import { NextRequest, NextResponse } from 'next/server';
import { tryOnService } from '@/lib/tryon/services';
import type { GarmentType } from '@/types/tryon';
import resultStorage from '@/lib/tryon/storage/ResultStorage';

/**
 * Process virtual try-on request
 * POST /api/tryon/process
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    console.log('Processing request body:', JSON.stringify(body, null, 2));
    
    const {
      userImageUrl,
      userImageBase64,
      garmentImageUrl,
      garmentImageBase64,
      garmentType,
      options = {},
      userId,
      sessionId,
    } = body;

    console.log('Validation checks:', {
      hasUserImageUrl: !!userImageUrl,
      hasUserImageBase64: !!userImageBase64,
      hasGarmentImageUrl: !!garmentImageUrl,
      hasGarmentImageBase64: !!garmentImageBase64,
      garmentType,
      optionsProvided: Object.keys(options).length
    });

    // Validate required fields
    if (!userImageUrl && !userImageBase64) {
      console.log('❌ Missing user image');
      return NextResponse.json(
        { error: 'User image is required (URL or base64)' },
        { status: 400 }
      );
    }

    if (!garmentImageUrl && !garmentImageBase64) {
      console.log('❌ Missing garment image');
      return NextResponse.json(
        { error: 'Garment image is required (URL or base64)' },
        { status: 400 }
      );
    }

    if (!garmentType) {
      console.log('❌ Missing garment type');
      return NextResponse.json(
        { error: 'Garment type is required' },
        { status: 400 }
      );
    }

    // Validate garment type
    const supportedTypes = tryOnService.getSupportedGarmentTypes();
    console.log('Garment type validation:', { garmentType, supportedTypes });
    
    if (!supportedTypes.includes(garmentType as GarmentType)) {
      console.log('❌ Unsupported garment type:', garmentType);
      return NextResponse.json(
        { 
          error: `Unsupported garment type: ${garmentType}`,
          supportedTypes 
        },
        { status: 400 }
      );
    }
    
    console.log('✅ All validations passed');

    // Initialize service if not already done
    if (!(await tryOnService.isReady())) {
      console.log('Initializing try-on service...');
      await tryOnService.initialize();
    }

    // Process the try-on request
    console.log(`Processing try-on request: ${garmentType}`);
    const result = await tryOnService.processTryOn({
      userImageUrl,
      userImageBase64,
      garmentImageUrl,
      garmentImageBase64,
      garmentType: garmentType as GarmentType,
      options: {
        quality: 'standard',
        fitPreference: 'regular',
        preserveBackground: true,
        enhanceLighting: true,
        generateShadows: true,
        ...options,
      },
      userId,
      sessionId,
    });

    // Return result
    if (result.success) {
      console.log(`Try-on completed successfully with ${result.metadata.provider}`);
      
      // Store the result for later retrieval
      console.log('🔍 Processing result data:', {
        jobId: result.jobId,
        hasResult: !!result.result,
        resultType: typeof result.result,
        resultUrl: result.result?.url,
        resultKeys: result.result ? Object.keys(result.result) : 'No result object'
      });
      
      const resultImageUrl = result.result?.url || result.result;
      console.log('💾 About to store result with URL:', resultImageUrl);
      
      resultStorage.store({
        jobId: result.jobId,
        status: 'completed',
        originalImageUrl: userImageUrl || 'Unknown', 
        resultImageUrl: resultImageUrl,
        garmentType: garmentType as string,
        qualityMetrics: result.qualityMetrics,
        processingTime: result.metadata.processingTime,
        provider: result.metadata.provider,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
      
      // Verify storage after storing
      console.log('✅ Stored result, verifying retrieval:');
      const verifyResult = resultStorage.get(result.jobId);
      console.log('Verification result:', {
        found: !!verifyResult,
        status: verifyResult?.status,
        hasImageUrl: !!verifyResult?.resultImageUrl
      });
      
      return NextResponse.json({
        success: true,
        jobId: result.jobId,
        status: result.status,
        resultImage: result.result,
        qualityMetrics: result.qualityMetrics,
        processingTime: result.metadata.processingTime,
        provider: result.metadata.provider,
      });
    } else {
      console.error('Try-on processing failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          jobId: result.jobId,
          error: {
            code: result.error?.code,
            message: result.error?.message,
            retryable: result.error?.retryable,
          },
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Get service capabilities and status
 * GET /api/tryon/process
 */
export async function GET() {
  try {
    // Initialize service if needed
    if (!(await tryOnService.isReady())) {
      await tryOnService.initialize();
    }

    // Get system status
    const status = await tryOnService.getSystemStatus();
    const capabilities = tryOnService.getCapabilities();
    const supportedGarmentTypes = tryOnService.getSupportedGarmentTypes();

    return NextResponse.json({
      healthy: status.healthy,
      capabilities,
      supportedGarmentTypes,
      systemMetrics: status.systemMetrics,
      serviceStatus: Object.fromEntries(
        Array.from(status.services.entries()).map(([provider, data]) => [
          provider,
          {
            healthy: data.healthy,
            successRate: data.metrics.successRate,
            averageProcessingTime: data.metrics.averageProcessingTime,
            totalRequests: data.metrics.totalRequests,
          },
        ])
      ),
    });

  } catch (error) {
    console.error('Status check error:', error);
    
    return NextResponse.json(
      {
        healthy: false,
        error: 'Service status check failed',
      },
      { status: 503 }
    );
  }
}