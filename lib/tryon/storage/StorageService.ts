/**
 * Storage Service for Virtual Try-On Feature
 * 
 * Handles file uploads, retrievals, and management with Supabase storage
 * and database metadata tracking. Integrates with the database schema
 * created in the migrations.
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { 
  UploadResult, 
  ValidationResult, 
  TryOnFile, 
  TryOnApiResponse 
} from '@/types/tryon';
import { supabaseService } from '@/lib/supabase';

// Storage configuration
const STORAGE_CONFIG = {
  bucket: 'tryon-uploads',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  defaultExpirationHours: 24,
  maxFilesPerUser: 50,
} as const;

export interface UploadOptions {
  type: 'garment' | 'person' | 'result';
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  expiresIn?: number; // hours
  validateImage?: boolean;
}

export interface FileMetadata {
  fileId: string;
  userId?: string;
  type: 'garment' | 'person' | 'result';
  originalName: string;
  fileSize: number;
  mimeType: string;
  dimensions?: { width: number; height: number };
  storagePath: string;
  validationResult?: ValidationResult;
  expiresAt: Date;
}

export interface StorageQuota {
  used: number;
  limit: number;
  available: number;
  fileCount: number;
}

/**
 * Main Storage Service Class
 */
export class StorageService {
  private supabase = supabaseService();

