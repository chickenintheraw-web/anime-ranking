'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

function animeFieldsFrom(formData) {
  return {
    title: formData.get('title')?.toString().trim(),
    title_romaji: formData.get('title_romaji')?.toString().trim() || null,
    season: formData.get('season')?.toString() || null,
    year: formData.get('year') ? Number(formData.get('year')) : null,
    format: formData.get('format')?.toString() || null,
    cover_image_url: formData.get('cover_image_url')?.toString().trim() || null,
    studio: formData.get('studio')?.toString().trim() || null,
    synopsis: formData.get('synopsis')?.toString().trim() || null,
  };
}

function themeFieldsFrom(formData) {
  return {
    title: formData.get('title')?.toString().trim(),
    artist: formData.get('artist')?.toString().trim() || null,
    sequence_number: formData.get('sequence_number')
      ? Number(formData.get('sequence_number'))
      : 1,
    release_season: formData.get('release_season')?.toString() || null,
    release_year: formData.get('release_year') ? Number(formData.get('release_year')) : null,
  };
}

export async function updateAnime(formData) {
  const { supabase } = await requireAdmin();
  const animeId = formData.get('anime_id');
  const fields = animeFieldsFrom(formData);
  if (!fields.title) throw new Error('Title is required');

  const { error } = await supabase.from('anime').update(fields).eq('id', animeId);
  if (error) throw new Error(error.message);

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/edit`);
  revalidatePath('/search');
}

export async function createTheme(formData) {
  const { supabase } = await requireAdmin();
  const animeId = formData.get('anime_id');
  const themeType = formData.get('theme_type');
  const fields = themeFieldsFrom(formData);
  if (!fields.title) throw new Error('Title is required');

  const { error } = await supabase.from('themes').insert({
    ...fields,
    anime_id: animeId,
    theme_type: themeType,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/edit`);
}

export async function updateTheme(formData) {
  const { supabase } = await requireAdmin();
  const themeId = formData.get('theme_id');
  const animeId = formData.get('anime_id');
  const themeType = formData.get('theme_type');
  const fields = themeFieldsFrom(formData);
  if (!fields.title) throw new Error('Title is required');

  const { error } = await supabase
    .from('themes')
    .update({ ...fields, theme_type: themeType })
    .eq('id', themeId);
  if (error) throw new Error(error.message);

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/edit`);
}
