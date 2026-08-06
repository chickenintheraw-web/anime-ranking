'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function saveEpisodeRanking(orderedIds) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('replace_episode_ranking', {
    p_episode_ids: orderedIds,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/leaderboard');
  revalidatePath('/rank/episode');
}