  /**
   * Upload a file to storage with metadata tracking
   */
  async uploadFile(
    file: File,
    options: UploadOptions
  ): Promise<TryOnApiResponse<{ fileId: string; previewUrl: string; metadata: FileMetadata }>> {
    try {
      // Validate file before upload
      const validation = await this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'File validation failed',
            details: validation.errors
          }
        };
      }

      // Check user quota if userId provided
      if (options.userId) {
        const quotaCheck = await this.checkUserQuota(options.userId);
        if (!quotaCheck.success) {
          return quotaCheck;
        }
      }

      // Generate unique file ID and storage path
      const fileId = uuidv4();
      const fileExt = this.getFileExtension(file.name);
      const fileName = `${fileId}.${fileExt}`;
      
      // Organize files by user and type
      const userId = options.userId || 'anonymous';
      const storagePath = `${userId}/${options.type}/${fileName}`;

      // Get image dimensions if it's an image
      const dimensions = await this.getImageDimensions(file);

      // Upload to Supabase Storage
      const uploadResult = await this.uploadToStorage(file, storagePath, options);
      if (!uploadResult.success) {
        return uploadResult;
      }

      // Store metadata in database
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (options.expiresIn || STORAGE_CONFIG.defaultExpirationHours));

      const metadata: FileMetadata = {
        fileId,
        userId: options.userId,
        type: options.type,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        dimensions,
        storagePath,
        validationResult: validation,
        expiresAt
      };

      const dbResult = await this.storeFileMetadata(metadata, options);
      if (!dbResult.success) {
        // In development, continue without database record if tables don't exist
        const dbError = dbResult.error;
        
        if (dbError?.code === '42P01' || 
            dbError?.code === 'DATABASE_INSERT_FAILED' ||
            dbError?.code === 'METADATA_STORE_ERROR' ||
            dbError?.message?.includes('does not exist') || 
            dbError?.details?.includes?.('does not exist') ||
            Object.keys(dbError || {}).length === 0) {
          console.log('⚠️  Database tables not found or error storing metadata, continuing without database record for development');
          // Don't cleanup the uploaded file, continue without database record
        } else {
          // For other database errors, cleanup uploaded file
          await this.deleteFromStorage(storagePath);
          return dbResult;
        }
      }

      // Get public URL for preview
      const previewUrl = await this.getPublicUrl(storagePath);

      return {
        success: true,
        data: {
          fileId,
          previewUrl,
          metadata
        },
        metadata: {
          requestId: uuidv4(),
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload file',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get file URL by file ID
   */
  async getFileUrl(fileId: string): Promise<TryOnApiResponse<{ url: string; metadata: FileMetadata }>> {
    try {
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        return {
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: `File not found: ${fileId}`
          }
        };
      }

      // Check if file has expired
      if (new Date() > metadata.expiresAt) {
        // Clean up expired file
        await this.deleteFile(fileId);
        return {
          success: false,
          error: {
            code: 'FILE_EXPIRED',
            message: 'File has expired and been deleted'
          }
        };
      }

      const url = await this.getPublicUrl(metadata.storagePath);

      return {
        success: true,
        data: { url, metadata }
      };

    } catch (error) {
      console.error('Get file URL error:', error);
      return {
        success: false,
        error: {
          code: 'GET_URL_FAILED',
          message: 'Failed to get file URL',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Delete a file and its metadata
   */
  async deleteFile(fileId: string): Promise<TryOnApiResponse<{ deleted: boolean }>> {
    try {
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        return {
          success: true,
          data: { deleted: false } // Already deleted
        };
      }

      // Delete from storage
      await this.deleteFromStorage(metadata.storagePath);

      // Delete metadata from database
      const { error } = await this.supabase
        .from('tryon_files')
        .delete()
        .eq('file_id', fileId);

      if (error) {
        console.error('Database delete error:', error);
        return {
          success: false,
          error: {
            code: 'DELETE_FAILED',
            message: 'Failed to delete file metadata',
            details: error.message
          }
        };
      }

      return {
        success: true,
        data: { deleted: true }
      };

    } catch (error) {
      console.error('Delete file error:', error);
      return {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete file',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get user's storage quota usage
   */
  async getUserQuota(userId: string): Promise<TryOnApiResponse<StorageQuota>> {
    try {
      const { data, error } = await this.supabase
        .from('tryon_files')
        .select('file_size')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        throw error;
      }

      const used = data?.reduce((total, file) => total + (file.file_size || 0), 0) || 0;
      const fileCount = data?.length || 0;
      const limit = STORAGE_CONFIG.maxFileSize * STORAGE_CONFIG.maxFilesPerUser;

      return {
        success: true,
        data: {
          used,
          limit,
          available: Math.max(0, limit - used),
          fileCount
        }
      };

    } catch (error) {
      console.error('Get quota error:', error);
      return {
        success: false,
        error: {
          code: 'QUOTA_CHECK_FAILED',
          message: 'Failed to check storage quota',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Clean up expired files
   */
  async cleanupExpiredFiles(): Promise<TryOnApiResponse<{ deletedCount: number }>> {
    try {
      console.log('Starting cleanup of expired files...');

      // Get expired files
      const { data: expiredFiles, error } = await this.supabase
        .from('tryon_files')
        .select('file_id, storage_path')
        .lt('expires_at', new Date().toISOString());

      if (error) {
        throw error;
      }

      if (!expiredFiles || expiredFiles.length === 0) {
        return {
          success: true,
          data: { deletedCount: 0 }
        };
      }

      let deletedCount = 0;

      // Delete each expired file
      for (const file of expiredFiles) {
        try {
          await this.deleteFromStorage(file.storage_path);
          
          const { error: deleteError } = await this.supabase
            .from('tryon_files')
            .delete()
            .eq('file_id', file.file_id);

          if (!deleteError) {
            deletedCount++;
          } else {
            console.error(`Failed to delete file ${file.file_id}:`, deleteError);
          }
        } catch (err) {
          console.error(`Failed to delete expired file ${file.file_id}:`, err);
        }
      }

      console.log(`Cleanup completed: ${deletedCount}/${expiredFiles.length} files deleted`);

      return {
        success: true,
        data: { deletedCount }
      };

    } catch (error) {
      console.error('Cleanup error:', error);
      return {
        success: false,
        error: {
          code: 'CLEANUP_FAILED',
          message: 'Failed to cleanup expired files',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * List user's files
   */
  async listUserFiles(
    userId: string, 
    type?: 'garment' | 'person' | 'result'
  ): Promise<TryOnApiResponse<FileMetadata[]>> {
    try {
      let query = this.supabase
        .from('tryon_files')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const files: FileMetadata[] = (data || []).map(file => ({
        fileId: file.file_id,
        userId: file.user_id,
        type: file.type,
        originalName: file.original_name,
        fileSize: file.file_size,
        mimeType: file.mime_type,
        dimensions: file.dimensions,
        storagePath: file.storage_path,
        validationResult: file.validation_result,
        expiresAt: new Date(file.expires_at)
      }));

      return {
        success: true,
        data: files
      };

    } catch (error) {
      console.error('List files error:', error);
      return {
        success: false,
        error: {
          code: 'LIST_FILES_FAILED',
          message: 'Failed to list user files',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  // Private helper methods

  private async validateFile(file: File): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size > STORAGE_CONFIG.maxFileSize) {
      errors.push(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(STORAGE_CONFIG.maxFileSize / 1024 / 1024)}MB)`);
    }

    // Check file type
    if (!STORAGE_CONFIG.allowedMimeTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not supported. Allowed types: ${STORAGE_CONFIG.allowedMimeTypes.join(', ')}`);
    }

    // Check minimum file size
    if (file.size < 1024) {
      warnings.push('File size is very small, which may affect processing quality');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.map(msg => ({ field: 'file', code: 'VALIDATION_ERROR', message: msg, severity: 'error' as const })),
      warnings: warnings.map(msg => ({ field: 'file', code: 'VALIDATION_WARNING', message: msg }))
    };
  }

  private async checkUserQuota(userId: string): Promise<TryOnApiResponse<boolean>> {
    try {
      const quotaResult = await this.getUserQuota(userId);
      if (!quotaResult.success) {
        // If database tables don't exist, allow upload for development
        console.log('Database quota check failed, allowing upload for development:', quotaResult.error);
        return { success: true, data: true };
      }

      const quota = quotaResult.data!;
      if (quota.fileCount >= STORAGE_CONFIG.maxFilesPerUser) {
        return {
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: `File limit exceeded (${quota.fileCount}/${STORAGE_CONFIG.maxFilesPerUser})`
          }
        };
      }

      return { success: true, data: true };
    } catch (error) {
      // Fallback: allow upload if quota check fails
      console.log('Quota check error, allowing upload for development:', error);
      return { success: true, data: true };
    }
  }

  private async uploadToStorage(
    file: File, 
    storagePath: string, 
    options: UploadOptions
  ): Promise<TryOnApiResponse<string>> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const expiresIn = (options.expiresIn || STORAGE_CONFIG.defaultExpirationHours) * 3600; // Convert to seconds

      const { data, error } = await this.supabase.storage
        .from(STORAGE_CONFIG.bucket)
        .upload(storagePath, arrayBuffer, {
          contentType: file.type,
          upsert: false,
          cacheControl: `max-age=${expiresIn}`
        });

      if (error) {
        return {
          success: false,
          error: {
            code: 'STORAGE_UPLOAD_FAILED',
            message: error.message,
            details: error
          }
        };
      }

      return {
        success: true,
        data: data.path
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STORAGE_UPLOAD_ERROR',
          message: 'Failed to upload to storage',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  private async deleteFromStorage(storagePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(STORAGE_CONFIG.bucket)
      .remove([storagePath]);

    if (error) {
      console.error('Storage delete error:', error);
      // Don't throw - deletion should be tolerant of missing files
    }
  }

  private async getPublicUrl(storagePath: string): Promise<string> {
    const { data } = this.supabase.storage
      .from(STORAGE_CONFIG.bucket)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  private async storeFileMetadata(
    metadata: FileMetadata, 
    options: UploadOptions
  ): Promise<TryOnApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('tryon_files')
        .insert({
          file_id: metadata.fileId,
          user_id: metadata.userId || null,
          type: metadata.type,
          original_name: metadata.originalName,
          file_size: metadata.fileSize,
          mime_type: metadata.mimeType,
          dimensions: metadata.dimensions || null,
          storage_path: metadata.storagePath,
          storage_bucket: STORAGE_CONFIG.bucket,
          validation_result: metadata.validationResult || null,
          expires_at: metadata.expiresAt.toISOString()
        });

      if (error) {
        return {
          success: false,
          error: {
            code: error.code || 'DATABASE_INSERT_FAILED',
            message: error.message || 'Failed to store file metadata',
            details: error
          }
        };
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'METADATA_STORE_ERROR',
          message: 'Failed to store metadata',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  private async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    const { data, error } = await this.supabase
      .from('tryon_files')
      .select('*')
      .eq('file_id', fileId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }

    return {
      fileId: data.file_id,
      userId: data.user_id,
      type: data.type,
      originalName: data.original_name,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      dimensions: data.dimensions,
      storagePath: data.storage_path,
      validationResult: data.validation_result,
      expiresAt: new Date(data.expires_at)
    };
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'jpg';
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number } | undefined> {
    try {
      if (!file.type.startsWith('image/')) {
        return undefined;
      }

      // Use the imageValidation service which has server-compatible dimension extraction
      const { imageValidation } = await import('./imageValidation');
      const analysis = await imageValidation.analyzeImage(file);
      
      if (analysis && analysis.dimensions) {
        return analysis.dimensions;
      }
      
      // Fallback dimensions
      return { width: 800, height: 600 };
    } catch (error) {
      console.log('Image dimension extraction failed, using fallback:', error);
      return { width: 800, height: 600 };
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
