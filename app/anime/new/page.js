import { requireAdmin } from '@/lib/admin';
import { FORMATS, SEASONS } from '@/lib/data';
import { createAnime } from './actions';
import styles from '../admin-form.module.css';

export default async function NewAnimePage() {
  await requireAdmin();

  return (
    <main className={styles.main}>
      <h1>Add Anime</h1>
      <form action={createAnime} className={styles.form}>
        <label className={styles.field}>
          Title
          <input type="text" name="title" required />
        </label>
        <label className={styles.field}>
          Title (romaji)
          <input type="text" name="title_romaji" />
        </label>
        <div className={styles.row}>
          <label className={styles.field}>
            Season
            <select name="season" defaultValue="">
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
            <input type="number" name="year" />
          </label>
          <label className={styles.field}>
            Format
            <select name="format" defaultValue="">
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
          <input type="text" name="studio" />
        </label>
        <label className={styles.field}>
          Cover image URL
          <input type="url" name="cover_image_url" />
        </label>
        <label className={styles.field}>
          Synopsis
          <textarea name="synopsis" rows={5} />
        </label>
        <button type="submit" className={styles.submit}>
          Create Anime
        </button>
      </form>
    </main>
  );
}
