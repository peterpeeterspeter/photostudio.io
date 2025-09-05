import { ServiceFactory, ServiceConfigManager } from './ServiceFactory';
import { TryOnOrchestrator } from './TryOnOrchestrator';
import type {
  TryOnRequest,
  TryOnResponse,
  AIProvider,
  ServiceMetrics,
  ProcessingOptions,
  ImageInput,
} from '@/types/ai-services';
import type { GarmentType } from '@/types/tryon';

/**
 * Main Try-On Service - High-level interface for virtual try-on processing
 * This is the primary service that other parts of the application should use
 */
export class TryOnService {
  private static instance: TryOnService;
  private orchestrator: TryOnOrchestrator;
  private configManager: ServiceConfigManager;
  private initialized = false;

  private constructor() {
    this.configManager = new ServiceConfigManager();
    this.orchestrator = ServiceFactory.getInstance().createOrchestrator();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TryOnService {
    if (!TryOnService.instance) {
      TryOnService.instance = new TryOnService();
    }
    return TryOnService.instance;
  }

  /**
   * Initialize the service (call once at application startup)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('Initializing Try-On Service...');
      
      // Load configurations
      await this.configManager.loadConfiguration();
      
      // Start health monitoring
      this.configManager.startHealthMonitoring(this.orchestrator);
      
      this.initialized = true;
      console.log('Try-On Service initialized successfully');
      
      // Log configuration summary
      const summary = this.configManager.getConfigSummary();
      console.log(`AI Services configured: ${summary.enabledProviders.join(', ')}`);
      console.log(`Total processing capacity: ${summary.totalCapacity} concurrent requests`);
      
    } catch (error) {
      console.error('Failed to initialize Try-On Service:', error);
      throw error;
    }
  }

  /**
   * Process a virtual try-on request
   */
  async processTryOn(params: {
    userImageUrl?: string;
    userImageBase64?: string;
    garmentImageUrl?: string;
    garmentImageBase64?: string;
    garmentType: GarmentType;
    options?: Partial<ProcessingOptions>;
    userId?: string;
    sessionId?: string;
  }): Promise<TryOnResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Validate inputs
      if (!params.userImageUrl && !params.userImageBase64) {
        throw new Error('User image is required (URL or base64)');
      }
      
      if (!params.garmentImageUrl && !params.garmentImageBase64) {
        throw new Error('Garment image is required (URL or base64)');
      }

      // Prepare user image
      const userImage: ImageInput = this.prepareImageInput(
        params.userImageUrl,
        params.userImageBase64,
        'user'
      );

      // Prepare garment image
      const garmentImage: ImageInput = this.prepareImageInput(
        params.garmentImageUrl,
        params.garmentImageBase64,
        'garment'
      );

      // Prepare processing options
      const options: ProcessingOptions = {
        quality: 'standard',
        fitPreference: 'regular',
        preserveBackground: true,
        enhanceLighting: true,
        generateShadows: true,
        garmentType: params.garmentType,
        ...params.options,
      };

      // Create request
      const request: TryOnRequest = {
        userImage,
        garmentImage,
        options,
        metadata: {
          userId: params.userId || 'anonymous',
          sessionId: params.sessionId || this.generateSessionId(),
          timestamp: new Date().toISOString(),
          source: 'web',
          version: '1.0',
        },
      };

      // Process with orchestrator
      console.log('Processing try-on request...');
      const result = await this.orchestrator.processTryOn(request);
      
      if (result.success) {
        console.log(`Try-on completed successfully with ${result.metadata.provider}`);
      } else {
        console.error('Try-on processing failed:', result.error);
      }

      return result;

    } catch (error) {
      console.error('Try-on service error:', error);
      
      // Return standardized error response
      return {
        success: false,
        jobId: `error-${Date.now()}`,
        status: 'failed',
        progress: 0,
        error: {
          code: 'SERVICE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'server',
          retryable: false,
          details: error,
        },
        metadata: {
          provider: 'service',
          model: 'error',
          version: '1.0',
          processingTime: 0,
          requestId: `error-${Date.now()}`,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Get system health and metrics
   */
  async getSystemStatus(): Promise<{
    healthy: boolean;
    services: Map<AIProvider, { healthy: boolean; metrics: ServiceMetrics }>;
    systemMetrics: {
      totalRequests: number;
      overallSuccessRate: number;
      averageProcessingTime: number;
      providerDistribution: Map<AIProvider, number>;
    };
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const serviceStatus = await this.orchestrator.getHealthStatus();
    const systemMetrics = this.orchestrator.getSystemMetrics();
    
    // Determine overall health
    const healthy = Array.from(serviceStatus.values()).some(status => status.healthy);

    return {
      healthy,
      services: serviceStatus,
      systemMetrics,
    };
  }

  /**
   * Check if service is ready to process requests
   */
  async isReady(): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    try {
      const status = await this.getSystemStatus();
      return status.healthy;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Get supported garment types
   */
  getSupportedGarmentTypes(): GarmentType[] {
    // Return intersection of supported types across all services
    return ['shirt', 'dress', 'pants', 'jacket', 'hoodie', 'top', 'bottom'];
  }

  /**
   * Get processing capabilities
   */
  getCapabilities(): {
    maxImageSize: number;
    supportedFormats: string[];
    maxResolution: { width: number; height: number };
    qualityLevels: string[];
    averageProcessingTime: number;
    maxProcessingTime: number;
  } {
    // Return conservative estimates based on available services
    return {
      maxImageSize: 20 * 1024 * 1024, // 20MB
      supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      maxResolution: { width: 4096, height: 4096 },
      qualityLevels: ['standard', 'high'],
      averageProcessingTime: 45, // seconds
      maxProcessingTime: 120, // seconds
    };
  }

  /**
   * Shutdown the service gracefully
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('Shutting down Try-On Service...');
    
    // Stop health monitoring
    this.configManager.stopHealthMonitoring();
    
    this.initialized = false;
    console.log('Try-On Service shut down successfully');
  }

  /**
   * Prepare image input from URL or base64
   */
  private prepareImageInput(
    url?: string,
    base64?: string,
    type?: string
  ): ImageInput {
    if (url) {
      return {
        url,
        format: this.extractFormatFromUrl(url),
        metadata: {
          originalName: url.split('/').pop() || 'image',
          size: 0, // Will be determined during processing
          uploadedAt: new Date().toISOString(),
        },
      };
    }

    if (base64) {
      // Extract format from base64 data URL if present
      const formatMatch = base64.match(/^data:image\/(\w+);base64,/);
      const format = formatMatch ? formatMatch[1] as any : 'jpg';
      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');

      return {
        base64: cleanBase64,
        format,
        metadata: {
          originalName: `${type || 'image'}.${format}`,
          size: Math.round((cleanBase64.length * 3) / 4), // Approximate size
          uploadedAt: new Date().toISOString(),
        },
      };
    }

    throw new Error('Either URL or base64 data must be provided');
  }

  /**
   * Extract image format from URL
   */
  private extractFormatFromUrl(url: string): 'jpg' | 'jpeg' | 'png' | 'webp' {
    const extension = url.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'jpg';
      case 'png':
        return 'png';
      case 'webp':
        return 'webp';
      default:
        return 'jpg'; // Default fallback
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Reset singleton (useful for testing)
   */
  static reset(): void {
    if (TryOnService.instance) {
      TryOnService.instance.shutdown();
    }
    TryOnService.instance = new TryOnService();
    ServiceFactory.reset();
  }
}

// Export singleton instance for easy access
export const tryOnService = TryOnService.getInstance();