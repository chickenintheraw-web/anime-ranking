import Link from "next/link";
import { getLeaderboard } from "@/lib/data";
import styles from "./leaderboard.module.css";

export default async function LeaderboardPage() {
  const openings = await getLeaderboard();

  return (
    <main className={styles.main}>
      <h1>Leaderboard</h1>
      <p className={styles.subtitle}>
        The pooled global ranking, built from every vote cast on the site.
      </p>

      {openings.length === 0 ? (
        <p className={styles.empty}>No votes yet — be the first to rank.</p>
      ) : (
        <ol className={styles.list}>
          {openings.map((op, i) => (
            <li key={op.id} className={styles.item}>
              <span className={styles.rank}>{i + 1}</span>
              <span className={styles.info}>
                <span className={styles.opTitle}>{op.title}</span>
                <span className={styles.animeTitle}>
                  {op.anime?.id ? (
                    <Link href={`/anime/${op.anime.id}`}>
                      {op.anime.title}
                    </Link>
                  ) : (
                    op.anime?.title
                  )}
                  {op.artist ? ` · ${op.artist}` : ""}
                </span>
              </span>
              <span className={styles.rating}>{op.elo_rating}</span>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
