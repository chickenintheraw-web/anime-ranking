'use client';

import { useMemo, useState, useTransition } from 'react';
import PlacementModal from './PlacementModal';
import styles from './theme-rank.module.css';

// Shared by /rank/opening and /rank/ending — identical mechanic, just a
// different theme_type of candidate and a different label for copy.
export default function ThemeRankingBuilder({ entityLabel, candidates, initialList, saveAction }) {
  const [list, setList] = useState(initialList);
  const [query, setQuery] = useState('');
  const [placing, setPlacing] = useState(null); // { candidate, center } | null
  const [pending, startTransition] = useTransition();

  const rankOf = useMemo(() => {
    const map = new Map();
    list.forEach((item, i) => map.set(item.id, i + 1));
    return map;
  }, [list]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? candidates.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.animeTitle?.toLowerCase().includes(q) ||
            c.artist?.toLowerCase().includes(q)
        )
      : candidates;
    return [...filtered].sort((a, b) => a.animeTitle.localeCompare(b.animeTitle));
  }, [query, candidates]);

  function persist(nextList) {
    startTransition(async () => {
      await saveAction(nextList.map((i) => i.id));
    });
  }

  function startPlacing(candidate) {
    if (list.length === 0) {
      const next = [candidate];
      setList(next);
      persist(next);
      return;
    }
    setPlacing({ candidate, center: list.length });
  }

  function moveUp() {
    setPlacing((p) => (p ? { ...p, center: Math.max(0, p.center - 1) } : p));
  }

  function moveDown() {
    setPlacing((p) => (p ? { ...p, center: Math.min(list.length, p.center + 1) } : p));
  }

  function confirmPlacement() {
    if (!placing) return;
    const next = [...list];
    next.splice(placing.center, 0, placing.candidate);
    setList(next);
    persist(next);
    setPlacing(null);
  }

  function remove(id) {
    const next = list.filter((i) => i.id !== id);
    setList(next);
    persist(next);
  }

  return (
    <div className={styles.layout}>
      <div className={styles.searchPanel}>
        <input
          type="text"
          placeholder={`Search ${entityLabel}s…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
        />
        <ul className={styles.resultsList}>
          {results.map((c) => {
            const rank = rankOf.get(c.id);
            if (rank) {
              return (
                <li key={c.id}>
                  <div className={styles.resultRanked}>
                    <span className={styles.rankBadge}>#{rank}</span>
                    <span className={styles.resultInfo}>
                      <span className={styles.resultTitle}>{c.title}</span>
                      <span className={styles.resultMeta}>
                        {c.animeTitle}
                        {c.artist ? ` · ${c.artist}` : ''}
                      </span>
                    </span>
                  </div>
                </li>
              );
            }
            return (
              <li key={c.id}>
                <button type="button" className={styles.result} onClick={() => startPlacing(c)}>
                  <span className={styles.resultInfo}>
                    <span className={styles.resultTitle}>{c.title}</span>
                    <span className={styles.resultMeta}>
                      {c.animeTitle}
                      {c.artist ? ` · ${c.artist}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={styles.rankingPanel}>
        <div className={styles.rankingHeader}>
          <h2>Your Ranking</h2>
          {pending && <span className={styles.saving}>Saving…</span>}
        </div>

        {list.length === 0 ? (
          <p className={styles.empty}>
            Search on the left and add your first {entityLabel} — it becomes
            #1 automatically.
          </p>
        ) : (
          <ol className={styles.rankingList}>
            {list.map((item, i) => (
              <li key={item.id} className={styles.rankingItem}>
                <span className={styles.placement}>{i + 1}</span>
                <span className={styles.rankingInfo}>
                  <span className={styles.rankingTitle}>{item.title}</span>
                  <span className={styles.rankingMeta}>{item.animeTitle}</span>
                </span>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => remove(item.id)}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {placing && (
        <PlacementModal
          list={list}
          candidate={placing.candidate}
          center={placing.center}
          onMoveUp={moveUp}
          onMoveDown={moveDown}
          onConfirm={confirmPlacement}
          onCancel={() => setPlacing(null)}
        />
      )}
    </div>
  );
}
