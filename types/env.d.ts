declare namespace NodeJS {
  interface ProcessEnv {
    // Client-side environment variables (available in browser)
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    
    // Server-side environment variables (server-only)
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE: string;
    
    // Other environment variables
    NODE_ENV: 'development' | 'production' | 'test';
  }
}