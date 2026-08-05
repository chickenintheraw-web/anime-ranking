'use client';

import { usePlayer } from '@/app/components/PlayerContext';
import styles from './watch.module.css';

export default function VariantSwitchButton({ variant, theme, animeId, animeTitle }) {
  const { play, current } = usePlayer();
  const active = current?.id === variant.id;

  function handleClick() {
    play({
      id: variant.id,
      themeId: theme.id,
      provider: variant.provider,
      url: variant.url,
      youtubeId: variant.youtube_id,
      title: theme.title,
      artist: theme.artist,
      animeId,
      animeTitle,
      themeType: theme.theme_type,
      sequenceNumber: theme.sequence_number,
      quality: variant.quality,
      source: variant.source,
    });
  }

  if (variant.provider === 'youtube') {
    return (
      <button
        type="button"
        className={active ? styles.variantActive : styles.variantYoutube}
        onClick={handleClick}
      >
        YouTube
      </button>
    );
  }

  return (
    <button
      type="button"
      className={active ? styles.variantActive : styles.variantButton}
      onClick={handleClick}
    >
      {variant.quality} <span>{variant.source}</span>
    </button>
  );
}
