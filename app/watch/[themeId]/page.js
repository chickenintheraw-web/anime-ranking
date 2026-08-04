import { notFound } from "next/navigation";
import Link from "next/link";
import { getThemeWithAnime } from "@/lib/data";
import WatchBootstrap from "./WatchBootstrap";
import VariantSwitchButton from "./VariantSwitchButton";
import styles from "./watch.module.css";

export default async function WatchPage({ params }) {
  const { themeId } = await params;
  const theme = await getThemeWithAnime(themeId);

  if (!theme) notFound();

  return (
    <main className={styles.main}>
      <WatchBootstrap theme={theme} />

      <div className={styles.info}>
        <h1>{theme.title}</h1>
        {theme.artist && <p className={styles.artist}>{theme.artist}</p>}
        <p className={styles.meta}>
          {theme.theme_type}
          {theme.sequence_number} ·{" "}
          <Link href={`/anime/${theme.anime.id}`}>{theme.anime.title}</Link>
        </p>

        {theme.theme_variants.length === 0 ? (
          <p className={styles.noVariants}>No video available.</p>
        ) : (
          <div className={styles.variants}>
            {theme.theme_variants.map((v) => (
              <VariantSwitchButton
                key={v.id}
                variant={v}
                theme={theme}
                animeId={theme.anime.id}
                animeTitle={theme.anime.title}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
