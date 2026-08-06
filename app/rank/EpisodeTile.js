'use client';

import styles from './episode-rank.module.css';

// No video to preview (episodes aren't hosted), so this is a plain
// thumbnail/text card rather than VideoTile's autoplay-muted-hover mechanic.
export default function EpisodeTile({ track }) {
  const epLabel = track.seasonLabel
    ? `${track.seasonLabel} · Ep ${track.episodeNumber}`
    : `Episode ${track.episodeNumber}`;

  return (
    <div className={styles.episodeTile}>
      <div className={styles.episodeThumb}>
        {track.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.thumbnailUrl} alt="" />
        ) : (
          <span className={styles.episodeThumbFallback}>{epLabel}</span>
        )}
      </div>
      <div className={styles.episodeCaption}>
        <span className={styles.episodeTitle}>{track.title}</span>
        <span className={styles.episodeMeta}>
          {track.animeTitle} · {epLabel}
        </span>
      </div>
    </div>
  );
}
