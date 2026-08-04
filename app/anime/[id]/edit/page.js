import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { getAnimeWithThemes, FORMATS, SEASONS } from '@/lib/data';
import { updateAnime, createTheme, updateTheme } from './actions';
import styles from '../../admin-form.module.css';

export default async function EditAnimePage({ params }) {
  await requireAdmin();
  const { id } = await params;
  const anime = await getAnimeWithThemes(id);
  if (!anime) notFound();

  const openings = anime.themes.filter((t) => t.theme_type === 'OP');
  const endings = anime.themes.filter((t) => t.theme_type === 'ED');

  return (
    <main className={styles.main}>
      <h1>Edit {anime.title}</h1>

      <form action={updateAnime} className={styles.form}>
        <input type="hidden" name="anime_id" value={anime.id} />
        <label className={styles.field}>
          Title
          <input type="text" name="title" defaultValue={anime.title} required />
        </label>
        <label className={styles.field}>
          Title (romaji)
          <input type="text" name="title_romaji" defaultValue={anime.title_romaji || ''} />
        </label>
        <div className={styles.row}>
          <label className={styles.field}>
            Season
            <select name="season" defaultValue={anime.season || ''}>
              <option value="">—</option>
              {SEASONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            Year
            <input type="number" name="year" defaultValue={anime.year || ''} />
          </label>
          <label className={styles.field}>
            Format
            <select name="format" defaultValue={anime.format || ''}>
              <option value="">—</option>
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={styles.field}>
          Studio
          <input type="text" name="studio" defaultValue={anime.studio || ''} />
        </label>
        <label className={styles.field}>
          Cover image URL
          <input type="url" name="cover_image_url" defaultValue={anime.cover_image_url || ''} />
        </label>
        <label className={styles.field}>
          Synopsis
          <textarea name="synopsis" rows={5} defaultValue={anime.synopsis || ''} />
        </label>
        <button type="submit" className={styles.submit}>
          Save Anime
        </button>
      </form>

      <h2 className={styles.sectionTitle}>Openings</h2>
      <ThemeList themes={openings} animeId={anime.id} />
      <AddThemeForm animeId={anime.id} themeType="OP" />

      <h2 className={styles.sectionTitle}>Endings</h2>
      <ThemeList themes={endings} animeId={anime.id} />
      <AddThemeForm animeId={anime.id} themeType="ED" />
    </main>
  );
}

function ThemeList({ themes, animeId }) {
  if (themes.length === 0) return <p className={styles.empty}>None yet.</p>;
  return (
    <div className={styles.themeList}>
      {themes.map((t) => (
        <form key={t.id} action={updateTheme} className={styles.themeForm}>
          <input type="hidden" name="theme_id" value={t.id} />
          <input type="hidden" name="anime_id" value={animeId} />
          <input type="hidden" name="theme_type" value={t.theme_type} />
          <input
            type="text"
            name="title"
            defaultValue={t.title}
            className={styles.themeInput}
            placeholder="Title"
            required
          />
          <input
            type="text"
            name="artist"
            defaultValue={t.artist || ''}
            className={styles.themeInput}
            placeholder="Artist"
          />
          <input
            type="number"
            name="sequence_number"
            defaultValue={t.sequence_number}
            className={styles.themeInputSmall}
            placeholder="#"
          />
          <select
            name="release_season"
            defaultValue={t.release_season || ''}
            className={styles.themeSelect}
          >
            <option value="">Season —</option>
            {SEASONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="release_year"
            defaultValue={t.release_year || ''}
            className={styles.themeInputSmall}
            placeholder="Year"
          />
          <button type="submit" className={styles.themeSave}>
            Save
          </button>
        </form>
      ))}
    </div>
  );
}

function AddThemeForm({ animeId, themeType }) {
  return (
    <form action={createTheme} className={styles.themeForm}>
      <input type="hidden" name="anime_id" value={animeId} />
      <input type="hidden" name="theme_type" value={themeType} />
      <input type="text" name="title" className={styles.themeInput} placeholder="Title" required />
      <input type="text" name="artist" className={styles.themeInput} placeholder="Artist" />
      <input
        type="number"
        name="sequence_number"
        className={styles.themeInputSmall}
        placeholder="#"
        defaultValue={1}
      />
      <select name="release_season" defaultValue="" className={styles.themeSelect}>
        <option value="">Season —</option>
        {SEASONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input type="number" name="release_year" className={styles.themeInputSmall} placeholder="Year" />
      <button type="submit" className={styles.themeSave}>
        Add {themeType === 'OP' ? 'Opening' : 'Ending'}
      </button>
    </form>
  );
}
