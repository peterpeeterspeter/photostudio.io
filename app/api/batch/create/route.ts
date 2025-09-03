export const runtime = 'nodejs';
import { supabaseService } from '../../../../lib/supabase';
import type { ExportItem, BatchSettings } from '../../../../lib/resize';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const name = String(form.get('name') || 'Untitled Batch');
    const prompt = String(form.get('prompt') || 'Ghost mannequin on neutral #f6f6f6 background.');

    // Parse settings for presets, packs, and custom variants
    let settings: BatchSettings = {};
    const rawSettings = form.get('settings');
    if (typeof rawSettings === 'string') {
      try {
        settings = JSON.parse(rawSettings);
      } catch (e) {
        console.warn('Failed to parse settings:', e);
      }
    }

    const files = form.getAll('images').filter((f): f is File => f instanceof File);
    if (!files.length) {
      return Response.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > 25) {
      return Response.json({ error: 'Maximum 25 images per batch' }, { status: 400 });
    }

    const sb = supabaseService();
    
    // Create batch record with settings
    const { data: batch, error: batchError } = await sb
      .from('batches')
      .insert({ name, status: 'pending', settings })
      .select('*')
      .single();
      
    if (batchError) throw batchError;

    // Save uploads to storage and create image rows
    const imageRows: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const blob = files[i];
      const ext = blob.type.includes('png') ? 'png' : 'jpg';
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const key = `uploads/${batch.id}/${fileName}`;
      
      const fileBuffer = Buffer.from(new Uint8Array(await blob.arrayBuffer()));
      
      const { error: uploadError } = await sb.storage
        .from('uploads')
        .upload(key, fileBuffer, { 
          contentType: blob.type,
          upsert: false 
        });
        
      if (uploadError) {
        console.error(`Upload failed for file ${i + 1}:`, uploadError);
        continue; // Skip failed uploads
      }
      
      imageRows.push({ 
        batch_id: batch.id, 
        source_path: key, 
        status: 'queued' 
      });
    }
    
    if (!imageRows.length) {
      throw new Error('No files were successfully uploaded');
    }
    
    const { error: imagesError } = await sb.from('images').insert(imageRows);
    if (imagesError) throw imagesError;

    // Start background processing (fire-and-forget)
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';
      
    fetch(`${baseUrl}/api/batch/worker?batch=${batch.id}&prompt=${encodeURIComponent(prompt)}`)
      .catch(e => console.warn('Failed to start worker:', e.message));

    return Response.json({ 
      success: true,
      batch_id: batch.id,
      queued_images: imageRows.length,
      message: `Batch created with ${imageRows.length} images queued for processing`
    });
    
  } catch (e: any) {
    console.error('batch/create error:', e);
    return Response.json({ 
      error: e?.message || 'Server error' 
    }, { status: 500 });
  }
}