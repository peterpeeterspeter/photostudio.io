// Virtual Try-On Feature Type Definitions

export interface TryOnUser {
  id: string;
  photo: File | string; // File for upload, string URL for stored images
  measurements?: UserMeasurements;
  preferences?: UserPreferences;
}

export interface UserMeasurements {
  height?: number; // in cm
  weight?: number; // in kg
  bodyType?: 'hourglass' | 'pear' | 'apple' | 'rectangle' | 'inverted-triangle';
  chest?: number; // in cm
  waist?: number; // in cm
  hips?: number; // in cm
  shoulderWidth?: number; // in cm
}

export interface UserPreferences {
  fitPreference: 'tight' | 'regular' | 'loose';
  sizingSystem: 'US' | 'EU' | 'UK' | 'international';
  privacySettings: {
    autoDelete: boolean;
    deleteAfterHours: number;
    allowAnalytics: boolean;
    shareResults: boolean;
  };
}

export interface Garment {
  id: string;
  name: string;
  type: GarmentType;
  photo: File | string;
  brand?: string;
  category: GarmentCategory;
  colors: string[];
  sizes: GarmentSize[];
  material?: string;
  metadata?: GarmentMetadata;
}

export type GarmentType = 
  | 'shirt' | 'tshirt' | 'sweater' | 'hoodie' | 'blazer'
  | 'jeans' | 'pants' | 'shorts' | 'skirt' | 'leggings'
  | 'dress' | 'jumpsuit' | 'romper'
  | 'jacket' | 'coat' | 'vest' | 'cardigan'
  | 'swimwear' | 'underwear' | 'activewear'
  | 'accessories';

export type GarmentCategory = 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'accessories';

export interface GarmentSize {
  label: string; // e.g., "M", "Large", "38"
  measurements: {
    chest?: number;
    waist?: number;
    hips?: number;
    length?: number;
    sleeves?: number;
  };
  system: 'US' | 'EU' | 'UK' | 'international';
}

export interface GarmentMetadata {
  fit: 'tight' | 'regular' | 'loose' | 'oversized';
  stretchiness: 'none' | 'low' | 'medium' | 'high';
  transparency: 'opaque' | 'semi-transparent' | 'transparent';
  formality: 'casual' | 'semi-formal' | 'formal';
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'all-season';
}

export interface TryOnJob {
  id: string;
  userId: string;
  userPhoto: string; // URL to uploaded photo
  garment: Garment;
  options: TryOnOptions;
  status: TryOnJobStatus;
  progress: number; // 0-100
  currentStep?: string;
  aiProvider: AIProvider;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  expiresAt: string;
  result?: TryOnResult;
  error?: TryOnError;
}

export type TryOnJobStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'expired';

export interface TryOnOptions {
  fitPreference: 'tight' | 'regular' | 'loose';
  background: 'original' | 'neutral' | 'studio' | 'transparent';
  angle: 'front' | 'side' | 'back' | 'three-quarter';
  pose: 'natural' | 'model' | 'custom';
  lighting: 'natural' | 'studio' | 'enhanced';
  quality: 'standard' | 'high' | 'ultra';
}

export interface TryOnResult {
  id: string;
  jobId: string;
  originalImageUrl: string;
  resultImageUrl: string;
  thumbnailUrl?: string;
  garmentInfo: {
    name: string;
    type: GarmentType;
    brand?: string;
  };
  fitAnalysis: FitAnalysis;
  qualityMetrics: QualityMetrics;
  processingTime: number; // in seconds
  aiProvider: AIProvider;
  metadata: ResultMetadata;
}

export interface FitAnalysis {
  overallScore: number; // 0-100
  sizeRecommendation: {
    recommendedSize: string;
    confidence: number; // 0-1
    alternatives: Array<{
      size: string;
      confidence: number;
      reason: string;
    }>;
  };
  fitAreas: {
    shoulders: FitScore;
    chest: FitScore;
    waist: FitScore;
    hips: FitScore;
    length: FitScore;
    sleeves?: FitScore;
  };
  recommendations: string[];
}

export interface FitScore {
  score: number; // 0-100
  status: 'too-tight' | 'tight' | 'perfect' | 'loose' | 'too-loose';
  confidence: number; // 0-1
}

export interface QualityMetrics {
  bodyDetectionAccuracy: number; // 0-1
  garmentMappingScore: number; // 0-1
  realismScore: number; // 0-1
  lightingConsistency: number; // 0-1
  proportionAccuracy: number; // 0-1
  overallQuality: number; // 0-1
}

export interface ResultMetadata {
  userId: string;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  downloadCount: number;
  shared: boolean;
  rating?: number; // user rating 1-5
  feedback?: string;
}

export interface TryOnError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  timestamp: string;
}

export type AIProvider = 'nano-banana' | 'fashn' | 'replicate' | 'fal-ai' | 'custom';

// Processing events
export interface ProcessingEvent {
  id: string;
  jobId: string;
  type: 'status_change' | 'progress_update' | 'error' | 'warning';
  data: any;
  timestamp: string;
}

// Upload types
export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  error?: string;
  metadata?: {
    size: number;
    type: string;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

// Privacy types
export interface PrivacyAction {
  action: 'delete_all_data' | 'delete_specific_jobs' | 'export_data' | 'anonymize_data';
  jobIds?: string[];
  userId: string;
  timestamp: string;
  completed: boolean;
  details?: any;
}

// API Response types
export interface TryOnApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime?: number;
  };
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}
