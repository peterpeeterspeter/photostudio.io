// AI Services Type Definitions for Virtual Try-On

export interface AIServiceConfig {
  name: AIProvider;
  apiKey: string;
  baseUrl: string;
  timeout: number; // in milliseconds
  retryAttempts: number;
  rateLimits: RateLimit;
  capabilities: ServiceCapabilities;
  pricing: PricingTier;
}

export type AIProvider = 'nano-banana' | 'fashn' | 'replicate' | 'fal-ai' | 'huggingface' | 'openai' | 'custom';

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  concurrentRequests: number;
}

export interface ServiceCapabilities {
  maxImageSize: number; // in bytes
  supportedFormats: string[]; // e.g., ['jpg', 'png', 'webp']
  maxResolution: {
    width: number;
    height: number;
  };
  supportedGarmentTypes: GarmentType[];
  features: ServiceFeature[];
  qualityLevels: QualityLevel[];
  processingTime: {
    average: number; // in seconds
    maximum: number;
  };
}

export type ServiceFeature = 
  | 'pose-estimation'
  | 'body-segmentation'
  | 'garment-parsing'
  | 'cloth-simulation'
  | 'lighting-adjustment'
  | 'shadow-generation'
  | 'texture-preservation'
  | 'size-recommendation'
  | 'multi-angle'
  | 'background-removal'
  | 'style-transfer';

export type QualityLevel = 'draft' | 'standard' | 'high' | 'ultra';

export interface PricingTier {
  model: 'free' | 'pay-per-use' | 'subscription' | 'enterprise';
  costPerRequest: number; // in USD
  freeQuota?: number; // requests per month
  subscriptionPrice?: number; // USD per month
}

// Request/Response interfaces for AI services
export interface TryOnRequest {
  userImage: ImageInput;
  garmentImage: ImageInput;
  options: ProcessingOptions;
  metadata?: RequestMetadata;
}

export interface ImageInput {
  url?: string;
  base64?: string;
  buffer?: Buffer;
  format: 'jpg' | 'png' | 'webp';
  dimensions?: {
    width: number;
    height: number;
  };
  metadata?: ImageMetadata;
}

export interface ImageMetadata {
  originalName?: string;
  size: number;
  uploadedAt: string;
  preprocessed?: boolean;
  exifData?: any;
}

export interface ProcessingOptions {
  quality: QualityLevel;
  fitPreference: 'tight' | 'regular' | 'loose';
  preserveBackground: boolean;
  enhanceLighting: boolean;
  generateShadows: boolean;
  garmentType: GarmentType;
  pose?: PoseOptions;
  style?: StyleOptions;
}

export interface PoseOptions {
  type: 'natural' | 'model' | 'custom';
  angle: 'front' | 'side' | 'back' | 'three-quarter';
  adjustments?: {
    armPosition?: string;
    legPosition?: string;
    headTurn?: number; // degrees
  };
}

export interface StyleOptions {
  lighting: 'natural' | 'studio' | 'dramatic' | 'soft';
  background: 'original' | 'neutral' | 'studio' | 'transparent' | 'custom';
  colorAdjustment?: {
    brightness: number; // -100 to 100
    contrast: number; // -100 to 100
    saturation: number; // -100 to 100
  };
}

export interface RequestMetadata {
  userId: string;
  sessionId: string;
  timestamp: string;
  source: 'web' | 'mobile' | 'api';
  version: string;
}

export interface TryOnResponse {
  success: boolean;
  jobId: string;
  resultImage?: ImageOutput;
  status: ProcessingStatus;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // in seconds
  qualityMetrics?: ProcessingQualityMetrics;
  fitAnalysis?: ProcessingFitAnalysis;
  error?: ServiceError;
  metadata: ResponseMetadata;
}

export interface ImageOutput {
  url: string;
  thumbnailUrl?: string;
  format: 'jpg' | 'png' | 'webp';
  dimensions: {
    width: number;
    height: number;
  };
  size: number; // in bytes
  quality: number; // 0-1
  expiresAt: string;
}

export type ProcessingStatus = 
  | 'queued'
  | 'initializing'
  | 'processing'
  | 'post-processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ProcessingQualityMetrics {
  bodyDetection: {
    confidence: number; // 0-1
    keypoints: number; // detected keypoints
    accuracy: number; // 0-1
  };
  garmentAlignment: {
    accuracy: number; // 0-1
    coverage: number; // 0-1 (how much of garment is visible)
    distortion: number; // 0-1 (lower is better)
  };
  lighting: {
    consistency: number; // 0-1
    naturalness: number; // 0-1
    shadowQuality: number; // 0-1
  };
  overall: {
    realism: number; // 0-1
    quality: number; // 0-1
    processingTime: number; // in seconds
  };
}

export interface ProcessingFitAnalysis {
  overallFit: number; // 0-100
  areaAnalysis: {
    shoulders: number;
    chest: number;
    waist: number;
    hips: number;
    length: number;
  };
  sizeRecommendation: {
    current: string;
    recommended: string;
    confidence: number; // 0-1
  };
}

export interface ServiceError {
  code: string;
  message: string;
  type: 'client' | 'server' | 'network' | 'timeout' | 'quota_exceeded' | 'invalid_input';
  retryable: boolean;
  retryAfter?: number; // seconds
  details?: any;
}

export interface ResponseMetadata {
  provider: AIProvider;
  model: string;
  version: string;
  processingTime: number; // in seconds
  queueTime?: number; // in seconds
  cost?: number; // in USD
  requestId: string;
  timestamp: string;
  region?: string;
}

// Service-specific interfaces
export interface NanoBananaConfig extends AIServiceConfig {
  name: 'nano-banana';
  modelVersion: string;
  customEndpoint?: string;
}

export interface FashnConfig extends AIServiceConfig {
  name: 'fashn';
  categorySpecialization: GarmentType[];
  customModels?: string[];
}

export interface ReplicateConfig extends AIServiceConfig {
  name: 'replicate';
  modelId: string;
  version: string;
  webhook?: string;
}

export interface FalAIConfig extends AIServiceConfig {
  name: 'fal-ai';
  model: string;
  optimization: 'speed' | 'quality' | 'balanced';
}

// Fallback and retry configuration
export interface FallbackConfig {
  primaryProvider: AIProvider;
  fallbackProviders: AIProvider[];
  fallbackTriggers: FallbackTrigger[];
  maxRetries: number;
  retryDelay: number; // in milliseconds
}

export type FallbackTrigger = 
  | 'timeout'
  | 'quota_exceeded'
  | 'server_error'
  | 'quality_threshold'
  | 'processing_time';

// Monitoring and analytics
export interface ServiceMetrics {
  provider: AIProvider;
  totalRequests: number;
  successRate: number; // 0-1
  averageProcessingTime: number; // in seconds
  averageQuality: number; // 0-1
  errorRate: number; // 0-1
  costPerRequest: number; // in USD
  uptime: number; // 0-1
  lastUpdated: string;
}

// Import statements for related types
import type { GarmentType } from './tryon';
