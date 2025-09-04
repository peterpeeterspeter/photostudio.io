"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      // Clean URL hash and redirect to account
      if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          router.replace("/account");
        }, 0);
      } else {
        router.replace("/account");
      }
    })();
  }, [router]);
  return (
    <div className="mx-auto max-w-xl p-6">
      <p className="text-sm text-neutral-500">Redirecting to your account…</p>
    </div>
  );
}