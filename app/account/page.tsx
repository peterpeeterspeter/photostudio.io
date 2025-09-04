"use client";
import { useEffect, useState } from "react";
import { createClient, type Session } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

export default function AccountPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await new Promise(r => setTimeout(r, 0)); // allow hash parse
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  if (loading) return <p className="p-6 text-neutral-500">Checking your session…</p>;

  if (!session) {
    return (
      <div className="mx-auto max-w-xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">You’re signed out</h1>
        <p className="text-neutral-600">Please sign in to access your account.</p>
        <Link href="/login" className="inline-flex items-center rounded-md bg-black px-4 py-2 text-white">
          Go to Login
        </Link>
      </div>
    );
  }

  const email = session.user.email ?? "Unknown";
  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Account</h1>
      <div className="rounded-lg border p-4">
        <p className="text-sm text-neutral-500">Signed in as</p>
        <p className="text-lg font-medium">{email}</p>
      </div>
      <form onSubmit={async (e) => { e.preventDefault(); await supabase.auth.signOut(); window.location.href = "/login"; }}>
        <button className="rounded-md border px-4 py-2">Sign out</button>
      </form>
    </div>
  );
}
