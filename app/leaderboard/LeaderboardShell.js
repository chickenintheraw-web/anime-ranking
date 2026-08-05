'use client';

import { usePlayer } from '@/app/components/PlayerContext';
import styles from './leaderboard.module.css';

// The actual video is the global PlayerBar (rendered once in the root
// layout, fixed to the viewport's left edge on this route - see
// PlayerBar.js's isLeaderboard check). This just reserves the matching
// space so the list doesn't sit underneath it, same trick /watch uses.
export default function LeaderboardShell({ children }) {
  const { current } = usePlayer();
  return <main className={current ? styles.mainWithPlayer : styles.main}>{children}</main>;
}
