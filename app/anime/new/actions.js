'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export async function createAnime(formData) {
  const { supabase } = await requireAdmin();

  const title = formData.get('title')?.toString().trim();
  if (!title) throw new Error('Title is required');

  const payload = {
    title,
    title_romaji: formData.get('title_romaji')?.toString().trim() || null,
    season: formData.get('season')?.toString() || null,
    year: formData.get('year') ? Number(formData.get('year')) : null,
    format: formData.get('format')?.toString() || null,
    cover_image_url: formData.get('cover_image_url')?.toString().trim() || null,
    studio: formData.get('studio')?.toString().trim() || null,
    synopsis: formData.get('synopsis')?.toString().trim() || null,
  };

  const { data, error } = await supabase.from('anime').insert(payload).select('id').single();
  if (error) throw new Error(error.message);

  revalidatePath('/search');
  redirect(`/anime/${data.id}`);
}
