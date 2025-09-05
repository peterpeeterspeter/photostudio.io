'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { createSupabaseClient } from '@/lib/supabase-client-only';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signUp: (email: string, password: string, storeName?: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  
  const supabase = createSupabaseClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth session error:', error);
          setError(error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err as AuthError);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Fallback timeout to prevent infinite loading (safety net)
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 10000); // 10 second timeout

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Auth state changed: keep session in sync
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          // Clear any local storage or cache
          setError(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        } else if (event === 'SIGNED_IN') {
          setError(null);
        }
      }
    );

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { user: null, error: authError };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, storeName?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            store_name: storeName || '',
          },
        },
      });

      if (error) {
        setError(error);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { user: null, error: authError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error);
        return { error };
      }

      return { error: null };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { error: authError };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
