export const runtime = 'nodejs';
import { createSupabaseServer } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe';

export async function POST() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
  if (!profile?.stripe_customer_id) return new Response('No customer', { status: 400 });

  const portal = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/account`,
  });
  
  return Response.redirect(portal.url, 303);
}