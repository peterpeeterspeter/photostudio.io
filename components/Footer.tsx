import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-indigo-600"></div>
            <span className="font-semibold">Photostudio.io</span>
          </div>
          <p className="max-w-xs text-sm text-gray-600">
            Studio-quality product photos for fashion boutiques — without the studio.
          </p>
        </div>

        <div>
          <h4 className="mb-3 font-semibold text-gray-900">Product</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/editor/batch" className="hover:text-gray-900">Batch Editor</Link></li>
            <li><Link href="/integrations/shopify" className="hover:text-gray-900">Shopify Integration</Link></li>
            <li><Link href="/pricing" className="hover:text-gray-900">Pricing</Link></li>
            <li><Link href="/changelog" className="hover:text-gray-900">Changelog</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-semibold text-gray-900">Company</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/about" className="hover:text-gray-900">About</Link></li>
            <li><Link href="/blog" className="hover:text-gray-900">Blog</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-gray-900">Privacy</Link></li>
            <li><Link href="/legal/terms" className="hover:text-gray-900">Terms</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-gray-500 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Photostudio.io. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <Badge>Shopify App</Badge>
            <Badge>GDPR Ready</Badge>
            <Badge>Powered by Google AI</Badge>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
      {children}
    </span>
  );
}