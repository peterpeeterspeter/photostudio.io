# AI Service Orchestrator 🤖

The AI Service Orchestrator is a comprehensive, production-ready system for managing multiple AI providers with intelligent fallback logic, quality checking, and monitoring. It serves as the brain of your virtual try-on system.

## 🚀 Features

### ✨ Multi-Provider Support
- **Google AI (Gemini)** - Primary provider with excellent quality
- **Extensible Architecture** - Easy to add FAL.AI, Replicate, and custom providers
- **Intelligent Fallback** - Automatic switching between providers
- **Load Balancing** - Distribute requests based on capacity and health

### 🛡️ Resilience & Reliability  
- **Circuit Breaker Pattern** - Prevent cascading failures
- **Retry Logic** - Smart retry mechanisms with exponential backoff
- **Health Monitoring** - Continuous service health checks
- **Quality Thresholds** - Ensure consistent output quality

### 📊 Monitoring & Analytics
- **Real-time Metrics** - Track success rates, processing times, costs
- **Service Health** - Monitor provider availability and performance
- **Request Analytics** - Detailed logging and monitoring
- **Error Tracking** - Comprehensive error handling and reporting

### 🔧 Production Ready
- **TypeScript** - Full type safety and IntelliSense
- **Environment Config** - Different settings per environment
- **Security** - Secure API key management
- **Testing** - Comprehensive test suite included

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   TryOnService  │    │ TryOnOrchestrator│    │  BaseAIService  │
│                 │    │                  │    │                 │
│ • Main API      │───▶│ • Fallback Logic │───▶│ • Provider Base │
│ • Initialization│    │ • Circuit Breaker│    │ • Validation    │
│ • Configuration │    │ • Quality Check  │    │ • Metrics       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
            ┌───────────────┐ ┌──────────┐ ┌─────────────┐
            │ GoogleAIService│ │ FAL.AI   │ │ Replicate   │
            │               │ │ (Future) │ │ (Future)    │
            │ • Gemini API  │ │          │ │             │
            │ • Primary     │ │          │ │             │
            └───────────────┘ └──────────┘ └─────────────┘
```

## 🚀 Quick Start

### 1. Environment Setup

Add to your `.env.local`:

```bash
# Required for Google AI (Gemini 2.5 Flash Image Preview)
GOOGLE_API_KEY=AIzaSyBR4HK-WLdvSf1vmXgnvGUSN7Ip3VyWep0

# Optional for future providers
FAL_KEY=your_fal_ai_key_here
REPLICATE_API_TOKEN=your_replicate_token_here
```

### 2. Basic Usage

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
  console.log('Try-on completed!', result.resultImage?.url);
} else {
  console.error('Try-on failed:', result.error?.message);
}
```

### 3. API Endpoints

The system includes ready-to-use API endpoints:

- `POST /api/tryon/process` - Process try-on requests
- `GET /api/tryon/process` - Get service capabilities
- `GET /api/tryon/health` - Health check and monitoring

### 4. Test the Service

```bash
# Run the comprehensive test suite
npm run test:ai-service

# Or run directly
tsx scripts/test-ai-service.ts
```

## 📋 API Reference

### TryOnService Methods

```typescript
// Initialize service
await tryOnService.initialize()

// Process try-on
const result = await tryOnService.processTryOn({
  userImageUrl?: string,
  userImageBase64?: string,
  garmentImageUrl?: string,
  garmentImageBase64?: string,
  garmentType: GarmentType,
  options?: ProcessingOptions,
  userId?: string,
  sessionId?: string
})

// Check health
const isReady = await tryOnService.isReady()
const status = await tryOnService.getSystemStatus()

// Get capabilities
const capabilities = tryOnService.getCapabilities()
const garmentTypes = tryOnService.getSupportedGarmentTypes()

// Shutdown
await tryOnService.shutdown()
```

### Processing Options

