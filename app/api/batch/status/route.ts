export const runtime = 'nodejs';
import { supabaseService, supabaseAnon } from '../../../../lib/supabase';

export async function GET(req: Request) {
  try {
    const sb = supabaseService();
    const url = new URL(req.url);
    const batchId = url.searchParams.get('batch');
    
    if (!batchId) {
      return Response.json({ error: 'Missing batch ID' }, { status: 400 });
    }

    // Get batch info
    const { data: batch, error: batchError } = await sb
      .from('batches')
      .select('*')
      .eq('id', batchId)
      .single();
      
    if (batchError) {
      return Response.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Get all images in batch
    const { data: items, error: itemsError } = await sb
      .from('images')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at');
      
    if (itemsError) {
      throw itemsError;
    }

    // Generate signed URLs for viewing
    const anon = supabaseAnon();
    const itemsWithUrls = await Promise.all((items || []).map(async (item) => {
      try {
        // Source image URL
        const sourceResult = await anon.storage
          .from('uploads')
          .createSignedUrl(item.source_path, 60 * 10);
          
        // Parse output path - could be JSON with variants or just a string
        let outputUrls: any = null;
        if (item.output_path) {
          try {
            const parsed = JSON.parse(item.output_path);
            if (parsed.main && parsed.variants) {
              // New format with variants
              const mainResult = await anon.storage
                .from('outputs')
                .createSignedUrl(parsed.main, 60 * 10);
              
              const variantUrls: Record<string, string> = {};
              for (const [key, path] of Object.entries(parsed.variants)) {
                const variantResult = await anon.storage
                  .from('outputs')
                  .createSignedUrl(path as string, 60 * 10);
                if (variantResult.data?.signedUrl) {
                  variantUrls[key] = variantResult.data.signedUrl;
                }
              }
              
              outputUrls = {
                main: mainResult.data?.signedUrl || null,
                variants: variantUrls
              };
            } else {
              // Legacy format or other JSON structure
              outputUrls = parsed;
            }
          } catch {
            // Simple string path (legacy)
            const outputResult = await anon.storage
              .from('outputs')
              .createSignedUrl(item.output_path, 60 * 10);
            outputUrls = outputResult.data?.signedUrl || null;
          }
        }
        
        return {
          ...item,
          source_url: sourceResult.data?.signedUrl,
          output_urls: outputUrls
        };
      } catch (e) {
        console.warn(`Failed to generate URLs for image ${item.id}:`, e);
        return {
          ...item,
          source_url: null,
          output_urls: null
        };
      }
    }));

    // Calculate progress statistics
    const total = items.length;
    const completed = items.filter(i => i.status === 'done').length;
    const failed = items.filter(i => i.status === 'error').length;
    const processing = items.filter(i => i.status === 'working').length;
    const queued = items.filter(i => i.status === 'queued').length;

    return Response.json({
      batch,
      items: itemsWithUrls,
      progress: {
        total,
        completed,
        failed,
        processing,
        queued,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    });
    
  } catch (e: any) {
    console.error('batch/status error:', e);
    return Response.json({ 
      error: e?.message || 'Failed to get batch status' 
    }, { status: 500 });
  }
}