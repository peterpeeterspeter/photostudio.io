// Next.js App Router API route. Handles multipart form-data, calls Gemini 2.5 Flash Image, returns a data URL.

export const runtime = "nodejs"; // use Edge if you prefer, but Node is convenient for Buffer APIs

import { GoogleGenAI } from "@google/genai";

function b64FromBlob(buf) {
  return Buffer.from(new Uint8Array(buf)).toString("base64");
}

export async function POST(req) {
  try {
    const form = await req.formData();
    const image = form.get("image");
    const prompt = String(form.get("prompt") || "").slice(0, 4000);

    if (!(image instanceof Blob)) {
      return Response.json({ error: "Missing image file." }, { status: 400 });
    }

    const mime = image.type || "image/png";
    if (!mime.startsWith("image/")) {
      return Response.json({ error: "Unsupported file type." }, { status: 400 });
    }

    // EEA safeguard: lightweight check
    // (You can enforce additional checks client-side based on your T&Cs.)
    if (prompt.toLowerCase().includes("child") || prompt.toLowerCase().includes("kid")) {
      return Response.json({ error: "Edits involving images of children are not supported in EEA." }, { status: 400 });
    }

    const bytesB64 = b64FromBlob(await image.arrayBuffer());

    // Build a more reliable instruction with defaults for apparel
    const baseGuard =
      "Maintain garment proportions, seam accuracy, fabric texture, true colors, and realistic shadows. No stretching/warping. No added logos. Output PNG.";

    const finalPrompt = `${prompt}\n\n${baseGuard}`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [
        { text: finalPrompt },
        {
          inlineData: {
            data: bytesB64,
            mimeType: mime,
          },
        },
      ],
    });

    // Extract first image from response parts
    const parts = response?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find((p) => p?.inlineData?.data);
    if (!imgPart) {
      const txt = parts.map((p) => p.text).filter(Boolean).join("\n");
      throw new Error(txt || "No image returned by model.");
    }

    const outB64 = imgPart.inlineData.data;
    const outMime = imgPart.inlineData.mimeType || "image/png";

    // Return as a data URL for simple front-end consumption
    return Response.json({ dataUrl: `data:${outMime};base64,${outB64}` });
  } catch (err) {
    console.error("/api/edit error", err);
    
    // Handle API quota exceeded errors specifically
    if (err?.status === 429 || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
      return Response.json({ 
        error: "API quota exceeded. Please try again in a few minutes or check your Gemini API plan at https://ai.google.dev/" 
      }, { status: 429 });
    }
    
    // Handle other API errors
    if (err?.status >= 400 && err?.status < 500) {
      return Response.json({ 
        error: err?.message || "API request failed. Please check your API key and try again." 
      }, { status: err.status });
    }
    
    return Response.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}