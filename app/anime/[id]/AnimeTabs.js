'use client';

import { useState } from 'react';
import styles from './anime-detail.module.css';

const TABS = [
  { key: 'episodes', label: 'Episodes' },
  { key: 'themes', label: 'OPs and EDs' },
];

// Local useState, not a URL param, matching how the rank pages' own left
// -panel tabs work - this is a display concern local to the page, not
// something worth deep-linking to.
export default function AnimeTabs({ episodesTab, themesTab }) {
  const [tab, setTab] = useState('episodes');

  return (
    <div>
      <div className={styles.animeTabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? styles.animeTabActive : styles.animeTab}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'episodes' ? episodesTab : themesTab}
    </div>
  );
}
