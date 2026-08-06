'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function saveSoloEpisodeRanking(animeId, orderedIds) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('replace_solo_episode_ranking', {
    p_anime_id: animeId,
    p_episode_ids: orderedIds,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/anime/${animeId}`);
  revalidatePath(`/anime/${animeId}/rank-episodes`);
  revalidatePath('/rank/episode');
}
