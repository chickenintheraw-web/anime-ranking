import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Rank anime and anime openings.</h1>
          <p>
            Browse the index of every anime and opening theme, then vote in
            head-to-head matchups. Every vote feeds a single, pooled global
            ranking.
          </p>
        </div>
        <div className={styles.ctas}>
          <Link className={styles.primary} href="/rank">
            Start ranking
          </Link>
          <Link className={styles.secondary} href="/anime">
            Browse the index
          </Link>
        </div>
      </main>
    </div>
  );
}
