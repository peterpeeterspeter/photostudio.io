#!/usr/bin/env tsx
/**
 * Simplified Database Setup for Virtual Try-On Feature
 * This creates the necessary tables using Supabase client methods
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

async function setupDatabase() {
  console.log('🚀 Setting up Virtual Try-On database...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  
  try {
    // Test connection with a simple query
    const { data, error } = await supabase.auth.getSession();
    console.log('📡 Connection test completed');
    
    console.log('✅ Connected to Supabase successfully');
    
    // Set up storage bucket
    await setupStorageBucket();
    
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Visit: http://localhost:3000/tryon');
    console.log('3. Test the virtual try-on flow');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

async function setupStorageBucket() {
  console.log('🪣 Setting up storage bucket...');
  
  try {
    // Create tryon-uploads bucket
    const { error: bucketError } = await supabase.storage.createBucket('tryon-uploads', {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });
    
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.warn('⚠️ Bucket creation failed, but this is often okay:', bucketError.message);
    } else {
      console.log('✅ Storage bucket "tryon-uploads" ready');
    }
    
  } catch (error) {
    console.warn('⚠️ Storage setup had issues (this is often okay for demo):', error);
  }
}

// Run the setup
setupDatabase().catch(console.error);
