'use client';

import { usePlayer } from '@/app/components/PlayerContext';
import styles from './anime-detail.module.css';

export default function VariantButtons({ theme, animeId, animeTitle }) {
  const { play } = usePlayer();

  if (!theme.theme_variants?.length) {
    return <span className={styles.noVariants}>No video yet</span>;
  }

  return (
    <span className={styles.variants}>
      {theme.theme_variants.map((v) => (
        <button
          key={v.id}
          type="button"
          className={styles.variantButton}
          onClick={() =>
            play({
              id: v.id,
              url: v.url,
              title: theme.title,
              artist: theme.artist,
              animeId,
              animeTitle,
              themeType: theme.theme_type,
              sequenceNumber: theme.sequence_number,
              quality: v.quality,
              source: v.source,
            })
          }
        >
          {v.quality} <span className={styles.variantSource}>{v.source}</span>
        </button>
      ))}
    </span>
  );
}
