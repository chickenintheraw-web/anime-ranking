'use server';

import { revalidatePath } from 'next/cache';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdmin } from '@/lib/admin';
import { extractYoutubeId } from '@/lib/youtube';

const R2_PUBLIC_BASE = 'https://pub-09be9ff2325342919e86ae0735f464d7.r2.dev';

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

// Replaces any existing YouTube variant for this theme rather than erroring
// on the one-per-theme unique index - pasting a new link is how an admin
// fixes a wrong one, not a separate remove-then-add flow.
export async function addYoutubeVariant(formData) {
  const { supabase } = await requireAdmin();
  const themeId = formData.get('theme_id');
  const animeId = formData.get('anime_id');
  const youtubeId = extractYoutubeId(formData.get('youtube_url')?.toString());
  if (!youtubeId) throw new Error('Not a recognizable YouTube URL or video ID');

  await supabase.from('theme_variants').delete().eq('theme_id', themeId).eq('provider', 'youtube');
  const { error } = await supabase
    .from('theme_variants')
    .insert({ theme_id: themeId, provider: 'youtube', youtube_id: youtubeId });
  if (error) throw new Error(error.message);

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/edit`);
}

export async function removeVariant(formData) {
  const { supabase } = await requireAdmin();
  const variantId = formData.get('variant_id');
  const animeId = formData.get('anime_id');

  // Look up the file before deleting the row - an R2-hosted variant's
  // underlying object would otherwise just sit in the bucket forever.
  const { data: variant } = await supabase
    .from('theme_variants')
    .select('provider, url')
    .eq('id', variantId)
    .maybeSingle();

  const { error } = await supabase.from('theme_variants').delete().eq('id', variantId);
  if (error) throw new Error(error.message);

  if (variant?.provider === 'r2' && variant.url?.startsWith(`${R2_PUBLIC_BASE}/`)) {
    const key = variant.url.slice(R2_PUBLIC_BASE.length + 1);
    const { env } = await getCloudflareContext({ async: true });
    await env.VIDEOS.delete(key).catch(() => {});
  }

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/edit`);
}
