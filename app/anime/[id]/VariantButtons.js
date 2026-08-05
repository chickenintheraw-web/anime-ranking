'use client';

import { useRouter } from 'next/navigation';
import { usePlayer } from '@/app/components/PlayerContext';
import styles from './anime-detail.module.css';

export default function VariantButtons({ theme, animeId, animeTitle }) {
  const { play } = usePlayer();
  const router = useRouter();

  if (!theme.theme_variants?.length) {
    return <span className={styles.noVariants}>No video yet</span>;
  }

  function handleClick(v) {
    play({
      id: v.id,
      themeId: theme.id,
      provider: v.provider,
      url: v.url,
      youtubeId: v.youtube_id,
      title: theme.title,
      artist: theme.artist,
      animeId,
      animeTitle,
      themeType: theme.theme_type,
      sequenceNumber: theme.sequence_number,
      quality: v.quality,
      source: v.source,
    });
    router.push(`/watch/${theme.id}`);
  }

  return (
    <span className={styles.variants}>
      {theme.theme_variants.map((v) =>
        v.provider === 'youtube' ? (
          <button
            key={v.id}
            type="button"
            className={styles.variantYoutube}
            onClick={() => handleClick(v)}
          >
            YouTube
          </button>
        ) : (
          <button
            key={v.id}
            type="button"
            className={styles.variantButton}
            onClick={() => handleClick(v)}
          >
            {v.quality} <span className={styles.variantSource}>{v.source}</span>
          </button>
        )
      )}
    </span>
  );
}
