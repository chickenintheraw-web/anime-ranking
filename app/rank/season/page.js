import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSeasonList } from '@/lib/data';
import RankingBuilder from '../RankingBuilder';
import { saveSeasonRanking } from './actions';
import styles from '../rank.module.css';

function seasonLabel(s) {
  return `${s.anime?.title ?? 'Unknown'} — ${s.title || `Season ${s.season_number}`}`;
}

export default async function RankSeasonPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/rank/season');

  const [seasons, { data: ranking }] = await Promise.all([
    getSeasonList(),
    supabase
      .from('season_rankings')
      .select('season_id, placement, season:season_id(id, season_number, title, anime:anime_id(id, title))')
      .eq('user_id', user.id)
      .order('placement', { ascending: true }),
  ]);

  const candidates = seasons.map((s) => ({ id: s.id, label: seasonLabel(s) }));
  const initialRanking = (ranking ?? [])
    .filter((r) => r.season)
    .map((r) => ({ id: r.season_id, label: seasonLabel(r.season) }));

  return (
    <main className={styles.main}>
      <h1>Rank Seasons</h1>
      <p className={styles.subtitle}>
        Search for a season to add, then reorder your list. Your #1 scores best.
      </p>
      <RankingBuilder
        entityLabel="season"
        candidates={candidates}
        initialRanking={initialRanking}
        saveAction={saveSeasonRanking}
      />
    </main>
  );
}
