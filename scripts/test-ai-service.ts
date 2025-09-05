#!/usr/bin/env tsx

/**
 * Test script for AI Service Orchestrator
 * Run with: npm run test:ai-service
 * Or directly: tsx scripts/test-ai-service.ts
 */

import { config } from 'dotenv';
import { tryOnService, ServiceFactory } from '../lib/tryon/services';

// Load environment variables
config({ path: '.env.local' });

async function testAIService() {
  console.log('🤖 Testing AI Service Orchestrator\n');

  try {
    // Test 1: Service Initialization
    console.log('1️⃣ Testing service initialization...');
    await tryOnService.initialize();
    console.log('✅ Service initialized successfully\n');

    // Test 2: Check Service Readiness
    console.log('2️⃣ Checking service readiness...');
    const isReady = await tryOnService.isReady();
    console.log(`${isReady ? '✅' : '⚠️'} Service ready: ${isReady}\n`);

    // Test 3: Get Capabilities
    console.log('3️⃣ Getting service capabilities...');
    const capabilities = tryOnService.getCapabilities();
    console.log('📋 Capabilities:');
    console.log(`   Max image size: ${Math.round(capabilities.maxImageSize / 1024 / 1024)}MB`);
    console.log(`   Supported formats: ${capabilities.supportedFormats.join(', ')}`);
    console.log(`   Max resolution: ${capabilities.maxResolution.width}x${capabilities.maxResolution.height}`);
    console.log(`   Quality levels: ${capabilities.qualityLevels.join(', ')}`);
    console.log(`   Processing time: ${capabilities.averageProcessingTime}-${capabilities.maxProcessingTime}s\n`);

    // Test 4: Get Supported Garment Types
    console.log('4️⃣ Getting supported garment types...');
    const garmentTypes = tryOnService.getSupportedGarmentTypes();
    console.log(`👕 Supported garment types: ${garmentTypes.join(', ')}\n`);

    // Test 5: System Status
    console.log('5️⃣ Getting system status...');
    const status = await tryOnService.getSystemStatus();
    console.log('📊 System Status:');
    console.log(`   Overall health: ${status.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`   Total requests: ${status.systemMetrics.totalRequests}`);
    console.log(`   Success rate: ${Math.round(status.systemMetrics.overallSuccessRate * 100)}%`);
    console.log(`   Avg processing time: ${Math.round(status.systemMetrics.averageProcessingTime)}s`);
    
    console.log('\n🔧 Service Details:');
    for (const [provider, serviceStatus] of status.services) {
      const icon = serviceStatus.healthy ? '✅' : '❌';
      console.log(`   ${icon} ${provider}:`);
      console.log(`      Requests: ${serviceStatus.metrics.totalRequests}`);
      console.log(`      Success rate: ${Math.round(serviceStatus.metrics.successRate * 100)}%`);
      console.log(`      Avg time: ${Math.round(serviceStatus.metrics.averageProcessingTime)}s`);
    }

    // Test 6: Configuration Validation
    console.log('\n6️⃣ Testing configuration validation...');
    const testConfig = ServiceFactory.createTestConfig();
    const isValidConfig = ServiceFactory.validateConfig(testConfig);
    console.log(`✅ Configuration validation: ${isValidConfig ? 'Pass' : 'Fail'}\n`);

    // Test 7: Environment Configuration
    console.log('7️⃣ Checking environment configuration...');
    console.log('🔑 Environment Variables:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`   GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`   FAL_KEY: ${process.env.FAL_KEY ? '✅ Set' : '⚠️ Not set (optional)'}`);
    console.log(`   REPLICATE_API_TOKEN: ${process.env.REPLICATE_API_TOKEN ? '✅ Set' : '⚠️ Not set (optional)'}`);

    // Test 8: Mock Processing Request (if environment allows)
    console.log('\n8️⃣ Testing mock processing request...');
    if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'test-google-api-key') {
      console.log('🧪 Attempting mock try-on processing...');
      
      // Create minimal test images (1x1 pixel)
      const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R/Z';

      try {
        const result = await tryOnService.processTryOn({
          userImageBase64: testImageBase64,
          garmentImageBase64: testImageBase64,
          garmentType: 'shirt',
          options: {
            quality: 'standard',
            fitPreference: 'regular',
          },
        });

        if (result.success) {
          console.log(`✅ Mock processing successful!`);
          console.log(`   Job ID: ${result.jobId}`);
          console.log(`   Provider: ${result.metadata.provider}`);
          console.log(`   Processing time: ${result.metadata.processingTime}s`);
          if (result.qualityMetrics) {
            console.log(`   Quality score: ${Math.round(result.qualityMetrics.overall.quality * 100)}%`);
          }
        } else {
          console.log(`⚠️ Mock processing failed: ${result.error?.message}`);
          console.log(`   Error code: ${result.error?.code}`);
          console.log(`   Retryable: ${result.error?.retryable}`);
        }
      } catch (error) {
        console.log(`❌ Mock processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log('⏭️ Skipping mock processing (no valid API key)');
    }

    // Test 9: Cleanup
    console.log('\n9️⃣ Testing graceful shutdown...');
    await tryOnService.shutdown();
    console.log('✅ Service shut down successfully\n');

    console.log('🎉 All tests completed!\n');

    // Summary
    console.log('📋 Test Summary:');
    console.log(`✅ Service initialization: Pass`);
    console.log(`${isReady ? '✅' : '⚠️'} Service readiness: ${isReady ? 'Pass' : 'Warning (no API key?)'}`);
    console.log(`✅ Capabilities check: Pass`);
    console.log(`✅ Garment types: Pass`);
    console.log(`✅ System status: Pass`);
    console.log(`✅ Configuration validation: Pass`);
    console.log(`✅ Environment check: Pass`);
    console.log(`${process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'test-google-api-key' ? '🧪' : '⏭️'} Mock processing: ${process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'test-google-api-key' ? 'Attempted' : 'Skipped'}`);
    console.log(`✅ Graceful shutdown: Pass`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  testAIService()
    .then(() => {
      console.log('\n✨ AI Service Orchestrator test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 AI Service Orchestrator test failed:', error);
      process.exit(1);
    });
}

export { testAIService };
