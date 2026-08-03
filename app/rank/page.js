import { getRandomPair } from "@/lib/data";
import Matchup from "./Matchup";
import styles from "./rank.module.css";

export default async function RankPage() {
  const pair = await getRandomPair();

  return (
    <main className={styles.main}>
      <h1>Rank</h1>
      <p className={styles.subtitle}>
        Pick the better opening. Every vote updates the global leaderboard.
      </p>

      {!pair ? (
        <p className={styles.empty}>
          Not enough openings yet — add at least two to start voting.
        </p>
      ) : (
        <Matchup key={`${pair[0].id}-${pair[1].id}`} pair={pair} />
      )}
    </main>
  );
}
