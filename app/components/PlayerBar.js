'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { usePlayer } from './PlayerContext';
import MediaPlayer from './MediaPlayer';
import styles from './PlayerBar.module.css';

export default function PlayerBar() {
  const { current, index, queue, isPlaying, setIsPlaying, next, prev, close } = usePlayer();
  const mediaRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!mediaRef.current) return;
    if (isPlaying) mediaRef.current.play();
    else mediaRef.current.pause();
  }, [isPlaying, current]);

  if (!current) return null;

  const isTheater = pathname === `/watch/${current.themeId}`;
  const isLeaderboard = pathname === '/leaderboard';

  const meta = (
    <>
      {current.themeType}
      {current.sequenceNumber}
      {current.animeId ? (
        <>
          {' · '}
          <Link href={`/anime/${current.animeId}`}>{current.animeTitle}</Link>
        </>
      ) : (
        ` · ${current.animeTitle}`
      )}
      {current.provider === 'youtube' ? ' · YouTube' : ''}
      {current.quality ? ` · ${current.quality} ${current.source}` : ''}
    </>
  );

  const transportButtons = (
    <>
      <button type="button" onClick={prev} disabled={index <= 0} aria-label="Previous">
        ⏮
      </button>
      <button
        type="button"
        onClick={() => setIsPlaying((p) => !p)}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className={styles.playPause}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <button type="button" onClick={next} disabled={index >= queue.length - 1} aria-label="Next">
        ⏭
      </button>
    </>
  );

  return (
    <div
      className={
        isTheater ? styles.theaterWrap : isLeaderboard ? styles.leaderboardWrap : styles.bar
      }
    >
      <MediaPlayer
        ref={mediaRef}
        provider={current.provider}
        url={current.url}
        youtubeId={current.youtubeId}
        className={
          isTheater ? styles.theaterVideo : isLeaderboard ? styles.leaderboardVideo : styles.video
        }
        autoPlay
        controls={isTheater}
        onEnded={next}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {isLeaderboard && (
        <>
          <button
            type="button"
            className={styles.leaderboardClose}
            onClick={close}
            aria-label="Close player"
          >
            ✕
          </button>
          <div className={styles.leaderboardInfo}>
            <span className={styles.title}>{current.title}</span>
            <span className={styles.meta}>{meta}</span>
          </div>
          <div className={`${styles.controls} ${styles.leaderboardControls}`}>
            {transportButtons}
          </div>
        </>
      )}

      {!isTheater && !isLeaderboard && (
        <>
          <div className={styles.info}>
            <span className={styles.title}>{current.title}</span>
            <span className={styles.meta}>{meta}</span>
          </div>

          <div className={styles.controls}>{transportButtons}</div>

          <button type="button" className={styles.close} onClick={close} aria-label="Close player">
            ✕
          </button>
        </>
      )}
    </div>
  );
}
