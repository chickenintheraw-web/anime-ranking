import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAnimeList } from '@/lib/data';
import RankingBuilder from '../RankingBuilder';
import { saveAnimeRanking } from './actions';
import styles from '../rank.module.css';

export default async function RankAnimePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/rank/anime');

  const [anime, { data: ranking }] = await Promise.all([
    getAnimeList(),
    supabase
      .from('anime_rankings')
      .select('anime_id, placement, anime:anime_id(id, title)')
      .eq('user_id', user.id)
      .order('placement', { ascending: true }),
  ]);

  const candidates = anime.map((a) => ({ id: a.id, label: a.title }));
  const initialRanking = (ranking ?? []).map((r) => ({
    id: r.anime_id,
    label: r.anime?.title ?? 'Unknown',
  }));

  return (
    <main className={styles.main}>
      <h1>Rank Anime</h1>
      <p className={styles.subtitle}>
        Search for anime to add, then reorder your list. Your #1 scores best.
      </p>
      <RankingBuilder
        entityLabel="anime"
        candidates={candidates}
        initialRanking={initialRanking}
        saveAction={saveAnimeRanking}
      />
    </main>
  );
}
