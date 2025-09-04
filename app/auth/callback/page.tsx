"use client";
import { useEffect, useRef, useState } from "react";
import { sb } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Initializing…");
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return;
    once.current = true;

    (async () => {
      const supabase = sb();
      setStatus("Parsing auth response…");
      await new Promise(r => setTimeout(r, 0));

      let resolved = false;
      const timer = setTimeout(() => { if (!resolved) setStatus("Still waiting for session…"); }, 800);

      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          resolved = true;
          clearTimeout(timer);
          setStatus("Signed in. Redirecting…");
          router.replace("/account");
        }
      });

      const { data } = await supabase.auth.getSession();
      if (data.session && !resolved) {
        resolved = true;
        clearTimeout(timer);
        setStatus("Session found. Redirecting…");
        router.replace("/account");
      }

      setTimeout(async () => {
        if (resolved) return;
        const { data: d2 } = await supabase.auth.getSession();
        if (d2.session) {
          setStatus("Late session grabbed. Redirecting…");
          router.replace("/account");
        } else {
          setStatus("No session available.");
        }
      }, 2000);

      return () => sub.subscription.unsubscribe();
    })();
  }, [router]);

  return <div className="p-6 text-sm text-neutral-500">{status}</div>;
}