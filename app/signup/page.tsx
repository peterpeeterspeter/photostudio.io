import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12">
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Start Your Free Trial
            </h1>
            <p className="text-gray-600">
              Transform your product photos in seconds
            </p>
          </div>

          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="you@boutique.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Create a secure password"
              />
            </div>

            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
                Store Name (Optional)
              </label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Your boutique name"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Start Free →
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3 text-xs text-gray-500">
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
              Shopify App
            </span>
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
              GDPR Ready
            </span>
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
              Powered by Google AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}