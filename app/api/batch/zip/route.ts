// app/api/batch/zip/route.ts
export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { supabaseService, supabaseAnon } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  // dynamic import avoids type complaints when no d.ts is present
  const { default: archiver }: any = await import('archiver');

  const url = new URL(req.url);
  const batchId = url.searchParams.get('batch');
  const imageId = url.searchParams.get('image');
  if (!batchId) return new Response('Missing batch', { status: 400 });

  const sb = supabaseService();
  const { data: imgs, error } = await sb
    .from('images')
    .select('id, output_path')
    .eq('batch_id', batchId)
    .eq('status', 'done');

  if (error) return new Response(error.message, { status: 500 });

  const list = (imgs || []).filter(x => !imageId || x.id === imageId);
  if (!list.length) return new Response('No completed images', { status: 404 });

  const stream = new ReadableStream({
    start(controller) {
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('data', (chunk: Uint8Array) => controller.enqueue(chunk));
      archive.on('end', () => controller.close());
      archive.on('warning', (e: any) => console.warn('zip warn', e));
      archive.on('error', (e: any) => controller.error(e));

      (async () => {
        try {
          const anon = supabaseAnon();
          for (const it of list) {
            let map: Record<string, string> = {};
            try { map = JSON.parse(it.output_path || '{}'); } catch {}
            for (const [label, storageKey] of Object.entries(map)) {
              const { data: signed } = await anon.storage.from('outputs').createSignedUrl(storageKey, 600);
              if (!signed?.signedUrl) continue;
              const res = await fetch(signed.signedUrl);
              const buf = Buffer.from(new Uint8Array(await res.arrayBuffer()));
              const filename = `${it.id}/${label}${storageKey.endsWith('.png') ? '.png' : '.jpg'}`;
              archive.append(buf, { name: filename });
            }
          }
          await archive.finalize();
        } catch (e) {
          console.error('zip error', e);
          controller.error(e);
        }
      })();
    }
  });

  return new Response(stream as any, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="photostudio-${batchId}${imageId ? '-' + imageId : ''}.zip"`
    }
  });
}