"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { sb } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";

type Ctx = { session: Session | null; loading: boolean; signOut: () => Promise<{ error: any | null }> };
const AuthCtx = createContext<Ctx>({ session: null, loading: true, signOut: async () => ({ error: null }) });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = sb();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log('AuthProvider: Starting session check...');
      await new Promise(r => setTimeout(r, 0)); // allow hash parse
      const { data } = await supabase.auth.getSession();
      console.log('AuthProvider: Session data:', data);
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
      console.log('AuthProvider: Loading complete, session:', !!data.session);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      console.log('AuthProvider: Auth state change:', event, !!s);
      setSession(s ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <AuthCtx.Provider value={{ session, loading, signOut: () => supabase.auth.signOut() }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);