import sharp from 'sharp';

export type ExportItem = { 
  label: string; 
  w: number; 
  h: number; 
  format?: 'png'|'jpg'; 
  mode?: 'contain'|'cover'; 
  background?: string; 
};

export const SOCIAL_PRESETS: Record<string, ExportItem[]> = {
  Instagram_Post:      [{ label: 'IG-Post-1080', w: 1080, h: 1080, format: 'jpg', mode: 'cover' }],
  Instagram_Reel:      [{ label: 'IG-Reel-1080x1920', w: 1080, h: 1920, format: 'jpg', mode: 'cover' }],
  Instagram_Story:     [{ label: 'IG-Story-1080x1920', w: 1080, h: 1920, format: 'jpg', mode: 'cover' }],
  Facebook_Ad:         [{ label: 'FB-Ad-1200x628', w: 1200, h: 628, format: 'jpg', mode: 'cover' }],
  Pinterest_Pin:       [{ label: 'Pinterest-1000x1500', w: 1000, h: 1500, format: 'jpg', mode: 'cover' }],
  Shopify_Product:     [{ label: 'Shopify-2048', w: 2048, h: 2048, format: 'png', mode: 'contain', background: '#ffffff' }],
};

function parseBg(bg?: string) {
  if (!bg) return { r: 255, g: 255, b: 255, alpha: 1 };
  const hex = bg.replace('#','');
  const full = hex.length === 3 ? hex.split('').map(c=>c+c).join('') : hex;
  const n = parseInt(full, 16);
  return { r: (n>>16)&255, g: (n>>8)&255, b: n&255, alpha: 1 };
}

export async function exportVariant(buf: Buffer, item: ExportItem): Promise<Buffer> {
  const mode = item.mode || 'contain';
  const fmt = item.format || 'png';
  const base = sharp(buf, { failOn: 'none' });
  const background = parseBg(item.background || '#ffffff');
  
  const pipe = base.resize({ 
    width: item.w, 
    height: item.h, 
    fit: mode === 'cover' ? 'cover' : 'contain', 
    position: 'attention', 
    background 
  });
  
  return fmt === 'png' ? await pipe.png().toBuffer() : await pipe.jpeg({ quality: 92 }).toBuffer();
}

export async function exportBatch(buf: Buffer, items: ExportItem[]): Promise<{ key: string; buffer: Buffer }[]> {
  const out: { key: string; buffer: Buffer }[] = [];
  for (const it of items) {
    const b = await exportVariant(buf, it);
    const ext = (it.format || 'png') === 'png' ? 'png' : 'jpg';
    out.push({ key: `${it.label}.${ext}`, buffer: b });
  }
  return out;
}