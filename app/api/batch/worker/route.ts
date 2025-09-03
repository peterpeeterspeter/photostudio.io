export const runtime = 'nodejs';
import { supabaseService, supabaseAnon } from '../../../../lib/supabase';
import { birefnetCutout, geminiEditPng, relightOrShadow } from '../../../../lib/pipeline';

async function downloadFromStorage(path: string): Promise<Uint8Array> {
  const sb = supabaseService();
  const { data, error } = await sb.storage.from('uploads').download(path);
  if (error) throw error;
  return new Uint8Array(await data.arrayBuffer());
}

async function uploadOutput(batchId: string, buf: Buffer): Promise<string> {
  const sb = supabaseService();
  const key = `outputs/${batchId}/${crypto.randomUUID()}.png`;
  const { error } = await sb.storage
    .from('outputs')
    .upload(key, buf, { 
      contentType: 'image/png', 
      upsert: false 
    });
  if (error) throw error;
  return key;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const batchId = url.searchParams.get('batch');
  const prompt = url.searchParams.get('prompt') || 'Ghost mannequin on neutral background';
  
  if (!batchId) {
    return new Response('Missing batch ID', { status: 400 });
  }

  const sb = supabaseService();
  
  // Mark batch as processing
  await sb.from('batches').update({ status: 'processing' }).eq('id', batchId);

  // Get queued images
  const { data: images, error: imagesError } = await sb
    .from('images')
    .select('*')
    .eq('batch_id', batchId)
    .in('status', ['queued', 'error']);
    
  if (imagesError) {
    console.error('Failed to fetch images:', imagesError);
    return new Response(imagesError.message, { status: 500 });
  }
  
  if (!images?.length) {
    return new Response('No images to process', { status: 200 });
  }

  console.log(`Processing ${images.length} images for batch ${batchId}`);

  // Process each image
  for (const img of images) {
    try {
      console.log(`Processing image ${img.id}...`);
      await sb.from('images').update({ 
        status: 'working', 
        error: null 
      }).eq('id', img.id);

      // 1) Download source image
      const srcBytes = await downloadFromStorage(img.source_path);
      const dataUrl = `data:image/png;base64,${Buffer.from(srcBytes).toString('base64')}`;

      // 2) Background removal with BiRefNet
      console.log(`Background removal for ${img.id}...`);
      const cutoutUrl = await birefnetCutout(dataUrl, 'general_light');

      // 3) Download cutout and run Gemini edit
      console.log(`AI editing for ${img.id}...`);
      const cutoutResponse = await fetch(cutoutUrl);
      const cutoutBuffer = Buffer.from(new Uint8Array(await cutoutResponse.arrayBuffer()));
      const editedBuffer = await geminiEditPng(cutoutBuffer, prompt);

      // 4) Relighting/harmonization
      console.log(`Relighting for ${img.id}...`);
      const tempKey = await uploadOutput(batchId, editedBuffer);
      const anon = supabaseAnon();
      const { data: signedData } = await anon.storage
        .from('outputs')
        .createSignedUrl(tempKey, 60 * 10);
        
      if (!signedData?.signedUrl) {
        throw new Error('Failed to create signed URL for relighting');
      }
      
      const relitUrl = await relightOrShadow(signedData.signedUrl, 'relight');

      // 5) Download final result and save
      console.log(`Saving final result for ${img.id}...`);
      const relitResponse = await fetch(relitUrl);
      const finalBuffer = Buffer.from(new Uint8Array(await relitResponse.arrayBuffer()));
      const finalKey = await uploadOutput(batchId, finalBuffer);

      // Mark as completed
      await sb.from('images').update({ 
        status: 'done', 
        output_path: finalKey 
      }).eq('id', img.id);
      
      console.log(`Completed processing ${img.id}`);

    } catch (err: any) {
      console.error(`Failed to process image ${img.id}:`, err);
      await sb.from('images').update({ 
        status: 'error', 
        error: err?.message || 'Processing failed' 
      }).eq('id', img.id);
    }
  }

  // Check if batch is complete
  const { data: remaining } = await sb
    .from('images')
    .select('id')
    .eq('batch_id', batchId)
    .neq('status', 'done');
    
  if (!remaining?.length) {
    await sb.from('batches').update({ 
      status: 'completed', 
      completed_at: new Date().toISOString() 
    }).eq('id', batchId);
    console.log(`Batch ${batchId} completed`);
  }

  return new Response('Processing completed');
}