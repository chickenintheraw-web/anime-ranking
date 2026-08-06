import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import {
  getAnimeWithThemes,
  getAnimeSeasons,
  getAnimeMovies,
  getAnimeEpisodes,
  FORMATS,
  SEASONS,
} from '@/lib/data';
import { updateAnime, createTheme, updateTheme, addYoutubeVariant, removeVariant } from './actions';
import { createSeason, updateSeason, deleteSeason } from './seasonActions';
import { createMovie, updateMovie, deleteMovie } from './movieActions';
import { updateEpisode, deleteEpisode, bulkAddEpisodes } from './episodeActions';
import VariantUpload from './VariantUpload';
import styles from '../../admin-form.module.css';

function groupBy(items, key) {
  const map = new Map();
  for (const item of items) {
    const k = item[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  }
  return map;
}

export default async function EditAnimePage({ params }) {
  await requireAdmin();
  const { id } = await params;
  const [anime, seasons, movies, episodes] = await Promise.all([
    getAnimeWithThemes(id),
    getAnimeSeasons(id),
    getAnimeMovies(id),
    getAnimeEpisodes(id),
  ]);
  if (!anime) notFound();

  const generalThemes = anime.themes.filter((t) => !t.season_id && !t.movie_id);
  const generalOpenings = generalThemes.filter((t) => t.theme_type === 'OP');
  const generalEndings = generalThemes.filter((t) => t.theme_type === 'ED');
  const themesBySeasonId = groupBy(
    anime.themes.filter((t) => t.season_id),
    'season_id'
  );
  const themesByMovieId = groupBy(
    anime.themes.filter((t) => t.movie_id),
    'movie_id'
  );
  const episodesBySeasonId = groupBy(
    episodes.filter((e) => e.season_id),
    'season_id'
  );
  const unsectionedEpisodes = episodes.filter((e) => !e.season_id);

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
      <ThemeList themes={generalOpenings} animeId={anime.id} />
      <AddThemeForm animeId={anime.id} themeType="OP" />

      <h2 className={styles.sectionTitle}>Endings</h2>
      <ThemeList themes={generalEndings} animeId={anime.id} />
      <AddThemeForm animeId={anime.id} themeType="ED" />

      <h2 className={styles.sectionTitle}>Seasons</h2>
      <SeasonList seasons={seasons} animeId={anime.id} />
      <AddSeasonForm animeId={anime.id} />

      {seasons.map((s) => {
        const label = s.title || `Season ${s.season_number}`;
        return (
          <div key={s.id} className={styles.themeItem}>
            <h3 className={styles.sectionTitle}>{label}</h3>

            <p className={styles.empty}>Episodes</p>
            <EpisodeList episodes={episodesBySeasonId.get(s.id) ?? []} animeId={anime.id} />
            <BulkAddEpisodesForm animeId={anime.id} seasonId={s.id} />

            <p className={styles.empty}>{label} Openings</p>
            <ThemeList
              themes={(themesBySeasonId.get(s.id) ?? []).filter((t) => t.theme_type === 'OP')}
              animeId={anime.id}
            />
            <AddThemeForm animeId={anime.id} themeType="OP" seasonId={s.id} />

            <p className={styles.empty}>{label} Endings</p>
            <ThemeList
              themes={(themesBySeasonId.get(s.id) ?? []).filter((t) => t.theme_type === 'ED')}
              animeId={anime.id}
            />
            <AddThemeForm animeId={anime.id} themeType="ED" seasonId={s.id} />
          </div>
        );
      })}

      {seasons.length === 0 && (
        <>
          <h2 className={styles.sectionTitle}>Episodes</h2>
          <EpisodeList episodes={unsectionedEpisodes} animeId={anime.id} />
          <BulkAddEpisodesForm animeId={anime.id} seasonId={null} />
        </>
      )}
      {seasons.length > 0 && unsectionedEpisodes.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Other Episodes (no season)</h2>
          <EpisodeList episodes={unsectionedEpisodes} animeId={anime.id} />
          <BulkAddEpisodesForm animeId={anime.id} seasonId={null} />
        </>
      )}

      <h2 className={styles.sectionTitle}>Movies</h2>
      <MovieList movies={movies} animeId={anime.id} />
      <AddMovieForm animeId={anime.id} />

      {movies.map((m) => (
        <div key={m.id} className={styles.themeItem}>
          <h3 className={styles.sectionTitle}>{m.title}</h3>

          <p className={styles.empty}>Openings</p>
          <ThemeList
            themes={(themesByMovieId.get(m.id) ?? []).filter((t) => t.theme_type === 'OP')}
            animeId={anime.id}
          />
          <AddThemeForm animeId={anime.id} themeType="OP" movieId={m.id} />

          <p className={styles.empty}>Endings</p>
          <ThemeList
            themes={(themesByMovieId.get(m.id) ?? []).filter((t) => t.theme_type === 'ED')}
            animeId={anime.id}
          />
          <AddThemeForm animeId={anime.id} themeType="ED" movieId={m.id} />
        </div>
      ))}
    </main>
  );
}

