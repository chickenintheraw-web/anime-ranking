import Link from "next/link";
import { getAnimeLeaderboard, getThemeLeaderboard } from "@/lib/data";
import styles from "./leaderboard.module.css";

function buildQuery(base, overrides) {
  const merged = { ...base, ...overrides };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, String(value));
  }
  return params.toString();
}

export default async function LeaderboardPage({ searchParams }) {
  const sp = await searchParams;
  const type = sp.type === "theme" ? "theme" : "anime";
  const themeType = sp.themeType || "";

  const rows =
    type === "anime"
      ? await getAnimeLeaderboard()
      : await getThemeLeaderboard(themeType || null);

  const filters = { type, themeType };

  return (
    <main className={styles.main}>
      <h1>Leaderboard</h1>
      <p className={styles.subtitle}>
        The pooled global ranking, built from every ranked list submitted on
        the site. Lower average placement is better.
      </p>

      <div className={styles.tabs}>
        <Link
          href={`/leaderboard?${buildQuery(filters, { type: "anime", themeType: "" })}`}
          className={type === "anime" ? styles.tabActive : styles.tab}
        >
          Anime
        </Link>
        <Link
          href={`/leaderboard?${buildQuery(filters, { type: "theme" })}`}
          className={type === "theme" ? styles.tabActive : styles.tab}
        >
          Themes
        </Link>
      </div>

      {type === "theme" && (
        <div className={styles.subtabs}>
          <Link
            href={`/leaderboard?${buildQuery(filters, { themeType: "" })}`}
            className={!themeType ? styles.subtabActive : styles.subtab}
          >
            All
          </Link>
          <Link
            href={`/leaderboard?${buildQuery(filters, { themeType: "OP" })}`}
            className={themeType === "OP" ? styles.subtabActive : styles.subtab}
          >
            Openings
          </Link>
          <Link
            href={`/leaderboard?${buildQuery(filters, { themeType: "ED" })}`}
            className={themeType === "ED" ? styles.subtabActive : styles.subtab}
          >
            Endings
          </Link>
        </div>
      )}

      {rows.length === 0 ? (
        <p className={styles.empty}>No votes yet — be the first to rank.</p>
      ) : (
        <ol className={styles.list}>
          {type === "anime"
            ? rows.map((row, i) => (
                <li key={row.anime_id} className={styles.item}>
                  <span className={styles.rank}>{i + 1}</span>
                  <span className={styles.info}>
                    <Link href={`/anime/${row.anime_id}`} className={styles.title}>
                      {row.title}
                    </Link>
                  </span>
                  <span className={styles.stats}>
                    <span className={styles.avg}>{row.avg_placement}</span>
                    <span className={styles.voteCount}>
                      {row.vote_count} vote{row.vote_count === 1 ? "" : "s"}
                    </span>
                  </span>
                </li>
              ))
            : rows.map((row, i) => (
                <li key={row.theme_id} className={styles.item}>
                  <span className={styles.rank}>{i + 1}</span>
                  <span className={styles.info}>
                    <span className={styles.title}>{row.theme_title}</span>
                    <span className={styles.animeTitle}>
                      <Link href={`/anime/${row.anime_id}`}>{row.anime_title}</Link>
                      {" • "}
                      {row.theme_type}
                      {row.artist ? ` • ${row.artist}` : ""}
                    </span>
                  </span>
                  <span className={styles.stats}>
                    <span className={styles.avg}>{row.avg_placement}</span>
                    <span className={styles.voteCount}>
                      {row.vote_count} vote{row.vote_count === 1 ? "" : "s"}
                    </span>
                  </span>
                </li>
              ))}
        </ol>
      )}
    </main>
  );
}
