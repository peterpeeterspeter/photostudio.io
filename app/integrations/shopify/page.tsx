export default function ShopifyIntegrationPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold">Shopify Integration</h1>
      <p className="mt-4 text-gray-600">
        Sync AI-enhanced images directly to your Shopify products. Install the app
        and connect your store in minutes.
      </p>

      <div className="mt-8 flex gap-4">
        <a
          href="/api/shopify/install"
          className="rounded-lg bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700"
        >
          Connect Shopify
        </a>
        <a
          href="https://apps.shopify.com" // replace with your app listing when live
          className="rounded-lg border px-6 py-3 text-gray-700 hover:border-gray-400"
        >
          View on Shopify App Store
        </a>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        <li className="rounded-lg border p-4">
          <h3 className="font-semibold">One-click publish</h3>
          <p className="text-gray-600">Push edited images to product media instantly.</p>
        </li>
        <li className="rounded-lg border p-4">
          <h3 className="font-semibold">Auto sizes</h3>
          <p className="text-gray-600">Exports for 1:1, 4:5, 9:16 ready for collections and ads.</p>
        </li>
      </ul>
    </main>
  );
}