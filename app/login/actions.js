'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signIn(prevState, formData) {
  const email = formData.get('email');
  const password = formData.get('password');
  const next = formData.get('next') || '/';

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  redirect(next);
}

export async function signUp(prevState, formData) {
  const email = formData.get('email');
  const password = formData.get('password');
  const username = formData.get('username');
  const next = formData.get('next') || '/';

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) return { error: error.message };

  if (data.session) {
    redirect(next);
  }

  return { message: 'Check your email to confirm your account, then sign in.' };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