function ThemeList({ themes, animeId }) {
  if (themes.length === 0) return <p className={styles.empty}>None yet.</p>;
  return (
    <div className={styles.themeList}>
      {themes.map((t) => (
        <div key={t.id} className={styles.themeItem}>
          <form action={updateTheme} className={styles.themeForm}>
            <input type="hidden" name="theme_id" value={t.id} />
            <input type="hidden" name="anime_id" value={animeId} />
            <input type="hidden" name="theme_type" value={t.theme_type} />
            <input type="hidden" name="season_id" value={t.season_id || ''} />
            <input type="hidden" name="movie_id" value={t.movie_id || ''} />
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
          <VariantsRow theme={t} animeId={animeId} />
        </div>
      ))}
    </div>
  );
}

function VariantsRow({ theme, animeId }) {
  const youtubeVariant = theme.theme_variants?.find((v) => v.provider === 'youtube');
  const r2Variants = theme.theme_variants?.filter((v) => v.provider !== 'youtube') ?? [];

  return (
    <div className={styles.variantsRow}>
      <VariantUpload themeId={theme.id} animeId={animeId} />

      {r2Variants.map((v) => (
        <form key={v.id} action={removeVariant} className={styles.variantChip}>
          <input type="hidden" name="variant_id" value={v.id} />
          <input type="hidden" name="anime_id" value={animeId} />
          <span>
            {v.quality} {v.source}
          </span>
          <button type="submit" className={styles.removeVariantButton} aria-label="Remove variant">
            ✕
          </button>
        </form>
      ))}

      {youtubeVariant ? (
        <form action={removeVariant} className={styles.variantChipYoutube}>
          <input type="hidden" name="variant_id" value={youtubeVariant.id} />
          <input type="hidden" name="anime_id" value={animeId} />
          <span>YouTube: {youtubeVariant.youtube_id}</span>
          <button type="submit" className={styles.removeVariantButton} aria-label="Remove YouTube link">
            ✕
          </button>
        </form>
      ) : (
        <form action={addYoutubeVariant} className={styles.addYoutubeForm}>
          <input type="hidden" name="theme_id" value={theme.id} />
          <input type="hidden" name="anime_id" value={animeId} />
          <input
            type="text"
            name="youtube_url"
            className={styles.addYoutubeInput}
            placeholder="Paste YouTube URL"
          />
          <button type="submit" className={styles.addYoutubeButton}>
            Add YouTube link
          </button>
        </form>
      )}
    </div>
  );
}

