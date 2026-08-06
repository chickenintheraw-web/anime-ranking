'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function saveMovieRanking(orderedIds) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('replace_movie_ranking', {
    p_movie_ids: orderedIds,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/leaderboard');
  revalidatePath('/rank/movie');
}
