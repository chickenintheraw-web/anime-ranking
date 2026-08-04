import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import styles from './NavBar.module.css';

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          Anime Ranking
        </Link>
        <div className={styles.links}>
          <Link href="/search">Search</Link>
          <Link href="/rank">Rank</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          {user ? (
            <Link href="/profile">Profile</Link>
          ) : (
            <Link href="/login">Sign in</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
