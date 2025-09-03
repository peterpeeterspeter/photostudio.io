export const runtime = 'nodejs';
import { headers } from 'next/headers';
import { stripe, PRICES } from '@/lib/stripe';
import { supabaseService } from '@/lib/supabase';

export async function POST(req: Request) {
  const sig = headers().get('stripe-signature')!;
  const buf = Buffer.from(await req.arrayBuffer());

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const sb = supabaseService();

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as any;
      const customerId = s.customer as string;
      
      // Lookup user by customer id
      const { data: rows } = await sb.from('profiles').select('id').eq('stripe_customer_id', customerId).limit(1);
      const userId = rows?.[0]?.id;
      
      if (userId) {
        // Determine plan from the subscription's price lookup
        const sub = await stripe.subscriptions.retrieve(s.subscription as string);
        const priceId = sub.items.data[0].price.id;
        const plan = priceId === PRICES.pro_monthly ? 'pro' : priceId === PRICES.agency_monthly ? 'agency' : 'free';
        await sb.from('profiles').update({ 
          plan, 
          current_period_end: new Date(sub.current_period_end * 1000).toISOString() 
        }).eq('id', userId);
      }
      break;
    }
    
    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const sub = event.data.object as any;
      const customerId = sub.customer as string;
      const { data: rows } = await sb.from('profiles').select('id').eq('stripe_customer_id', customerId).limit(1);
      const userId = rows?.[0]?.id;
      
      if (userId) {
        const priceId = sub.items.data[0].price.id;
        const plan = priceId === PRICES.pro_monthly ? 'pro' : priceId === PRICES.agency_monthly ? 'agency' : 'free';
        await sb.from('profiles').update({ 
          plan, 
          current_period_end: new Date(sub.current_period_end * 1000).toISOString() 
        }).eq('id', userId);
      }
      break;
    }
    
    case 'customer.subscription.deleted': {
      const sub = event.data.object as any;
      const customerId = sub.customer as string;
      await sb.from('profiles').update({ 
        plan: 'free', 
        current_period_end: null 
      }).eq('stripe_customer_id', customerId);
      break;
    }
    
    default:
      // ignore other events
  }

  return new Response('ok', { status: 200 });
}