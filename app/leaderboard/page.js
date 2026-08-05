import Link from "next/link";
import { getAnimeLeaderboard, getThemeLeaderboard } from "@/lib/data";
import LeaderboardShell from "./LeaderboardShell";
import LeaderboardThemeRow from "./LeaderboardThemeRow";
import styles from "./leaderboard.module.css";

const TABS = [
  { type: "anime", label: "Anime" },
  { type: "opening", label: "Openings" },
  { type: "ending", label: "Endings" },
];

export default async function LeaderboardPage({ searchParams }) {
  const sp = await searchParams;
  const type = TABS.some((t) => t.type === sp.type) ? sp.type : "anime";

  const rows =
    type === "anime"
      ? await getAnimeLeaderboard()
      : await getThemeLeaderboard(type === "opening" ? "OP" : "ED");

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
                <LeaderboardThemeRow key={row.theme_id} row={row} rank={i + 1} />
              ))}
        </ol>
      )}
    </LeaderboardShell>
  );
}
