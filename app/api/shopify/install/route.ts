export const runtime = "nodejs";

export async function GET() {
  // If not configured yet, show a friendly message.
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const appUrl   = process.env.NEXT_PUBLIC_BASE_URL;

  if (!clientId) {
    const html = `
      <html><body style="font-family:system-ui;padding:24px">
        <h1>Shopify integration coming soon</h1>
        <p>Set <code>SHOPIFY_CLIENT_ID</code> and implement OAuth to enable install.</p>
      </body></html>`;
    return new Response(html, { headers: { "content-type": "text/html" } });
  }

  // If you already have OAuth ready, redirect to Shopify OAuth:
  // const shop = new URL(req.url).searchParams.get("shop");
  // const redirectUri = `${appUrl}/api/shopify/callback`;
  // const scopes = process.env.SHOPIFY_SCOPES || "write_products,read_products";
  // const url = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  // return Response.redirect(url, 302);

  return new Response("OK");
}