export const runtime = "nodejs";

import Stripe from "stripe";
import { headers } from "next/headers";
import { updateSubscriptionFromEvent } from "@/lib/stripeSync";

// Init Stripe with your secret (server-side only)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

// Stripe requires the raw body to verify signatures.
// In App Router, reading req.text() gives you the raw payload.
export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return new Response("Missing signature", { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Handle only what we care about
    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
        await updateSubscriptionFromEvent(event);
        break;

      default:
        // ignore other events
        break;
    }

    return new Response("ok", { status: 200 });
  } catch (err: any) {
    console.error("❌ Webhook error:", err?.message || err);
    return new Response("Webhook error", { status: 400 });
  }
}