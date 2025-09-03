import sharp from 'sharp';

export type AspectRatio = '1:1' | '3:4' | '4:3' | '16:9' | '9:16' | '2:3' | '3:2' | string;

export interface AspectOptions {
  ratio: AspectRatio;
  format: 'png' | 'jpg' | 'jpeg';
  width: number;
  background: string;
}

export interface AspectSettings {
  cover?: boolean;
}

function parseAspectRatio(ratio: AspectRatio): { width: number; height: number } {
  const [w, h] = ratio.split(':').map(Number);
  return { width: w, height: h };
}

function parseBg(bg: string) {
  if (!bg) return { r: 255, g: 255, b: 255, alpha: 1 };
  const hex = bg.replace('#','');
  const full = hex.length === 3 ? hex.split('').map(c=>c+c).join('') : hex;
  const n = parseInt(full, 16);
  return { r: (n>>16)&255, g: (n>>8)&255, b: n&255, alpha: 1 };
}

export async function exportAspect(
  buf: Buffer, 
  options: AspectOptions, 
  settings: AspectSettings = {}
): Promise<Buffer> {
  const { ratio, format, width, background } = options;
  const { cover = false } = settings;
  
  // Parse aspect ratio
  const aspectDimensions = parseAspectRatio(ratio);
  const aspectRatio = aspectDimensions.width / aspectDimensions.height;
  
  // Calculate height based on width and aspect ratio
  const height = Math.round(width / aspectRatio);
  
  const base = sharp(buf, { failOn: 'none' });
  const backgroundColor = parseBg(background);
  
  const pipe = base.resize({ 
    width, 
    height, 
    fit: cover ? 'cover' : 'contain', 
    position: 'attention', 
    background: backgroundColor 
  });
  
  // Return buffer based on format
  if (format === 'png') {
    return await pipe.png().toBuffer();
  } else {
    return await pipe.jpeg({ quality: 92 }).toBuffer();
  }
}