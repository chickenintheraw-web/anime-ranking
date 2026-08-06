'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function saveSeasonRanking(orderedIds) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('replace_season_ranking', {
    p_season_ids: orderedIds,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/leaderboard');
  revalidatePath('/rank/season');
}
