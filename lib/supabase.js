import { createClient } from '@supabase/supabase-js';

export function supabaseService() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE; // server-side only
  return createClient(url, key, { auth: { persistSession: false } });
}

export function supabaseAnon() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY; // for signed URLs if needed
  return createClient(url, key, { auth: { persistSession: false } });
}