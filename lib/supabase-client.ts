import { createClient } from '@supabase/supabase-js';

// Client-side Supabase configuration with proper environment variable checks
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  return key;
}

// Create and export the client-side Supabase client
export const supabaseClient = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey(),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Export individual functions for flexibility
export function createSupabaseClient() {
  return createClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
}