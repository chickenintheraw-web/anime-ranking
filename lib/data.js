import { sb } from '@/lib/supabase';

export async function getAnimeList() {
  const { data, error } = await sb
    .from('anime')
    .select('id, title, title_romaji, season, year, cover_image_url, openings(id)')
    .order('year', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getAnimeWithOpenings(id) {
  const { data, error } = await sb
    .from('anime')
    .select('id, title, title_romaji, season, year, cover_image_url, openings(id, sequence_number, title, artist, video_url, elo_rating)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getRandomPair() {
  // Fetches all openings and shuffles in-memory since supabase-js has no
  // built-in random ordering; fine at this catalog size, revisit if it grows.
  const { data, error } = await sb
    .from('openings')
    .select('id, title, artist, video_url, elo_rating, anime:anime_id(id, title, cover_image_url)');

  if (error) throw new Error(error.message);
  if (!data || data.length < 2) return null;

  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

export async function getLeaderboard(limit = 50) {
  const { data, error } = await sb
    .from('openings')
    .select('id, title, artist, elo_rating, anime:anime_id(id, title)')
    .order('elo_rating', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}
