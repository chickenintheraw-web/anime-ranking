'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

function seasonFieldsFrom(formData) {
  return {
    season_number: Number(formData.get('season_number') || 1),
    title: formData.get('title')?.toString().trim() || null,
    year: formData.get('year') ? Number(formData.get('year')) : null,
    cover_image_url: formData.get('cover_image_url')?.toString().trim() || null,
  };
}

export async function createSeason(formData) {
  const { supabase } = await requireAdmin();
  const animeId = formData.get('anime_id');
  const fields = seasonFieldsFrom(formData);

  const { error } = await supabase.from('seasons').insert({ ...fields, anime_id: animeId });
  if (error) throw new Error(error.message);

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/edit`);
}

export async function updateSeason(formData) {
  const { supabase } = await requireAdmin();
  const seasonId = formData.get('season_id');
  const animeId = formData.get('anime_id');
  const fields = seasonFieldsFrom(formData);

  const { error } = await supabase.from('seasons').update(fields).eq('id', seasonId);
  if (error) throw new Error(error.message);

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/edit`);
}

export async function deleteSeason(formData) {
  const { supabase } = await requireAdmin();
  const seasonId = formData.get('season_id');
  const animeId = formData.get('anime_id');

  const { error } = await supabase.from('seasons').delete().eq('id', seasonId);
  if (error) throw new Error(error.message);

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/edit`);
}
