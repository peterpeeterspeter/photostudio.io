export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  
  await supabase.from('profiles').upsert({ 
    id: user.id, 
    email: user.email || null 
  }, { onConflict: 'id' });
  
  return new Response('ok');
}