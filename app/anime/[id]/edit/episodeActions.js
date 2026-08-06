'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export async function createEpisode(formData) {
  const { supabase } = await requireAdmin();
  const animeId = formData.get('anime_id');
  const seasonId = formData.get('season_id')?.toString() || null;

  const { error } = await supabase.from('episodes').insert({
    anime_id: animeId,
    season_id: seasonId,
    episode_number: Number(formData.get('episode_number') || 1),
    title: formData.get('title')?.toString().trim() || null,
    air_date: formData.get('air_date')?.toString() || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/edit`);
}

export async function updateEpisode(formData) {
  const { supabase } = await requireAdmin();
  const episodeId = formData.get('episode_id');
  const animeId = formData.get('anime_id');

  const { error } = await supabase
    .from('episodes')
    .update({
      episode_number: Number(formData.get('episode_number') || 1),
      title: formData.get('title')?.toString().trim() || null,
      air_date: formData.get('air_date')?.toString() || null,
    })
    .eq('id', episodeId);
  if (error) throw new Error(error.message);

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/edit`);
}

export async function deleteEpisode(formData) {
  const { supabase } = await requireAdmin();
  const episodeId = formData.get('episode_id');
  const animeId = formData.get('anime_id');

  const { error } = await supabase.from('episodes').delete().eq('id', episodeId);
  if (error) throw new Error(error.message);

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/edit`);
}

// One line per episode, tolerant of a leading "1.", "01)", "1:" etc, since
// that's how episode lists are usually pasted from a wiki/tracker. A one-
// row-per-episode form isn't practical once a show has dozens of episodes,
// let alone hundreds - this is the primary entry mechanism.
export async function bulkAddEpisodes(formData) {
  const { supabase } = await requireAdmin();
  const animeId = formData.get('anime_id');
  const seasonId = formData.get('season_id')?.toString() || null;
  const startAt = Number(formData.get('start_at') || 1);
  const raw = formData.get('episode_list')?.toString() || '';

  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) throw new Error('Paste at least one episode line');

  const rows = lines.map((line, i) => {
    const m = line.match(/^\d+[.):-]?\s*(.*)$/);
    const title = (m ? m[1] : line).trim();
    return {
      anime_id: animeId,
      season_id: seasonId,
      episode_number: startAt + i,
      title: title || null,
    };
  });

  const { error } = await supabase.from('episodes').insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/edit`);
}
