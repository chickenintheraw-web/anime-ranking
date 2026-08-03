"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { castVote } from "./actions";
import styles from "./rank.module.css";

export default function Matchup({ pair }) {
  const [a, b] = pair;
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function vote(winner, loser) {
    startTransition(async () => {
      await castVote(winner.id, loser.id);
      router.refresh();
    });
  }

  return (
    <div className={styles.grid}>
      <OpeningCard op={a} pending={pending} onVote={() => vote(a, b)} />
      <span className={styles.vs}>vs</span>
      <OpeningCard op={b} pending={pending} onVote={() => vote(b, a)} />
    </div>
  );
}

function OpeningCard({ op, pending, onVote }) {
  return (
    <button
      type="button"
      className={styles.card}
      disabled={pending}
      onClick={onVote}
    >
      {op.anime?.title && (
        <span className={styles.animeTitle}>{op.anime.title}</span>
      )}
      <span className={styles.opTitle}>{op.title}</span>
      {op.artist && <span className={styles.opArtist}>{op.artist}</span>}
    </button>
  );
}
