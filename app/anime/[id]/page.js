import { notFound } from "next/navigation";
import { getAnimeWithOpenings } from "@/lib/data";
import styles from "./anime-detail.module.css";

export default async function AnimeDetailPage({ params }) {
  const { id } = await params;
  const anime = await getAnimeWithOpenings(id);

  if (!anime) notFound();

  const openings = [...(anime.openings ?? [])].sort(
    (a, b) => a.sequence_number - b.sequence_number
  );

  return (
    <main className={styles.main}>
      <h1>{anime.title}</h1>
      {anime.title_romaji && anime.title_romaji !== anime.title && (
        <p className={styles.romaji}>{anime.title_romaji}</p>
      )}
      <p className={styles.meta}>
        {[anime.season, anime.year].filter(Boolean).join(" ")}
      </p>

      <h2 className={styles.sectionTitle}>Openings</h2>
      {openings.length === 0 ? (
        <p className={styles.empty}>No openings recorded yet.</p>
      ) : (
        <ul className={styles.list}>
          {openings.map((op) => (
            <li key={op.id} className={styles.item}>
              <span className={styles.opNumber}>OP{op.sequence_number}</span>
              <span className={styles.opInfo}>
                <span className={styles.opTitle}>{op.title}</span>
                {op.artist && (
                  <span className={styles.opArtist}>{op.artist}</span>
                )}
              </span>
              <span className={styles.opRating}>{op.elo_rating}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
