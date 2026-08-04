import Link from 'next/link';
import { searchAnime, searchThemes, FORMATS, SEASONS } from '@/lib/data';
import styles from './search.module.css';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function buildQuery(base, overrides) {
  const merged = { ...base, ...overrides };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, String(value));
  }
  return params.toString();
}

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const type = sp.type === 'theme' ? 'theme' : 'anime';
  const filters = {
    type,
    q: sp.q || '',
    letter: sp.letter || '',
    season: sp.season || '',
    year: sp.year || '',
    format: sp.format || '',
    sort: sp.sort || 'title_asc',
    themeType: sp.themeType || '',
  };

  const results = type === 'anime' ? await searchAnime(filters) : await searchThemes(filters);

  return (
    <main className={styles.main}>
      <h1>Search</h1>

      <div className={styles.tabs}>
        <Link
          href={`/search?${buildQuery(filters, { type: 'anime' })}`}
          className={type === 'anime' ? styles.tabActive : styles.tab}
        >
          Anime
        </Link>
        <Link
          href={`/search?${buildQuery(filters, { type: 'theme' })}`}
          className={type === 'theme' ? styles.tabActive : styles.tab}
        >
          Theme
        </Link>
      </div>

      <form className={styles.filters} method="get">
        <input type="hidden" name="type" value={type} />
        <input
          type="text"
          name="q"
          placeholder="Search…"
          defaultValue={filters.q}
          className={styles.search}
        />

        <select name="letter" defaultValue={filters.letter}>
          <option value="">First letter</option>
          {LETTERS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <select name="season" defaultValue={filters.season}>
          <option value="">Season</option>
          {SEASONS.map((s) => (
            <option key={s} value={s}>
              {cap(s)}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="year"
          placeholder="Year"
          defaultValue={filters.year}
          className={styles.year}
        />

        <select name="format" defaultValue={filters.format}>
          <option value="">Format</option>
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        {type === 'theme' && (
          <select name="themeType" defaultValue={filters.themeType}>
            <option value="">Opening or ending</option>
            <option value="OP">Opening</option>
            <option value="ED">Ending</option>
          </select>
        )}

        <select name="sort" defaultValue={filters.sort}>
          <option value="title_asc">A → Z</option>
          <option value="year_desc">Newest</option>
          <option value="year_asc">Oldest</option>
        </select>

        <button type="submit" className={styles.applyButton}>
          Apply
        </button>
      </form>

      {results.length === 0 ? (
        <p className={styles.empty}>No results.</p>
      ) : (
        <ul className={styles.results}>
          {type === 'anime'
            ? results.map((a) => (
                <li key={a.id}>
                  <Link href={`/anime/${a.id}`} className={styles.row}>
                    <span className={styles.thumb}>
                      {a.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.cover_image_url} alt="" />
                      ) : (
                        <span className={styles.thumbFallback}>{a.title.slice(0, 1)}</span>
                      )}
                    </span>
                    <span className={styles.rowInfo}>
                      <span className={styles.rowTitle}>{a.title}</span>
                      <span className={styles.rowMeta}>
                        {[a.format, [cap(a.season), a.year].filter(Boolean).join(' ')]
                          .filter(Boolean)
                          .join(' • ')}
                        {a.themes?.length
                          ? ` • ${a.themes.length} theme${a.themes.length === 1 ? '' : 's'}`
                          : ''}
                      </span>
                    </span>
                  </Link>
                </li>
              ))
            : results.map((t) => (
                <li key={t.id}>
                  <Link href={`/anime/${t.anime.id}`} className={styles.row}>
                    <span className={styles.thumb}>
                      {t.anime.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.anime.cover_image_url} alt="" />
                      ) : (
                        <span className={styles.thumbFallback}>{t.anime.title.slice(0, 1)}</span>
                      )}
                    </span>
                    <span className={styles.rowInfo}>
                      <span className={styles.rowTitle}>{t.title}</span>
                      <span className={styles.rowMeta}>
                        {t.anime.title} • {t.theme_type}
                        {t.sequence_number}
                        {t.anime.format ? ` • ${t.anime.format}` : ''}
                        {t.anime.season || t.anime.year
                          ? ` • ${[cap(t.anime.season), t.anime.year].filter(Boolean).join(' ')}`
                          : ''}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
        </ul>
      )}
    </main>
  );
}