```typescript
interface ProcessingOptions {
  quality: 'standard' | 'high';           // Processing quality
  fitPreference: 'tight' | 'regular' | 'loose'; // Fit style
  preserveBackground: boolean;            // Keep original background
  enhanceLighting: boolean;              // Improve lighting
  generateShadows: boolean;              // Add realistic shadows
  garmentType: GarmentType;              // Garment category
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

## 📊 Quality Metrics

Each result includes comprehensive quality metrics:

```typescript
interface ProcessingQualityMetrics {
  bodyDetection: {
    confidence: number;    // Body detection accuracy (0-1)
    keypoints: number;     // Detected body keypoints
    accuracy: number;      // Overall detection accuracy
  };
  garmentAlignment: {
    accuracy: number;      // Garment alignment quality
    coverage: number;      // Garment visibility percentage
    distortion: number;    // Distortion level (lower is better)
  };
  lighting: {
    consistency: number;   // Lighting consistency
    naturalness: number;   // Natural lighting appearance
    shadowQuality: number; // Shadow generation quality
  };
  overall: {
    realism: number;       // Overall realism score
    quality: number;       // Image quality score
    processingTime: number; // Processing duration
  };
}
```

## 🔧 Configuration

### Environment-Based Configuration

Different settings for each environment:

```typescript
// Development: Faster timeouts, fewer retries
// Staging: Moderate settings for testing
// Production: Full timeouts and retry logic
```

### Service Configuration

Each AI provider can be configured with:

- **Rate Limits** - Requests per minute/hour/day
- **Timeouts** - Processing and request timeouts
- **Retry Logic** - Number of attempts and delays
- **Quality Thresholds** - Minimum acceptable quality scores

## 🚨 Error Handling

Comprehensive error handling with specific error codes:

- `UNSUPPORTED_FORMAT` - Invalid image format
- `IMAGE_TOO_LARGE` - File size exceeds limits
- `PROCESSING_FAILED` - AI processing error
- `QUALITY_THRESHOLD_NOT_MET` - Result quality too low
- `ALL_SERVICES_FAILED` - No providers available

Each error includes:
- **Code** - Standardized error identifier
- **Message** - Human-readable description
- **Retryable** - Whether the request can be retried
- **Details** - Technical error information

## 📈 Monitoring

### Health Checks

```typescript
// Get system health
const status = await tryOnService.getSystemStatus();

// Check individual services
for (const [provider, health] of status.services) {
  console.log(`${provider}: ${health.healthy ? 'OK' : 'FAILED'}`);
}
```

### Metrics

Track important metrics:
- **Success Rate** - Percentage of successful requests
- **Processing Time** - Average and percentile response times
- **Provider Distribution** - Request distribution across providers
- **Quality Scores** - Average quality metrics
- **Error Rates** - Failure rates by type

### API Monitoring

Use the health endpoint for monitoring:

```bash
# Simple health check
curl https://your-domain.com/api/tryon/health

# Detailed status
curl https://your-domain.com/api/tryon/process
```

## 🔮 Future Enhancements

### Planned Features

1. **Additional AI Providers**
   - FAL.AI integration for specialized fashion models
   - Replicate integration for alternative processing
   - Custom model support

2. **Advanced Features**
   - Batch processing for multiple garments
   - Real-time processing optimizations
   - Advanced quality enhancement
   - Custom style transfer

3. **Performance Improvements**
   - Request queuing and prioritization
   - Result caching mechanisms
   - Progressive image loading
   - WebAssembly optimizations

4. **Enterprise Features**
   - Multi-tenant support
   - Advanced analytics dashboard
   - Custom model training
   - White-label solutions

## 🧪 Testing

### Run Tests

```bash
# Full test suite
npm run test:ai-service

# Specific test categories
npm test -- --grep "Service Initialization"
npm test -- --grep "Error Handling"
npm test -- --grep "Performance"
```

### Test Coverage

The test suite covers:
- ✅ Service initialization and configuration
- ✅ Request processing and validation
- ✅ Error handling and edge cases
- ✅ Health monitoring and metrics
- ✅ Provider fallback logic
- ✅ Quality threshold enforcement

## 🤝 Contributing

### Adding New AI Providers

1. **Create Provider Class**
   ```typescript
   export class NewAIService extends BaseAIService {
     async processTryOn(request: TryOnRequest): Promise<TryOnResponse> {
       // Implementation
     }
   }
   ```

2. **Register with Factory**
   ```typescript
   // In ServiceFactory
   case 'new-provider':
     this.services.set(provider, new NewAIService(config));
     break;
   ```

3. **Add Configuration**
   ```typescript
   // Add to getDefaultConfig method
   'new-provider': {
     timeout: 120000,
     retryAttempts: 2,
     // ... other config
   }
   ```

4. **Update Types**
   ```typescript
   // In types/ai-services.ts
   export type AIProvider = 'nano-banana' | 'fal-ai' | 'replicate' | 'new-provider';
   ```

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Include comprehensive error handling
- Add tests for new features
- Update documentation

## 📝 License

This AI Service Orchestrator is part of the Photostudio.io project. See the main project license for details.

---

**Built with ❤️ for the Photostudio.io virtual try-on system**

The AI Service Orchestrator provides enterprise-grade reliability, scalability, and monitoring for your virtual try-on needs. Start with Google AI and easily expand to multiple providers as your requirements grow.
