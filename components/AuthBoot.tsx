"use client";
import { useEffect } from "react";

export default function AuthBoot() {
  useEffect(() => {
    // If we arrive with #access_token… let Supabase parse it (detectSessionInUrl=true),
    // then clean the URL fragment so refreshes don't break.
    if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      // give supabase a microtask to read the hash first
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }, 0);
    }
  }, []);
  return null;
}