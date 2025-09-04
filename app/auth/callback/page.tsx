"use client";
import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
      );
      await new Promise(r => setTimeout(r, 0)); // let Supabase store session
      if (typeof window !== "undefined") {
        window.history.replaceState({}, document.title, "/account");
      }
      router.replace("/account");
    })();
  }, [router]);
  return null;
}
