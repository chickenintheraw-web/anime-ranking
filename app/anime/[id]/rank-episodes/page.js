import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { sb } from '@/lib/supabase/anon';
import { getAnimeEpisodes, getAnimeSeasons } from '@/lib/data';
import EpisodeRankingBuilder from '@/app/rank/EpisodeRankingBuilder';
import { saveSoloEpisodeRanking } from './actions';
import styles from '@/app/rank/episode-rank.module.css';

export default async function RankAnimeEpisodesPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/anime/${id}/rank-episodes`);

  const [{ data: anime }, seasons, episodes] = await Promise.all([
    sb.from('anime').select('id, title').eq('id', id).maybeSingle(),
    getAnimeSeasons(id),
    getAnimeEpisodes(id),
  ]);
  if (!anime) notFound();

  const seasonById = new Map(seasons.map((s) => [s.id, s]));
  const candidates = episodes.map((e) => {
    const season = e.season_id ? seasonById.get(e.season_id) : null;
    return {
      id: e.id,
      title: e.title || `Episode ${e.episode_number}`,
      episodeNumber: e.episode_number,
      airDate: e.air_date,
      thumbnailUrl: e.thumbnail_url,
      animeId: anime.id,
      animeTitle: anime.title,
      seasonId: e.season_id,
      seasonLabel: season ? season.title || `Season ${season.season_number}` : null,
    };
  });

  const { data: ranking } = await supabase
    .from('episode_rankings_solo')
    .select('episode_id, placement')
    .eq('user_id', user.id)
    .eq('anime_id', id)
    .order('placement', { ascending: true });

  const candidateMap = new Map(candidates.map((c) => [c.id, c]));
  const initialList = (ranking ?? []).map((r) => candidateMap.get(r.episode_id)).filter(Boolean);

  return (
    <main className={styles.main}>
      <h1>Rank {anime.title} Episodes</h1>
      <p className={styles.subtitle}>
        This ranking is just for {anime.title} — it won&apos;t affect (or
        pull from) your global Episode ranking. You can add these into the
        global ranking later from the &quot;By Show&quot; tab on{' '}
        <Link href="/rank/episode">/rank/episode</Link>.
      </p>
      <EpisodeRankingBuilder
        entityLabel="episode"
        candidates={candidates}
        initialList={initialList}
        saveAction={saveSoloEpisodeRanking.bind(null, id)}
        showByShowTab={false}
      />
    </main>
  );
}
