import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnimeWithThemes, getAnimeSeasons, getAnimeMovies, getAnimeEpisodes } from "@/lib/data";
import { getSessionAndAdmin } from "@/lib/admin";
import VariantButtons from "./VariantButtons";
import styles from "./anime-detail.module.css";

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function groupBy(items, key) {
  const map = new Map();
  for (const item of items) {
    const k = item[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  }
  return map;
}

export default async function AnimeDetailPage({ params }) {
  const { id } = await params;
  const [anime, { isAdmin, user, supabase }, seasons, movies, episodes] = await Promise.all([
    getAnimeWithThemes(id),
    getSessionAndAdmin(),
    getAnimeSeasons(id),
    getAnimeMovies(id),
    getAnimeEpisodes(id),
  ]);

  if (!anime) notFound();

  const themes = [...(anime.themes ?? [])].sort((a, b) => {
    if (a.theme_type !== b.theme_type) return a.theme_type === "OP" ? -1 : 1;
    return a.sequence_number - b.sequence_number;
  });
  const generalThemes = themes.filter((t) => !t.season_id && !t.movie_id);
  const themesBySeasonId = groupBy(
    themes.filter((t) => t.season_id),
    "season_id"
  );
  const themesByMovieId = groupBy(
    themes.filter((t) => t.movie_id),
    "movie_id"
  );
  const episodesBySeasonId = groupBy(
    episodes.filter((e) => e.season_id),
    "season_id"
  );
  const unsectionedEpisodes = episodes.filter((e) => !e.season_id);

  let episodeRanking = [];
  if (user) {
    const episodeById = new Map(episodes.map((e) => [e.id, e]));
    const { data: solo } = await supabase
      .from("episode_rankings_solo")
      .select("episode_id, placement")
      .eq("user_id", user.id)
      .eq("anime_id", id)
      .order("placement", { ascending: true });

    if (solo?.length) {
      episodeRanking = solo.map((r) => episodeById.get(r.episode_id)).filter(Boolean);
    } else {
      const { data: global } = await supabase
        .from("episode_rankings")
        .select("episode_id, placement")
        .eq("user_id", user.id)
        .order("placement", { ascending: true });
      const idsInThisAnime = new Set(episodes.map((e) => e.id));
      episodeRanking = (global ?? [])
        .filter((r) => idsInThisAnime.has(r.episode_id))
        .map((r) => episodeById.get(r.episode_id))
        .filter(Boolean);
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.cover}>
            {anime.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={anime.cover_image_url} alt="" />
            ) : (
              <span className={styles.coverFallback}>{anime.title.slice(0, 1)}</span>
            )}
          </div>

          {(anime.season || anime.year) && (
            <div className={styles.metaBlock}>
              <span className={styles.metaLabel}>Premiere</span>
              <span className={styles.metaValue}>
                {[cap(anime.season), anime.year].filter(Boolean).join(" ")}
              </span>
            </div>
          )}

          {anime.format && (
            <div className={styles.metaBlock}>
              <span className={styles.metaLabel}>Format</span>
              <span className={styles.metaValue}>{anime.format}</span>
            </div>
          )}

          {anime.studio && (
            <div className={styles.metaBlock}>
              <span className={styles.metaLabel}>Studio</span>
              <span className={styles.metaValue}>{anime.studio}</span>
            </div>
          )}
        </aside>

        <div className={styles.content}>
          <div className={styles.titleRow}>
            <div>
              <h1>{anime.title}</h1>
              {anime.title_romaji && anime.title_romaji !== anime.title && (
                <p className={styles.romaji}>{anime.title_romaji}</p>
              )}
            </div>
            {isAdmin && (
              <Link href={`/anime/${anime.id}/edit`} className={styles.editButton}>
                Edit
              </Link>
            )}
          </div>

          {anime.synopsis && (
            <>
              <h2 className={styles.sectionTitle}>Synopsis</h2>
              <p className={styles.synopsis}>{anime.synopsis}</p>
            </>
          )}

          {generalThemes.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>Themes ({generalThemes.length})</h2>
              <ThemeSection
                title="Openings"
                themes={generalThemes.filter((t) => t.theme_type === "OP")}
                animeId={anime.id}
                animeTitle={anime.title}
              />
              <ThemeSection
                title="Endings"
                themes={generalThemes.filter((t) => t.theme_type === "ED")}
                animeId={anime.id}
                animeTitle={anime.title}
              />
            </>
          )}

          {seasons.length > 0 ? (
            <>
              <h2 className={styles.sectionTitle}>Seasons</h2>
              {seasons.map((s) => (
                <SeasonBlock
                  key={s.id}
                  season={s}
                  episodes={episodesBySeasonId.get(s.id) ?? []}
                  openings={(themesBySeasonId.get(s.id) ?? []).filter((t) => t.theme_type === "OP")}
                  endings={(themesBySeasonId.get(s.id) ?? []).filter((t) => t.theme_type === "ED")}
                  animeId={anime.id}
                  animeTitle={anime.title}
                />
              ))}
              {unsectionedEpisodes.length > 0 && (
                <EpisodeListBlock title="Other Episodes" episodes={unsectionedEpisodes} />
              )}
            </>
          ) : (
            episodes.length > 0 && (
              <>
                <h2 className={styles.sectionTitle}>Episodes ({episodes.length})</h2>
                <EpisodeListBlock episodes={episodes} />
              </>
            )
          )}

          {movies.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>Movies</h2>
              {movies.map((m) => (
                <MovieBlock
                  key={m.id}
                  movie={m}
                  openings={(themesByMovieId.get(m.id) ?? []).filter((t) => t.theme_type === "OP")}
                  endings={(themesByMovieId.get(m.id) ?? []).filter((t) => t.theme_type === "ED")}
                  animeId={anime.id}
                  animeTitle={anime.title}
                />
              ))}
            </>
          )}

          {user && episodes.length > 0 && (
            <EpisodeRankingSection ranking={episodeRanking} animeId={anime.id} />
          )}
        </div>
      </div>
    </main>
  );
}

