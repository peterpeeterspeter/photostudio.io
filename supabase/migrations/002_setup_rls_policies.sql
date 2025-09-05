-- Migration: Row Level Security Policies for Try-On Feature
-- Created: $(date)
-- Description: Set up RLS policies to ensure users can only access their own data

-- Enable RLS on all tables
ALTER TABLE tryon_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tryon_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE tryon_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tryon_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tryon_privacy_actions ENABLE ROW LEVEL SECURITY;

-- =====================================
-- TRYON_JOBS POLICIES
-- =====================================

-- Users can view their own jobs
CREATE POLICY "Users can view their own try-on jobs"
  ON tryon_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create jobs for themselves
CREATE POLICY "Users can create their own try-on jobs"
  ON tryon_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own jobs (for status updates, progress, etc.)
CREATE POLICY "Users can update their own try-on jobs"
  ON tryon_jobs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own jobs
CREATE POLICY "Users can delete their own try-on jobs"
  ON tryon_jobs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all jobs (for background processing)
CREATE POLICY "Service role can manage all try-on jobs"
  ON tryon_jobs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================
-- TRYON_FILES POLICIES
-- =====================================

-- Users can view their own files
CREATE POLICY "Users can view their own try-on files"
  ON tryon_files
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can upload files for themselves
CREATE POLICY "Users can upload their own try-on files"
  ON tryon_files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own files
CREATE POLICY "Users can delete their own try-on files"
  ON tryon_files
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all files (for processing and cleanup)
CREATE POLICY "Service role can manage all try-on files"
  ON tryon_files
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================
-- TRYON_SESSIONS POLICIES
-- =====================================

-- Users can view their own sessions
CREATE POLICY "Users can view their own try-on sessions"
  ON tryon_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create sessions for themselves
CREATE POLICY "Users can create their own try-on sessions"
  ON tryon_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own try-on sessions"
  ON tryon_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete their own try-on sessions"
  ON tryon_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all sessions (for cleanup)
CREATE POLICY "Service role can manage all try-on sessions"
  ON tryon_sessions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================
-- TRYON_ANALYTICS POLICIES
-- =====================================

-- Users can view their own analytics data
CREATE POLICY "Users can view their own analytics data"
  ON tryon_analytics
  FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can insert analytics (for anonymous usage tracking)
CREATE POLICY "Allow analytics insertion"
  ON tryon_analytics
  FOR INSERT
  WITH CHECK (true);

-- Service role can manage all analytics
CREATE POLICY "Service role can manage all analytics"
  ON tryon_analytics
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admin users can view all analytics (if admin table exists)
-- Note: This assumes an admin_users table or similar admin identification method
CREATE POLICY "Admins can view all analytics"
  ON tryon_analytics
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE role = 'admin'
    )
  );

-- =====================================
-- TRYON_PRIVACY_ACTIONS POLICIES
-- =====================================

-- Users can view their own privacy actions
CREATE POLICY "Users can view their own privacy actions"
  ON tryon_privacy_actions
  FOR SELECT
  USING (auth.uid()::TEXT = user_id);

-- Users can create privacy action requests
CREATE POLICY "Users can create privacy action requests"
  ON tryon_privacy_actions
  FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user_id);

-- Service role can manage all privacy actions
CREATE POLICY "Service role can manage privacy actions"
  ON tryon_privacy_actions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admins can view and process privacy actions
CREATE POLICY "Admins can manage privacy actions"
  ON tryon_privacy_actions
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE role = 'admin'
    )
  );

-- =====================================
-- STORAGE BUCKET POLICIES
-- =====================================

-- Create storage buckets with appropriate policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'tryon-uploads',
    'tryon-uploads',
    false,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tryon-uploads bucket
CREATE POLICY "Users can upload their own files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'tryon-uploads' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'tryon-uploads' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'tryon-uploads' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Service role can manage all files in tryon-uploads"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'tryon-uploads' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'tryon-uploads' AND auth.role() = 'service_role');

-- =====================================
-- HELPER FUNCTIONS FOR POLICY CHECKS
-- =====================================

-- Function to check if user is admin (customize based on your user system)
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Customize this logic based on your admin identification system
  -- This is a placeholder that checks for a hypothetical admin role
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a job belongs to the current user
CREATE OR REPLACE FUNCTION job_belongs_to_user(job_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tryon_jobs 
    WHERE id = job_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's file quota usage
CREATE OR REPLACE FUNCTION get_user_file_quota_usage(user_uuid UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(file_size) FROM tryon_files WHERE user_id = user_uuid),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON POLICY "Users can view their own try-on jobs" ON tryon_jobs IS 'Users can only see their own try-on jobs';
COMMENT ON POLICY "Service role can manage all try-on jobs" ON tryon_jobs IS 'Background services need full access for processing';
COMMENT ON POLICY "Users can upload their own files" ON storage.objects IS 'File uploads are scoped to user directories';
COMMENT ON FUNCTION is_admin(UUID) IS 'Helper function to check admin status - customize based on your user system';
COMMENT ON FUNCTION job_belongs_to_user(UUID) IS 'Security helper to verify job ownership';
COMMENT ON FUNCTION get_user_file_quota_usage(UUID) IS 'Calculate total file storage used by a user';
