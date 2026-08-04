'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import styles from './rank.module.css';

export default function RankingBuilder({ entityLabel, candidates, initialRanking, saveAction }) {
  const [list, setList] = useState(initialRanking);
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const addedIds = useMemo(() => new Set(list.map((i) => i.id)), [list]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return candidates
      .filter((c) => !addedIds.has(c.id) && c.label.toLowerCase().includes(q))
      .slice(0, 20);
  }, [query, candidates, addedIds]);

  function add(candidate) {
    setList((prev) => [...prev, candidate]);
    setQuery('');
    setSaved(false);
  }

  function remove(id) {
    setList((prev) => prev.filter((i) => i.id !== id));
    setSaved(false);
  }

  function move(index, dir) {
    setList((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      await saveAction(list.map((i) => i.id));
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div>
      <div className={styles.search}>
        <input
          type="text"
          placeholder={`Search ${entityLabel} to add…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
        />
        {results.length > 0 && (
          <ul className={styles.results}>
            {results.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => add(c)}>
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {list.length === 0 ? (
        <p className={styles.empty}>Search above to start building your ranking.</p>
      ) : (
        <ol className={styles.list}>
          {list.map((item, i) => (
            <li key={item.id} className={styles.item}>
              <span className={styles.placement}>{i + 1}</span>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.controls}>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === list.length - 1}
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button type="button" onClick={() => remove(item.id)} aria-label="Remove">
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className={styles.saveRow}>
        <button type="button" className={styles.save} onClick={save} disabled={pending}>
          {pending ? 'Saving…' : 'Save ranking'}
        </button>
        {saved && !pending && <span className={styles.savedNote}>Saved.</span>}
      </div>
    </div>
  );
}
