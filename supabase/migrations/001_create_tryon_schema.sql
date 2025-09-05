-- Migration: Create Virtual Try-On Schema
-- Created: $(date)
-- Description: Set up tables for virtual try-on feature with proper indexing and RLS

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Try-on jobs table (main job tracking)
CREATE TABLE IF NOT EXISTS tryon_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'expired')),
  
  -- File references
  garment_file_id TEXT NOT NULL,
  person_file_id TEXT NOT NULL,
  result_file_id TEXT,
  
  -- Processing details
  ai_provider TEXT NOT NULL DEFAULT 'nano-banana' CHECK (ai_provider IN ('nano-banana', 'fashn', 'replicate', 'fal-ai', 'custom')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step TEXT,
  
  -- Options and metadata
  options JSONB NOT NULL DEFAULT '{}',
  garment_metadata JSONB DEFAULT '{}',
  person_metadata JSONB DEFAULT '{}',
  
  -- Results
  processing_time_seconds INTEGER,
  quality_metrics JSONB,
  fit_analysis JSONB,
  error_details JSONB,
  
  -- Lifecycle management
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Try-on files table (file metadata and tracking)
CREATE TABLE IF NOT EXISTS tryon_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id TEXT UNIQUE NOT NULL, -- External reference ID
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File details
  type TEXT NOT NULL CHECK (type IN ('garment', 'person', 'result')),
  original_name TEXT,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  dimensions JSONB, -- {width: number, height: number}
  
  -- Storage details
  storage_path TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'tryon-uploads',
  
  -- Validation and processing
  validation_result JSONB,
  preprocessing_applied JSONB DEFAULT '{}',
  
  -- Lifecycle
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Try-on sessions table (user session tracking)
CREATE TABLE IF NOT EXISTS tryon_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  
  -- Session state
  current_step TEXT DEFAULT 'upload',
  garment_file_id TEXT,
  person_file_id TEXT,
  selected_options JSONB DEFAULT '{}',
  
  -- Privacy settings
  privacy_settings JSONB DEFAULT '{
    "auto_delete": true,
    "delete_after_hours": 24,
    "allow_analytics": false,
    "share_results": false
  }',
  
  -- Lifecycle
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '4 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics and events table
CREATE TABLE IF NOT EXISTS tryon_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES tryon_jobs(id) ON DELETE CASCADE,
  session_id UUID REFERENCES tryon_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Event details
  event_type TEXT NOT NULL, -- 'upload', 'process_start', 'process_complete', 'download', 'error', etc.
  event_data JSONB DEFAULT '{}',
  
  -- Context
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  
  -- Timing
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Privacy actions table (GDPR compliance)
CREATE TABLE IF NOT EXISTS tryon_privacy_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Not a foreign key in case user is deleted
  action_type TEXT NOT NULL CHECK (action_type IN ('delete_all_data', 'delete_specific_jobs', 'export_data', 'anonymize_data')),
  
  -- Action details
  target_job_ids UUID[],
  request_details JSONB DEFAULT '{}',
  
  -- Processing
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_tryon_jobs_user_id ON tryon_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_tryon_jobs_status ON tryon_jobs(status);
CREATE INDEX IF NOT EXISTS idx_tryon_jobs_created_at ON tryon_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_tryon_jobs_expires_at ON tryon_jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_tryon_jobs_ai_provider ON tryon_jobs(ai_provider);

CREATE INDEX IF NOT EXISTS idx_tryon_files_user_id ON tryon_files(user_id);
CREATE INDEX IF NOT EXISTS idx_tryon_files_file_id ON tryon_files(file_id);
CREATE INDEX IF NOT EXISTS idx_tryon_files_type ON tryon_files(type);
CREATE INDEX IF NOT EXISTS idx_tryon_files_expires_at ON tryon_files(expires_at);

CREATE INDEX IF NOT EXISTS idx_tryon_sessions_user_id ON tryon_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tryon_sessions_token ON tryon_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_tryon_sessions_expires_at ON tryon_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_tryon_analytics_job_id ON tryon_analytics(job_id);
CREATE INDEX IF NOT EXISTS idx_tryon_analytics_session_id ON tryon_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_tryon_analytics_user_id ON tryon_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_tryon_analytics_event_type ON tryon_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_tryon_analytics_timestamp ON tryon_analytics(timestamp);

CREATE INDEX IF NOT EXISTS idx_tryon_privacy_actions_user_id ON tryon_privacy_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_tryon_privacy_actions_status ON tryon_privacy_actions(status);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tryon_jobs_user_status ON tryon_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tryon_files_user_type ON tryon_files(user_id, type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_tryon_jobs_updated_at 
  BEFORE UPDATE ON tryon_jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tryon_sessions_updated_at 
  BEFORE UPDATE ON tryon_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup expired records
CREATE OR REPLACE FUNCTION cleanup_expired_tryon_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete expired jobs
  DELETE FROM tryon_jobs WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete expired files (will cascade to file metadata)
  DELETE FROM tryon_files WHERE expires_at < NOW();
  
  -- Delete expired sessions
  DELETE FROM tryon_sessions WHERE expires_at < NOW();
  
  -- Delete old analytics data (older than 90 days)
  DELETE FROM tryon_analytics WHERE timestamp < NOW() - INTERVAL '90 days';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE tryon_jobs IS 'Main table for tracking virtual try-on processing jobs';
COMMENT ON TABLE tryon_files IS 'Metadata for all uploaded and generated files in the try-on system';
COMMENT ON TABLE tryon_sessions IS 'User session tracking for multi-step try-on process';
COMMENT ON TABLE tryon_analytics IS 'Events and analytics for try-on usage patterns';
COMMENT ON TABLE tryon_privacy_actions IS 'GDPR compliance tracking for user data deletion requests';

COMMENT ON COLUMN tryon_jobs.options IS 'Processing options like fit preference, quality level, background handling';
COMMENT ON COLUMN tryon_jobs.quality_metrics IS 'AI processing quality scores and metrics';
COMMENT ON COLUMN tryon_jobs.fit_analysis IS 'AI-generated fit analysis and size recommendations';
COMMENT ON COLUMN tryon_files.validation_result IS 'Image validation results including detected clothing type, pose, etc.';
COMMENT ON COLUMN tryon_files.preprocessing_applied IS 'Record of any preprocessing steps applied to the image';
