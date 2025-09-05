/**
 * Result Client for Virtual Try-On
 * Handles fetching, caching, and managing try-on results
 */

import type { TryOnResult, TryOnApiResponse } from '@/types/tryon';

export interface ResultClientOptions {
  baseUrl?: string;
  apiKey?: string;
  cacheResults?: boolean;
  cacheDuration?: number; // in milliseconds
}

export interface CachedResult {
  result: TryOnResult;
  timestamp: number;
  expiresAt: number;
}

export class ResultClient {
  private baseUrl: string;
  private apiKey?: string;
  private cache: Map<string, CachedResult>;
  private cacheEnabled: boolean;
  private cacheDuration: number;

  constructor(options: ResultClientOptions = {}) {
    this.baseUrl = options.baseUrl || '/api/tryon';
    this.apiKey = options.apiKey;
    this.cache = new Map();
    this.cacheEnabled = options.cacheResults !== false;
    this.cacheDuration = options.cacheDuration || 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Fetch try-on result by job ID
   */
  async getResult(jobId: string, useCache: boolean = true): Promise<TryOnApiResponse<TryOnResult>> {
    try {
      // Check cache first
      if (useCache && this.cacheEnabled) {
        const cached = this.getCachedResult(jobId);
        if (cached) {
          return {
            success: true,
            data: cached.result
          };
        }
      }

      const response = await fetch(`${this.baseUrl}/result/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: response.status === 404 ? 'RESULT_NOT_FOUND' : 'FETCH_ERROR',
            message: errorData.error || `Failed to fetch result: ${response.status}`
          }
        };
      }

      const data = await response.json();
      const result = data.result || data;

      // Cache the result
      if (this.cacheEnabled) {
        this.cacheResult(jobId, result);
      }

      return {
        success: true,
        data: result
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network error while fetching result'
        }
      };
    }
  }

  /**
   * Download result image
   */
  async downloadResultImage(
    jobId: string,
    imageType: 'result' | 'original' | 'thumbnail' = 'result',
    format?: 'jpg' | 'png' | 'webp'
  ): Promise<TryOnApiResponse<Blob>> {
    try {
      const resultResponse = await this.getResult(jobId);
      
      if (!resultResponse.success || !resultResponse.data) {
        return {
          success: false,
          error: resultResponse.error
        };
      }

      const result = resultResponse.data;
      let imageUrl: string;

      switch (imageType) {
        case 'original':
          imageUrl = result.originalImageUrl;
          break;
        case 'thumbnail':
          imageUrl = result.thumbnailUrl || result.resultImageUrl;
          break;
        case 'result':
        default:
          imageUrl = result.resultImageUrl;
          break;
      }

      // Fetch the image
      const imageResponse = await fetch(imageUrl, {
        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {},
      });

      if (!imageResponse.ok) {
        return {
          success: false,
          error: {
            code: 'IMAGE_FETCH_ERROR',
            message: `Failed to download image: ${imageResponse.status}`
          }
        };
      }

      const blob = await imageResponse.blob();

      // Convert format if requested
      if (format && format !== this.getImageFormat(blob.type)) {
        const convertedBlob = await this.convertImageFormat(blob, format);
        return {
          success: true,
          data: convertedBlob
        };
      }

      return {
        success: true,
        data: blob
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DOWNLOAD_ERROR',
          message: error.message || 'Failed to download image'
        }
      };
    }
  }

  /**
   * Get multiple results (user's history)
   */
  async getResultHistory(
    limit: number = 10,
    offset: number = 0
  ): Promise<TryOnApiResponse<TryOnResult[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`${this.baseUrl}/results?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: 'HISTORY_ERROR',
            message: errorData.error || `Failed to fetch history: ${response.status}`
          }
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.results || data
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network error while fetching history'
        }
      };
    }
  }

  /**
   * Delete a result
   */
  async deleteResult(jobId: string): Promise<TryOnApiResponse<{ deleted: boolean }>> {
    try {
      const response = await fetch(`${this.baseUrl}/result/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: 'DELETE_ERROR',
            message: errorData.error || `Failed to delete result: ${response.status}`
          }
        };
      }

      // Remove from cache
      this.cache.delete(jobId);

      const data = await response.json();
      return {
        success: true,
        data: { deleted: true }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network error while deleting result'
        }
      };
    }
  }

  /**
   * Share result (get shareable link)
   */
  async shareResult(
    jobId: string,
    platform: 'facebook' | 'twitter' | 'instagram' | 'generic' = 'generic'
  ): Promise<TryOnApiResponse<{ shareUrl: string; expiresAt: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/result/${jobId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({ platform }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: 'SHARE_ERROR',
            message: errorData.error || `Failed to create share link: ${response.status}`
          }
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          shareUrl: data.shareUrl,
          expiresAt: data.expiresAt
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network error while creating share link'
        }
      };
    }
  }

  /**
   * Rate result quality
   */
  async rateResult(
    jobId: string,
    rating: number,
    feedback?: string
  ): Promise<TryOnApiResponse<{ rated: boolean }>> {
    try {
      if (rating < 1 || rating > 5) {
        return {
          success: false,
          error: {
            code: 'INVALID_RATING',
            message: 'Rating must be between 1 and 5'
          }
        };
      }

      const response = await fetch(`${this.baseUrl}/result/${jobId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({ rating, feedback }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: 'RATING_ERROR',
            message: errorData.error || `Failed to submit rating: ${response.status}`
          }
        };
      }

      return {
        success: true,
        data: { rated: true }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network error while submitting rating'
        }
      };
    }
  }

  /**
   * Cache management
   */
  private getCachedResult(jobId: string): CachedResult | null {
    const cached = this.cache.get(jobId);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(jobId);
      return null;
    }

    return cached;
  }

  private cacheResult(jobId: string, result: TryOnResult): void {
    const now = Date.now();
    this.cache.set(jobId, {
      result,
      timestamp: now,
      expiresAt: now + this.cacheDuration
    });
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Utility methods
   */
  private getImageFormat(mimeType: string): string {
    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('webp')) return 'webp';
    return 'jpg';
  }

  private async convertImageFormat(blob: Blob, targetFormat: 'jpg' | 'png' | 'webp'): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        if (ctx) {
          if (targetFormat === 'jpg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0);
        }

        canvas.toBlob((convertedBlob) => {
          if (convertedBlob) {
            resolve(convertedBlob);
          } else {
            reject(new Error('Failed to convert image format'));
          }
        }, `image/${targetFormat}`, 0.9);

        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image for conversion'));
      };

      img.src = URL.createObjectURL(blob);
    });
  }
}