function AddThemeForm({ animeId, themeType, seasonId, movieId }) {
  return (
    <form action={createTheme} className={styles.themeForm}>
      <input type="hidden" name="anime_id" value={animeId} />
      <input type="hidden" name="theme_type" value={themeType} />
      {seasonId && <input type="hidden" name="season_id" value={seasonId} />}
      {movieId && <input type="hidden" name="movie_id" value={movieId} />}
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

function SeasonList({ seasons, animeId }) {
  if (seasons.length === 0) return <p className={styles.empty}>None yet.</p>;
  return (
    <div className={styles.themeList}>
      {seasons.map((s) => (
        <form key={s.id} action={updateSeason} className={styles.themeForm}>
          <input type="hidden" name="season_id" value={s.id} />
          <input type="hidden" name="anime_id" value={animeId} />
          <input
            type="number"
            name="season_number"
            defaultValue={s.season_number}
            className={styles.themeInputSmall}
            placeholder="#"
          />
          <input
            type="text"
            name="title"
            defaultValue={s.title || ''}
            className={styles.themeInput}
            placeholder="Title (optional)"
          />
          <input
            type="number"
            name="year"
            defaultValue={s.year || ''}
            className={styles.themeInputSmall}
            placeholder="Year"
          />
          <input
            type="url"
            name="cover_image_url"
            defaultValue={s.cover_image_url || ''}
            className={styles.themeInput}
            placeholder="Cover image URL"
          />
          <button type="submit" className={styles.themeSave}>
            Save
          </button>
          <button
            type="submit"
            formAction={deleteSeason}
            className={styles.removeVariantButton}
            aria-label="Remove season"
          >
            ✕
          </button>
        </form>
      ))}
    </div>
  );
}

function AddSeasonForm({ animeId }) {
  return (
    <form action={createSeason} className={styles.themeForm}>
      <input type="hidden" name="anime_id" value={animeId} />
      <input
        type="number"
        name="season_number"
        className={styles.themeInputSmall}
        placeholder="#"
        defaultValue={1}
        required
      />
      <input type="text" name="title" className={styles.themeInput} placeholder="Title (optional)" />
      <input type="number" name="year" className={styles.themeInputSmall} placeholder="Year" />
      <input type="url" name="cover_image_url" className={styles.themeInput} placeholder="Cover image URL" />
      <button type="submit" className={styles.themeSave}>
        Add Season
      </button>
    </form>
  );
}

function MovieList({ movies, animeId }) {
  if (movies.length === 0) return <p className={styles.empty}>None yet.</p>;
  return (
    <div className={styles.themeList}>
      {movies.map((m) => (
        <form key={m.id} action={updateMovie} className={styles.themeForm}>
          <input type="hidden" name="movie_id" value={m.id} />
          <input type="hidden" name="anime_id" value={animeId} />
          <input
            type="text"
            name="title"
            defaultValue={m.title}
            className={styles.themeInput}
            placeholder="Title"
            required
          />
          <input
            type="number"
            name="year"
            defaultValue={m.year || ''}
            className={styles.themeInputSmall}
            placeholder="Year"
          />
          <input
            type="url"
            name="cover_image_url"
            defaultValue={m.cover_image_url || ''}
            className={styles.themeInput}
            placeholder="Cover image URL"
          />
          <button type="submit" className={styles.themeSave}>
            Save
          </button>
          <button
            type="submit"
            formAction={deleteMovie}
            className={styles.removeVariantButton}
            aria-label="Remove movie"
          >
            ✕
          </button>
        </form>
      ))}
    </div>
  );
}

function AddMovieForm({ animeId }) {
  return (
    <form action={createMovie} className={styles.themeForm}>
      <input type="hidden" name="anime_id" value={animeId} />
      <input type="text" name="title" className={styles.themeInput} placeholder="Title" required />
      <input type="number" name="year" className={styles.themeInputSmall} placeholder="Year" />
      <input type="url" name="cover_image_url" className={styles.themeInput} placeholder="Cover image URL" />
      <button type="submit" className={styles.themeSave}>
        Add Movie
      </button>
    </form>
  );
}

function EpisodeList({ episodes, animeId }) {
  if (episodes.length === 0) return <p className={styles.empty}>None yet.</p>;
  return (
    <div className={styles.themeList}>
      {episodes.map((e) => (
        <form key={e.id} action={updateEpisode} className={styles.themeForm}>
          <input type="hidden" name="episode_id" value={e.id} />
          <input type="hidden" name="anime_id" value={animeId} />
          <input
            type="number"
            name="episode_number"
            defaultValue={e.episode_number}
            className={styles.themeInputSmall}
            placeholder="#"
          />
          <input
            type="text"
            name="title"
            defaultValue={e.title || ''}
            className={styles.themeInput}
            placeholder="Title"
          />
          <input
            type="date"
            name="air_date"
            defaultValue={e.air_date || ''}
            className={styles.themeInputSmall}
          />
          <button type="submit" className={styles.themeSave}>
            Save
          </button>
          <button
            type="submit"
            formAction={deleteEpisode}
            className={styles.removeVariantButton}
            aria-label="Remove episode"
          >
            ✕
          </button>
        </form>
      ))}
    </div>
  );
}

function BulkAddEpisodesForm({ animeId, seasonId }) {
  return (
    <form action={bulkAddEpisodes} className={styles.bulkForm}>
      <input type="hidden" name="anime_id" value={animeId} />
      {seasonId && <input type="hidden" name="season_id" value={seasonId} />}
      <textarea
        name="episode_list"
        className={styles.bulkTextarea}
        placeholder={'Paste one episode per line, e.g.:\n1. Episode Title\n2. Another Episode Title'}
      />
      <div className={styles.bulkRow}>
        <span className={styles.empty}>Starting at #</span>
        <input
          type="number"
          name="start_at"
          defaultValue={1}
          className={styles.themeInputSmall}
        />
        <button type="submit" className={styles.themeSave}>
          Add Episodes
        </button>
      </div>
    </form>
  );
}
