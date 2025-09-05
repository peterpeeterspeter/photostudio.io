#!/usr/bin/env tsx
/**
 * Database Setup Script for Virtual Try-On Feature
 * 
 * This script sets up the complete database schema, RLS policies, and storage buckets
 * for the virtual try-on feature. Run this after setting up your Supabase project.
 * 
 * Usage:
 *   npm run setup:database
 *   or
 *   tsx scripts/setup-database.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

/**
 * Execute SQL migration file
 */
async function executeMigration(filename: string): Promise<void> {
  try {
    console.log(`📄 Executing migration: ${filename}`);
    
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', filename);
    const sql = readFileSync(migrationPath, 'utf-8');
    
    // Replace $(date) placeholder with actual timestamp
    const processedSql = sql.replace(/\$\(date\)/g, new Date().toISOString());
    
    // Split SQL into individual statements and execute them one by one
    const statements = processedSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.from('').select('').limit(0).rpc('', {}).sql(statement + ';');
        
        // Since we can't use rpc, let's try a different approach using the REST API
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY,
          },
          body: JSON.stringify({ sql: statement + ';' })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`SQL execution failed: ${errorText}`);
        }
      }
    }
    
    console.log(`✅ Migration ${filename} executed successfully`);
  } catch (error) {
    console.error(`❌ Failed to execute migration ${filename}:`, error);
    throw error;
  }
}

/**
 * Create a custom exec_sql function if it doesn't exist
 */
async function createExecSqlFunction(): Promise<void> {
  const { error } = await supabase.rpc('exec_sql', { 
    sql: `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    ` 
  });
  
  if (error && !error.message.includes('already exists')) {
    // If exec_sql doesn't exist, we'll use direct SQL execution
    console.log('⚠️ Using direct SQL execution (exec_sql function not available)');
  }
}

/**
 * Set up storage buckets with proper configuration
 */
async function setupStorageBuckets(): Promise<void> {
  console.log('🪣 Setting up storage buckets...');
  
  try {
    // Create tryon-uploads bucket
    const { error: bucketError } = await supabase.storage.createBucket('tryon-uploads', {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });
    
    if (bucketError && !bucketError.message.includes('already exists')) {
      throw bucketError;
    }
    
    console.log('✅ Storage bucket "tryon-uploads" created/verified');
    
    // Set up bucket CORS policy for web uploads
    const corsPolicy = {
      allowedOrigins: ['*'], // Customize based on your domain
      allowedHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      maxAgeSeconds: 3600
    };
    
    // Note: CORS policies are typically set via Supabase dashboard or CLI
    console.log('📝 Remember to configure CORS policies in Supabase dashboard');
    
  } catch (error) {
    console.error('❌ Failed to set up storage buckets:', error);
    throw error;
  }
}

/**
 * Verify database setup by running basic queries
 */
async function verifySetup(): Promise<void> {
  console.log('🔍 Verifying database setup...');
  
  try {
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'tryon_%');
    
    if (tablesError) throw tablesError;
    
    const expectedTables = [
      'tryon_jobs',
      'tryon_files', 
      'tryon_sessions',
      'tryon_analytics',
      'tryon_privacy_actions'
    ];
    
    const foundTables = tables?.map(t => t.table_name) || [];
    const missingTables = expectedTables.filter(table => !foundTables.includes(table));
    
    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }
    
    console.log('✅ All required tables found');
    
    // Check if storage bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) throw bucketsError;
    
    const hasUploadsBucket = buckets?.some(bucket => bucket.name === 'tryon-uploads');
    if (!hasUploadsBucket) {
      throw new Error('Storage bucket "tryon-uploads" not found');
    }
    
    console.log('✅ Storage bucket verified');
    console.log('✅ Database setup verification complete');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

/**
 * Create sample data for testing (optional)
 */
async function createSampleData(): Promise<void> {
  console.log('📝 Creating sample data...');
  
  try {
    // This would create test data for development
    // Omitted for production safety
    console.log('ℹ️ Sample data creation skipped (implement if needed for development)');
  } catch (error) {
    console.error('❌ Failed to create sample data:', error);
    // Don't throw - sample data is optional
  }
}

/**
 * Main setup function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting Virtual Try-On database setup...\n');
  
  try {
    // Initialize exec_sql function
    await createExecSqlFunction();
    
    // Execute migrations in order
    await executeMigration('001_create_tryon_schema.sql');
    await executeMigration('002_setup_rls_policies.sql');
    
    // Set up storage
    await setupStorageBuckets();
    
    // Verify everything is working
    await verifySetup();
    
    // Optionally create sample data
    if (process.argv.includes('--sample-data')) {
      await createSampleData();
    }
    
    console.log('\n🎉 Virtual Try-On database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Configure environment variables in your .env file');
    console.log('   2. Test the setup by running the storage service');
    console.log('   3. Set up CORS policies in Supabase dashboard if needed');
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  }
}

/**
 * Cleanup function for development
 */
async function cleanup(): Promise<void> {
  if (process.argv.includes('--cleanup')) {
    console.log('🧹 Cleaning up database...');
    
    const tables = [
      'tryon_privacy_actions',
      'tryon_analytics', 
      'tryon_sessions',
      'tryon_files',
      'tryon_jobs'
    ];
    
    for (const table of tables) {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: `DROP TABLE IF EXISTS ${table} CASCADE;` 
      });
      if (error) {
        console.error(`Failed to drop table ${table}:`, error);
      } else {
        console.log(`✅ Dropped table ${table}`);
      }
    }
    
    // Remove storage bucket
    const { error: bucketError } = await supabase.storage.deleteBucket('tryon-uploads');
    if (bucketError && !bucketError.message.includes('not found')) {
      console.error('Failed to delete bucket:', bucketError);
    } else {
      console.log('✅ Deleted storage bucket');
    }
    
    console.log('🧹 Cleanup completed');
    return;
  }
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log(`
Virtual Try-On Database Setup Script

Usage:
  tsx scripts/setup-database.ts [options]

Options:
  --sample-data    Create sample data for development/testing
  --cleanup        Remove all try-on related tables and buckets (destructive!)
  --help           Show this help message

Environment Variables Required:
  SUPABASE_URL              Your Supabase project URL
  SUPABASE_SERVICE_ROLE     Your Supabase service role key

Examples:
  tsx scripts/setup-database.ts
  tsx scripts/setup-database.ts --sample-data
  tsx scripts/setup-database.ts --cleanup
  `);
  process.exit(0);
}

// Run cleanup if requested, otherwise run main setup
if (process.argv.includes('--cleanup')) {
  cleanup().catch(console.error);
} else {
  main().catch(console.error);
}
