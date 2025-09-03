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
          
        // Output image URL (if exists)
        let outputUrl: string | null = null;
        if (item.output_path) {
          const outputResult = await anon.storage
            .from('outputs')
            .createSignedUrl(item.output_path, 60 * 10);
          outputUrl = outputResult.data?.signedUrl || null;
        }
        
        return {
          ...item,
          source_url: sourceResult.data?.signedUrl,
          output_url: outputUrl
        };
      } catch (e) {
        console.warn(`Failed to generate URLs for image ${item.id}:`, e);
        return {
          ...item,
          source_url: null,
          output_url: null
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