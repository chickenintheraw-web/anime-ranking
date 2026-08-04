'use client';

import { usePlayer } from '@/app/components/PlayerContext';
import styles from './watch.module.css';

export default function VariantSwitchButton({ variant, theme, animeId, animeTitle }) {
  const { play, current } = usePlayer();
  const active = current?.id === variant.id;

  return (
    <button
      type="button"
      className={active ? styles.variantActive : styles.variantButton}
      onClick={() =>
        play({
          id: variant.id,
          themeId: theme.id,
          url: variant.url,
          title: theme.title,
          artist: theme.artist,
          animeId,
          animeTitle,
          themeType: theme.theme_type,
          sequenceNumber: theme.sequence_number,
          quality: variant.quality,
          source: variant.source,
        })
      }
    >
      {variant.quality} <span>{variant.source}</span>
    </button>
  );
}
