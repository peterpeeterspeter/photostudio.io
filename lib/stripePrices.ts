// lib/stripePrices.ts
// Replace these with your real Stripe Price IDs
export const PRICE_PRO_MONTHLY = process.env.STRIPE_PRICE_PRO_MONTHLY_ID || "price_pro_monthly_placeholder";
export const PRICE_AGENCY_MONTHLY = process.env.STRIPE_PRICE_AGENCY_MONTHLY_ID || "price_agency_monthly_placeholder";

export function planForPriceId(priceId?: string | null) {
  if (!priceId) return "free";
  if (priceId === PRICE_PRO_MONTHLY) return "pro";
  if (priceId === PRICE_AGENCY_MONTHLY) return "agency";
  // fallback
  return "pro";
}