export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { stripe, PRICES, PlanKey } from '@/lib/stripe';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const form = await req.formData();
  const priceKey = String(form.get('price')) as PlanKey;
  if (!PRICES[priceKey]) return new Response('Bad price', { status: 400 });

  // Ensure profile and customer id
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  let customerId = profile?.stripe_customer_id as string | undefined;
  
  if (!customerId) {
    const customer = await stripe.customers.create({ 
      email: user.email || undefined, 
      metadata: { supabase_user_id: user.id } 
    });
    customerId = customer.id;
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: PRICES[priceKey], quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/account?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/account?canceled=1`,
    allow_promotion_codes: true,
  });

  return Response.redirect(session.url!, 303);
}