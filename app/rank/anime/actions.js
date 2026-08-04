'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function saveAnimeRanking(orderedIds) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('replace_anime_ranking', {
    p_anime_ids: orderedIds,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/leaderboard');
  revalidatePath('/rank/anime');
}
