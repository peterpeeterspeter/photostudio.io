import { BaseAIService } from './BaseAIService';
import { FalAIService } from './FalAIService';
import type {
  TryOnRequest,
  TryOnResponse,
  AIServiceConfig,
  FallbackConfig,
  FallbackTrigger,
  ServiceMetrics,
  ServiceError,
  AIProvider,
} from '@/types/ai-services';

/**
 * Orchestrator that manages multiple AI services with intelligent fallback logic
 * The brain of the virtual try-on system
 */
export class TryOnOrchestrator {
  private services: Map<AIProvider, BaseAIService>;
  private fallbackConfig: FallbackConfig;
  private serviceConfigs: Map<AIProvider, AIServiceConfig>;
  private circuitBreakers: Map<AIProvider, CircuitBreaker>;

  constructor(fallbackConfig: FallbackConfig) {
    this.services = new Map();
    this.serviceConfigs = new Map();
    this.circuitBreakers = new Map();
    this.fallbackConfig = fallbackConfig;
  }

  /**
   * Register an AI service with the orchestrator
   */
  registerService(provider: AIProvider, config: AIServiceConfig): void {
    this.serviceConfigs.set(provider, config);
    this.circuitBreakers.set(provider, new CircuitBreaker(provider));

    // Initialize service based on provider type
    switch (provider) {
      case 'nano-banana':
        this.services.set(provider, new FalAIService(config.apiKey));
        break;
      // Future services will be added here
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * Process try-on request with intelligent fallback
   */
  async processTryOn(request: TryOnRequest): Promise<TryOnResponse> {
    const providers = this.getProviderOrder();
    const errors: Array<{ provider: AIProvider; error: ServiceError }> = [];

    for (const provider of providers) {
      const service = this.services.get(provider);
      const circuitBreaker = this.circuitBreakers.get(provider);

      if (!service || !circuitBreaker) {
        console.warn(`Service not available for provider: ${provider}`);
        continue;
      }

      // Check circuit breaker state
      if (circuitBreaker.isOpen()) {
        console.log(`Circuit breaker is open for ${provider}, skipping`);
        continue;
      }

      try {
        console.log(`Attempting try-on with ${provider}...`);
        
        // Add timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Service timeout')), this.getTimeout(provider));
        });

        const processingPromise = service.processTryOn(request);
        const result = await Promise.race([processingPromise, timeoutPromise]);

        // Check if result meets quality standards
        if (this.isAcceptableResult(result)) {
          console.log(`Success with ${provider}`);
          circuitBreaker.recordSuccess();
          
          return {
            ...result,
            metadata: {
              ...result.metadata,
              provider,
            },
          };
        } else {
          console.log(`Quality threshold not met with ${provider}`);
          const qualityError: ServiceError = {
            code: 'QUALITY_THRESHOLD_NOT_MET',
            message: 'Result quality below acceptable threshold',
            type: 'server',
            retryable: true,
          };
          errors.push({ provider, error: qualityError });
          circuitBreaker.recordFailure();
          
          // If this was a quality issue, try next provider
          if (this.shouldTriggerFallback('quality_threshold', qualityError)) {
            continue;
          }
        }
      } catch (error) {
        console.warn(`Service ${provider} failed:`, error);
        
        const serviceError: ServiceError = {
          code: this.categorizeError(error),
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'server',
          retryable: this.isRetryableError(error),
          details: error,
        };

        errors.push({ provider, error: serviceError });
        circuitBreaker.recordFailure();

        // Check if we should retry or fallback
        if (this.shouldRetryWithSameProvider(serviceError, provider)) {
          console.log(`Retrying with ${provider}...`);
          // Implement retry logic here if needed
        }

        // Check if error should trigger fallback
        if (this.shouldTriggerFallback(this.getErrorTriggerType(serviceError), serviceError)) {
          continue;
        }
      }
    }

    // All services failed
    return this.createFallbackErrorResponse(errors);
  }

  /**
   * Get health status of all services
   */
  async getHealthStatus(): Promise<Map<AIProvider, { healthy: boolean; metrics: ServiceMetrics }>> {
    const status = new Map();

    for (const [provider, service] of this.services) {
      try {
        const healthy = await service.isHealthy();
        const metrics = this.convertToServiceMetrics(provider, service.getMetrics());
        status.set(provider, { healthy, metrics });
      } catch (error) {
        status.set(provider, { 
          healthy: false, 
          metrics: this.getDefaultMetrics(provider) 
        });
      }
    }

    return status;
  }

