'use client';

import { useMemo, useState, useTransition } from 'react';
import EpisodePlacementModal from './EpisodePlacementModal';
import styles from './episode-rank.module.css';

function currentSeason(date = new Date()) {
  const m = date.getMonth(); // 0-11
  if (m === 11 || m <= 1) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'fall';
}

function episodeLabel(c) {
  return c.seasonLabel ? `${c.seasonLabel} · Ep ${c.episodeNumber}` : `Episode ${c.episodeNumber}`;
}

const BASE_LEFT_TABS = [
  { key: 'search', label: 'Search' },
  { key: 'top', label: 'Top Rated' },
  { key: 'season', label: 'This Season' },
];

// Adapted from ThemeRankingBuilder for episodes: same slot-picking +
// comparison-modal mechanic, but text/thumbnail cards instead of video
// (episodes aren't hosted), plus an optional "By Show" tab (global mode
// only) surfacing shows the user has solo-ranked on their own anime page,
// pre-sorted, as a quick source to pull into this list.
export default function EpisodeRankingBuilder({
  entityLabel,
  candidates,
  initialList,
  saveAction,
  topRated = [],
  byShowGroups = [],
  showByShowTab = false,
}) {
  const [list, setList] = useState(initialList);
  const [query, setQuery] = useState('');
  const [leftTab, setLeftTab] = useState('search');
  const [selectingFor, setSelectingFor] = useState(null); // candidate | null — picking a slot
  const [placing, setPlacing] = useState(null); // { candidate, center } | null — modal open
  const [pending, startTransition] = useTransition();

  const leftTabs = showByShowTab
    ? [...BASE_LEFT_TABS, { key: 'byshow', label: 'By Show' }]
    : BASE_LEFT_TABS;

  const rankOf = useMemo(() => {
    const map = new Map();
    list.forEach((item, i) => map.set(item.id, i + 1));
    return map;
  }, [list]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? candidates.filter(
          (c) => c.title.toLowerCase().includes(q) || c.animeTitle?.toLowerCase().includes(q)
        )
      : candidates;
    return [...filtered].sort((a, b) => a.animeTitle.localeCompare(b.animeTitle));
  }, [query, candidates]);

  const seasonResults = useMemo(() => {
    const season = currentSeason();
    const year = new Date().getFullYear();
    return candidates.filter((c) => {
      if (!c.airDate) return false;
      const d = new Date(c.airDate);
      return currentSeason(d) === season && d.getFullYear() === year;
    });
  }, [candidates]);

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

  function renderRow(c, extra) {
    const rank = rankOf.get(c.id);
    if (rank) {
      return (
        <li key={c.id}>
          <div className={styles.resultRanked}>
            <span className={styles.rankBadge}>#{rank}</span>
            <span className={styles.resultInfo}>
              <span className={styles.resultTitle}>{c.title}</span>
              <span className={styles.resultMeta}>
                {c.animeTitle} · {episodeLabel(c)}
              </span>
            </span>
            {extra}
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
              {c.animeTitle} · {episodeLabel(c)}
            </span>
          </span>
          {extra}
        </button>
      </li>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.searchPanel}>
        <div className={styles.leftTabs}>
          {leftTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={leftTab === t.key ? styles.leftTabActive : styles.leftTab}
              onClick={() => setLeftTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {leftTab === 'search' && (
          <>
            <input
              type="text"
              placeholder={`Search ${entityLabel}s…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
            />
            <ul className={styles.resultsList}>{results.map((c) => renderRow(c))}</ul>
          </>
        )}

        {leftTab === 'top' &&
          (topRated.length === 0 ? (
            <p className={styles.empty}>No votes yet — be the first to rank.</p>
          ) : (
            <ul className={styles.resultsList}>
              {topRated.map((c, i) =>
                renderRow(
                  c,
                  <span className={styles.rowStats}>
                    <span className={styles.rowRank}>#{i + 1}</span>
                    <span className={styles.rowAvg}>{c.avgPlacement}</span>
                  </span>
                )
              )}
            </ul>
          ))}

        {leftTab === 'season' &&
          (seasonResults.length === 0 ? (
            <p className={styles.empty}>
              No {entityLabel}s marked as airing this season yet.
            </p>
          ) : (
            <ul className={styles.resultsList}>{seasonResults.map((c) => renderRow(c))}</ul>
          ))}

        {leftTab === 'byshow' &&
          (byShowGroups.length === 0 ? (
            <p className={styles.empty}>
              You haven&apos;t solo-ranked any show&apos;s episodes yet — visit a
              show&apos;s page and use &quot;Rank Episodes&quot; there first.
            </p>
          ) : (
            <div className={styles.byShowGroups}>
              {byShowGroups.map((g) => (
                <div key={g.animeId} className={styles.byShowGroup}>
                  <h3 className={styles.byShowTitle}>{g.animeTitle}</h3>
                  <ul className={styles.resultsList}>
                    {g.episodes.map((c, i) =>
                      renderRow(
                        c,
                        <span className={styles.rowStats}>
                          <span className={styles.rowRank}>#{i + 1}</span>
                        </span>
                      )
                    )}
                  </ul>
                </div>
              ))}
            </div>
          ))}
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
                    <span className={styles.rankingMeta}>
                      {item.animeTitle} · {episodeLabel(item)}
                    </span>
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
        <EpisodePlacementModal
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
