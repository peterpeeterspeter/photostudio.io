import { NextResponse } from 'next/server';
import { tryOnService } from '@/lib/tryon/services';

/**
 * Health check endpoint for AI services
 * GET /api/tryon/health
 */
export async function GET() {
  try {
    // Check if service is ready
    const isReady = await tryOnService.isReady();
    
    if (!isReady) {
      // Try to initialize if not ready
      try {
        await tryOnService.initialize();
      } catch (initError) {
        console.error('Service initialization failed:', initError);
        return NextResponse.json(
          {
            status: 'unhealthy',
            message: 'Service initialization failed',
            timestamp: new Date().toISOString(),
          },
          { status: 503 }
        );
      }
    }

    // Get detailed health status
    const systemStatus = await tryOnService.getSystemStatus();
    const capabilities = tryOnService.getCapabilities();

    // Determine overall health
    const overallHealth = systemStatus.healthy;
    const httpStatus = overallHealth ? 200 : 503;

    // Prepare service details
    const serviceDetails = Object.fromEntries(
      Array.from(systemStatus.services.entries()).map(([provider, data]) => [
        provider,
        {
          healthy: data.healthy,
          metrics: {
            successRate: Math.round(data.metrics.successRate * 100),
            averageProcessingTime: Math.round(data.metrics.averageProcessingTime),
            totalRequests: data.metrics.totalRequests,
            uptime: Math.round(data.metrics.uptime * 100),
          },
        },
      ])
    );

    return NextResponse.json(
      {
        status: overallHealth ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: serviceDetails,
        systemMetrics: {
          totalRequests: systemStatus.systemMetrics.totalRequests,
          successRate: Math.round(systemStatus.systemMetrics.overallSuccessRate * 100),
          averageProcessingTime: Math.round(systemStatus.systemMetrics.averageProcessingTime),
        },
        capabilities: {
          ...capabilities,
          maxImageSizeMB: Math.round(capabilities.maxImageSize / 1024 / 1024),
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasGoogleApiKey: !!process.env.GOOGLE_API_KEY,
          hasFalKey: !!process.env.FAL_KEY,
          hasReplicateKey: !!process.env.REPLICATE_API_TOKEN,
        },
      },
      { status: httpStatus }
    );

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

/**
 * Simple ping endpoint
 * HEAD /api/tryon/health
 */
export async function HEAD() {
  try {
    const isReady = await tryOnService.isReady();
    return new NextResponse(null, { status: isReady ? 200 : 503 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
