"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home", startsWith: "/" },
  { href: "/editor/batch", label: "Editor", startsWith: "/editor" },
  { href: "/integrations/shopify", label: "Shopify", startsWith: "/integrations" },
  { href: "/account", label: "Account", startsWith: "/account" },
];

function clsx(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-indigo-600"></div>
            <span className="font-semibold">Photostudio.io</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex" aria-label="Primary">
          {links.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.startsWith);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "rounded-md px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}

          <Link
            href="/signup"
            className="ml-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Start Free
          </Link>
        </nav>

        {/* Mobile burger */}
        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((s) => !s)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-gray-200 md:hidden">
          <nav className="mx-auto max-w-6xl px-4 py-3" aria-label="Mobile">
            <ul className="flex flex-col gap-1">
              {links.map((l) => {
                const active =
                  l.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(l.startsWith);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={clsx(
                        "block rounded-md px-3 py-2 text-base font-medium",
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-50"
                      )}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
              <li className="pt-1">
                <Link
                  href="/signup"
                  className="block rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700"
                  onClick={() => setOpen(false)}
                >
                  Start Free
                </Link>
              </li>
            </ul>
            <div className="mt-3 flex items-center gap-4 border-t border-gray-200 pt-3">
              <Badge>Shopify App</Badge>
              <Badge>GDPR Ready</Badge>
              <Badge>Powered by Google AI</Badge>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">
      {children}
    </span>
  );
}