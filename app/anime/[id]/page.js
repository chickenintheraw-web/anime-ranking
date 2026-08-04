import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnimeWithThemes } from "@/lib/data";
import { getSessionAndAdmin } from "@/lib/admin";
import VariantButtons from "./VariantButtons";
import styles from "./anime-detail.module.css";

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default async function AnimeDetailPage({ params }) {
  const { id } = await params;
  const [anime, { isAdmin }] = await Promise.all([
    getAnimeWithThemes(id),
    getSessionAndAdmin(),
  ]);

  if (!anime) notFound();

  const themes = [...(anime.themes ?? [])].sort((a, b) => {
    if (a.theme_type !== b.theme_type) return a.theme_type === "OP" ? -1 : 1;
    return a.sequence_number - b.sequence_number;
  });
  const openings = themes.filter((t) => t.theme_type === "OP");
  const endings = themes.filter((t) => t.theme_type === "ED");

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

          <h2 className={styles.sectionTitle}>Themes ({themes.length})</h2>

          <ThemeSection title="Openings" themes={openings} animeId={anime.id} animeTitle={anime.title} />
          <ThemeSection title="Endings" themes={endings} animeId={anime.id} animeTitle={anime.title} />
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
