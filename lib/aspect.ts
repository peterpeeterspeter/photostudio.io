import sharp from 'sharp';

export type RatioKey = '1:1' | '4:5' | '3:4' | '16:9' | '9:16';
export type Format = 'png' | 'jpg';

export interface ExportSpec {
  ratio: RatioKey;
  format: Format;
  width?: number;  // target width (auto height by ratio)
  background?: string; // hex like '#ffffff' for padding area
}

const RATIO_MAP: Record<RatioKey, number> = {
  '1:1': 1,
  '4:5': 4/5,
  '3:4': 3/4,
  '16:9': 16/9,
  '9:16': 9/16,
};

function parseBg(bg?: string) {
  if (!bg) return { r: 255, g: 255, b: 255, alpha: 1 };
  const hex = bg.replace('#','');
  const n = parseInt(hex.length === 3 ? hex.split('').map(c=>c+c).join('') : hex, 16);
  return { r: (n>>16)&255, g: (n>>8)&255, b: n&255, alpha: 1 };
}

/**
 * Export image into target aspect by letterboxing (no crop),
 * or smart-cover (crop) if cover=true.
 */
export async function exportAspect(
  input: Buffer,
  spec: ExportSpec,
  { cover = false }: { cover?: boolean } = {}
): Promise<Buffer> {
  const img = sharp(input, { failOn: 'none' });
  const meta = await img.metadata();
  const srcW = meta.width || 1024;
  const srcH = meta.height || 1024;

  const targetW = spec.width || 2048; // default large enough for socials/shops
  const ratio = RATIO_MAP[spec.ratio];
  const targetH = Math.round(targetW / ratio);

  const background = parseBg(spec.background || '#ffffff');

  if (cover) {
    // cover: fill entire target, possibly cropping
    const out = await img
      .resize(targetW, targetH, { fit: 'cover', position: 'attention' })
      [spec.format === 'png' ? 'png' : 'jpeg']({ quality: 92 })
      .toBuffer();
    return out;
  } else {
    // contain: keep full image, pad to aspect
    const out = await img
      .resize(targetW, targetH, { fit: 'contain', background })
      .flatten({ background }) // ensure opaque background for JPG
      [spec.format === 'png' ? 'png' : 'jpeg']({ quality: 92 })
      .toBuffer();

    return out;
  }
}

export async function batchExport(
  input: Buffer,
  specs: ExportSpec[],
  options?: { cover?: boolean }
): Promise<{ key: string; buf: Buffer }[]> {
  const out: { key: string; buf: Buffer }[] = [];
  for (const s of specs) {
    const buf = await exportAspect(input, s, options);
    const key = `${s.ratio}.${s.format}`;
    out.push({ key, buf });
  }
  return out;
}