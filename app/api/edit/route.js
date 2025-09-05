// Next.js App Router API route. Handles multipart form-data, calls Gemini 2.5 Flash Image, returns a data URL.

export const runtime = "nodejs"; // use Edge if you prefer, but Node is convenient for Buffer APIs

import { GoogleGenAI } from "@google/genai";

function b64FromBlob(buf) {
  return Buffer.from(new Uint8Array(buf)).toString("base64");
}

// FAL.AI Nano Banana Image-to-Image fallback function
async function editImageWithFAL(imageBase64, prompt, mimeType) {
  console.log("🔄 Falling back to FAL.AI Nano Banana (Image-to-Image)...");
  
  const falResponse = await fetch("https://fal.run/fal-ai/nano-banana/edit", {
    method: "POST",
    headers: {
      "Authorization": `Key ${process.env.FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: prompt,
      image_urls: [`data:${mimeType};base64,${imageBase64}`],
      num_images: 1,
      output_format: "png"
    }),
  });

  if (!falResponse.ok) {
    const errorText = await falResponse.text();
    throw new Error(`FAL.AI error: ${falResponse.status} - ${errorText}`);
  }

  const falResult = await falResponse.json();
  console.log("✅ FAL.AI Gemini response received");
  
  if (falResult.images && falResult.images[0] && falResult.images[0].url) {
    // Download the image from FAL.AI
    const imageResponse = await fetch(falResult.images[0].url);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64Result = Buffer.from(imageBuffer).toString('base64');
    
    console.log("✅ FAL.AI fallback successful!");
    return {
      dataUrl: `data:image/png;base64,${imageBase64Result}`,
      provider: "FAL.AI Nano Banana",
      description: falResult.description || "Image edited successfully"
    };
  } else {
    throw new Error("FAL.AI did not return a valid image");
  }
}

// Resize image if it's too large for Gemini API
async function resizeImageIfNeeded(imageBlob) {
  const maxWidth = 2048;
  const maxHeight = 2048;
  const maxSize = 4 * 1024 * 1024; // 4MB
  
  // If image is small enough, return as-is
  if (imageBlob.size <= maxSize) {
    // Still need to check dimensions, but for now let's try size-based approach
    return imageBlob;
  }
  
  // For now, if image is too large, we'll just return it and let Gemini handle it
  // In production, you'd want to implement proper image resizing
  console.warn(`Image size ${imageBlob.size} bytes might be too large for Gemini API`);
  return imageBlob;
}

export async function POST(req) {
  let bytesB64, prompt, mime; // Declare at function scope for catch block access
  
  try {
    console.log("=== /api/edit START ===");
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    const form = await req.formData();
    console.log("FormData parsed successfully");
    
    const image = form.get("image");
    prompt = String(form.get("prompt") || "").slice(0, 4000);
    
    console.log("Form data:", {
      hasImage: !!image,
      imageType: image?.type,
      imageSize: image?.size,
      prompt: prompt?.substring(0, 100)
    });

    if (!(image instanceof Blob)) {
      console.log("Error: Image is not a Blob", typeof image, image);
      return Response.json({ error: "Missing image file." }, { status: 400 });
    }

    mime = image.type || "image/png";
    console.log("Image mime type:", mime);
    
    if (!mime.startsWith("image/")) {
      console.log("Error: Invalid mime type", mime);
      return Response.json({ error: "Unsupported file type." }, { status: 400 });
    }

    // Additional validation for problematic images
    if (image.size === 0) {
      console.log("Error: Image size is 0");
      return Response.json({ error: "Image file appears to be empty." }, { status: 400 });
    }

    // Check image size limits
    const maxSize = 20 * 1024 * 1024; // 20MB hard limit
    if (image.size > maxSize) {
      return Response.json({ 
        error: `Image too large (${(image.size / 1024 / 1024).toFixed(1)}MB). Please keep under ${maxSize / 1024 / 1024}MB.` 
      }, { status: 400 });
    }

    console.log(`Processing image: ${image.size} bytes, type: ${mime}`);

    // EEA safeguard: lightweight check
    // (You can enforce additional checks client-side based on your T&Cs.)
    if (prompt.toLowerCase().includes("child") || prompt.toLowerCase().includes("kid")) {
      return Response.json({ error: "Edits involving images of children are not supported in EEA." }, { status: 400 });
    }

    console.log("Converting image to ArrayBuffer...");
    let arrayBuffer;
    try {
      arrayBuffer = await image.arrayBuffer();
      console.log("ArrayBuffer created successfully, size:", arrayBuffer.byteLength);
    } catch (err) {
      console.log("Error creating ArrayBuffer:", err);
      return Response.json({ error: "Failed to process image data." }, { status: 400 });
    }

    console.log("Converting to base64...");
    bytesB64 = b64FromBlob(arrayBuffer);

    // Build a more reliable instruction with defaults for apparel
    const baseGuard =
      "Maintain garment proportions, seam accuracy, fabric texture, true colors, and realistic shadows. No stretching/warping. No added logos. Output PNG.";

    // According to Google's docs, be more specific and use step-by-step instructions
    const finalPrompt = `${prompt}. ${baseGuard}`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    console.log("Calling Gemini with prompt:", finalPrompt);
    console.log("Using model: gemini-2.5-flash-image-preview");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview", // Official Gemini Nano Banana model
      contents: [
        {
          parts: [
            { text: finalPrompt },
            {
              inlineData: {
                data: bytesB64,
                mimeType: mime,
              },
            },
          ],
        },
      ],
    });

    // Extract first image from response parts
    const parts = response?.candidates?.[0]?.content?.parts || [];
    console.log("Gemini response parts:", parts.map(p => Object.keys(p)));
    
    const imgPart = parts.find((p) => p?.inlineData?.data);
    if (!imgPart) {
      const txt = parts.map((p) => p.text).filter(Boolean).join("\n");
      console.log("No image part found. Text response:", txt);
      console.log("🔄 Gemini failed, trying FAL.AI fallback...");
      
      // Try FAL.AI as fallback
      try {
        const falResult = await editImageWithFAL(bytesB64, prompt, mime);
        console.log("✅ FAL.AI fallback successful!");
        return Response.json({ 
          dataUrl: falResult.dataUrl,
          provider: falResult.provider,
          description: falResult.description,
          note: "Gemini content filtering triggered, used FAL.AI Nano Banana instead"
        });
      } catch (falError) {
        console.error("❌ FAL.AI fallback also failed:", falError);
        throw new Error(`Both Gemini and FAL.AI failed. Gemini: ${txt || "No image returned"}. FAL.AI: ${falError.message}`);
      }
    }

    const outB64 = imgPart.inlineData.data;
    const outMime = imgPart.inlineData.mimeType || "image/png";

    // Return as a data URL for simple front-end consumption
    return Response.json({ 
      dataUrl: `data:${outMime};base64,${outB64}`,
      provider: "Gemini"
    });
  } catch (err) {
    console.error("/api/edit error:", err);
    console.error("Error details:", {
      message: err?.message,
      status: err?.status,
      stack: err?.stack
    });
    
    // Handle API quota exceeded errors specifically
    if (err?.status === 429 || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
      return Response.json({ 
        error: "API quota exceeded. Please try again in a few minutes or check your Gemini API plan at https://ai.google.dev/",
        quotaError: true
      }, { status: 429 });
    }
    
    // Handle image size/format errors
    if (err?.message?.includes("Image too large") || err?.message?.includes("INVALID_ARGUMENT")) {
      return Response.json({ 
        error: "Image may be too large or in an unsupported format. Try a smaller image (under 2048x2048) or different format.",
        imageError: true
      }, { status: 400 });
    }
    
    // If Gemini fails completely, try FAL.AI fallback
    console.log("🔄 Gemini API failed completely, trying FAL.AI fallback...");
    try {
      const falResult = await editImageWithFAL(bytesB64, prompt, mime);
      console.log("✅ FAL.AI fallback successful after Gemini API error!");
      return Response.json({ 
        dataUrl: falResult.dataUrl,
        provider: falResult.provider,
        description: falResult.description,
        note: `Gemini API failed (${err?.status || 'unknown error'}), used FAL.AI Nano Banana instead`
      });
    } catch (falError) {
      console.error("❌ FAL.AI fallback also failed after Gemini error:", falError);
      
      // Handle other API errors
      if (err?.status >= 400 && err?.status < 500) {
        return Response.json({ 
          error: `Both Gemini and FAL.AI failed. Gemini: ${err?.message || "API request failed"}. FAL.AI: ${falError.message}` 
        }, { status: err.status });
      }
      
      return Response.json({ 
        error: `Both Gemini and FAL.AI failed. Gemini: ${err?.message || "Server error"}. FAL.AI: ${falError.message}` 
      }, { status: 500 });
    }
  }
}