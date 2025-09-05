// AI Service Orchestrator - Entry point for virtual try-on processing
// This module provides a comprehensive AI service system with fallback logic,
// quality checking, and multi-provider support for virtual try-on functionality

export { BaseAIService } from './BaseAIService';
export { GoogleAIService } from './GoogleAIService';
export { TryOnOrchestrator } from './TryOnOrchestrator';
export { ServiceFactory, ServiceConfigManager } from './ServiceFactory';
export { TryOnService, tryOnService } from './TryOnService';

// Re-export types for convenience
export type {
  TryOnRequest,
  TryOnResponse,
  AIServiceConfig,
  FallbackConfig,
  ServiceMetrics,
  ProcessingQualityMetrics,
  ServiceError,
  AIProvider,
  ImageInput,
  ImageOutput,
  ProcessingOptions,
  ProcessingStatus,
} from '@/types/ai-services';

/**
 * Quick start usage example:
 * 
 * ```typescript
 * import { tryOnService } from '@/lib/tryon/services';
 * 
 * // Initialize the service (call once at app startup)
 * await tryOnService.initialize();
 * 
 * // Process a try-on request
 * const result = await tryOnService.processTryOn({
 *   userImageUrl: 'https://example.com/person.jpg',
 *   garmentImageUrl: 'https://example.com/shirt.jpg',
 *   garmentType: 'shirt',
 *   options: {
 *     quality: 'high',
 *     fitPreference: 'regular'
 *   }
 * });
 * 
 * if (result.success) {
 *   console.log('Try-on completed:', result.resultImage?.url);
 * } else {
 *   console.error('Try-on failed:', result.error?.message);
 * }
 * ```
 */

/**
 * Service Architecture Overview:
 * 
 * 1. TryOnService - Main high-level interface
 *    └── Provides simple API for try-on processing
 *    └── Handles initialization and configuration
 *    └── Manages service lifecycle
 * 
 * 2. TryOnOrchestrator - Multi-provider management
 *    └── Implements fallback logic between providers
 *    └── Circuit breaker pattern for resilience
 *    └── Quality threshold enforcement
 *    └── Load balancing and health monitoring
 * 
 * 3. BaseAIService - Abstract base for all providers
 *    └── Standardized interface for AI services
 *    └── Common validation and metrics collection
 *    └── Error handling and response formatting
 * 
 * 4. GoogleAIService - Primary AI provider
 *    └── Uses Gemini Vision models
 *    └── Advanced prompt engineering
 *    └── Quality metrics calculation
 * 
 * 5. ServiceFactory - Configuration and instantiation
 *    └── Environment-based configuration
 *    └── Service registration and validation
 *    └── Health monitoring setup
 * 
 * Future providers (FAL.AI, Replicate, etc.) will follow the same pattern
 * by extending BaseAIService and being registered with the orchestrator.
 */

/**
 * Environment Variables Required:
 * 
 * GOOGLE_API_KEY - Required for Google AI service
 * NODE_ENV - development|staging|production (affects timeouts and retry logic)
 * GOOGLE_API_BASE_URL - Optional override for Google API endpoint
 */
