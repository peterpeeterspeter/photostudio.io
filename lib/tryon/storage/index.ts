/**
 * Storage Module Entry Point
 * 
 * Provides convenient access to storage functionality for the virtual try-on feature.
 * Includes the main storage service and utility functions.
 */

export { StorageService, storageService } from './StorageService';
export { imageValidation } from './imageValidation';
export { storageUtils } from './utils';

// Re-export types for convenience
export type {
  UploadOptions,
  FileMetadata,
  StorageQuota
} from './StorageService';

// Convenience functions for common operations
import { storageService } from './StorageService';
import { imageValidation } from './imageValidation';
import type { UploadOptions } from './StorageService';
import type { TryOnApiResponse } from '@/types/tryon';

// Add missing exports for upload route
export async function validateImageFile(
  file: File, 
  type: 'garment' | 'person'
) {
  return await imageValidation.validateImage(file, type, { checkQuality: true });
}

export async function uploadImage(
  file: File,
  options: {
    type: 'garment' | 'person' | 'result';
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, any>;
  }
) {
  return await storageService.uploadFile(file, {
    type: options.type,
    userId: options.userId,
    sessionId: options.sessionId,
    metadata: options.metadata,
    validateImage: true
  });
}

/**
 * Upload a garment image
 */
export async function uploadGarmentImage(
  file: File,
  userId?: string,
  sessionId?: string
): Promise<TryOnApiResponse<{ fileId: string; previewUrl: string }>> {
  const result = await storageService.uploadFile(file, {
    type: 'garment',
    userId,
    sessionId,
    validateImage: true
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: {
      fileId: result.data!.fileId,
      previewUrl: result.data!.previewUrl
    }
  };
}

/**
 * Upload a person image
 */
export async function uploadPersonImage(
  file: File,
  userId?: string,
  sessionId?: string
): Promise<TryOnApiResponse<{ fileId: string; previewUrl: string }>> {
  const result = await storageService.uploadFile(file, {
    type: 'person',
    userId,
    sessionId,
    validateImage: true
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: {
      fileId: result.data!.fileId,
      previewUrl: result.data!.previewUrl
    }
  };
}

/**
 * Upload a result image (from AI processing)
 */
export async function uploadResultImage(
  file: File,
  userId?: string,
  metadata?: Record<string, any>
): Promise<TryOnApiResponse<{ fileId: string; previewUrl: string }>> {
  const result = await storageService.uploadFile(file, {
    type: 'result',
    userId,
    metadata,
    expiresIn: 72 // Results kept longer
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: {
      fileId: result.data!.fileId,
      previewUrl: result.data!.previewUrl
    }
  };
}

/**
 * Get a file URL with automatic expiration check
 */
export async function getFileUrl(fileId: string): Promise<TryOnApiResponse<string>> {
  const result = await storageService.getFileUrl(fileId);
  
  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: result.data!.url
  };
}

/**
 * Delete a file
 */
export async function deleteFile(fileId: string): Promise<TryOnApiResponse<boolean>> {
  const result = await storageService.deleteFile(fileId);
  
  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: result.data!.deleted
  };
}

/**
 * Check if user is within storage quota
 */
export async function checkUserQuota(userId: string): Promise<TryOnApiResponse<{ withinQuota: boolean; usage: number; limit: number }>> {
  const result = await storageService.getUserQuota(userId);
  
  if (!result.success) {
    return result;
  }

  const quota = result.data!;
  
  return {
    success: true,
    data: {
      withinQuota: quota.used < quota.limit,
      usage: quota.used,
      limit: quota.limit
    }
  };
}

/**
 * Clean up expired files (should be called periodically)
 */
export async function cleanupExpiredFiles(): Promise<TryOnApiResponse<number>> {
  const result = await storageService.cleanupExpiredFiles();
  
  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: result.data!.deletedCount
  };
}
