/**
 * Image Validation for Virtual Try-On Feature
 * 
 * Provides advanced image validation beyond basic file type checking.
 * Includes image quality assessment, dimension validation, and content detection.
 */

import type { ValidationResult, ValidationError, ValidationWarning } from '@/types/tryon';

export interface ImageValidationOptions {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  requirePortrait?: boolean; // For person images
  requireProduct?: boolean; // For garment images
  checkQuality?: boolean;
}

export interface ImageAnalysis {
  dimensions: { width: number; height: number };
  aspectRatio: number;
  isPortrait: boolean;
  isLandscape: boolean;
  estimatedQuality: 'low' | 'medium' | 'high';
  hasTransparency: boolean;
  colorChannels: number;
  fileSize: number;
  format: string;
}

/**
 * Image Validation Service
 */
class ImageValidation {
  
  /**
   * Validate an image file for try-on usage
   */
  async validateImage(
    file: File, 
    type: 'garment' | 'person',
    options: ImageValidationOptions = {}
  ): Promise<ValidationResult & { analysis?: ImageAnalysis }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    try {
      // Basic file validation
      const basicValidation = this.validateBasicFile(file);
      errors.push(...basicValidation.errors);
      warnings.push(...basicValidation.warnings);

      // Get image analysis
      const analysis = await this.analyzeImage(file);
      
      // Dimension validation
      const dimensionValidation = this.validateDimensions(analysis.dimensions, options);
      errors.push(...dimensionValidation.errors);
      warnings.push(...dimensionValidation.warnings);

      // Type-specific validation
      if (type === 'person') {
        const personValidation = this.validatePersonImage(analysis, options);
        errors.push(...personValidation.errors);
        warnings.push(...personValidation.warnings);
      } else if (type === 'garment') {
        const garmentValidation = this.validateGarmentImage(analysis, options);
        errors.push(...garmentValidation.errors);
        warnings.push(...garmentValidation.warnings);
      }

      // Quality validation
      if (options.checkQuality) {
        const qualityValidation = this.validateImageQuality(analysis);
        errors.push(...qualityValidation.errors);
        warnings.push(...qualityValidation.warnings);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        analysis
      };

    } catch (error) {
      console.error('Image validation error:', error);
      return {
        isValid: false,
        errors: [{
          field: 'image',
          code: 'ANALYSIS_FAILED',
          message: 'Failed to analyze image',
          severity: 'error'
        }],
        warnings: []
      };
    }
  }

  /**
   * Quick validation for file uploads (lighter weight)
   */
  validateFileQuick(file: File): ValidationResult {
    return this.validateBasicFile(file);
  }

  /**
   * Analyze image properties
   */
  private async analyzeImage(file: File): Promise<ImageAnalysis> {
    try {
      // Server-side image analysis without browser APIs
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Extract basic image dimensions from file headers
      let width = 800;  // Default fallback
      let height = 600; // Default fallback
      let hasTransparency = false;
      
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        const dims = this.getJPEGDimensions(uint8Array);
        width = dims.width;
        height = dims.height;
        hasTransparency = false;
      } else if (file.type === 'image/png') {
        const dims = this.getPNGDimensions(uint8Array);
        width = dims.width;
        height = dims.height;
        hasTransparency = true; // PNG can have transparency
      }
      
      const aspectRatio = width / height;
      
      // Estimate quality based on resolution and file size
      const pixelDensity = (width * height) / file.size;
      let quality: 'low' | 'medium' | 'high';
      
      if (width < 512 || height < 512 || pixelDensity < 0.1) {
        quality = 'low';
      } else if (width >= 1024 && height >= 1024 && pixelDensity > 0.3) {
        quality = 'high';
      } else {
        quality = 'medium';
      }
      
      return {
        dimensions: { width, height },
        aspectRatio,
        isPortrait: height > width,
        isLandscape: width > height,
        estimatedQuality: quality,
        hasTransparency,
        colorChannels: hasTransparency ? 4 : 3,
        fileSize: file.size,
        format: file.type
      };
    } catch (error) {
      // Fallback analysis if header parsing fails
      return {
        dimensions: { width: 800, height: 600 },
        aspectRatio: 4/3,
        isPortrait: false,
        isLandscape: true,
        estimatedQuality: 'medium',
        hasTransparency: file.type === 'image/png',
        colorChannels: file.type === 'image/png' ? 4 : 3,
        fileSize: file.size,
        format: file.type
      };
    }
  }

  /**
   * Extract dimensions from JPEG file header
   */
  private getJPEGDimensions(data: Uint8Array): { width: number; height: number } {
    try {
      let offset = 2; // Skip SOI marker
      while (offset < data.length - 8) {
        const marker = (data[offset] << 8) | data[offset + 1];
        
        if (marker >= 0xFFC0 && marker <= 0xFFC3) { // SOF markers
          const height = (data[offset + 5] << 8) | data[offset + 6];
          const width = (data[offset + 7] << 8) | data[offset + 8];
          return { width, height };
        }
        
        const length = (data[offset + 2] << 8) | data[offset + 3];
        offset += 2 + length;
      }
    } catch (e) {
      // Fallback on error
    }
    return { width: 800, height: 600 };
  }

  /**
   * Extract dimensions from PNG file header
   */
  private getPNGDimensions(data: Uint8Array): { width: number; height: number } {
    try {
      // Check PNG signature
      if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) {
        // IHDR chunk starts at byte 16 for width and 20 for height
        const width = (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19];
        const height = (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23];
        return { width, height };
      }
    } catch (e) {
      // Fallback on error
    }
    return { width: 800, height: 600 };
  }

  /**
   * Basic file validation
   */
  private validateBasicFile(file: File): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.push({
        field: 'fileType',
        code: 'INVALID_FILE_TYPE',
        message: `File type ${file.type} not supported. Allowed: ${allowedTypes.join(', ')}`,
        severity: 'error'
      });
    }

    // File size validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push({
        field: 'fileSize',
        code: 'FILE_TOO_LARGE',
        message: `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds limit (10MB)`,
        severity: 'error'
      });
    }

    const minSize = 10 * 1024; // 10KB
    if (file.size < minSize) {
      warnings.push({
        field: 'fileSize',
        code: 'FILE_VERY_SMALL',
        message: 'File size is very small, which may affect processing quality'
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate image dimensions
   */
  private validateDimensions(
    dimensions: { width: number; height: number },
    options: ImageValidationOptions
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const { width, height } = dimensions;
    const {
      minWidth = 256,
      minHeight = 256,
      maxWidth = 4096,
      maxHeight = 4096
    } = options;

    if (width < minWidth || height < minHeight) {
      errors.push({
        field: 'dimensions',
        code: 'DIMENSIONS_TOO_SMALL',
        message: `Image dimensions (${width}x${height}) below minimum (${minWidth}x${minHeight})`,
        severity: 'error'
      });
    }

    if (width > maxWidth || height > maxHeight) {
      warnings.push({
        field: 'dimensions',
        code: 'DIMENSIONS_LARGE',
        message: `Large image dimensions (${width}x${height}) may slow processing`,
        suggestion: `Consider resizing to max ${maxWidth}x${maxHeight}`
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate person image specific requirements
   */
  private validatePersonImage(
    analysis: ImageAnalysis,
    options: ImageValidationOptions
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Portrait orientation preference for person photos
    if (options.requirePortrait && !analysis.isPortrait) {
      warnings.push({
        field: 'orientation',
        code: 'NOT_PORTRAIT',
        message: 'Portrait orientation recommended for person photos',
        suggestion: 'Use a vertical photo for better results'
      });
    }

    // Aspect ratio check
    if (analysis.aspectRatio < 0.5 || analysis.aspectRatio > 2.0) {
      warnings.push({
        field: 'aspectRatio',
        code: 'UNUSUAL_ASPECT_RATIO',
        message: 'Unusual aspect ratio detected',
        suggestion: 'Standard photo proportions work best'
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate garment image specific requirements
   */
  private validateGarmentImage(
    analysis: ImageAnalysis,
    options: ImageValidationOptions
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Transparency check for garment images
    if (analysis.hasTransparency) {
      warnings.push({
        field: 'transparency',
        code: 'HAS_TRANSPARENCY',
        message: 'Image has transparent areas',
        suggestion: 'Solid backgrounds often work better for garments'
      });
    }

    // Square-ish aspect ratio preferred for garments
    if (analysis.aspectRatio < 0.7 || analysis.aspectRatio > 1.5) {
      warnings.push({
        field: 'aspectRatio',
        code: 'NON_SQUARE_GARMENT',
        message: 'Square or near-square images work best for garments',
        suggestion: 'Consider cropping to focus on the garment'
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate image quality
   */
  private validateImageQuality(analysis: ImageAnalysis): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (analysis.estimatedQuality === 'low') {
      warnings.push({
        field: 'quality',
        code: 'LOW_QUALITY',
        message: 'Image quality appears low',
        suggestion: 'Higher resolution images produce better results'
      });
    }

    // Check for extremely small file sizes that might indicate compression issues
    const bytesPerPixel = analysis.fileSize / (analysis.dimensions.width * analysis.dimensions.height);
    if (bytesPerPixel < 0.1) {
      warnings.push({
        field: 'compression',
        code: 'HIGH_COMPRESSION',
        message: 'Image appears heavily compressed',
        suggestion: 'Less compressed images produce better results'
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Get validation recommendations for a specific use case
   */
  getRecommendations(type: 'garment' | 'person'): string[] {
    const common = [
      'Use high-resolution images (at least 512x512 pixels)',
      'Ensure good lighting and clear visibility',
      'Avoid heavily compressed or blurry images',
      'Use JPEG, PNG, or WebP format'
    ];

    const personSpecific = [
      'Use portrait orientation when possible',
      'Ensure the person is clearly visible and centered',
      'Avoid complex backgrounds that might interfere with detection',
      'Make sure the person is facing forward or at a slight angle'
    ];

    const garmentSpecific = [
      'Use square or near-square aspect ratios',
      'Ensure the garment is the main focus of the image',
      'Avoid transparent backgrounds if possible',
      'Use flat-lay or well-lit product shots'
    ];

    return type === 'person' 
      ? [...common, ...personSpecific]
      : [...common, ...garmentSpecific];
  }
}

export const imageValidation = new ImageValidation();
