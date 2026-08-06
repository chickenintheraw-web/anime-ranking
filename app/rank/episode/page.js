import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getRankableEpisodes, getEpisodeLeaderboard } from '@/lib/data';
import EpisodeRankingBuilder from '../EpisodeRankingBuilder';
import { saveEpisodeRanking } from './actions';
import styles from '../episode-rank.module.css';

export default async function RankEpisodePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/rank/episode');

  const [candidates, { data: ranking }, leaderboard, { data: soloRows }] = await Promise.all([
    getRankableEpisodes(),
    supabase
      .from('episode_rankings')
      .select('episode_id, placement')
      .eq('user_id', user.id)
      .order('placement', { ascending: true }),
    getEpisodeLeaderboard(),
    supabase
      .from('episode_rankings_solo')
      .select('anime_id, placement, episode_id')
      .eq('user_id', user.id)
      .order('placement', { ascending: true }),
  ]);

  const candidateMap = new Map(candidates.map((c) => [c.id, c]));
  const initialList = (ranking ?? []).map((r) => candidateMap.get(r.episode_id)).filter(Boolean);
  const topRated = leaderboard
    .map((row) => {
      const c = candidateMap.get(row.episode_id);
      return c ? { ...c, avgPlacement: row.avg_placement, voteCount: row.vote_count } : null;
    })
    .filter(Boolean);

  const byShow = new Map();
  for (const r of soloRows ?? []) {
    const c = candidateMap.get(r.episode_id);
    if (!c) continue;
    if (!byShow.has(r.anime_id)) byShow.set(r.anime_id, []);
    byShow.get(r.anime_id).push(c);
  }
  const byShowGroups = [...byShow.entries()].map(([animeId, episodes]) => ({
    animeId,
    animeTitle: episodes[0]?.animeTitle ?? 'Unknown',
    episodes,
  }));

  return (
    <main className={styles.main}>
      <h1>Rank Episodes</h1>
      <p className={styles.subtitle}>
        Search on the left to add an episode from any show. Shows you&apos;ve
        already ranked solo show up under &quot;By Show&quot;, pre-sorted in
        your own order.
      </p>
      <EpisodeRankingBuilder
        entityLabel="episode"
        candidates={candidates}
        initialList={initialList}
        saveAction={saveEpisodeRanking}
        topRated={topRated}
        byShowGroups={byShowGroups}
        showByShowTab
      />
    </main>
  );
}
