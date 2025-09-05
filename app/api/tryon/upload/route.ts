import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server-only';
import { uploadImage, validateImageFile } from '@/lib/tryon/storage';

export const runtime = 'nodejs';

interface TryOnUploadResponse {
  success: boolean;
  fileId?: string;
  previewUrl?: string;
  validation?: {
    isValid: boolean;
    confidence: number;
    issues?: string[];
    suggestions?: string[];
  };
  metadata?: {
    dimensions: { width: number; height: number };
    fileSize: number;
    detectedType?: string;
  };
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    // For demo purposes, allow anonymous uploads
    const userId = user?.id || `anonymous_${Date.now()}`;
    console.log(`Processing upload for user: ${userId}`);

    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'garment' | 'person';
    const sessionId = formData.get('sessionId') as string || `session_${Date.now()}`;
    const options = {
      garmentType: formData.get('garmentType') as string || undefined,
      personPose: formData.get('personPose') as string || undefined,
    };

    if (!file || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: file and type are required' },
        { status: 400 }
      );
    }

    // Validate the file
    const validationResult = await validateImageFile(file, type);
    
    if (!validationResult.isValid) {
      return NextResponse.json({
        success: false,
        error: 'File validation failed',
        validation: validationResult
      }, { status: 400 });
    }

    // Get image dimensions for metadata
    const dimensions = await getImageDimensions(file);

    // Upload the file to storage
    const uploadResult = await uploadImage(file, {
      type,
      sessionId,
      userId: userId,
      metadata: {
        originalName: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        ...options
      }
    });

    // Store upload record in database
    const { data: uploadRecord, error: dbError } = await supabase
      .from('tryon_files')
      .insert({
        file_id: uploadResult.fileId,
        user_id: userId,
        type,
        original_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        dimensions: { width: dimensions.width, height: dimensions.height },
        storage_path: uploadResult.url,
        validation_result: validationResult,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // For development: if tables don't exist, continue without database record
      if (dbError.code === '42P01' || 
          (dbError.message && dbError.message.includes('does not exist')) ||
          Object.keys(dbError).length === 0) {
        console.log('⚠️  Database tables not found or empty error object, continuing without database record for development');
        // Continue without database record for development - do not return early
      } else {
        // Only return error for non-table-missing errors
        return NextResponse.json({
          success: false,
          error: 'Failed to save upload record'
        }, { status: 500 });
      }
    }

    // Check if upload was successful
    if (!uploadResult.success || !uploadResult.data) {
      console.error('Upload failed:', uploadResult);
      return NextResponse.json({
        success: false,
        error: uploadResult.error?.message || 'Upload failed'
      }, { status: 500 });
    }

    // Return the response according to PRD specification
    const response: TryOnUploadResponse = {
      success: true,
      fileId: uploadResult.data.fileId,
      previewUrl: uploadResult.data.previewUrl,
      validation: validationResult,
      metadata: {
        dimensions,
        fileSize: file.size,
        detectedType: type,
      },
    };

    console.log(`✅ Upload successful for ${type} image:`, {
      fileId: response.fileId,
      previewUrl: response.previewUrl,
      hasUrl: !!response.previewUrl,
      urlType: typeof response.previewUrl
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}

// Helper function to get image dimensions
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  try {
    // Use the validation function that already handles server-side dimension extraction
    const validation = await validateImageFile(file, 'person');
    if (validation.isValid && validation.imageAnalysis) {
      return validation.imageAnalysis.dimensions;
    }
    return { width: 800, height: 600 }; // Fallback
  } catch (error) {
    console.log('Dimension extraction failed, using fallback:', error);
    return { width: 800, height: 600 }; // Fallback
  }
}

export async function GET() {
  return new Response(JSON.stringify({ 
    message: 'Virtual Try-On Upload API',
    methods: ['POST'],
    requiredFields: ['userPhoto', 'garmentPhoto', 'garmentType'],
    optionalFields: ['fitPreference'],
    maxFileSize: '10MB',
    supportedFormats: ['JPEG', 'PNG', 'WebP']
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
