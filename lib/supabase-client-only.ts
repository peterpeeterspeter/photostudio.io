'use client';

import { createClient } from '@supabase/supabase-js';

// Environment variable validation
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

// Client-side Supabase client (singleton)
let clientInstance: ReturnType<typeof createClient> | null = null;

export function createSupabaseClient() {
  if (clientInstance) return clientInstance;
  
  clientInstance = createClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'photostudio-web'
        }
      }
    }
  );
  
  return clientInstance;
}
