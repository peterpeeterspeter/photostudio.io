"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function AccountPage() {
  const { session, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <p className="text-sm text-neutral-500">Checking your session…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">You're signed out</h1>
        <p className="text-neutral-600">
          Please sign in to access your account.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center rounded-md bg-black px-4 py-2 text-white"
        >
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

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await signOut();
          window.location.href = "/login";
        }}
      >
        <button className="rounded-md border px-4 py-2">Sign out</button>
      </form>
    </div>
  );
}