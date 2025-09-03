import { GoogleGenAI } from '@google/genai';

const FAL_KEY = process.env.FAL_KEY!;

export async function falInvoke(model: string, body: any): Promise<any> {
  const r = await fetch(`https://fal.run/${model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${FAL_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`FAL ${model} failed: ${r.status}`);
  return r.json();
}

export async function birefnetCutout(imageDataUrl: string, variant: string = 'general_light'): Promise<string> {
  const out = await falInvoke('fal-ai/birefnet', { 
    image_url: imageDataUrl, 
    model: variant 
  });
  return out?.image?.url || out?.output?.url; // returns URL to cutout PNG
}

export async function geminiEditPng(pngBytes: Buffer, prompt: string): Promise<Buffer> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const finalPrompt = `${prompt}

CRITICAL REQUIREMENTS:
- Maintain exact garment proportions, seam accuracy, fabric texture
- Preserve true colors and realistic shadows
- No warping or distortion
- Professional e-commerce quality
- Output PNG format`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: [
      { text: finalPrompt },
      { 
        inlineData: { 
          data: Buffer.from(pngBytes).toString('base64'), 
          mimeType: 'image/png' 
        } 
      },
    ],
  });

  const parts = res?.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p: any) => p?.inlineData?.data);
  
  if (!img?.inlineData?.data) {
    const txt = parts.map((p: any) => p.text).filter(Boolean).join('\n');
    throw new Error(txt || 'Gemini returned no image');
  }
  
  const outB64 = img.inlineData.data;
  return Buffer.from(outB64, 'base64');
}

export async function relightOrShadow(imageUrl: string, mode: string = 'relight'): Promise<string> {
  try {
    // Enhanced lighting and shadow harmonization
    const model = mode === 'relight' ? 'fal-ai/flux/dev/image-to-image' : 'fal-ai/flux/dev/image-to-image';
    
    const harmonizationPrompt = mode === 'relight' 
      ? "Enhance lighting consistency, soft professional studio lighting, maintain garment details"
      : "Add realistic shadows and depth, maintain fabric texture and proportions";

    const out = await falInvoke(model, { 
      image_url: imageUrl,
      prompt: harmonizationPrompt,
      strength: 0.3,
      num_inference_steps: 20
    });
    
    return out?.images?.[0]?.url || out?.image?.url || out?.output?.url || imageUrl; // fallback
  } catch (error: any) {
    console.warn('Relighting failed, using original:', error.message);
    return imageUrl; // fallback to original
  }
}

export async function upscaleImage(imageDataUrl: string): Promise<string> {
  try {
    const upscaleResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
        input: { 
          image: imageDataUrl, 
          scale: 2,
          face_enhance: false
        },
      }),
    });

    if (!upscaleResponse.ok) {
      throw new Error(`Upscaling failed: ${upscaleResponse.status}`);
    }

    const upscaleData = await upscaleResponse.json();
    let pollUrl = upscaleData?.urls?.get;

    // Poll for completion (max 60 seconds)
    for (let i = 0; i < 30 && pollUrl; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(pollUrl, {
        headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
      });
      
      const statusData = await statusResponse.json();
      
      if (statusData.status === "succeeded" && statusData.output) {
        return statusData.output;
      } else if (statusData.status === "failed") {
        throw new Error(statusData.error || "Upscaling failed");
      }
    }
    
    throw new Error("Upscaling timeout");
  } catch (error: any) {
    console.warn('Upscaling failed:', error.message);
    return imageDataUrl; // fallback to original
  }
}