"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      await new Promise(r => setTimeout(r, 0));
      if (typeof window !== "undefined") {
        window.history.replaceState({}, document.title, "/account");
      }
      router.replace("/account");
    })();
  }, [router]);
  return null;
}