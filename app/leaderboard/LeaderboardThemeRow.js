'use client';

import Link from 'next/link';
import { usePlayer } from '@/app/components/PlayerContext';
import styles from './leaderboard.module.css';

export default function LeaderboardThemeRow({ row, rank }) {
  const { play, current } = usePlayer();
  const active = current?.themeId === row.theme_id;
  const hasVideo =
    row.preview_provider === 'youtube' ? !!row.preview_youtube_id : !!row.preview_url;

  function handlePlay() {
    if (!hasVideo) return;
    play({
      id: row.theme_id,
      themeId: row.theme_id,
      provider: row.preview_provider,
      url: row.preview_url,
      youtubeId: row.preview_youtube_id,
      title: row.theme_title,
      artist: row.artist,
      animeId: row.anime_id,
      animeTitle: row.anime_title,
      themeType: row.theme_type,
      sequenceNumber: row.sequence_number,
      quality: row.preview_quality,
      source: row.preview_source,
    });
  }

  return (
    <li className={active ? styles.itemActive : styles.item}>
      <span className={styles.rank}>{rank}</span>
      <span className={styles.info}>
        {hasVideo ? (
          <button type="button" className={styles.titleButton} onClick={handlePlay}>
            {row.theme_title}
          </button>
        ) : (
          <span className={styles.title}>{row.theme_title}</span>
        )}
        <span className={styles.animeTitle}>
          <Link href={`/anime/${row.anime_id}`}>{row.anime_title}</Link>
          {row.artist ? ` • ${row.artist}` : ''}
        </span>
      </span>
      <span className={styles.stats}>
        <span className={styles.avg}>{row.avg_placement}</span>
        <span className={styles.voteCount}>
          {row.vote_count} vote{row.vote_count === 1 ? '' : 's'}
        </span>
      </span>
    </li>
  );
}
