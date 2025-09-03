// app/account/shell.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  email: string | null;
  plan: "free" | "pro" | "agency" | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
};

export default function AccountClient() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<"checkout-pro" | "checkout-agency" | "portal" | null>(null);

  // human-friendly date
  const periodEnd = useMemo(() => {
    if (!profile?.current_period_end) return null;
    try {
      const d = new Date(profile.current_period_end);
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return null;
    }
  }, [profile?.current_period_end]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const u = auth?.user ?? null;
        if (!u) {
          setErr("not-auth");
          setLoading(false);
          return;
        }
        if (!mounted) return;

        setUserId(u.id);
        setEmail(u.email || null);

        // Load profile row (RLS policy should allow self-select)
        const { data: prof, error } = await supabase
          .from("profiles")
          .select("id,email,plan,current_period_end,stripe_customer_id")
          .eq("id", u.id)
          .maybeSingle();

        if (error) throw error;
        if (!mounted) return;

        // if profile row doesn't exist yet, create it
        if (!prof) {
          const { error: insErr } = await supabase
            .from("profiles")
            .insert({ id: u.id, email: u.email || null });
          if (insErr) throw insErr;
          setProfile({ id: u.id, email: u.email || null, plan: "free", current_period_end: null, stripe_customer_id: null });
        } else {
          setProfile(prof as Profile);
        }
      } catch (e: any) {
        console.error(e);
        setErr(e?.message || "Failed to load account");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  async function startCheckout(priceEnvKey: "STRIPE_PRICE_PRO_MONTHLY_ID" | "STRIPE_PRICE_AGENCY_MONTHLY_ID") {
    try {
      setBusy(priceEnvKey === "STRIPE_PRICE_PRO_MONTHLY_ID" ? "checkout-pro" : "checkout-agency");

      // Don't put price IDs client-side if you prefer; you can also POST { plan: "pro" } and map server-side.
      const priceId = process.env[priceEnvKey] as string | undefined;
      if (!priceId) {
        // Fallback: let API map a plan string → real price ID
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: priceEnvKey === "STRIPE_PRICE_PRO_MONTHLY_ID" ? "pro" : "agency" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to create checkout session");
        window.location.href = data.url;
        return;
      }

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create checkout session");
      window.location.href = data.url;
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Checkout failed");
    } finally {
      setBusy(null);
    }
  }

  async function openPortal() {
    try {
      setBusy("portal");
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to open billing portal");
      window.location.href = data.url;
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Portal failed");
    } finally {
      setBusy(null);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-bold">Account</h1>
        <p className="mt-4 text-gray-600">Loading your account…</p>
      </main>
    );
  }

  if (err === "not-auth") {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-bold">Account</h1>
        <p className="mt-4 text-gray-600">You're not signed in.</p>
        <a
          href="/login"
          className="mt-6 inline-flex rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Sign in
        </a>
      </main>
    );
  }

  if (err) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-bold">Account</h1>
        <p className="mt-4 text-red-600">Error: {err}</p>
      </main>
    );
  }

  const plan = profile?.plan ?? "free";

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold">Account</h1>

      <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-600">Signed in as</p>
            <p className="text-lg font-semibold">{email || "—"}</p>
          </div>
          <button
            onClick={signOut}
            className="mt-3 inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 sm:mt-0"
          >
            Sign out
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-gray-600">Current plan</p>
            <p className="text-xl font-semibold capitalize">{plan}</p>
            {periodEnd && plan !== "free" && (
              <p className="mt-1 text-xs text-gray-500">Renews: {periodEnd}</p>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm text-gray-600">Stripe customer</p>
            <p className="text-sm">{profile?.stripe_customer_id || "—"}</p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm text-gray-600">Actions</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={openPortal}
                disabled={busy === "portal"}
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50 disabled:opacity-60"
              >
                {busy === "portal" ? "Opening…" : "Manage billing"}
              </button>
            </div>
          </div>
        </div>

        {/* Upgrade area */}
        <div className="mt-8 rounded-lg bg-gray-50 p-4">
          <h3 className="font-semibold">Upgrade your plan</h3>
          <p className="mt-1 text-sm text-gray-600">
            Unlock batch processing, Shopify sync, and priority edits.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => startCheckout("STRIPE_PRICE_PRO_MONTHLY_ID")}
              disabled={busy === "checkout-pro"}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {busy === "checkout-pro" ? "Redirecting…" : "Upgrade to Pro (€39/mo)"}
            </button>
            <button
              onClick={() => startCheckout("STRIPE_PRICE_AGENCY_MONTHLY_ID")}
              disabled={busy === "checkout-agency"}
              className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
            >
              {busy === "checkout-agency" ? "Redirecting…" : "Upgrade to Agency"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}