/**
 * Upload Client for Virtual Try-On
 * Handles file uploads with progress tracking and retry logic
 */

import type { TryOnApiResponse, UploadResult } from '@/types/tryon';
import { validateUploadedFile } from '../models/TryOnTypes';
import { preprocessImage } from '../utils/imageProcessing';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: 'preprocessing' | 'uploading' | 'complete';
}

export interface UploadOptions {
  preprocess?: boolean;
  onProgress?: (progress: UploadProgress) => void;
  timeout?: number;
  retryAttempts?: number;
  chunkSize?: number;
}

export class UploadClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = '/api/tryon', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Upload a single file with progress tracking
   */
  async uploadFile(
    file: File,
    fieldName: string,
    options: UploadOptions = {}
  ): Promise<TryOnApiResponse<UploadResult>> {
    const {
      preprocess = true,
      onProgress,
      timeout = 60000,
      retryAttempts = 3
    } = options;

    try {
      // Validate file
      const validation = validateUploadedFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.errors.join(', ')
          }
        };
      }

      // Preprocess if requested
      let processedFile = file;
      if (preprocess) {
        onProgress?.({
          loaded: 0,
          total: file.size,
          percentage: 0,
          stage: 'preprocessing'
        });

        try {
          processedFile = await preprocessImage(file, {
            removeExif: true,
            maxWidth: 2048,
            maxHeight: 2048,
            quality: 0.9
          });
        } catch (preprocessError) {
          console.warn('Preprocessing failed, using original file:', preprocessError);
          processedFile = file;
        }
      }

      // Upload with retry logic
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= retryAttempts; attempt++) {
        try {
          const result = await this.performUpload(processedFile, fieldName, {
            onProgress: (loaded, total) => {
              onProgress?.({
                loaded,
                total,
                percentage: Math.round((loaded / total) * 100),
                stage: 'uploading'
              });
            },
            timeout
          });

          onProgress?.({
            loaded: processedFile.size,
            total: processedFile.size,
            percentage: 100,
            stage: 'complete'
          });

          return {
            success: true,
            data: result
          };

        } catch (error: any) {
          lastError = error;
          
          if (attempt < retryAttempts) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }

      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: lastError?.message || 'Upload failed after retries'
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error.message || 'Upload error'
        }
      };
    }
  }

  /**
   * Upload multiple files (user photo and garment photo)
   */
  async uploadTryOnPhotos(
    userPhoto: File,
    garmentPhoto: File,
    options: UploadOptions & {
      garmentType?: string;
      fitPreference?: string;
    } = {}
  ): Promise<TryOnApiResponse<{ jobId: string; uploadResults: UploadResult[] }>> {
    const {
      garmentType = 'shirt',
      fitPreference = 'regular',
      onProgress,
      ...uploadOptions
    } = options;

    try {
      // Validate both files
      const userValidation = validateUploadedFile(userPhoto);
      const garmentValidation = validateUploadedFile(garmentPhoto);

      if (!userValidation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `User photo: ${userValidation.errors.join(', ')}`
          }
        };
      }

      if (!garmentValidation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Garment photo: ${garmentValidation.errors.join(', ')}`
          }
        };
      }

      // Preprocess both files if requested
      let processedUserPhoto = userPhoto;
      let processedGarmentPhoto = garmentPhoto;

      if (uploadOptions.preprocess !== false) {
        onProgress?.({
          loaded: 0,
          total: userPhoto.size + garmentPhoto.size,
          percentage: 0,
          stage: 'preprocessing'
        });

        try {
          processedUserPhoto = await preprocessImage(userPhoto);
          processedGarmentPhoto = await preprocessImage(garmentPhoto);
        } catch (preprocessError) {
          console.warn('Preprocessing failed, using original files:', preprocessError);
        }
      }

      // Create form data
      const formData = new FormData();
      formData.append('userPhoto', processedUserPhoto);
      formData.append('garmentPhoto', processedGarmentPhoto);
      formData.append('garmentType', garmentType);
      formData.append('fitPreference', fitPreference);

      // Upload with progress tracking
      const totalSize = processedUserPhoto.size + processedGarmentPhoto.size;
      let uploadedSize = 0;

      const xhr = new XMLHttpRequest();

      return new Promise((resolve) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            onProgress?.({
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
              stage: 'uploading'
            });
          }
        });

        xhr.addEventListener('load', () => {
          try {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText);
              
              onProgress?.({
                loaded: totalSize,
                total: totalSize,
                percentage: 100,
                stage: 'complete'
              });

              resolve({
                success: true,
                data: {
                  jobId: response.jobId,
                  uploadResults: [{
                    success: true,
                    fileUrl: response.userPhotoUrl,
                    metadata: {
                      size: processedUserPhoto.size,
                      type: processedUserPhoto.type
                    }
                  }, {
                    success: true,
                    fileUrl: response.garmentPhotoUrl,
                    metadata: {
                      size: processedGarmentPhoto.size,
                      type: processedGarmentPhoto.type
                    }
                  }]
                }
              });
            } else {
              const error = JSON.parse(xhr.responseText);
              resolve({
                success: false,
                error: {
                  code: 'UPLOAD_ERROR',
                  message: error.error || `Upload failed with status ${xhr.status}`
                }
              });
            }
          } catch (parseError) {
            resolve({
              success: false,
              error: {
                code: 'PARSE_ERROR',
                message: 'Failed to parse server response'
              }
            });
          }
        });

        xhr.addEventListener('error', () => {
          resolve({
            success: false,
            error: {
              code: 'NETWORK_ERROR',
              message: 'Network error during upload'
            }
          });
        });

        xhr.addEventListener('timeout', () => {
          resolve({
            success: false,
            error: {
              code: 'TIMEOUT_ERROR',
              message: 'Upload timeout'
            }
          });
        });

        xhr.open('POST', `${this.baseUrl}/upload`);
        
        if (this.apiKey) {
          xhr.setRequestHeader('Authorization', `Bearer ${this.apiKey}`);
        }

        xhr.timeout = uploadOptions.timeout || 60000;
        xhr.send(formData);
      });

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error.message || 'Upload preparation error'
        }
      };
    }
  }

  /**
   * Perform actual upload with XMLHttpRequest for progress tracking
   */
  private async performUpload(
    file: File,
    fieldName: string,
    options: {
      onProgress?: (loaded: number, total: number) => void;
      timeout?: number;
    }
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append(fieldName, file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && options.onProgress) {
          options.onProgress(event.loaded, event.total);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve({
              success: true,
              fileUrl: response.fileUrl,
              metadata: {
                size: file.size,
                type: file.type
              }
            });
          } else {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || `HTTP ${xhr.status}`));
          }
        } catch (parseError) {
          reject(new Error('Failed to parse response'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      xhr.open('POST', `${this.baseUrl}/upload`);
      
      if (this.apiKey) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.apiKey}`);
      }

      xhr.timeout = options.timeout || 60000;
      xhr.send(formData);
    });
  }

  /**
   * Cancel ongoing upload (if supported)
   */
  cancelUpload(): void {
    // Implementation depends on how uploads are tracked
    // This would require maintaining references to active XMLHttpRequest objects
    console.warn('Upload cancellation not yet implemented');
  }

  /**
   * Get upload limits and configuration
   */
  async getUploadLimits(): Promise<TryOnApiResponse<{
    maxFileSize: number;
    allowedTypes: string[];
    maxDimensions: { width: number; height: number };
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'GET',
        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {},
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          maxFileSize: data.maxFileSize || 10 * 1024 * 1024, // 10MB default
          allowedTypes: data.supportedFormats || ['image/jpeg', 'image/png', 'image/webp'],
          maxDimensions: data.maxDimensions || { width: 4096, height: 4096 }
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: error.message || 'Failed to get upload configuration'
        }
      };
    }
  }
}
