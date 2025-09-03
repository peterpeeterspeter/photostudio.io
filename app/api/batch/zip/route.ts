export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { supabaseService } from '../../../../lib/supabase';
import archiver from 'archiver';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const batchId = url.searchParams.get('batch');
    const imageId = url.searchParams.get('image');
    
    if (!batchId) {
      return new Response('Missing batch ID', { status: 400 });
    }

    const sb = supabaseService();
    
    if (imageId) {
      // Single image ZIP
      const { data: image } = await sb
        .from('images')
        .select('*')
        .eq('id', imageId)
        .eq('batch_id', batchId)
        .single();
        
      if (!image?.output_path) {
        return new Response('Image not found or not processed', { status: 404 });
      }
      
      return await createImageZip(sb, image, `image-${imageId}-variants.zip`);
    } else {
      // Batch ZIP
      const { data: images } = await sb
        .from('images')
        .select('*')
        .eq('batch_id', batchId)
        .eq('status', 'done');
        
      if (!images?.length) {
        return new Response('No completed images found', { status: 404 });
      }
      
      return await createBatchZip(sb, images, batchId, `batch-${batchId}-export.zip`);
    }
    
  } catch (e: any) {
    console.error('ZIP generation error:', e);
    return new Response(e?.message || 'ZIP generation failed', { status: 500 });
  }
}

async function createImageZip(sb: any, image: any, filename: string) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  try {
    const outputData = JSON.parse(image.output_path);
    
    // Add main image
    if (outputData.main) {
      const { data: mainFile } = await sb.storage.from('outputs').download(outputData.main);
      if (mainFile) {
        const mainBuffer = Buffer.from(await mainFile.arrayBuffer());
        archive.append(mainBuffer, { name: `main.${outputData.main.endsWith('.png') ? 'png' : 'jpg'}` });
      }
    }
    
    // Add variants
    if (outputData.variants) {
      for (const [variantName, variantPath] of Object.entries(outputData.variants)) {
        const { data: variantFile } = await sb.storage.from('outputs').download(variantPath as string);
        if (variantFile) {
          const variantBuffer = Buffer.from(await variantFile.arrayBuffer());
          const ext = (variantPath as string).endsWith('.png') ? 'png' : 'jpg';
          archive.append(variantBuffer, { name: `${variantName}.${ext}` });
        }
      }
    }
    
  } catch (parseError) {
    // Legacy format - single file path
    const { data: file } = await sb.storage.from('outputs').download(image.output_path);
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      archive.append(buffer, { name: `result.${image.output_path.endsWith('.png') ? 'png' : 'jpg'}` });
    }
  }

  archive.finalize();
  
  return new Response(archive as any, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

async function createBatchZip(sb: any, images: any[], batchId: string, filename: string) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const imageFolder = `image-${i + 1}`;
    
    try {
      const outputData = JSON.parse(image.output_path);
      
      // Add main image
      if (outputData.main) {
        const { data: mainFile } = await sb.storage.from('outputs').download(outputData.main);
        if (mainFile) {
          const mainBuffer = Buffer.from(await mainFile.arrayBuffer());
          archive.append(mainBuffer, { name: `${imageFolder}/main.${outputData.main.endsWith('.png') ? 'png' : 'jpg'}` });
        }
      }
      
      // Add variants
      if (outputData.variants) {
        for (const [variantName, variantPath] of Object.entries(outputData.variants)) {
          const { data: variantFile } = await sb.storage.from('outputs').download(variantPath as string);
          if (variantFile) {
            const variantBuffer = Buffer.from(await variantFile.arrayBuffer());
            const ext = (variantPath as string).endsWith('.png') ? 'png' : 'jpg';
            archive.append(variantBuffer, { name: `${imageFolder}/${variantName}.${ext}` });
          }
        }
      }
      
    } catch (parseError) {
      // Legacy format
      const { data: file } = await sb.storage.from('outputs').download(image.output_path);
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        archive.append(buffer, { name: `${imageFolder}/result.${image.output_path.endsWith('.png') ? 'png' : 'jpg'}` });
      }
    }
  }

  archive.finalize();
  
  return new Response(archive as any, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}