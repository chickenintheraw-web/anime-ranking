import Link from 'next/link';
import styles from './leaderboard.module.css';

// Plain row, no video (episodes aren't hosted/playable).
export default function LeaderboardEpisodeRow({ row, rank }) {
  const epLabel =
    row.season_number != null ? `S${row.season_number}E${row.episode_number}` : `Ep. ${row.episode_number}`;

  return (
    <li className={styles.item}>
      <span className={styles.rank}>{rank}</span>
      <span className={styles.info}>
        <span className={styles.title}>{row.episode_title || epLabel}</span>
        <span className={styles.animeTitle}>
          <Link href={`/anime/${row.anime_id}`}>{row.anime_title}</Link> · {epLabel}
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
