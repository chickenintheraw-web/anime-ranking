import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMovieList } from '@/lib/data';
import RankingBuilder from '../RankingBuilder';
import { saveMovieRanking } from './actions';
import styles from '../rank.module.css';

function movieLabel(m) {
  return `${m.anime?.title ?? 'Unknown'} — ${m.title}`;
}

export default async function RankMoviePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/rank/movie');

  const [movies, { data: ranking }] = await Promise.all([
    getMovieList(),
    supabase
      .from('movie_rankings')
      .select('movie_id, placement, movie:movie_id(id, title, anime:anime_id(id, title))')
      .eq('user_id', user.id)
      .order('placement', { ascending: true }),
  ]);

  const candidates = movies.map((m) => ({ id: m.id, label: movieLabel(m) }));
  const initialRanking = (ranking ?? [])
    .filter((r) => r.movie)
    .map((r) => ({ id: r.movie_id, label: movieLabel(r.movie) }));

  return (
    <main className={styles.main}>
      <h1>Rank Movies</h1>
      <p className={styles.subtitle}>
        Search for a movie to add, then reorder your list. Your #1 scores best.
      </p>
      <RankingBuilder
        entityLabel="movie"
        candidates={candidates}
        initialRanking={initialRanking}
        saveAction={saveMovieRanking}
      />
    </main>
  );
}
