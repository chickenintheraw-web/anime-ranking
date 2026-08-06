import { sb } from '@/lib/supabase/anon';

export const FORMATS = ['TV', 'OVA', 'ONA', 'Movie', 'Special'];
export const SEASONS = ['winter', 'spring', 'summer', 'fall'];

export async function getAnimeList() {
  const { data, error } = await sb
    .from('anime')
    .select('id, title, title_romaji, season, year, cover_image_url, themes(id)')
    .order('year', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// Higher-quality, non-credit-less first — matches how AnimeThemes.moe
// orders variant buttons within a theme.
const SOURCE_RANK = { BD: 0, NCBD: 1, WEB: 2, NCWEB: 3, DVD: 4, NCDVD: 5 };
const QUALITY_RANK = { '1080p': 0, '720p': 1, '480p': 2, '576p': 3 };

function sortVariants(variants) {
  return [...(variants ?? [])].sort((a, b) => {
    const q = (QUALITY_RANK[a.quality] ?? 9) - (QUALITY_RANK[b.quality] ?? 9);
    if (q !== 0) return q;
    return (SOURCE_RANK[a.source] ?? 9) - (SOURCE_RANK[b.source] ?? 9);
  });
}

export async function getAnimeWithThemes(id) {
  const { data, error } = await sb
    .from('anime')
    .select(
      'id, title, title_romaji, season, year, cover_image_url, format, synopsis, studio, themes(id, theme_type, sequence_number, title, artist, release_season, release_year, season_id, movie_id, theme_variants(id, provider, quality, source, url, youtube_id))'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return data;

  return {
    ...data,
    themes: (data.themes ?? []).map((t) => ({
      ...t,
      theme_variants: sortVariants(t.theme_variants),
    })),
  };
}

// Flat shape ready for the ranking-builder UI: one representative preview
// video (best available variant) per theme, rather than the full nested
// variants list callers of getAnimeWithThemes/getThemeWithAnime need.
export async function getRankableThemes(themeType) {
  const { data, error } = await sb
    .from('themes')
    .select(
      'id, title, artist, sequence_number, release_season, release_year, season_id, movie_id, anime:anime_id(id, title), theme_variants(id, provider, quality, source, url, youtube_id)'
    )
    .eq('theme_type', themeType);

  if (error) throw new Error(error.message);

  return (data ?? []).map((t) => {
    const [best] = sortVariants(t.theme_variants);
    return {
      id: t.id,
      title: t.title,
      artist: t.artist,
      sequenceNumber: t.sequence_number,
      releaseSeason: t.release_season,
      releaseYear: t.release_year,
      animeId: t.anime?.id ?? null,
      animeTitle: t.anime?.title ?? 'Unknown',
      previewUrl: best?.url ?? null,
      provider: best?.provider ?? null,
      youtubeId: best?.youtube_id ?? null,
    };
  });
}

export async function getThemeWithAnime(id) {
  const { data, error } = await sb
    .from('themes')
    .select(
      'id, theme_type, sequence_number, title, artist, season_id, movie_id, anime:anime_id(id, title), theme_variants(id, provider, quality, source, url, youtube_id)'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return data;

  return { ...data, theme_variants: sortVariants(data.theme_variants) };
}

function applySort(query, sort) {
  switch (sort) {
    case 'year_asc':
      return query.order('year', { ascending: true, nullsFirst: false });
    case 'year_desc':
      return query.order('year', { ascending: false, nullsFirst: false });
    case 'title_asc':
    default:
      return query.order('title', { ascending: true });
  }
}

export async function searchAnime({ q, letter, season, year, format, sort } = {}) {
  let query = sb
    .from('anime')
    .select('id, title, title_romaji, season, year, format, cover_image_url, themes(id)');

  if (q) query = query.or(`title.ilike.%${q}%,title_romaji.ilike.%${q}%`);
  if (letter) query = query.ilike('title', `${letter}%`);
  if (season) query = query.eq('season', season);
  if (year) query = query.eq('year', Number(year));
  if (format) query = query.eq('format', format);

  query = applySort(query, sort);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function searchThemes({ q, themeType, letter, season, year, format, sort } = {}) {
  let query = sb
    .from('themes')
    .select(
      'id, theme_type, sequence_number, title, artist, anime:anime_id!inner(id, title, season, year, format, cover_image_url)'
    );

  if (q) query = query.or(`title.ilike.%${q}%,artist.ilike.%${q}%`);
  if (themeType) query = query.eq('theme_type', themeType);
  if (letter) query = query.ilike('anime.title', `${letter}%`);
  if (season) query = query.eq('anime.season', season);
  if (year) query = query.eq('anime.year', Number(year));
  if (format) query = query.eq('anime.format', format);

  if (sort === 'year_asc') query = query.order('year', { referencedTable: 'anime', ascending: true, nullsFirst: false });
  else if (sort === 'year_desc') query = query.order('year', { referencedTable: 'anime', ascending: false, nullsFirst: false });
  else query = query.order('title', { ascending: true });

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getAnimeLeaderboard(limit = 100) {
  const { data, error } = await sb.rpc('get_anime_leaderboard', { p_limit: limit });
  if (error) throw new Error(error.message);
  return data;
}

// The RPC only returns ranking stats, not playable video info (it groups
// by theme, but a theme's variants live in a separate table) - fetch each
// ranked theme's best variant in a second query and merge it in, rather
// than reshaping the SQL function's return type for this one caller.
export async function getThemeLeaderboard(themeType, limit = 100) {
  const { data, error } = await sb.rpc('get_theme_leaderboard', {
    p_theme_type: themeType,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  if (!data?.length) return [];

  const { data: themes, error: themesError } = await sb
    .from('themes')
    .select('id, sequence_number, theme_variants(id, provider, quality, source, url, youtube_id)')
    .in('id', data.map((r) => r.theme_id));
  if (themesError) throw new Error(themesError.message);

  const themeById = new Map((themes ?? []).map((t) => [t.id, t]));

  return data.map((row) => {
    const theme = themeById.get(row.theme_id);
    const [best] = sortVariants(theme?.theme_variants);
    return {
      ...row,
      sequence_number: theme?.sequence_number ?? null,
      preview_provider: best?.provider ?? null,
      preview_url: best?.url ?? null,
      preview_youtube_id: best?.youtube_id ?? null,
      preview_quality: best?.quality ?? null,
      preview_source: best?.source ?? null,
    };
  });
}

// --- Seasons ---------------------------------------------------------

export async function getSeasonList() {
  const { data, error } = await sb
    .from('seasons')
    .select('id, season_number, title, anime:anime_id(id, title)')
    .order('season_number', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function getAnimeSeasons(animeId) {
  const { data, error } = await sb
    .from('seasons')
    .select('id, season_number, title, year, cover_image_url')
    .eq('anime_id', animeId)
    .order('season_number', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSeasonLeaderboard(limit = 100) {
  const { data, error } = await sb.rpc('get_season_leaderboard', { p_limit: limit });
  if (error) throw new Error(error.message);
  return data;
}

// --- Movies ------------------------------------------------------------

export async function getMovieList() {
  const { data, error } = await sb
    .from('movies')
    .select('id, title, year, anime:anime_id(id, title)')
    .order('year', { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getAnimeMovies(animeId) {
  const { data, error } = await sb
    .from('movies')
    .select('id, title, year, cover_image_url, synopsis')
    .eq('anime_id', animeId)
    .order('year', { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMovieLeaderboard(limit = 100) {
  const { data, error } = await sb.rpc('get_movie_leaderboard', { p_limit: limit });
  if (error) throw new Error(error.message);
  return data;
}

// --- Episodes ------------------------------------------------------------

export async function getAnimeEpisodes(animeId) {
  const { data, error } = await sb
    .from('episodes')
    .select('id, season_id, episode_number, title, air_date, thumbnail_url')
    .eq('anime_id', animeId)
    .order('episode_number', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Flat candidate shape for /rank/episode, mirroring getRankableThemes.
export async function getRankableEpisodes() {
  const { data, error } = await sb
    .from('episodes')
    .select(
      'id, episode_number, title, air_date, thumbnail_url, anime:anime_id(id, title), season:season_id(id, season_number, title)'
    );
  if (error) throw new Error(error.message);

  return (data ?? []).map((e) => ({
    id: e.id,
    title: e.title || `Episode ${e.episode_number}`,
    episodeNumber: e.episode_number,
    airDate: e.air_date,
    thumbnailUrl: e.thumbnail_url,
    animeId: e.anime?.id ?? null,
    animeTitle: e.anime?.title ?? 'Unknown',
    seasonId: e.season?.id ?? null,
    seasonLabel: e.season ? e.season.title || `Season ${e.season.season_number}` : null,
  }));
}

export async function getEpisodeLeaderboard(limit = 100) {
  const { data, error } = await sb.rpc('get_episode_leaderboard', { p_limit: limit });
  if (error) throw new Error(error.message);
  return data;
}
