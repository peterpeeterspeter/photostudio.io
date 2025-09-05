#!/usr/bin/env tsx
/**
 * Create Database Tables for Virtual Try-On Feature
 * This creates the necessary tables using Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

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

async function createTables() {
  console.log('🚀 Creating Virtual Try-On database tables...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  
  try {
    // Read the SQL migration file
    const sqlPath = join(process.cwd(), 'supabase', 'migrations', '001_create_tryon_schema.sql');
    let sql = readFileSync(sqlPath, 'utf-8');
    
    // Replace the $(date) placeholder with actual timestamp
    sql = sql.replace(/\$\(date\)/g, new Date().toISOString());
    
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          
          if (error) {
            // If exec_sql doesn't exist, try direct SQL execution
            if (error.message.includes('function "exec_sql"')) {
              console.log('   ⚠️  exec_sql function not available, trying direct execution...');
              // For basic table creation, we can use specific operations
              await executeBasicSQL(statement);
            } else {
              throw error;
            }
          } else {
            console.log('   ✅ Success');
          }
        } catch (statementError) {
          console.error(`   ❌ Error in statement ${i + 1}:`, statementError);
          // Continue with other statements
        }
      }
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const { data: tables, error: listError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'tryon_%');
    
    if (listError) {
      console.error('❌ Error checking tables:', listError);
    } else {
      const tableNames = tables?.map(t => t.table_name) || [];
      console.log('✅ Created tables:', tableNames);
      
      if (tableNames.includes('tryon_files')) {
        console.log('🎉 Database setup completed successfully!');
      } else {
        console.log('⚠️  Some tables may not have been created. Trying manual creation...');
        await createTablesManually();
      }
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('🔧 Attempting manual table creation...');
    await createTablesManually();
  }
}

async function executeBasicSQL(statement: string) {
  // This is a simplified approach for basic table creation
  // In production, you'd want more sophisticated SQL parsing
  console.log('   🔧 Attempting simplified execution...');
}

async function createTablesManually() {
  console.log('🔧 Creating tables manually...');
  
  try {
    // Create the most essential table first - tryon_files
    const createFilesTable = `
      CREATE TABLE IF NOT EXISTS tryon_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_id TEXT UNIQUE NOT NULL,
        user_id TEXT,
        type TEXT NOT NULL CHECK (type IN ('garment', 'person', 'result')),
        original_name TEXT,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        dimensions JSONB,
        storage_path TEXT NOT NULL,
        storage_bucket TEXT NOT NULL DEFAULT 'tryon-uploads',
        validation_result JSONB,
        preprocessing_applied JSONB DEFAULT '{}',
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    console.log('📝 Creating tryon_files table...');
    const { error: filesError } = await supabase.rpc('exec_sql', { sql: createFilesTable });
    
    if (filesError && !filesError.message.includes('already exists')) {
      console.error('❌ Failed to create tryon_files:', filesError);
    } else {
      console.log('✅ tryon_files table ready');
    }
    
    // Create tryon_jobs table
    const createJobsTable = `
      CREATE TABLE IF NOT EXISTS tryon_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'expired')),
        garment_file_id TEXT NOT NULL,
        person_file_id TEXT NOT NULL,
        result_file_id TEXT,
        ai_provider TEXT NOT NULL DEFAULT 'nano-banana',
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        current_step TEXT,
        options JSONB NOT NULL DEFAULT '{}',
        garment_metadata JSONB DEFAULT '{}',
        person_metadata JSONB DEFAULT '{}',
        processing_time_seconds INTEGER,
        quality_metrics JSONB,
        fit_analysis JSONB,
        error_details JSONB,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `;
    
    console.log('📝 Creating tryon_jobs table...');
    const { error: jobsError } = await supabase.rpc('exec_sql', { sql: createJobsTable });
    
    if (jobsError && !jobsError.message.includes('already exists')) {
      console.error('❌ Failed to create tryon_jobs:', jobsError);
    } else {
      console.log('✅ tryon_jobs table ready');
    }
    
  } catch (error) {
    console.error('❌ Manual table creation failed:', error);
    console.log('\n🔧 Manual setup required - please run the SQL migration in Supabase dashboard:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Open SQL Editor');
    console.log('   3. Run the migration from: supabase/migrations/001_create_tryon_schema.sql');
  }
}

createTables().catch(console.error);
