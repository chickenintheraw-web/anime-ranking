import Link from "next/link";
import { getAnimeList } from "@/lib/data";
import styles from "./anime.module.css";

export default async function AnimeIndexPage() {
  const anime = await getAnimeList();

  return (
    <main className={styles.main}>
      <h1>Index</h1>
      <p className={styles.subtitle}>
        Every anime and opening theme tracked on the site.
      </p>

      {anime.length === 0 ? (
        <p className={styles.empty}>No anime yet.</p>
      ) : (
        <ul className={styles.grid}>
          {anime.map((a) => (
            <li key={a.id}>
              <Link href={`/anime/${a.id}`} className={styles.card}>
                <span className={styles.cover}>
                  {a.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.cover_image_url} alt="" />
                  ) : (
                    <span className={styles.coverFallback}>
                      {a.title.slice(0, 1)}
                    </span>
                  )}
                </span>
                <span className={styles.cardTitle}>{a.title}</span>
                <span className={styles.cardMeta}>
                  {[a.season, a.year].filter(Boolean).join(" ")}
                  {a.openings?.length
                    ? ` · ${a.openings.length} opening${a.openings.length === 1 ? "" : "s"}`
                    : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