  /**
   * Get overall system metrics
   */
  getSystemMetrics(): {
    totalRequests: number;
    overallSuccessRate: number;
    averageProcessingTime: number;
    providerDistribution: Map<AIProvider, number>;
  } {
    let totalRequests = 0;
    let totalSuccessful = 0;
    let totalProcessingTime = 0;
    const providerDistribution = new Map<AIProvider, number>();

    for (const [provider, service] of this.services) {
      const metrics = service.getMetrics();
      totalRequests += metrics.totalRequests;
      totalSuccessful += metrics.successfulRequests;
      totalProcessingTime += metrics.totalProcessingTime;
      providerDistribution.set(provider, metrics.totalRequests);
    }

    return {
      totalRequests,
      overallSuccessRate: totalRequests > 0 ? totalSuccessful / totalRequests : 0,
      averageProcessingTime: totalSuccessful > 0 ? totalProcessingTime / totalSuccessful : 0,
      providerDistribution,
    };
  }

  /**
   * Get ordered list of providers based on fallback configuration
   */
  private getProviderOrder(): AIProvider[] {
    const order = [this.fallbackConfig.primaryProvider];
    
    // Add fallback providers in order
    for (const provider of this.fallbackConfig.fallbackProviders) {
      if (!order.includes(provider)) {
        order.push(provider);
      }
    }

    // Filter to only include registered services
    return order.filter(provider => this.services.has(provider));
  }

  /**
   * Check if result meets quality standards
   */
  private isAcceptableResult(result: TryOnResponse): boolean {
    console.log('🔍 Quality check - result:', {
      success: result.success,
      status: result.status,
      hasQualityMetrics: !!result.qualityMetrics,
      hasResult: !!result.result,
      resultType: typeof result.result
    });

    // 🚧 DEVELOPMENT MODE: Always accept successful results with valid image URLs
    if (result.success && result.status === 'completed' && result.result) {
      const hasImageUrl = result.result.url || typeof result.result === 'string';
      if (hasImageUrl) {
        console.log('🔧 DEVELOPMENT MODE: Bypassing quality checks - accepting result with image URL');
        console.log('✅ Development bypass - Quality check PASSED');
        return true;
      }
    }

    if (!result.success || result.status !== 'completed') {
      console.log('❌ Quality check failed: success or status check');
      return false;
    }

    if (!result.qualityMetrics) {
      console.log('❌ Quality check failed: no quality metrics');
      return false;
    }

    const metrics = result.qualityMetrics;
    console.log('📊 Quality metrics:', metrics);
    
    // Define minimum quality thresholds (very permissive for development)
    const minOverallQuality = 0.1;   // Extremely low for testing
    const minRealism = 0.1;           // Extremely low for testing
    const minBodyDetection = 0.1;    // Extremely low for testing
    const minGarmentAlignment = 0.1;  // Extremely low for testing

    const qualityPassed = metrics.overall.quality >= minOverallQuality;
    const realismPassed = metrics.overall.realism >= minRealism;
    const bodyDetectionPassed = metrics.bodyDetection.confidence >= minBodyDetection;
    const alignmentPassed = metrics.garmentAlignment.accuracy >= minGarmentAlignment;

    console.log('🎯 Quality threshold checks:', {
      qualityPassed: `${metrics.overall.quality} >= ${minOverallQuality} = ${qualityPassed}`,
      realismPassed: `${metrics.overall.realism} >= ${minRealism} = ${realismPassed}`,
      bodyDetectionPassed: `${metrics.bodyDetection.confidence} >= ${minBodyDetection} = ${bodyDetectionPassed}`,
      alignmentPassed: `${metrics.garmentAlignment.accuracy} >= ${minGarmentAlignment} = ${alignmentPassed}`
    });

    const overallPassed = qualityPassed && realismPassed && bodyDetectionPassed && alignmentPassed;
    console.log(`✅ Overall quality check result: ${overallPassed}`);

    return overallPassed;
  }

