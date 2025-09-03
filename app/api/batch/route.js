export const runtime = "nodejs";
import * as fal from "@fal-ai/serverless-client";

// Configure fal.ai
fal.config({
  credentials: process.env.FAL_KEY,
});

// Batch processing endpoint for multiple images
export async function POST(req) {
  try {
    const form = await req.formData();
    const images = form.getAll("images"); // Multiple files
    const prompt = String(form.get("prompt") || "");
    const preset = String(form.get("preset") || "");
    const webhookUrl = String(form.get("webhookUrl") || "");
    
    if (!images.length) {
      return Response.json({ error: "No images provided" }, { status: 400 });
    }

    if (images.length > 25) {
      return Response.json({ error: "Maximum 25 images per batch" }, { status: 400 });
    }

    const finalPrompt = preset || prompt;
    if (!finalPrompt.trim()) {
      return Response.json({ error: "Prompt or preset required" }, { status: 400 });
    }

    const jobResults = [];

    // Process each image asynchronously
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      if (!(image instanceof Blob)) continue;
      
      const imgBuffer = await image.arrayBuffer();
      const imgB64 = Buffer.from(new Uint8Array(imgBuffer)).toString("base64");
      const dataUrl = `data:${image.type || "image/png"};base64,${imgB64}`;

      try {
        // Submit job to fal.ai queue (async processing)
        const job = await fal.queue.submit("fal-ai/flux/dev/image-to-image", {
          input: {
            image_url: dataUrl,
            prompt: `${finalPrompt}\n\nMaintain garment proportions, fabric texture, true colors. Professional e-commerce quality.`,
            strength: 0.8,
            num_inference_steps: 25
          },
          webhookUrl: webhookUrl || undefined, // Optional webhook
          pollInterval: 5000, // Check every 5 seconds
          logs: true
        });

        jobResults.push({
          id: job.requestId,
          status: "queued",
          originalIndex: i,
          fileName: image.name || `image_${i + 1}`
        });

      } catch (error) {
        console.error(`Failed to queue image ${i + 1}:`, error);
        jobResults.push({
          id: null,
          status: "failed",
          error: error.message,
          originalIndex: i,
          fileName: image.name || `image_${i + 1}`
        });
      }
    }

    return Response.json({
      success: true,
      batchId: `batch_${Date.now()}`,
      totalImages: images.length,
      queuedJobs: jobResults.filter(j => j.status === "queued").length,
      failedJobs: jobResults.filter(j => j.status === "failed").length,
      jobs: jobResults,
      message: `Batch processing started for ${jobResults.filter(j => j.status === "queued").length} images`
    });

  } catch (error) {
    console.error("Batch processing error:", error);
    return Response.json({
      error: error.message || "Batch processing failed"
    }, { status: 500 });
  }
}

// Get batch job status
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobIds = searchParams.get('jobIds')?.split(',') || [];
    
    if (!jobIds.length) {
      return Response.json({ error: "Job IDs required" }, { status: 400 });
    }

    const jobStatuses = [];

    for (const jobId of jobIds) {
      try {
        const status = await fal.queue.status("fal-ai/flux/dev/image-to-image", {
          requestId: jobId
        });
        
        jobStatuses.push({
          id: jobId,
          status: status.status,
          result: status.result || null,
          error: status.error || null
        });
      } catch (error) {
        jobStatuses.push({
          id: jobId,
          status: "error",
          error: error.message
        });
      }
    }

    const completed = jobStatuses.filter(j => j.status === "completed").length;
    const failed = jobStatuses.filter(j => j.status === "failed" || j.status === "error").length;
    const pending = jobStatuses.length - completed - failed;

    return Response.json({
      jobs: jobStatuses,
      summary: {
        total: jobStatuses.length,
        completed,
        failed,
        pending,
        progress: Math.round((completed / jobStatuses.length) * 100)
      }
    });

  } catch (error) {
    console.error("Batch status error:", error);
    return Response.json({
      error: error.message || "Failed to get batch status"
    }, { status: 500 });
  }
}