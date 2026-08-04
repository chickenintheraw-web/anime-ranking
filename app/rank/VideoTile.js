'use client';

import { useEffect, useRef } from 'react';
import styles from './theme-rank.module.css';

// All three comparison videos autoplay muted simultaneously; hovering one
// unmutes just that one so the user can compare audio by moving their
// mouse between tiles, without ever stopping playback.
export default function VideoTile({ track }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = true;
  }, []);

  function handleEnter() {
    if (videoRef.current) videoRef.current.muted = false;
  }

  function handleLeave() {
    if (videoRef.current) videoRef.current.muted = true;
  }

  return (
    <div className={styles.videoTile} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {track.previewUrl ? (
        <video
          ref={videoRef}
          src={track.previewUrl}
          className={styles.videoEl}
          autoPlay
          loop
          muted
          playsInline
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
