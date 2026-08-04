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

export async function getAnimeWithThemes(id) {
  const { data, error } = await sb
    .from('anime')
    .select(
      'id, title, title_romaji, season, year, cover_image_url, format, themes(id, theme_type, sequence_number, title, artist, video_url)'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
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

export async function getThemeLeaderboard(themeType = null, limit = 100) {
  const { data, error } = await sb.rpc('get_theme_leaderboard', {
    p_theme_type: themeType,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return data;
}
