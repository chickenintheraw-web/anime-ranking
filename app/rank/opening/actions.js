'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function saveOpeningRanking(orderedIds) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('replace_theme_ranking', {
    p_theme_ids: orderedIds,
    p_theme_type: 'OP',
  });

  if (error) throw new Error(error.message);

  revalidatePath('/leaderboard');
  revalidatePath('/rank/opening');
}
