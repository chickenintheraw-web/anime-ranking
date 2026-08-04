import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getRankableThemes, getThemeLeaderboard } from '@/lib/data';
import ThemeRankingBuilder from '../ThemeRankingBuilder';
import { saveOpeningRanking } from './actions';
import styles from '../theme-rank.module.css';

export default async function RankOpeningPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/rank/opening');

  const [candidates, { data: ranking }, leaderboard] = await Promise.all([
    getRankableThemes('OP'),
    supabase
      .from('theme_rankings')
      .select('theme_id, placement')
      .eq('user_id', user.id)
      .order('placement', { ascending: true }),
    getThemeLeaderboard('OP'),
  ]);

  const candidateMap = new Map(candidates.map((c) => [c.id, c]));
  const initialList = (ranking ?? [])
    .map((r) => candidateMap.get(r.theme_id))
    .filter(Boolean);

  const topRated = leaderboard
    .map((row) => {
      const c = candidateMap.get(row.theme_id);
      if (!c) return null;
      return { ...c, avgPlacement: row.avg_placement, voteCount: row.vote_count };
    })
    .filter(Boolean);

  return (
    <main className={styles.main}>
      <h1>Rank Openings</h1>
      <p className={styles.subtitle}>
        Search on the left to add an opening. Compare it against your current
        ranking to decide exactly where it belongs.
      </p>
      <ThemeRankingBuilder
        entityLabel="opening"
        candidates={candidates}
        initialList={initialList}
        saveAction={saveOpeningRanking}
        topRated={topRated}
      />
    </main>
  );
}
