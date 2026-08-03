'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { sb } from '@/lib/supabase';
import { hashIp } from '@/lib/hash';

export async function castVote(winnerId, loserId) {
  const h = await headers();
  const ip = h.get('cf-connecting-ip') || h.get('x-forwarded-for');
  const voterIpHash = await hashIp(ip);

  const { error } = await sb.rpc('cast_vote', {
    p_winner_id: winnerId,
    p_loser_id: loserId,
    p_voter_ip_hash: voterIpHash,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/leaderboard');
}
