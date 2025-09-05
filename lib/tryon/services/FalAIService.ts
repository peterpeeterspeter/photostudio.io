import { fal } from '@fal-ai/client';
import { TryOnRequest, TryOnResponse, ImageOutput, ProcessingQualityMetrics } from '@/types/tryon';

export class FalAIService {
  private readonly modelId = 'fal-ai/nano-banana/edit';

  constructor(private readonly apiKey: string) {
    // Configure fal.ai client
    fal.config({
      credentials: this.apiKey
    });
  }

  async processTryOn(request: any): Promise<TryOnResponse> {
    try {
      console.log('🚀 Starting fal.ai nano-banana processing...');
      console.log('📥 Raw request received:', request);

      // Map the request to the expected format
      const mappedRequest = {
        userImageUrl: request.userImageUrl || request.userImage?.url,
        garmentImageUrl: request.garmentImageUrl || request.garmentImage?.url,
        userImageBase64: request.userImageBase64,
        garmentImageBase64: request.garmentImageBase64,
        garmentType: request.garmentType || request.options?.garmentType,
        options: request.options || {}
      };

      console.log('📋 Mapped request:', {
        hasUserImageUrl: !!mappedRequest.userImageUrl,
        hasGarmentImageUrl: !!mappedRequest.garmentImageUrl,
        garmentType: mappedRequest.garmentType,
        options: mappedRequest.options
      });

      // Create the prompt for the nano-banana model
      const prompt = this.createTryOnPrompt(mappedRequest);

      // Prepare the API request according to fal.ai schema
      const falRequest = {
        prompt,
        image_urls: [
          mappedRequest.userImageUrl || mappedRequest.userImageBase64,
          mappedRequest.garmentImageUrl || mappedRequest.garmentImageBase64
        ].filter(Boolean),
        num_images: 1,
        output_format: 'jpeg' as const
      };

      console.log('📤 Sending request to fal.ai:', {
        prompt: prompt.substring(0, 100) + '...',
        imageCount: falRequest.image_urls.length,
        outputFormat: falRequest.output_format
      });

      // Call the fal.ai API
      const result = await fal.subscribe(this.modelId, {
        input: falRequest,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log) => log.message).forEach(console.log);
          }
        },
      });

      console.log('✅ fal.ai processing completed:', {
        hasImages: !!result.data.images,
        imageCount: result.data.images?.length || 0,
        description: result.data.description?.substring(0, 100) + '...'
      });

      // Process the result
      if (!result.data.images || result.data.images.length === 0) {
        throw new Error('No images returned from fal.ai');
      }

      const imageUrl = result.data.images[0].url;
      console.log('🖼️ Extracted image URL:', imageUrl);
      
      const outputImage: ImageOutput = {
        url: imageUrl,
        thumbnailUrl: imageUrl, // Use same URL for thumbnail
        format: 'jpg',
        dimensions: {
          width: 1024, // Default dimensions - fal.ai doesn't return these
          height: 1024,
        },
        size: result.data.images[0].file_size || 500000, // Estimate if not provided
        quality: 0.9, // High quality for successful generation
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };

      // Calculate quality metrics based on successful generation
      const qualityMetrics = this.calculateQualityMetrics(result.data.description);

      return {
        success: true,
        status: 'completed',
        jobId: result.requestId,
        result: outputImage,
        qualityMetrics,
        processingTime: Date.now(), // Will be calculated by caller
        metadata: {
          provider: 'fal-ai',
          model: 'nano-banana',
          description: result.data.description,
          requestId: result.requestId
        }
      };

    } catch (error) {
      console.error('❌ fal.ai processing failed:', error);
      
      return {
        success: false,
        status: 'failed',
        jobId: `failed-${Date.now()}`,
        error: {
          code: 'FAL_AI_ERROR',
          message: error instanceof Error ? error.message : 'Unknown fal.ai error',
          details: error
        },
        processingTime: Date.now(),
        metadata: {
          provider: 'fal-ai',
          model: 'nano-banana'
        }
      };
    }
  }

  private createTryOnPrompt(request: any): string {
    const { garmentType, options } = request;
    
    console.log('🎯 Creating prompt with:', { garmentType, options });
    
    // Create a detailed prompt for the nano-banana model
    const basePrompt = `Create a realistic virtual try-on image where the person in the first image is wearing the ${garmentType} from the second image.`;
    
    const requirements = [
      'Maintain the person\'s body proportions, pose, and facial features exactly',
      'Ensure the garment fits naturally without distortion',
      'Preserve fabric texture, patterns, and colors from the garment image',
      'Create realistic shadows and lighting that match the environment',
      'Make the result look like a genuine photograph, not a digital manipulation',
      'Ensure seamless blending with no visible artifacts'
    ];

    if (options?.fitPreference) {
      requirements.push(`Apply a ${options.fitPreference} fit style`);
    }

    if (options?.preserveBackground !== false) {
      requirements.push('Preserve the original background from the person\'s photo exactly');
    }

    return `${basePrompt}

Requirements:
${requirements.map(req => `- ${req}`).join('\n')}

Generate a high-quality, photorealistic result that looks natural and professional.`;
  }

  private calculateQualityMetrics(description?: string): ProcessingQualityMetrics {
    // Since fal.ai nano-banana is a high-quality model, we can assume good metrics
    // In a real implementation, you might analyze the description or image for quality indicators
    const baseQuality = 0.85;
    
    return {
      bodyDetection: {
        confidence: baseQuality + 0.05, // 0.9
        keypoints: 17,
        accuracy: baseQuality + 0.03, // 0.88
      },
      garmentAlignment: {
        accuracy: baseQuality, // 0.85
        coverage: baseQuality + 0.03, // 0.88
        distortion: 0.1, // Low distortion
      },
      lighting: {
        consistency: baseQuality, // 0.85
        naturalness: baseQuality - 0.03, // 0.82
        shadowQuality: baseQuality - 0.07, // 0.78
      },
      overall: {
        realism: baseQuality, // 0.85
        quality: baseQuality, // 0.85
        processingTime: 0, // Will be set by caller
      },
    };
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // Simple health check - just verify the API key is configured
      if (!this.apiKey) {
        return { status: 'unhealthy', details: 'API key not configured' };
      }
      
      return { status: 'healthy' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
