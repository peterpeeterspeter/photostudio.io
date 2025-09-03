export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // don't cache webhook

import Stripe from "stripe";
import { headers } from "next/headers";

export async function POST(req: Request) {
  // Stripe requires the raw body for signature verification
  const rawBody = await req.text();

  // In your Next.js version, headers() returns a Promise — await it:
  const hdrs = await headers();
  const sig = hdrs.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  // Create Stripe instance INSIDE the handler to avoid build-time env issues
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil",
  });

  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Minimal: just log the event type for now
    console.log("✅ Stripe event:", event.type);

    // TODO: call your updater here:
    // await updateSubscriptionFromEvent(event);

    return new Response("ok", { status: 200 });
  } catch (err: any) {
    console.error("❌ Webhook error:", err?.message || err);
    return new Response("Webhook error", { status: 400 });
  }
}