function ThemeSection({ title, themes, animeId, animeTitle }) {
  return (
    <>
      <h3 className={styles.subsectionTitle}>{title}</h3>
      {themes.length === 0 ? (
        <p className={styles.empty}>None recorded yet.</p>
      ) : (
        <ul className={styles.list}>
          {themes.map((t) => (
            <li key={t.id} className={styles.item}>
              <span className={styles.opNumber}>
                {t.theme_type}
                {t.sequence_number}
              </span>
              <span className={styles.opInfo}>
                {t.theme_variants?.length ? (
                  <Link href={`/watch/${t.id}`} className={styles.opTitleLink}>
                    {t.title}
                  </Link>
                ) : (
                  <span className={styles.opTitle}>{t.title}</span>
                )}
                {t.artist && <span className={styles.opArtist}> by {t.artist}</span>}
              </span>
              <VariantButtons theme={t} animeId={animeId} animeTitle={animeTitle} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function SeasonBlock({ season, episodes, openings, endings, animeId, animeTitle }) {
  const label = season.title || `Season ${season.season_number}`;
  return (
    <div className={styles.seasonBlock}>
      <h3 className={styles.subsectionTitle}>
        {label}
        {season.year ? ` (${season.year})` : ""}
      </h3>
      {episodes.length > 0 && <EpisodeListBlock episodes={episodes} compact />}
      <ThemeSection title={`${label} Openings`} themes={openings} animeId={animeId} animeTitle={animeTitle} />
      <ThemeSection title={`${label} Endings`} themes={endings} animeId={animeId} animeTitle={animeTitle} />
    </div>
  );
}

function MovieBlock({ movie, openings, endings, animeId, animeTitle }) {
  return (
    <div className={styles.seasonBlock}>
      <h3 className={styles.subsectionTitle}>
        {movie.title}
        {movie.year ? ` (${movie.year})` : ""}
      </h3>
      {movie.synopsis && <p className={styles.synopsis}>{movie.synopsis}</p>}
      <ThemeSection title="Openings" themes={openings} animeId={animeId} animeTitle={animeTitle} />
      <ThemeSection title="Endings" themes={endings} animeId={animeId} animeTitle={animeTitle} />
    </div>
  );
}

function EpisodeListBlock({ title, episodes, compact }) {
  return (
    <>
      {title && <h4 className={styles.subsectionTitle}>{title}</h4>}
      <ul className={compact ? styles.episodeListCompact : styles.list}>
        {episodes.map((e) => (
          <li key={e.id} className={styles.item}>
            <span className={styles.opNumber}>Ep {e.episode_number}</span>
            <span className={styles.opInfo}>
              <span className={styles.opTitle}>{e.title || `Episode ${e.episode_number}`}</span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function EpisodeRankingSection({ ranking, animeId }) {
  return (
    <>
      <h2 className={styles.sectionTitle}>Your Episode Ranking</h2>
      {ranking.length === 0 ? (
        <p className={styles.empty}>You haven&apos;t ranked any episodes of this show yet.</p>
      ) : (
        <ol className={styles.list}>
          {ranking.map((e, i) => (
            <li key={e.id} className={styles.item}>
              <span className={styles.opNumber}>#{i + 1}</span>
              <span className={styles.opInfo}>
                <span className={styles.opTitle}>{e.title || `Episode ${e.episode_number}`}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
      <Link href={`/anime/${animeId}/rank-episodes`} className={styles.editButton}>
        {ranking.length === 0 ? "Rank episodes" : "Edit your ranking"}
      </Link>
    </>
  );
}
