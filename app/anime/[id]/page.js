import { notFound } from "next/navigation";
import { getAnimeWithThemes } from "@/lib/data";
import styles from "./anime-detail.module.css";

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default async function AnimeDetailPage({ params }) {
  const { id } = await params;
  const anime = await getAnimeWithThemes(id);

  if (!anime) notFound();

  const themes = [...(anime.themes ?? [])].sort((a, b) => {
    if (a.theme_type !== b.theme_type) return a.theme_type === "OP" ? -1 : 1;
    return a.sequence_number - b.sequence_number;
  });
  const openings = themes.filter((t) => t.theme_type === "OP");
  const endings = themes.filter((t) => t.theme_type === "ED");

  return (
    <main className={styles.main}>
      <h1>{anime.title}</h1>
      {anime.title_romaji && anime.title_romaji !== anime.title && (
        <p className={styles.romaji}>{anime.title_romaji}</p>
      )}
      <p className={styles.meta}>
        {[anime.format, [cap(anime.season), anime.year].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(" • ")}
      </p>

      <ThemeSection title="Openings" themes={openings} />
      <ThemeSection title="Endings" themes={endings} />
    </main>
  );
}

function ThemeSection({ title, themes }) {
  return (
    <>
      <h2 className={styles.sectionTitle}>{title}</h2>
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
                <span className={styles.opTitle}>{t.title}</span>
                {t.artist && <span className={styles.opArtist}>{t.artist}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
