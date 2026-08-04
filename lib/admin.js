import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function getSessionAndAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, isAdmin: false };

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  return { supabase, user, isAdmin: profile?.is_admin ?? false };
}

export async function requireAdmin() {
  const { supabase, user, isAdmin } = await getSessionAndAdmin();
  if (!user || !isAdmin) redirect('/');
  return { supabase, user };
}
