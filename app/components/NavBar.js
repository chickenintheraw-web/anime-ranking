import Link from 'next/link';
import styles from './NavBar.module.css';

export default function NavBar() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          Anime Ranking
        </Link>
        <div className={styles.links}>
          <Link href="/anime">Index</Link>
          <Link href="/rank">Rank</Link>
          <Link href="/leaderboard">Leaderboard</Link>
        </div>
      </nav>
    </header>
  );
}
