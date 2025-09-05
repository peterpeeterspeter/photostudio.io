/**
 * Image Processing Utilities for Virtual Try-On
 * Handles image validation, preprocessing, and EXIF data removal for privacy
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageMetadata {
  size: number;
  type: string;
  dimensions?: ImageDimensions;
  hasExifData: boolean;
  aspectRatio: number;
}

export interface ProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'jpeg' | 'png' | 'webp';
  removeExif?: boolean;
  normalizeOrientation?: boolean;
}

/**
 * Analyze image and extract metadata
 */
export async function analyzeImage(file: File): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const metadata: ImageMetadata = {
        size: file.size,
        type: file.type,
        dimensions: {
          width: img.naturalWidth,
          height: img.naturalHeight
        },
        hasExifData: false, // We'll check this separately
        aspectRatio: img.naturalWidth / img.naturalHeight
      };

      resolve(metadata);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Check if image has EXIF data (simplified check)
 */
export async function hasExifData(file: File): Promise<boolean> {
  if (file.type !== 'image/jpeg') {
    return false; // EXIF is primarily in JPEG files
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Look for EXIF marker (0xFFE1)
  for (let i = 0; i < bytes.length - 1; i++) {
    if (bytes[i] === 0xFF && bytes[i + 1] === 0xE1) {
      return true;
    }
  }

  return false;
}

/**
 * Remove EXIF data and return clean image
 */
export async function removeExifData(file: File): Promise<File> {
  if (file.type !== 'image/jpeg') {
    return file; // Only JPEG files typically have EXIF data
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const cleanFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(cleanFile);
        } else {
          reject(new Error('Failed to process image'));
        }
      }, file.type, 0.95);
      
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Resize image if it exceeds maximum dimensions
 */
export async function resizeImage(
  file: File, 
  options: ProcessingOptions = {}
): Promise<File> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.9,
    format = 'jpeg',
    removeExif = true
  } = options;

  const metadata = await analyzeImage(file);
  
  if (!metadata.dimensions) {
    throw new Error('Could not determine image dimensions');
  }

  const { width, height } = metadata.dimensions;
  
  // Check if resizing is needed
  if (width <= maxWidth && height <= maxHeight && !removeExif) {
    return file;
  }

  // Calculate new dimensions while maintaining aspect ratio
  let newWidth = width;
  let newHeight = height;

  if (width > maxWidth) {
    newWidth = maxWidth;
    newHeight = (height * maxWidth) / width;
  }

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = (width * maxHeight) / height;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Use high-quality scaling
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
      }
      
      const mimeType = format === 'png' ? 'image/png' : 
                       format === 'webp' ? 'image/webp' : 'image/jpeg';
      
      canvas.toBlob((blob) => {
        if (blob) {
          const processedFile = new File([blob], file.name, {
            type: mimeType,
            lastModified: Date.now()
          });
          resolve(processedFile);
        } else {
          reject(new Error('Failed to process image'));
        }
      }, mimeType, quality);
      
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate image for try-on processing
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: ImageMetadata;
}

export async function validateImage(file: File): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Unsupported file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum (10MB)`);
  }

  if (file.size < 1024) {
    warnings.push('File size is very small, which may affect processing quality');
  }

  let metadata: ImageMetadata | undefined;

  try {
    metadata = await analyzeImage(file);
    
    // Check dimensions
    if (metadata.dimensions) {
      const { width, height } = metadata.dimensions;
      
      if (width < 256 || height < 256) {
        errors.push('Image is too small. Minimum dimensions: 256x256 pixels');
      }
      
      if (width > 4096 || height > 4096) {
        warnings.push('Image is very large and will be resized for processing');
      }
      
      // Check aspect ratio
      if (metadata.aspectRatio < 0.5 || metadata.aspectRatio > 2.0) {
        warnings.push('Unusual aspect ratio may affect try-on quality');
      }
    }

    // Check for EXIF data
    if (await hasExifData(file)) {
      metadata.hasExifData = true;
      warnings.push('Image contains EXIF data which will be removed for privacy');
    }

  } catch (error) {
    errors.push('Failed to analyze image');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata
  };
}

/**
 * Preprocess image for optimal try-on results
 */
export async function preprocessImage(
  file: File,
  options: ProcessingOptions = {}
): Promise<File> {
  const validation = await validateImage(file);
  
  if (!validation.isValid) {
    throw new Error(`Image validation failed: ${validation.errors.join(', ')}`);
  }

  // Apply preprocessing steps
  let processedFile = file;

  // Remove EXIF data if requested or if privacy is a concern
  if (options.removeExif !== false) {
    if (validation.metadata?.hasExifData) {
      processedFile = await removeExifData(processedFile);
    }
  }

  // Resize if needed
  const needsResize = validation.metadata?.dimensions && (
    validation.metadata.dimensions.width > (options.maxWidth || 2048) ||
    validation.metadata.dimensions.height > (options.maxHeight || 2048)
  );

  if (needsResize || options.format) {
    processedFile = await resizeImage(processedFile, options);
  }

  return processedFile;
}

/**
 * Create image thumbnail
 */
export async function createThumbnail(
  file: File,
  size: number = 200,
  quality: number = 0.8
): Promise<File> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const { width, height } = img;
      const aspectRatio = width / height;
      
      let thumbWidth = size;
      let thumbHeight = size;
      
      if (aspectRatio > 1) {
        thumbHeight = size / aspectRatio;
      } else {
        thumbWidth = size * aspectRatio;
      }

      canvas.width = thumbWidth;
      canvas.height = thumbHeight;
      
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
      }
      
      canvas.toBlob((blob) => {
        if (blob) {
          const thumbnailFile = new File([blob], `thumb_${file.name}`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(thumbnailFile);
        } else {
          reject(new Error('Failed to create thumbnail'));
        }
      }, 'image/jpeg', quality);
      
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert image to different format
 */
export async function convertImageFormat(
  file: File,
  targetFormat: 'jpeg' | 'png' | 'webp',
  quality: number = 0.9
): Promise<File> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      if (ctx) {
        // Fill white background for JPEG (since it doesn't support transparency)
        if (targetFormat === 'jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0);
      }
      
      const mimeType = `image/${targetFormat}`;
      const extension = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
      const newName = file.name.replace(/\.[^/.]+$/, `.${extension}`);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const convertedFile = new File([blob], newName, {
            type: mimeType,
            lastModified: Date.now()
          });
          resolve(convertedFile);
        } else {
          reject(new Error('Failed to convert image'));
        }
      }, mimeType, quality);
      
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}
