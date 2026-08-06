import Link from "next/link";
import {
  getAnimeLeaderboard,
  getThemeLeaderboard,
  getSeasonLeaderboard,
  getMovieLeaderboard,
  getEpisodeLeaderboard,
} from "@/lib/data";
import LeaderboardShell from "./LeaderboardShell";
import LeaderboardSimpleRow from "./LeaderboardSimpleRow";
import LeaderboardThemeRow from "./LeaderboardThemeRow";
import LeaderboardEpisodeRow from "./LeaderboardEpisodeRow";
import styles from "./leaderboard.module.css";

const TABS = [
  { type: "anime", label: "Anime" },
  { type: "opening", label: "Openings" },
  { type: "ending", label: "Endings" },
  { type: "season", label: "Seasons" },
  { type: "movie", label: "Movies" },
  { type: "episode", label: "Episodes" },
];

const TAB_CONFIG = {
  anime: {
    fetch: () => getAnimeLeaderboard(),
    keyOf: (r) => r.anime_id,
    Row: LeaderboardSimpleRow,
    toRow: (r) => ({
      href: `/anime/${r.anime_id}`,
      title: r.title,
      subtitle: null,
      avg: r.avg_placement,
      count: r.vote_count,
    }),
  },
  season: {
    fetch: () => getSeasonLeaderboard(),
    keyOf: (r) => r.season_id,
    Row: LeaderboardSimpleRow,
    toRow: (r) => ({
      href: `/anime/${r.anime_id}`,
      title: r.season_title || `Season ${r.season_number}`,
      subtitle: r.anime_title,
      avg: r.avg_placement,
      count: r.vote_count,
    }),
  },
  movie: {
    fetch: () => getMovieLeaderboard(),
    keyOf: (r) => r.movie_id,
    Row: LeaderboardSimpleRow,
    toRow: (r) => ({
      href: `/anime/${r.anime_id}`,
      title: r.title,
      subtitle: r.anime_title,
      avg: r.avg_placement,
      count: r.vote_count,
    }),
  },
  opening: {
    fetch: () => getThemeLeaderboard("OP"),
    keyOf: (r) => r.theme_id,
    Row: LeaderboardThemeRow,
    toRow: (r) => r,
  },
  ending: {
    fetch: () => getThemeLeaderboard("ED"),
    keyOf: (r) => r.theme_id,
    Row: LeaderboardThemeRow,
    toRow: (r) => r,
  },
  episode: {
    fetch: () => getEpisodeLeaderboard(),
    keyOf: (r) => r.episode_id,
    Row: LeaderboardEpisodeRow,
    toRow: (r) => r,
  },
};

export default async function LeaderboardPage({ searchParams }) {
  const sp = await searchParams;
  const type = TABS.some((t) => t.type === sp.type) ? sp.type : "anime";
  const config = TAB_CONFIG[type];
  const rows = await config.fetch();

  return (
    <LeaderboardShell>
      <h1>Leaderboard</h1>
      <p className={styles.subtitle}>
        The pooled global ranking, built from every ranked list submitted on
        the site. Lower average placement is better.
      </p>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <Link
            key={tab.type}
            href={`/leaderboard?type=${tab.type}`}
            className={type === tab.type ? styles.tabActive : styles.tab}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className={styles.empty}>No votes yet — be the first to rank.</p>
      ) : (
        <ol className={styles.list}>
          {rows.map((row, i) => (
            <config.Row key={config.keyOf(row)} row={config.toRow(row)} rank={i + 1} />
          ))}
        </ol>
      )}
    </LeaderboardShell>
  );
}
