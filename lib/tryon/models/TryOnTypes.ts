// Re-export types from the main types directory for backward compatibility
// and additional model-specific utilities

export * from '@/types/tryon';
export type { AIProvider, AIServiceConfig, ServiceCapabilities } from '@/types/ai-services';

// Additional utility types for the lib layer
export interface TryOnModelConfig {
  defaultOptions: {
    quality: 'standard' | 'high' | 'ultra';
    timeout: number;
    retryAttempts: number;
    fallbackEnabled: boolean;
  };
  validation: {
    maxFileSize: number;
    allowedFormats: string[];
    minImageDimensions: {
      width: number;
      height: number;
    };
    maxImageDimensions: {
      width: number;
      height: number;
    };
  };
  privacy: {
    defaultExpirationHours: number;
    autoDeleteEnabled: boolean;
    allowAnalytics: boolean;
  };
}

export const DEFAULT_TRYON_CONFIG: TryOnModelConfig = {
  defaultOptions: {
    quality: 'standard',
    timeout: 60000, // 60 seconds
    retryAttempts: 3,
    fallbackEnabled: true
  },
  validation: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    minImageDimensions: {
      width: 256,
      height: 256
    },
    maxImageDimensions: {
      width: 4096,
      height: 4096
    }
  },
  privacy: {
    defaultExpirationHours: 24,
    autoDeleteEnabled: true,
    allowAnalytics: false
  }
};

// Model validation utilities
export interface ModelValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateTryOnJob(job: Partial<TryOnJob>): ModelValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!job.userId) {
    errors.push('User ID is required');
  }

  if (!job.userPhoto) {
    errors.push('User photo is required');
  }

  if (!job.garment) {
    errors.push('Garment information is required');
  } else {
    if (!job.garment.name) {
      warnings.push('Garment name is recommended for better results');
    }
    if (!job.garment.type) {
      errors.push('Garment type is required');
    }
  }

  if (!job.options) {
    warnings.push('Using default processing options');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateUploadedFile(file: File): ModelValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config = DEFAULT_TRYON_CONFIG.validation;

  if (file.size > config.maxFileSize) {
    errors.push(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(config.maxFileSize / 1024 / 1024)}MB)`);
  }

  if (!config.allowedFormats.includes(file.type)) {
    errors.push(`File type ${file.type} is not supported. Allowed types: ${config.allowedFormats.join(', ')}`);
  }

  if (file.size < 1024) {
    warnings.push('File size is very small, which may affect processing quality');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Type guards
export function isTryOnJob(obj: any): obj is TryOnJob {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.status === 'string' &&
    obj.garment &&
    obj.options;
}

export function isTryOnResult(obj: any): obj is TryOnResult {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.jobId === 'string' &&
    typeof obj.originalImageUrl === 'string' &&
    typeof obj.resultImageUrl === 'string' &&
    obj.fitAnalysis &&
    obj.qualityMetrics;
}

// Import the types we're re-exporting
import type { TryOnJob, TryOnResult } from '@/types/tryon';
