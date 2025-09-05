import { TryOnOrchestrator } from './TryOnOrchestrator';
import type {
  AIServiceConfig,
  FallbackConfig,
  AIProvider,
  RateLimit,
  ServiceCapabilities,
  PricingTier,
} from '@/types/ai-services';

/**
 * Factory for creating and configuring AI services
 * Centralized configuration management for the try-on system
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  private orchestrator: TryOnOrchestrator | null = null;

  private constructor() {}

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  /**
   * Create and configure the try-on orchestrator with all available services
   */
  createOrchestrator(): TryOnOrchestrator {
    if (this.orchestrator) {
      return this.orchestrator;
    }

    // Define fallback configuration
    const fallbackConfig: FallbackConfig = {
      primaryProvider: 'nano-banana',
      fallbackProviders: ['fal-ai', 'replicate'], // Will be implemented later
      fallbackTriggers: ['timeout', 'server_error', 'quality_threshold'],
      maxRetries: 3,
      retryDelay: 2000,
    };

    this.orchestrator = new TryOnOrchestrator(fallbackConfig);

    // Register available services
    this.registerFalAIService();
    // Additional services will be registered here as they're implemented

    return this.orchestrator;
  }

  /**
   * Register Google AI (Nano Banana) service
   */
  private registerFalAIService(): void {
    const apiKey = process.env.FAL_KEY;
    
    if (!apiKey) {
      console.warn('FAL_KEY not found, skipping fal.ai service registration');
      return;
    }

    const config: AIServiceConfig = {
      name: 'nano-banana',
      apiKey,
      baseUrl: 'https://fal.run',
      timeout: 300000, // 5 minutes for image generation
      retryAttempts: 2,
      rateLimits: this.getFalAIRateLimits(),
      capabilities: this.getFalAICapabilities(),
      pricing: this.getFalAIPricing(),
    };

    this.orchestrator?.registerService('nano-banana', config);
    console.log('fal.ai service registered successfully');
  }

  /**
   * Get fal.ai rate limits
   */
  private getFalAIRateLimits(): RateLimit {
    return {
      requestsPerMinute: 120, // fal.ai typically has good rate limits
      requestsPerHour: 2000,
      requestsPerDay: 20000,
      concurrentRequests: 5,
    };
  }

  /**
   * Get fal.ai capabilities
   */
  private getFalAICapabilities(): ServiceCapabilities {
    return {
      maxImageSize: 10 * 1024 * 1024, // 10MB for fal.ai
      supportedFormats: ['jpg', 'jpeg', 'png'],
      maxResolution: { width: 2048, height: 2048 },
      supportedGarmentTypes: ['shirt', 'dress', 'pants', 'jacket', 'hoodie', 'top', 'bottom'],
      features: [
        'virtual-tryon',
        'image-editing',
        'pose-preservation',
        'realistic-rendering',
        'fabric-preservation',
      ],
      qualityLevels: ['standard', 'high'],
      processingTime: { average: 60, maximum: 300 },
    };
  }

  /**
   * Get fal.ai pricing information
   */
  private getFalAIPricing(): PricingTier {
    return {
      model: 'pay-per-use',
      costPerRequest: 0.002, // $0.002 per request (estimated)
      freeQuota: 100, // 100 free requests per month
    };
  }

  /**
   * Create service configuration for different environments
   */
  static createEnvironmentConfig(env: 'development' | 'staging' | 'production'): Partial<AIServiceConfig> {
    const baseConfig = {
      development: {
        timeout: 60000, // Shorter timeout for development
        retryAttempts: 1,
      },
      staging: {
        timeout: 90000,
        retryAttempts: 2,
      },
      production: {
        timeout: 120000,
        retryAttempts: 3,
      },
    };

    return baseConfig[env];
  }

  /**
   * Validate service configuration
   */
  static validateConfig(config: AIServiceConfig): boolean {
    // Required fields validation
    if (!config.name || !config.apiKey || !config.baseUrl) {
      console.error('Missing required service configuration fields');
      return false;
    }

    // Timeout validation
    if (config.timeout <= 0 || config.timeout > 300000) { // Max 5 minutes
      console.error('Invalid timeout configuration');
      return false;
    }

    // Rate limits validation
    if (config.rateLimits.requestsPerMinute <= 0 || 
        config.rateLimits.requestsPerHour <= 0 || 
        config.rateLimits.requestsPerDay <= 0) {
      console.error('Invalid rate limits configuration');
      return false;
    }

    // Capabilities validation
    if (!config.capabilities.supportedFormats || config.capabilities.supportedFormats.length === 0) {
      console.error('No supported formats specified');
      return false;
    }

    if (!config.capabilities.supportedGarmentTypes || config.capabilities.supportedGarmentTypes.length === 0) {
      console.error('No supported garment types specified');
      return false;
    }

    return true;
  }

  /**
   * Get default configuration template
   */
  static getDefaultConfig(provider: AIProvider): Partial<AIServiceConfig> {
    const defaultConfigs = {
      'nano-banana': {
        timeout: 120000,
        retryAttempts: 2,
        rateLimits: {
          requestsPerMinute: 60,
          requestsPerHour: 1000,
          requestsPerDay: 10000,
          concurrentRequests: 5,
        },
      },
      'fal-ai': {
        timeout: 90000,
        retryAttempts: 3,
        rateLimits: {
          requestsPerMinute: 30,
          requestsPerHour: 500,
          requestsPerDay: 5000,
          concurrentRequests: 3,
        },
      },
      'replicate': {
        timeout: 180000, // Replicate can be slower
        retryAttempts: 2,
        rateLimits: {
          requestsPerMinute: 20,
          requestsPerHour: 300,
          requestsPerDay: 2000,
          concurrentRequests: 2,
        },
      },
      'fashn': {
        timeout: 120000,
        retryAttempts: 2,
        rateLimits: {
          requestsPerMinute: 40,
          requestsPerHour: 800,
          requestsPerDay: 8000,
          concurrentRequests: 4,
        },
      },
      'huggingface': {
        timeout: 150000,
        retryAttempts: 2,
        rateLimits: {
          requestsPerMinute: 15,
          requestsPerHour: 200,
          requestsPerDay: 1000,
          concurrentRequests: 2,
        },
      },
      'openai': {
        timeout: 60000,
        retryAttempts: 3,
        rateLimits: {
          requestsPerMinute: 50,
          requestsPerHour: 1000,
          requestsPerDay: 10000,
          concurrentRequests: 10,
        },
      },
      'custom': {
        timeout: 120000,
        retryAttempts: 2,
        rateLimits: {
          requestsPerMinute: 30,
          requestsPerHour: 500,
          requestsPerDay: 5000,
          concurrentRequests: 3,
        },
      },
    };

    return defaultConfigs[provider] || defaultConfigs['custom'];
  }

  /**
   * Create a test configuration for development/testing
   */
  static createTestConfig(): AIServiceConfig {
    return {
      name: 'nano-banana',
      apiKey: 'test-key',
      baseUrl: 'https://test.example.com',
      timeout: 30000,
      retryAttempts: 1,
      rateLimits: {
        requestsPerMinute: 10,
        requestsPerHour: 100,
        requestsPerDay: 1000,
        concurrentRequests: 2,
      },
      capabilities: {
        maxImageSize: 5 * 1024 * 1024, // 5MB for testing
        supportedFormats: ['jpg', 'png'],
        maxResolution: { width: 1024, height: 1024 },
        supportedGarmentTypes: ['shirt', 'dress'],
        features: ['pose-estimation'],
        qualityLevels: ['standard'],
        processingTime: { average: 10, maximum: 30 },
      },
      pricing: {
        model: 'free',
        costPerRequest: 0,
        freeQuota: 1000,
      },
    };
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    ServiceFactory.instance = new ServiceFactory();
  }
}

