import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import styles from './rank.module.css';

export default async function RankPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className={styles.main}>
      <h1>Rank</h1>
      <p className={styles.subtitle}>
        Build your own ranking. Every list is pooled into the global leaderboard.
      </p>

      {!user ? (
        <p className={styles.empty}>
          <Link href="/login?next=/rank">Log in</Link> to start ranking.
        </p>
      ) : (
        <div className={styles.chooser}>
          <Link href="/rank/anime" className={styles.chooserCard}>
            <span className={styles.chooserTitle}>Rank Anime</span>
            <span className={styles.chooserDesc}>Order the anime you&apos;ve watched.</span>
          </Link>
          <Link href="/rank/opening" className={styles.chooserCard}>
            <span className={styles.chooserTitle}>Rank Openings</span>
            <span className={styles.chooserDesc}>Order your favorite opening themes.</span>
          </Link>
          <Link href="/rank/ending" className={styles.chooserCard}>
            <span className={styles.chooserTitle}>Rank Endings</span>
            <span className={styles.chooserDesc}>Order your favorite ending themes.</span>
          </Link>
          <Link href="/rank/season" className={styles.chooserCard}>
            <span className={styles.chooserTitle}>Rank Seasons</span>
            <span className={styles.chooserDesc}>Order full seasons against each other.</span>
          </Link>
          <Link href="/rank/movie" className={styles.chooserCard}>
            <span className={styles.chooserTitle}>Rank Movies</span>
            <span className={styles.chooserDesc}>Order the movies you&apos;ve watched.</span>
          </Link>
          <Link href="/rank/episode" className={styles.chooserCard}>
            <span className={styles.chooserTitle}>Rank Episodes</span>
            <span className={styles.chooserDesc}>
              Build a global episode ranking across every show. To rank just
              one show&apos;s episodes, use that show&apos;s own page instead.
            </span>
          </Link>
        </div>
      )}
    </main>
  );
}
