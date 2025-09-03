"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";

export default function AuthBoot() {
  const router = useRouter();
  const pathname = usePathname();
  const [ran, setRan] = useState(false);

  useEffect(() => {
    // 1) If tokens are in hash, Supabase will pick them up because detectSessionInUrl=true
    // 2) After it runs, clean the URL (remove #access_token etc.)
    // 3) If we now have a session, go to /account (unless we're already there)

    (async () => {
      // give Supabase a tick to parse hash
      await new Promise((r) => setTimeout(r, 0));

      const { data: { session } } = await supabase.auth.getSession();

      // Clean hash if present
      if (typeof window !== "undefined" && window.location.hash) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }

      // If we just logged in, send to account once
      if (session && pathname !== "/account") {
        router.replace("/account");
      }
      setRan(true);
    })();

    // also react to future auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && pathname !== "/account") {
        router.replace("/account");
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [router, pathname]);

  return null;
}