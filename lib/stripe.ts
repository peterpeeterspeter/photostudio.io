import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Map logical plans to Stripe Price IDs (create in Stripe Dashboard first)
export const PRICES = {
  pro_monthly: 'price_PRO_MONTHLY_ID',     // e.g. price_123
  agency_monthly: 'price_AGENCY_MONTHLY_ID'
} as const;

export type PlanKey = keyof typeof PRICES;