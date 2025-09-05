# AI Services Setup Guide

## Overview

The AI Service Orchestrator provides intelligent virtual try-on processing with multiple AI providers, fallback logic, and quality checking. This guide explains how to set up and configure the AI services.

## Required Environment Variables

Add these variables to your `.env.local` file:

```bash
# Google AI (Gemini) - Primary AI service for virtual try-on
# Using Gemini 2.5 Flash Image Preview model
GOOGLE_API_KEY=AIzaSyBR4HK-WLdvSf1vmXgnvGUSN7Ip3VyWep0
GOOGLE_API_BASE_URL=https://generativelanguage.googleapis.com

# Optional: Future AI services
FAL_KEY=your_fal_ai_key_here
REPLICATE_API_TOKEN=your_replicate_token_here
```

## Getting API Keys

### Google AI (Gemini) API Key

1. Go to [Google AI Studio](https://aistudio.google.com/prompts/new_chat?model=gemini-2.5-flash-image-preview)
2. Create a new API key for your project
3. Enable the Generative Language API
4. Use the **Gemini 2.5 Flash Image Preview** model for optimal virtual try-on results
5. Copy the API key to `GOOGLE_API_KEY`

**Note**: We're using Gemini 2.5 Flash Image Preview which is specifically optimized for image processing tasks and provides excellent quality and reliability for virtual try-on scenarios.

### FAL.AI API Key (Future Implementation)

1. Sign up at [FAL.AI](https://www.fal.ai/)
2. Go to your dashboard and generate an API key
3. Copy the key to `FAL_KEY`

### Replicate API Token (Future Implementation)

1. Sign up at [Replicate](https://replicate.com/)
2. Go to your account settings
3. Generate an API token
4. Copy the token to `REPLICATE_API_TOKEN`

## Service Architecture

The AI Service Orchestrator consists of several components:

### 1. TryOnService (Main Interface)
- High-level API for virtual try-on processing
- Handles service initialization and lifecycle management
- Provides simple methods for try-on requests

### 2. TryOnOrchestrator (Fallback Management)
- Manages multiple AI service providers
- Implements intelligent fallback logic
- Circuit breaker pattern for service resilience
- Quality threshold enforcement

### 3. GoogleAIService (Primary Provider)
- Uses Gemini Vision models for image processing
- Advanced prompt engineering for realistic results
- Comprehensive quality metrics calculation

### 4. ServiceFactory (Configuration)
- Environment-based service configuration
- Service registration and validation
- Health monitoring setup

## Usage Example

```typescript
import { tryOnService } from '@/lib/tryon/services';

// Initialize the service (call once at app startup)
await tryOnService.initialize();

// Process a try-on request
const result = await tryOnService.processTryOn({
  userImageUrl: 'https://example.com/person.jpg',
  garmentImageUrl: 'https://example.com/shirt.jpg',
  garmentType: 'shirt',
  options: {
    quality: 'high',
    fitPreference: 'regular',
    preserveBackground: true,
    enhanceLighting: true
  }
});

if (result.success) {
  console.log('Try-on completed:', result.resultImage?.url);
  console.log('Quality score:', result.qualityMetrics?.overall.quality);
} else {
  console.error('Try-on failed:', result.error?.message);
}
```

## Configuration Options

### Processing Options

```typescript
interface ProcessingOptions {
  quality: 'standard' | 'high';           // Processing quality level
  fitPreference: 'tight' | 'regular' | 'loose'; // How the garment should fit
  preserveBackground: boolean;            // Keep original background
  enhanceLighting: boolean;              // Improve lighting quality
  generateShadows: boolean;              // Add realistic shadows
  garmentType: GarmentType;              // Type of garment being tried on
}
```

### Supported Garment Types

- `shirt` - T-shirts, button-ups, blouses
- `dress` - Dresses of all styles
- `pants` - Trousers, jeans, leggings
- `jacket` - Blazers, coats, jackets
- `hoodie` - Hoodies and sweatshirts
- `top` - General upper body garments
- `bottom` - General lower body garments

## Quality Metrics

The service provides comprehensive quality metrics for each processed image:

```typescript
interface ProcessingQualityMetrics {
  bodyDetection: {
    confidence: number;    // 0-1, body detection accuracy
    keypoints: number;     // Number of detected body keypoints
    accuracy: number;      // Overall body detection accuracy
  };
  garmentAlignment: {
    accuracy: number;      // How well the garment aligns with body
    coverage: number;      // Percentage of garment visible
    distortion: number;    // Amount of garment distortion (lower is better)
  };
  lighting: {
    consistency: number;   // Lighting consistency across image
    naturalness: number;   // How natural the lighting appears
    shadowQuality: number; // Quality of generated shadows
  };
  overall: {
    realism: number;       // Overall realism of the result
    quality: number;       // Overall image quality
    processingTime: number; // Time taken to process (seconds)
  };
}
```

## Error Handling

The service includes comprehensive error handling with detailed error codes:

- `UNSUPPORTED_FORMAT` - Image format not supported
- `UNSUPPORTED_GARMENT_TYPE` - Garment type not supported by provider
- `IMAGE_TOO_LARGE` - Image exceeds size limits
- `PROCESSING_FAILED` - AI processing failed
- `QUALITY_THRESHOLD_NOT_MET` - Result quality below threshold
- `ALL_SERVICES_FAILED` - All AI providers failed

## Monitoring and Health Checks

The service includes built-in monitoring:

```typescript
// Get system health status
const status = await tryOnService.getSystemStatus();
console.log('System healthy:', status.healthy);
console.log('Service metrics:', status.systemMetrics);

// Check if service is ready
const ready = await tryOnService.isReady();
```

## Development and Testing

For development, you can create test configurations:

```typescript
import { ServiceFactory } from '@/lib/tryon/services';

// Create test configuration
const testConfig = ServiceFactory.createTestConfig();

// Validate configuration
const isValid = ServiceFactory.validateConfig(testConfig);
```

## Performance Considerations

- **Image Size**: Maximum 20MB per image
- **Resolution**: Up to 4096x4096 pixels
- **Processing Time**: 45-120 seconds average
- **Concurrent Requests**: Limited by provider quotas
- **Quality vs Speed**: Higher quality settings take longer

## Security

- API keys are never logged or exposed in responses
- Images are processed securely and not stored permanently
- All communications use HTTPS
- Rate limiting prevents abuse

## Troubleshooting

### Common Issues

1. **"Google API key not found"**
   - Ensure `GOOGLE_API_KEY` is set in your `.env.local` file
   - Verify the API key is valid and has proper permissions

2. **"All AI services failed"**
   - Check your internet connection
   - Verify API keys are valid
   - Check service status pages for outages

3. **"Quality threshold not met"**
   - Try different input images with better quality
   - Ensure faces are clearly visible in user photos
   - Use well-lit, high-resolution images

4. **Slow processing times**
   - Use smaller image files (under 5MB recommended)
   - Choose 'standard' quality for faster processing
   - Check network connectivity

### Debug Mode

Set `NODE_ENV=development` for verbose logging and shorter timeouts during development.

## Future Enhancements

The architecture is designed to easily support additional AI providers:

- FAL.AI integration for specialized fashion models
- Replicate integration for alternative processing methods
- Custom model support for specialized use cases
- Batch processing capabilities
- Real-time processing optimizations
