// lib/stripePrices.ts
// Import the existing PRICES from stripe.ts to maintain consistency
import { PRICES } from './stripe';

export function planForPriceId(priceId: string | undefined): string {
  if (!priceId) return "free";
  
  switch (priceId) {
    case PRICES.pro_monthly:
      return "pro";
    case PRICES.agency_monthly:
      return "agency";
    default:
      return "free";
  }
}