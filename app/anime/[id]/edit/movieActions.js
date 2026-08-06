'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

function movieFieldsFrom(formData) {
  return {
    title: formData.get('title')?.toString().trim(),
    year: formData.get('year') ? Number(formData.get('year')) : null,
    cover_image_url: formData.get('cover_image_url')?.toString().trim() || null,
    synopsis: formData.get('synopsis')?.toString().trim() || null,
  };
}

export async function createMovie(formData) {
  const { supabase } = await requireAdmin();
  const animeId = formData.get('anime_id');
  const fields = movieFieldsFrom(formData);
  if (!fields.title) throw new Error('Title is required');

  const { error } = await supabase.from('movies').insert({ ...fields, anime_id: animeId });
  if (error) throw new Error(error.message);

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/edit`);
}

export async function updateMovie(formData) {
  const { supabase } = await requireAdmin();
  const movieId = formData.get('movie_id');
  const animeId = formData.get('anime_id');
  const fields = movieFieldsFrom(formData);
  if (!fields.title) throw new Error('Title is required');

  const { error } = await supabase.from('movies').update(fields).eq('id', movieId);
  if (error) throw new Error(error.message);

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/edit`);
}

export async function deleteMovie(formData) {
  const { supabase } = await requireAdmin();
  const movieId = formData.get('movie_id');
  const animeId = formData.get('anime_id');

  const { error } = await supabase.from('movies').delete().eq('id', movieId);
  if (error) throw new Error(error.message);

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/edit`);
}
