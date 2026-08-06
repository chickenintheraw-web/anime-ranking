import Link from 'next/link';
import styles from './leaderboard.module.css';

// Plain link+stats row, no video — used by Anime, Season, and Movie tabs.
export default function LeaderboardSimpleRow({ row, rank }) {
  return (
    <li className={styles.item}>
      <span className={styles.rank}>{rank}</span>
      <span className={styles.info}>
        <Link href={row.href} className={styles.title}>
          {row.title}
        </Link>
        {row.subtitle && <span className={styles.animeTitle}>{row.subtitle}</span>}
      </span>
      <span className={styles.stats}>
        <span className={styles.avg}>{row.avg}</span>
        <span className={styles.voteCount}>
          {row.count} vote{row.count === 1 ? '' : 's'}
        </span>
      </span>
    </li>
  );
}
