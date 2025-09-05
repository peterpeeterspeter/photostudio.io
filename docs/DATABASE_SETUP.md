# Database Setup for Virtual Try-On Feature

This document describes how to set up the database schema for the virtual try-on feature.

## Prerequisites

1. **Supabase Project**: You need an active Supabase project
2. **Environment Variables**: Set up the required environment variables
3. **Node.js**: Ensure you have Node.js >= 20 installed

## Required Environment Variables

Create a `.env.local` file (or add to your existing `.env` file):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key
```

## Quick Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the database setup script**:
   ```bash
   npm run setup:database
   ```

This will:
- ✅ Create all required tables (`tryon_jobs`, `tryon_files`, `tryon_sessions`, etc.)
- ✅ Set up Row Level Security (RLS) policies
- ✅ Create storage buckets for file uploads
- ✅ Add proper indexes for performance
- ✅ Set up cleanup functions and triggers

## Database Schema Overview

### Core Tables

#### `tryon_jobs`
Main table for tracking virtual try-on processing jobs.
- Stores job status, AI provider, processing options
- Links to uploaded files and results
- Includes quality metrics and fit analysis

#### `tryon_files`
Metadata for all uploaded and generated files.
- Tracks file details, validation results, storage paths
- Automatic cleanup based on expiration

#### `tryon_sessions`
User session tracking for the multi-step try-on process.
- Maintains state across upload steps
- Privacy settings and preferences

#### `tryon_analytics`
Events and usage analytics (GDPR compliant).
- User interactions, processing times, errors
- Can be disabled per user preferences

#### `tryon_privacy_actions`
GDPR compliance for data deletion requests.
- Tracks user data deletion requests
- Audit trail for privacy actions

### Storage Buckets

- **`tryon-uploads`**: Secure bucket for uploaded images
  - 10MB file size limit
  - Supports JPEG, PNG, WebP formats
  - User-scoped access via RLS policies

## Security Features

### Row Level Security (RLS)
- ✅ Users can only access their own data
- ✅ Service role has full access for background processing
- ✅ Admin users can access analytics (if admin system exists)

### File Storage Security
- ✅ Files are organized by user ID
- ✅ Non-public bucket (signed URLs for access)
- ✅ Automatic cleanup of expired files

### Privacy Compliance
- ✅ Automatic data expiration (24-hour default)
- ✅ User-controlled privacy settings
- ✅ GDPR data deletion tracking

## Manual Setup (Advanced)

If you prefer to run migrations manually:

1. **Create the schema**:
   ```bash
   # Run in Supabase SQL Editor or via CLI
   cat supabase/migrations/001_create_tryon_schema.sql | supabase db reset
   ```

2. **Set up RLS policies**:
   ```bash
   cat supabase/migrations/002_setup_rls_policies.sql | supabase db reset
   ```

## Development Commands

```bash
# Set up database with sample data
npm run setup:database:sample

# Clean up database (DESTRUCTIVE!)
npm run cleanup:database

# Get help
tsx scripts/setup-database.ts --help
```

## Verification

After setup, verify everything is working:

1. **Check tables exist**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name LIKE 'tryon_%';
   ```

2. **Check storage bucket**:
   ```sql
   SELECT * FROM storage.buckets WHERE name = 'tryon-uploads';
   ```

3. **Test RLS policies**:
   - Try accessing data as different users
   - Verify users can only see their own records

## Troubleshooting

### Common Issues

1. **Missing environment variables**:
   - Ensure all required variables are set
   - Check variable names match exactly

2. **Permission errors**:
   - Verify service role key has admin permissions
   - Check RLS policies are correctly applied

3. **Storage bucket errors**:
   - Ensure bucket doesn't already exist with different settings
   - Check CORS configuration in Supabase dashboard

### Getting Help

If you encounter issues:
1. Check the setup script output for specific error messages
2. Verify your Supabase project is active and accessible
3. Test database connection with a simple query
4. Check Supabase dashboard for any configuration issues

## Next Steps

After database setup is complete:
1. ✅ Implement the Storage Service (`lib/tryon/storage.ts`)
2. ✅ Set up file upload API endpoints
3. ✅ Test the complete file upload → storage → metadata flow
4. ✅ Implement cleanup jobs for expired data

## Schema Evolution

As the feature evolves, you may need to:
- Add new columns to existing tables
- Create additional indexes for performance
- Update RLS policies for new use cases
- Modify storage bucket policies

Always test schema changes in a development environment first!
