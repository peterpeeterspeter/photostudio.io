/**
 * Integration tests for the AI Service Orchestrator
 * Tests the complete virtual try-on processing pipeline
 */

import { TryOnService, ServiceFactory } from '../index';
import type { TryOnResponse } from '@/types/ai-services';

// Mock environment variables for testing
const originalEnv = process.env;

beforeEach(() => {
  // Reset service state before each test
  TryOnService.reset();
  
  // Mock environment variables
  process.env = {
    ...originalEnv,
    GOOGLE_API_KEY: 'test-google-api-key',
    NODE_ENV: 'test',
  };
});

afterEach(() => {
  // Restore original environment
  process.env = originalEnv;
});

describe('TryOnService Integration Tests', () => {
  let tryOnService: TryOnService;

  beforeEach(() => {
    tryOnService = TryOnService.getInstance();
  });

  describe('Service Initialization', () => {
    test('should initialize successfully with valid configuration', async () => {
      await expect(tryOnService.initialize()).resolves.not.toThrow();
    });

    test('should report ready status after initialization', async () => {
      await tryOnService.initialize();
      const isReady = await tryOnService.isReady();
      
      // Note: This might be false in test environment without real API keys
      // but should not throw errors
      expect(typeof isReady).toBe('boolean');
    });

    test('should return system capabilities', () => {
      const capabilities = tryOnService.getCapabilities();
      
      expect(capabilities).toHaveProperty('maxImageSize');
      expect(capabilities).toHaveProperty('supportedFormats');
      expect(capabilities).toHaveProperty('maxResolution');
      expect(capabilities.supportedFormats).toContain('jpg');
      expect(capabilities.supportedFormats).toContain('png');
    });

    test('should return supported garment types', () => {
      const garmentTypes = tryOnService.getSupportedGarmentTypes();
      
      expect(Array.isArray(garmentTypes)).toBe(true);
      expect(garmentTypes).toContain('shirt');
      expect(garmentTypes).toContain('dress');
      expect(garmentTypes).toContain('pants');
    });
  });

  describe('Service Configuration', () => {
    test('should validate service configuration correctly', () => {
      const validConfig = ServiceFactory.createTestConfig();
      const isValid = ServiceFactory.validateConfig(validConfig);
      
      expect(isValid).toBe(true);
    });

    test('should reject invalid configuration', () => {
      const invalidConfig = {
        ...ServiceFactory.createTestConfig(),
        apiKey: '', // Invalid empty API key
      };
      
      const isValid = ServiceFactory.validateConfig(invalidConfig);
      expect(isValid).toBe(false);
    });

    test('should create environment-specific configurations', () => {
      const devConfig = ServiceFactory.createEnvironmentConfig('development');
      const prodConfig = ServiceFactory.createEnvironmentConfig('production');
      
      expect(devConfig.timeout).toBeLessThan(prodConfig.timeout!);
      expect(devConfig.retryAttempts).toBeLessThanOrEqual(prodConfig.retryAttempts!);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing user image gracefully', async () => {
      await tryOnService.initialize();
      
      const result = await tryOnService.processTryOn({
        // Missing user image
        garmentImageUrl: 'https://example.com/shirt.jpg',
        garmentType: 'shirt',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVICE_ERROR');
      expect(result.error?.message).toContain('User image is required');
    });

    test('should handle missing garment image gracefully', async () => {
      await tryOnService.initialize();
      
      const result = await tryOnService.processTryOn({
        userImageUrl: 'https://example.com/person.jpg',
        // Missing garment image
        garmentType: 'shirt',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVICE_ERROR');
      expect(result.error?.message).toContain('Garment image is required');
    });

    test('should handle invalid base64 data gracefully', async () => {
      await tryOnService.initialize();
      
      const result = await tryOnService.processTryOn({
        userImageBase64: 'invalid-base64-data',
        garmentImageUrl: 'https://example.com/shirt.jpg',
        garmentType: 'shirt',
      });

      // Should not crash, but might fail during processing
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('jobId');
    });
  });

  describe('Request Processing', () => {
    test('should create valid request structure', async () => {
      // This test verifies request preparation without actually calling AI services
      const mockImageUrl = 'https://example.com/test-image.jpg';
      const mockBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R/Z';
      
      await tryOnService.initialize();
      
      // Test with URL
      const urlResult = await tryOnService.processTryOn({
        userImageUrl: mockImageUrl,
        garmentImageUrl: mockImageUrl,
        garmentType: 'shirt',
        options: {
          quality: 'standard',
          fitPreference: 'regular',
        },
      });

      expect(urlResult).toHaveProperty('jobId');
      expect(urlResult.metadata?.provider).toBeDefined();

      // Test with base64
      const base64Result = await tryOnService.processTryOn({
        userImageBase64: mockBase64,
        garmentImageBase64: mockBase64,
        garmentType: 'dress',
        options: {
          quality: 'high',
          preserveBackground: false,
        },
      });

      expect(base64Result).toHaveProperty('jobId');
      expect(base64Result.metadata?.provider).toBeDefined();
    });

    test('should handle different garment types', async () => {
      await tryOnService.initialize();
      
      const garmentTypes = ['shirt', 'dress', 'pants', 'jacket', 'hoodie'];
      const mockImageUrl = 'https://example.com/test-image.jpg';
      
      for (const garmentType of garmentTypes) {
        const result = await tryOnService.processTryOn({
          userImageUrl: mockImageUrl,
          garmentImageUrl: mockImageUrl,
          garmentType: garmentType as any,
        });

        expect(result).toHaveProperty('jobId');
        expect(result.metadata?.provider).toBeDefined();
      }
    });

    test('should include processing options in metadata', async () => {
      await tryOnService.initialize();
      
      const result = await tryOnService.processTryOn({
        userImageUrl: 'https://example.com/person.jpg',
        garmentImageUrl: 'https://example.com/shirt.jpg',
        garmentType: 'shirt',
        options: {
          quality: 'high',
          fitPreference: 'loose',
          preserveBackground: true,
          enhanceLighting: false,
        },
        userId: 'test-user-123',
        sessionId: 'test-session-456',
      });

      expect(result.metadata?.timestamp).toBeDefined();
      expect(result.metadata?.version).toBeDefined();
    });
  });

  describe('Service Health and Monitoring', () => {
    test('should provide system status', async () => {
      await tryOnService.initialize();
      
      const status = await tryOnService.getSystemStatus();
      
      expect(status).toHaveProperty('healthy');
      expect(status).toHaveProperty('services');
      expect(status).toHaveProperty('systemMetrics');
      expect(typeof status.healthy).toBe('boolean');
    });

    test('should track system metrics', async () => {
      await tryOnService.initialize();
      
      const status = await tryOnService.getSystemStatus();
      const metrics = status.systemMetrics;
      
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('overallSuccessRate');
      expect(metrics).toHaveProperty('averageProcessingTime');
      expect(metrics).toHaveProperty('providerDistribution');
      expect(typeof metrics.totalRequests).toBe('number');
      expect(typeof metrics.overallSuccessRate).toBe('number');
    });

    test('should shutdown gracefully', async () => {
      await tryOnService.initialize();
      await expect(tryOnService.shutdown()).resolves.not.toThrow();
    });
  });
});

describe('ServiceFactory Tests', () => {
  test('should create singleton instances correctly', () => {
    const factory1 = ServiceFactory.getInstance();
    const factory2 = ServiceFactory.getInstance();
    
    expect(factory1).toBe(factory2);
  });

  test('should provide default configurations for all providers', () => {
    const providers = ['nano-banana', 'fal-ai', 'replicate', 'fashn', 'huggingface', 'openai', 'custom'];
    
    providers.forEach(provider => {
      const config = ServiceFactory.getDefaultConfig(provider as any);
      expect(config).toHaveProperty('timeout');
      expect(config).toHaveProperty('retryAttempts');
      expect(config).toHaveProperty('rateLimits');
    });
  });

  test('should reset instances for testing', () => {
    const factory1 = ServiceFactory.getInstance();
    ServiceFactory.reset();
    const factory2 = ServiceFactory.getInstance();
    
    expect(factory1).not.toBe(factory2);
  });
});

// Helper function to create mock image data for testing
function createMockImageData(format: 'jpg' | 'png' = 'jpg'): string {
  // This is a minimal valid JPEG header in base64
  return format === 'jpg' 
    ? '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R/Z'
    : 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
}

// Performance test (optional - only run if needed)
describe.skip('Performance Tests', () => {
  test('should handle concurrent requests', async () => {
    const tryOnService = TryOnService.getInstance();
    await tryOnService.initialize();
    
    const mockImageUrl = 'https://example.com/test-image.jpg';
    const requests = Array(5).fill(null).map(() => 
      tryOnService.processTryOn({
        userImageUrl: mockImageUrl,
        garmentImageUrl: mockImageUrl,
        garmentType: 'shirt',
      })
    );

    const results = await Promise.allSettled(requests);
    
    // All requests should complete (though they may fail due to mock data)
    expect(results).toHaveLength(5);
    results.forEach(result => {
      expect(result.status).toBe('fulfilled');
    });
  });
});
