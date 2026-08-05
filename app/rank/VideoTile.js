'use client';

import { useEffect, useRef } from 'react';
import MediaPlayer from '@/app/components/MediaPlayer';
import styles from './theme-rank.module.css';

// All three comparison videos autoplay muted simultaneously; hovering one
// unmutes just that one so the user can compare audio by moving their
// mouse between tiles, without ever stopping playback.
export default function VideoTile({ track }) {
  const mediaRef = useRef(null);

  useEffect(() => {
    mediaRef.current?.setMuted(true);
  }, []);

  function handleEnter() {
    mediaRef.current?.setMuted(false);
  }

  function handleLeave() {
    mediaRef.current?.setMuted(true);
  }

  const hasVideo = track.provider === 'youtube' ? !!track.youtubeId : !!track.previewUrl;

  return (
    <div className={styles.videoTile} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {hasVideo ? (
        <MediaPlayer
          ref={mediaRef}
          provider={track.provider}
          url={track.previewUrl}
          youtubeId={track.youtubeId}
          className={styles.videoEl}
          autoPlay
          loop
          muted
        />
      ) : (
        <div className={styles.noPreview}>No video</div>
      )}
      <div className={styles.videoCaption}>
        <span className={styles.videoTitle}>{track.title}</span>
        <span className={styles.videoMeta}>{track.animeTitle}</span>
      </div>
    </div>
  );
}
