export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { exportAspect, RatioKey, Format } from '../../../../lib/aspect';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const image = form.get('image');
    const ratio = String(form.get('ratio') || '1:1') as RatioKey;
    const format = String(form.get('format') || 'png') as Format;
    const width = Number(form.get('width') || 2048);
    const background = String(form.get('background') || '#ffffff');
    const mode = String(form.get('mode') || 'contain'); // contain | cover

    if (!(image instanceof Blob)) return Response.json({ error: 'missing image' }, { status: 400 });
    const buf = Buffer.from(new Uint8Array(await image.arrayBuffer()));
    const out = await exportAspect(buf, { ratio, format, width, background }, { cover: mode === 'cover' });
    const b64 = out.toString('base64');
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    return Response.json({ dataUrl: `data:${mime};base64,${b64}` });
  } catch (e: any) {
    console.error('aspect/preview', e);
    return Response.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}