/**
 * Configuration manager for runtime service management
 */
export class ServiceConfigManager {
  private configs: Map<AIProvider, AIServiceConfig> = new Map();
  private healthCheckIntervals: Map<AIProvider, NodeJS.Timeout> = new Map();

  /**
   * Load configuration from environment variables or config files
   */
  async loadConfiguration(): Promise<void> {
    // Load Google AI configuration
    const googleConfig = this.loadGoogleConfig();
    if (googleConfig) {
      this.configs.set('nano-banana', googleConfig);
    }

    // Future: Load other service configurations
    // const falConfig = this.loadFALConfig();
    // const replicateConfig = this.loadReplicateConfig();

    console.log(`Loaded configurations for ${this.configs.size} AI services`);
  }

  /**
   * Load Google AI configuration from environment
   */
  private loadGoogleConfig(): AIServiceConfig | null {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn('Google API key not found in environment variables');
      return null;
    }

    const baseConfig = ServiceFactory.getDefaultConfig('nano-banana');
    const envConfig = ServiceFactory.createEnvironmentConfig(
      (process.env.NODE_ENV as any) || 'development'
    );

    return {
      name: 'nano-banana',
      apiKey,
      baseUrl: process.env.GOOGLE_API_BASE_URL || 'https://generativelanguage.googleapis.com',
      ...baseConfig,
      ...envConfig,
      capabilities: {
        maxImageSize: 20 * 1024 * 1024,
        supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxResolution: { width: 4096, height: 4096 },
        supportedGarmentTypes: ['shirt', 'dress', 'pants', 'jacket', 'hoodie', 'top', 'bottom'],
        features: [
          'pose-estimation',
          'body-segmentation',
          'garment-parsing',
          'lighting-adjustment',
          'texture-preservation',
          'background-removal',
        ],
        qualityLevels: ['standard', 'high'],
        processingTime: { average: 45, maximum: 120 },
      },
      pricing: {
        model: 'pay-per-use',
        costPerRequest: 0.002,
        freeQuota: 100,
      },
    } as AIServiceConfig;
  }

  /**
   * Get configuration for a specific provider
   */
  getConfig(provider: AIProvider): AIServiceConfig | undefined {
    return this.configs.get(provider);
  }

  /**
   * Update configuration for a provider
   */
  updateConfig(provider: AIProvider, config: AIServiceConfig): boolean {
    if (!ServiceFactory.validateConfig(config)) {
      return false;
    }

    this.configs.set(provider, config);
    console.log(`Updated configuration for ${provider}`);
    return true;
  }

  /**
   * Start health monitoring for all configured services
   */
  startHealthMonitoring(orchestrator: TryOnOrchestrator): void {
    const healthCheckInterval = 60000; // 1 minute

    for (const provider of this.configs.keys()) {
      const interval = setInterval(async () => {
        try {
          const healthStatus = await orchestrator.getHealthStatus();
          const status = healthStatus.get(provider);
          
          if (status && !status.healthy) {
            console.warn(`Health check failed for ${provider}:`, status.metrics);
          }
        } catch (error) {
          console.error(`Health check error for ${provider}:`, error);
        }
      }, healthCheckInterval);

      this.healthCheckIntervals.set(provider, interval);
    }

    console.log('Health monitoring started for all AI services');
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    for (const [provider, interval] of this.healthCheckIntervals) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();
    console.log('Health monitoring stopped');
  }

  /**
   * Get all configurations
   */
  getAllConfigs(): Map<AIProvider, AIServiceConfig> {
    return new Map(this.configs);
  }

  /**
   * Get configuration summary
   */
  getConfigSummary(): {
    totalServices: number;
    enabledProviders: AIProvider[];
    totalCapacity: number;
  } {
    const enabledProviders = Array.from(this.configs.keys());
    const totalCapacity = enabledProviders.reduce((sum, provider) => {
      const config = this.configs.get(provider);
      return sum + (config?.rateLimits.concurrentRequests || 0);
    }, 0);

    return {
      totalServices: this.configs.size,
      enabledProviders,
      totalCapacity,
    };
  }
}
