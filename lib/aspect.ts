import sharp from 'sharp';

export type RatioKey = '1:1' | '4:5' | '3:4' | '16:9' | '9:16';
export type Format = 'png' | 'jpg';

export interface ExportSpec {
  ratio: RatioKey;
  format: Format;
  width?: number;        // default 2048
  background?: string;   // e.g. '#ffffff' when padding
}

const RATIO_MAP: Record<RatioKey, number> = {
  '1:1': 1,
  '4:5': 4 / 5,
  '3:4': 3 / 4,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
};

function parseBg(bg?: string) {
  if (!bg) return { r: 255, g: 255, b: 255, alpha: 1 };
  const hex = bg.replace('#', '');
  const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, alpha: 1 };
}

/**
 * Export image into target aspect by letterboxing (contain, no crop).
 * Set cover=true if you prefer crop-to-fill.
 */
export async function exportAspect(
  input: Buffer,
  spec: ExportSpec,
  { cover = false }: { cover?: boolean } = {}
): Promise<Buffer> {
  const targetW = spec.width || 2048;
  const ratio = RATIO_MAP[spec.ratio];
  const targetH = Math.round(targetW / ratio);

  const background = parseBg(spec.background || '#ffffff');

  const pipe = sharp(input, { failOn: 'none' }).resize(targetW, targetH, {
    fit: cover ? 'cover' : 'contain',
    position: 'attention',
    background,
  });

  return spec.format === 'png'
    ? pipe.png().toBuffer()
    : pipe.jpeg({ quality: 92 }).toBuffer();
}

/** Batch helper (optional) */
export async function batchExport(
  input: Buffer,
  specs: ExportSpec[],
  opts?: { cover?: boolean }
): Promise<{ key: string; buf: Buffer }[]> {
  const out: { key: string; buf: Buffer }[] = [];
  for (const s of specs) {
    const buf = await exportAspect(input, s, opts);
    const key = `${s.ratio}.${s.format}`;
    out.push({ key, buf });
  }
  return out;
}