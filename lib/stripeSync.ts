// lib/stripeSync.ts
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { planForPriceId } from "./stripePrices";

// Admin Supabase client (service role)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  { auth: { persistSession: false } }
);

// Map a user to a plan + current_period_end.
export async function updateSubscriptionFromEvent(event: Stripe.Event) {
  // We'll try to extract (1) stripe_customer_id, (2) user_id (if provided via metadata)
  let stripeCustomerId: string | undefined;
  let plan: string | undefined;
  let periodEnd: string | undefined;
  let userId: string | undefined;

  // Normalize data based on event type
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      stripeCustomerId = s.customer as string | undefined;
      // If you passed user_id when creating Checkout Session:
      userId = (s.metadata && s.metadata.user_id) || (s.client_reference_id ?? undefined) || undefined;

      // On completed checkout, we may not have subscription object in payload; best to fetch it:
      if (s.subscription) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-08-27.basil" });
        const sub = await stripe.subscriptions.retrieve(s.subscription as string);
        const priceId = sub.items.data[0]?.price?.id;
        plan = planForPriceId(priceId);
        if ((sub as any).current_period_end) {
          periodEnd = new Date((sub as any).current_period_end * 1000).toISOString();
        }
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      stripeCustomerId = sub.customer as string | undefined;
      const priceId = sub.items.data[0]?.price?.id;
      plan = (event.type === "customer.subscription.deleted") ? "free" : planForPriceId(priceId);
      if ((sub as any).current_period_end) {
        periodEnd = new Date((sub as any).current_period_end * 1000).toISOString();
      }
      break;
    }

    case "invoice.payment_succeeded":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      stripeCustomerId = invoice.customer as string | undefined;
      // Optional: you can update grace period / flags here
      break;
    }
  }

  if (!stripeCustomerId && !userId) {
    console.warn("No customer or user id in event; skipping");
    return;
  }

  // Resolve user id by customer id if not given
  if (!userId && stripeCustomerId) {
    const { data: profByCust, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", stripeCustomerId)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("Supabase lookup error:", error);
    }
    userId = profByCust?.id;
  }

  if (!userId) {
    console.warn("No matching user found for webhook; skipping update");
    return;
  }

  // Build update payload
  const update: Record<string, any> = {};
  if (stripeCustomerId) update.stripe_customer_id = stripeCustomerId;
  if (plan) update.plan = plan;                 // 'free' | 'pro' | 'agency'
  if (periodEnd) update.current_period_end = periodEnd;

  if (Object.keys(update).length === 0) {
    return; // nothing to write
  }

  const { error: upError } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId);

  if (upError) {
    console.error("Supabase update error:", upError);
  }
}