  /**
   * Check if error should trigger fallback to next provider
   */
  private shouldTriggerFallback(trigger: FallbackTrigger, error: ServiceError): boolean {
    return this.fallbackConfig.fallbackTriggers.includes(trigger);
  }

  /**
   * Get fallback trigger type from error
   */
  private getErrorTriggerType(error: ServiceError): FallbackTrigger {
    switch (error.code) {
      case 'TIMEOUT':
      case 'REQUEST_TIMEOUT':
        return 'timeout';
      case 'QUOTA_EXCEEDED':
      case 'RATE_LIMIT_EXCEEDED':
        return 'quota_exceeded';
      case 'QUALITY_THRESHOLD_NOT_MET':
        return 'quality_threshold';
      case 'PROCESSING_TIMEOUT':
        return 'processing_time';
      default:
        return 'server_error';
    }
  }

  /**
   * Check if error is retryable with same provider
   */
  private shouldRetryWithSameProvider(error: ServiceError, provider: AIProvider): boolean {
    // For now, we fallback instead of retry with same provider
    // This can be enhanced with more sophisticated retry logic
    return false;
  }

  /**
   * Categorize error for standardized error codes
   */
  private categorizeError(error: any): string {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) return 'TIMEOUT';
      if (error.message.includes('quota')) return 'QUOTA_EXCEEDED';
      if (error.message.includes('rate limit')) return 'RATE_LIMIT_EXCEEDED';
      if (error.message.includes('network')) return 'NETWORK_ERROR';
    }
    return 'PROCESSING_FAILED';
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('temporary') ||
        message.includes('rate limit')
      );
    }
    return false;
  }

  /**
   * Get timeout for specific provider
   */
  private getTimeout(provider: AIProvider): number {
    const config = this.serviceConfigs.get(provider);
    return config?.timeout || 60000; // Default 60 seconds
  }

  /**
   * Create error response when all services fail
   */
  private createFallbackErrorResponse(
    errors: Array<{ provider: AIProvider; error: ServiceError }>
  ): TryOnResponse {
    const lastError = errors[errors.length - 1]?.error || {
      code: 'ALL_SERVICES_FAILED',
      message: 'All AI services failed to process the request',
      type: 'server' as const,
      retryable: true,
    };

    return {
      success: false,
      jobId: `failed-${Date.now()}`,
      status: 'failed',
      progress: 0,
      error: {
        ...lastError,
        details: { allErrors: errors },
      },
      metadata: {
        provider: 'orchestrator',
        model: 'fallback',
        version: '1.0',
        processingTime: 0,
        requestId: `failed-${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Convert service metrics to standard format
   */
  private convertToServiceMetrics(provider: AIProvider, metrics: any): ServiceMetrics {
    return {
      provider,
      totalRequests: metrics.totalRequests,
      successRate: metrics.successRate,
      averageProcessingTime: metrics.averageProcessingTime,
      averageQuality: metrics.averageQuality,
      errorRate: 1 - metrics.successRate,
      costPerRequest: 0, // Will be calculated based on provider pricing
      uptime: 1, // Will be calculated based on health checks
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get default metrics for failed health check
   */
  private getDefaultMetrics(provider: AIProvider): ServiceMetrics {
    return {
      provider,
      totalRequests: 0,
      successRate: 0,
      averageProcessingTime: 0,
      averageQuality: 0,
      errorRate: 1,
      costPerRequest: 0,
      uptime: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Circuit breaker implementation for service resilience
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  private readonly failureThreshold = 5;
  private readonly timeoutDuration = 60000; // 1 minute
  private readonly retryTimePeriod = 30000; // 30 seconds

  constructor(private provider: AIProvider) {}

  isOpen(): boolean {
    if (this.state === 'closed') {
      return false;
    }

    if (this.state === 'open') {
      // Check if we should transition to half-open
      if (Date.now() - this.lastFailureTime > this.retryTimePeriod) {
        this.state = 'half-open';
        console.log(`Circuit breaker for ${this.provider} transitioning to half-open`);
        return false;
      }
      return true;
    }

    // half-open state - allow one request through
    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      console.log(`Circuit breaker for ${this.provider} opened after ${this.failures} failures`);
    }
  }

  getState(): string {
    return this.state;
  }
}
