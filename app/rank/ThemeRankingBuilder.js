'use client';

import { useMemo, useState, useTransition } from 'react';
import PlacementModal from './PlacementModal';
import styles from './theme-rank.module.css';

// Shared by /rank/opening and /rank/ending — identical mechanic, just a
// different theme_type of candidate and a different label for copy.
export default function ThemeRankingBuilder({ entityLabel, candidates, initialList, saveAction }) {
  const [list, setList] = useState(initialList);
  const [query, setQuery] = useState('');
  const [selectingFor, setSelectingFor] = useState(null); // candidate | null — picking a slot
  const [placing, setPlacing] = useState(null); // { candidate, center } | null — modal open
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

  // First entry skips straight to #1 — nothing to compare against yet.
  // Otherwise, select this candidate and let the user click a slot in the
  // ranking panel (rather than always starting the comparison at the
  // bottom, which would force walking up one step at a time on a long list).
  function startPlacing(candidate) {
    if (list.length === 0) {
      const next = [candidate];
      setList(next);
      persist(next);
      return;
    }
    setSelectingFor((cur) => (cur?.id === candidate.id ? null : candidate));
  }

  function pickSlot(index) {
    if (!selectingFor) return;
    setPlacing({ candidate: selectingFor, center: index });
    setSelectingFor(null);
  }

  function moveBy(amount) {
    setPlacing((p) =>
      p ? { ...p, center: Math.min(list.length, Math.max(0, p.center + amount)) } : p
    );
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
            const isSelecting = selectingFor?.id === c.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className={isSelecting ? styles.resultSelecting : styles.result}
                  onClick={() => startPlacing(c)}
                >
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

        {selectingFor && (
          <div className={styles.selectingBanner}>
            <span>
              Click where <strong>{selectingFor.title}</strong> belongs.
            </span>
            <button
              type="button"
              className={styles.cancelLink}
              onClick={() => setSelectingFor(null)}
            >
              Cancel
            </button>
          </div>
        )}

        {list.length === 0 ? (
          <p className={styles.empty}>
            Search on the left and add your first {entityLabel} — it becomes
            #1 automatically.
          </p>
        ) : (
          <ol className={styles.rankingList}>
            {selectingFor && (
              <li key="slot-0">
                <button type="button" className={styles.slot} onClick={() => pickSlot(0)}>
                  Place here — #1
                </button>
              </li>
            )}
            {list.flatMap((item, i) => {
              const row = (
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
              );
              if (!selectingFor) return [row];
              const slot = (
                <li key={`slot-${i + 1}`}>
                  <button type="button" className={styles.slot} onClick={() => pickSlot(i + 1)}>
                    Place here — #{i + 2}
                  </button>
                </li>
              );
              return [row, slot];
            })}
          </ol>
        )}
      </div>

      {placing && (
        <PlacementModal
          list={list}
          candidate={placing.candidate}
          center={placing.center}
          onMoveBy={moveBy}
          onConfirm={confirmPlacement}
          onCancel={() => setPlacing(null)}
        />
      )}
    </div>
  );
}
