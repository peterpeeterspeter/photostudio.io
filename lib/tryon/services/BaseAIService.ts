import type {
  TryOnRequest,
  TryOnResponse,
  AIServiceConfig,
  ProcessingQualityMetrics,
  ServiceError,
  AIProvider
} from '@/types/ai-services';

/**
 * Abstract base class for all AI service providers
 * Defines the contract for virtual try-on processing
 */
export abstract class BaseAIService {
  protected config: AIServiceConfig;
  protected metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalProcessingTime: number;
    averageQuality: number;
  };

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalProcessingTime: 0,
      averageQuality: 0,
    };
  }

  /**
   * Main method for processing virtual try-on requests
   */
  abstract processTryOn(request: TryOnRequest): Promise<TryOnResponse>;

  /**
   * Health check for the service
   */
  abstract isHealthy(): Promise<boolean>;

  /**
   * Get service capabilities and current status
   */
  getCapabilities() {
    return this.config.capabilities;
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 
        ? this.metrics.successfulRequests / this.metrics.totalRequests 
        : 0,
      averageProcessingTime: this.metrics.successfulRequests > 0
        ? this.metrics.totalProcessingTime / this.metrics.successfulRequests
        : 0,
    };
  }

  /**
   * Validate request before processing
   */
  protected validateRequest(request: TryOnRequest): ServiceError | null {
    const { userImage, garmentImage, options } = request;

    // Check image formats
    const supportedFormats = this.config.capabilities.supportedFormats;
    if (!supportedFormats.includes(userImage.format)) {
      return {
        code: 'UNSUPPORTED_FORMAT',
        message: `User image format ${userImage.format} not supported`,
        type: 'client',
        retryable: false,
      };
    }

    if (!supportedFormats.includes(garmentImage.format)) {
      return {
        code: 'UNSUPPORTED_FORMAT',
        message: `Garment image format ${garmentImage.format} not supported`,
        type: 'client',
        retryable: false,
      };
    }

    // Check garment type support
    const supportedGarments = this.config.capabilities.supportedGarmentTypes;
    if (!supportedGarments.includes(options.garmentType)) {
      return {
        code: 'UNSUPPORTED_GARMENT_TYPE',
        message: `Garment type ${options.garmentType} not supported`,
        type: 'client',
        retryable: false,
      };
    }

    // Check image size limits
    const maxSize = this.config.capabilities.maxImageSize;
    if (userImage.metadata?.size && userImage.metadata.size > maxSize) {
      return {
        code: 'IMAGE_TOO_LARGE',
        message: `User image exceeds maximum size of ${maxSize} bytes`,
        type: 'client',
        retryable: false,
      };
    }

    if (garmentImage.metadata?.size && garmentImage.metadata.size > maxSize) {
      return {
        code: 'IMAGE_TOO_LARGE',
        message: `Garment image exceeds maximum size of ${maxSize} bytes`,
        type: 'client',
        retryable: false,
      };
    }

    return null;
  }

  /**
   * Update metrics after processing
   */
  protected updateMetrics(
    processingTime: number,
    success: boolean,
    qualityScore?: number
  ) {
    this.metrics.totalRequests++;
    this.metrics.totalProcessingTime += processingTime;

    if (success) {
      this.metrics.successfulRequests++;
      if (qualityScore !== undefined) {
        // Update running average
        const currentAvg = this.metrics.averageQuality;
        const successCount = this.metrics.successfulRequests;
        this.metrics.averageQuality = 
          ((currentAvg * (successCount - 1)) + qualityScore) / successCount;
      }
    } else {
      this.metrics.failedRequests++;
    }
  }

  /**
   * Create a standardized error response
   */
  protected createErrorResponse(
    jobId: string,
    error: ServiceError,
    requestId: string
  ): TryOnResponse {
    return {
      success: false,
      jobId,
      status: 'failed',
      progress: 0,
      error,
      metadata: {
        provider: this.config.name,
        model: 'unknown',
        version: '1.0',
        processingTime: 0,
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate a unique job ID
   */
  protected generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${this.config.name}-${timestamp}-${random}`;
  }

  /**
   * Generate a unique request ID
   */
  protected generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Calculate quality metrics from processing result
   */
  protected calculateQualityMetrics(
    userImage: any,
    garmentImage: any,
    resultImage: any
  ): ProcessingQualityMetrics {
    // Base implementation - services can override for more sophisticated metrics
    return {
      bodyDetection: {
        confidence: 0.8,
        keypoints: 17,
        accuracy: 0.85,
      },
      garmentAlignment: {
        accuracy: 0.8,
        coverage: 0.9,
        distortion: 0.2,
      },
      lighting: {
        consistency: 0.8,
        naturalness: 0.75,
        shadowQuality: 0.7,
      },
      overall: {
        realism: 0.8,
        quality: 0.8,
        processingTime: 0,
      },
    };
  }

  /**
   * Check if result meets quality threshold
   */
  protected meetsQualityThreshold(metrics: ProcessingQualityMetrics): boolean {
    const minOverallQuality = 0.6;
    const minRealism = 0.6;
    const minBodyDetection = 0.7;

    return (
      metrics.overall.quality >= minOverallQuality &&
      metrics.overall.realism >= minRealism &&
      metrics.bodyDetection.confidence >= minBodyDetection
    );
  }
}
