'use client';

import { useEffect } from 'react';
import { usePlayer } from '@/app/components/PlayerContext';

// Starts playback if this theme isn't already the current track — covers
// landing on /watch/[id] directly (shared link, refresh) rather than via a
// variant button that already called play() before navigating here.
export default function WatchBootstrap({ theme }) {
  const { current, play } = usePlayer();

  useEffect(() => {
    if (current?.themeId === theme.id) return;
    const variant = theme.theme_variants[0];
    if (!variant) return;

    play({
      id: variant.id,
      themeId: theme.id,
      url: variant.url,
      title: theme.title,
      artist: theme.artist,
      animeId: theme.anime.id,
      animeTitle: theme.anime.title,
      themeType: theme.theme_type,
      sequenceNumber: theme.sequence_number,
      quality: variant.quality,
      source: variant.source,
    });
    // Only re-run when the theme itself changes, not on every player update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme.id]);

  return null;
}
