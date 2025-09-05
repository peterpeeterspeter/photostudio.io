/**
 * Storage Utilities for Virtual Try-On Feature
 * 
 * Provides utility functions for common storage operations,
 * file processing, and data management.
 */

import type { FileMetadata } from './StorageService';

/**
 * Storage utility functions
 */
class StorageUtils {
  
  /**
   * Format file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Generate a descriptive filename
   */
  generateDescriptiveFilename(
    type: 'garment' | 'person' | 'result',
    originalName?: string,
    metadata?: Record<string, any>
  ): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = originalName ? this.getFileExtension(originalName) : 'jpg';
    
    let baseName = `${type}-${timestamp}`;
    
    // Add metadata context if available
    if (metadata?.garmentType) {
      baseName = `${metadata.garmentType}-${type}-${timestamp}`;
    }
    
    return `${baseName}.${extension}`;
  }

  /**
   * Check if file type is supported
   */
  isSupportedFileType(file: File): boolean {
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return supportedTypes.includes(file.type);
  }

  /**
   * Check if file is an image
   */
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Calculate storage path for a file
   */
  generateStoragePath(
    userId: string | undefined,
    type: 'garment' | 'person' | 'result',
    filename: string
  ): string {
    const userFolder = userId || 'anonymous';
    const dateFolder = new Date().toISOString().slice(0, 7); // YYYY-MM format
    return `${userFolder}/${type}/${dateFolder}/${filename}`;
  }

  /**
   * Parse storage path to extract components
   */
  parseStoragePath(path: string): {
    userId: string;
    type: string;
    dateFolder: string;
    filename: string;
  } | null {
    const parts = path.split('/');
    if (parts.length !== 4) return null;
    
    const [userId, type, dateFolder, filename] = parts;
    return { userId, type, dateFolder, filename };
  }

  /**
   * Create a file expiration date
   */
  createExpirationDate(hours: number = 24): Date {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + hours);
    return expiration;
  }

  /**
   * Check if a file has expired
   */
  isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Calculate time until expiration
   */
  getTimeUntilExpiration(expiresAt: Date): {
    expired: boolean;
    hours: number;
    minutes: number;
    humanReadable: string;
  } {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffMs = expiration.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return {
        expired: true,
        hours: 0,
        minutes: 0,
        humanReadable: 'Expired'
      };
    }
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let humanReadable: string;
    if (hours > 0) {
      humanReadable = `${hours}h ${minutes}m`;
    } else {
      humanReadable = `${minutes}m`;
    }
    
    return {
      expired: false,
      hours,
      minutes,
      humanReadable
    };
  }

  /**
   * Group files by type
   */
  groupFilesByType(files: FileMetadata[]): Record<string, FileMetadata[]> {
    return files.reduce((groups, file) => {
      const type = file.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(file);
      return groups;
    }, {} as Record<string, FileMetadata[]>);
  }

  /**
   * Sort files by creation date (newest first)
   */
  sortFilesByDate(files: FileMetadata[], ascending: boolean = false): FileMetadata[] {
    return [...files].sort((a, b) => {
      // Note: We'll need to get creation date from the database query
      // For now, sort by fileId (which includes timestamp)
      return ascending 
        ? a.fileId.localeCompare(b.fileId)
        : b.fileId.localeCompare(a.fileId);
    });
  }

  /**
   * Filter files by date range
   */
  filterFilesByDateRange(
    files: FileMetadata[],
    startDate: Date,
    endDate: Date
  ): FileMetadata[] {
    return files.filter(file => {
      const fileDate = file.expiresAt; // We'd need creation date from DB
      return fileDate >= startDate && fileDate <= endDate;
    });
  }

  /**
   * Calculate total storage used by files
   */
  calculateTotalStorage(files: FileMetadata[]): {
    totalBytes: number;
    totalFormatted: string;
    fileCount: number;
    byType: Record<string, { bytes: number; count: number; formatted: string }>;
  } {
    const byType: Record<string, { bytes: number; count: number; formatted: string }> = {};
    let totalBytes = 0;
    
    files.forEach(file => {
      totalBytes += file.fileSize;
      
      if (!byType[file.type]) {
        byType[file.type] = { bytes: 0, count: 0, formatted: '' };
      }
      
      byType[file.type].bytes += file.fileSize;
      byType[file.type].count += 1;
    });
    
    // Format the byType totals
    Object.keys(byType).forEach(type => {
      byType[type].formatted = this.formatFileSize(byType[type].bytes);
    });
    
    return {
      totalBytes,
      totalFormatted: this.formatFileSize(totalBytes),
      fileCount: files.length,
      byType
    };
  }

  /**
   * Create a file download name
   */
  createDownloadFilename(
    type: 'garment' | 'person' | 'result',
    originalName?: string,
    jobId?: string
  ): string {
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const extension = originalName ? this.getFileExtension(originalName) : 'jpg';
    
    if (type === 'result' && jobId) {
      return `tryon-result-${jobId}-${timestamp}.${extension}`;
    }
    
    const baseName = originalName 
      ? originalName.replace(/\.[^/.]+$/, '') // Remove extension
      : `${type}-image`;
    
    return `${baseName}-${type}-${timestamp}.${extension}`;
  }

  /**
   * Validate storage quota
   */
  validateStorageQuota(
    currentUsage: number,
    newFileSize: number,
    limit: number
  ): {
    valid: boolean;
    wouldExceed: boolean;
    availableSpace: number;
    usageAfterUpload: number;
    percentageUsed: number;
  } {
    const usageAfterUpload = currentUsage + newFileSize;
    const wouldExceed = usageAfterUpload > limit;
    const availableSpace = Math.max(0, limit - currentUsage);
    const percentageUsed = (currentUsage / limit) * 100;
    
    return {
      valid: !wouldExceed,
      wouldExceed,
      availableSpace,
      usageAfterUpload,
      percentageUsed
    };
  }

  /**
   * Create a simple file hash for deduplication (client-side)
   */
  async createFileHash(file: File): Promise<string> {
    // Simple hash based on file properties
    // For a more robust solution, you'd want to use crypto.subtle.digest
    const content = `${file.name}-${file.size}-${file.lastModified}-${file.type}`;
    
    // Simple string hash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Compress image quality for thumbnails or previews
   */
  async compressImage(
    file: File,
    maxWidth: number = 800,
    maxHeight: number = 600,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        const { width, height } = img;
        
        // Calculate new dimensions maintaining aspect ratio
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
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            file.type,
            quality
          );
        } else {
          URL.revokeObjectURL(url);
          reject(new Error('Cannot get canvas context'));
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  /**
   * Create image preview URL (for display purposes)
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Cleanup preview URL
   */
  cleanupPreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}

export const storageUtils = new StorageUtils();
