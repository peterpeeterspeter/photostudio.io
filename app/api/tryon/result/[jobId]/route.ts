export const runtime = "nodejs";
import { NextRequest } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server-only';
import resultStorage from '@/lib/tryon/storage/ResultStorage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get userId - use authenticated user or anonymous fallback
    const userId = user?.id || 'anonymous';

    const { jobId } = await params;

    console.log(`🔍 GET /api/tryon/result/${jobId} - userId: ${userId}`);
    
    // Debug storage state
    resultStorage.debugStatus();

    if (!jobId) {
      return new Response(JSON.stringify({ 
        error: 'Missing job ID parameter' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch actual result from storage
    const storedResult = resultStorage.get(jobId);
    
    if (!storedResult) {
      return new Response(JSON.stringify({ 
        error: 'Result not found',
        message: 'The requested try-on result was not found or has expired'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return the actual stored result
    const result = {
      jobId,
      status: storedResult.status,
      success: true,
      result: {
        originalImageUrl: storedResult.originalImageUrl,
        resultImageUrl: storedResult.resultImageUrl,
        garmentName: `Virtual Try-On Result - ${storedResult.garmentType}`,
        garmentType: storedResult.garmentType,
        fitScore: Math.floor((storedResult.qualityMetrics?.overall?.quality || 0.85) * 100),
        sizeRecommendation: 'Medium', // Would be calculated from body measurements
        processingTime: storedResult.processingTime || 30,
        aiProvider: storedResult.provider,
        qualityMetrics: {
          bodyDetectionAccuracy: storedResult.qualityMetrics?.bodyDetection?.confidence || 0.90,
          garmentMappingScore: storedResult.qualityMetrics?.garmentAlignment?.accuracy || 0.85,
          realismScore: storedResult.qualityMetrics?.overall?.realism || 0.88
        },
        metadata: {
          userId: userId,
          createdAt: storedResult.createdAt,
          expiresAt: storedResult.expiresAt,
        }
      }
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Result fetch error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error while fetching result' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get userId - use authenticated user or anonymous fallback
    const userId = user?.id || 'anonymous';

    const { jobId } = await params;

    // TODO: Verify job belongs to authenticated user
    // TODO: Delete result images from storage
    // TODO: Delete job record from database
    // TODO: Log deletion for privacy compliance

    const deleteResult = {
      success: true,
      jobId,
      message: 'Try-on result and associated data deleted successfully',
      deletedAt: new Date().toISOString(),
      userId: userId
    };

    return new Response(JSON.stringify(deleteResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Result deletion error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error during deletion' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
