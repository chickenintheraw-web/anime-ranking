-- Atomically replaces a user's ranking (delete-then-insert in one
-- transaction). security invoker is sufficient here since the function
-- only ever touches auth.uid()'s own rows, already permitted by the
-- owner-only RLS policies on anime_rankings/theme_rankings.
create or replace function replace_anime_ranking(p_anime_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'must be signed in to rank';
  end if;

  if p_anime_ids is not null and array_length(p_anime_ids, 1) > 0 then
    if (select count(*) from unnest(p_anime_ids) x) <> (select count(distinct x) from unnest(p_anime_ids) x) then
      raise exception 'duplicate anime_id in ranking';
    end if;
  end if;

  delete from anime_rankings where user_id = auth.uid();

  insert into anime_rankings (user_id, anime_id, placement)
  select auth.uid(), aid, ord
  from unnest(p_anime_ids) with ordinality as t(aid, ord);
end;
$$;
grant execute on function replace_anime_ranking(uuid[]) to authenticated;

create or replace function replace_theme_ranking(p_theme_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'must be signed in to rank';
  end if;

  if p_theme_ids is not null and array_length(p_theme_ids, 1) > 0 then
    if (select count(*) from unnest(p_theme_ids) x) <> (select count(distinct x) from unnest(p_theme_ids) x) then
      raise exception 'duplicate theme_id in ranking';
    end if;
  end if;

  delete from theme_rankings where user_id = auth.uid();

  insert into theme_rankings (user_id, theme_id, placement)
  select auth.uid(), tid, ord
  from unnest(p_theme_ids) with ordinality as t(tid, ord);
end;
$$;
grant execute on function replace_theme_ranking(uuid[]) to authenticated;

-- Aggregate leaderboards: the one place that legitimately reads across all
-- users' ranking rows, so this runs security definer (bypassing the
-- owner-only RLS above) but only ever returns aggregated columns, never
-- raw per-user rows.
create or replace function get_anime_leaderboard(p_limit int default 100)
returns table (
  anime_id uuid,
  title text,
  title_romaji text,
  cover_image_url text,
  avg_placement numeric,
  vote_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select a.id, a.title, a.title_romaji, a.cover_image_url,
         round(avg(r.placement)::numeric, 2), count(*)
  from anime_rankings r
  join anime a on a.id = r.anime_id
  group by a.id, a.title, a.title_romaji, a.cover_image_url
  order by 5 asc, 6 desc
  limit p_limit;
$$;
grant execute on function get_anime_leaderboard(int) to anon, authenticated;

create or replace function get_theme_leaderboard(p_theme_type text default null, p_limit int default 100)
returns table (
  theme_id uuid,
  theme_title text,
  artist text,
  theme_type text,
  anime_id uuid,
  anime_title text,
  cover_image_url text,
  avg_placement numeric,
  vote_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select t.id, t.title, t.artist, t.theme_type, a.id, a.title, a.cover_image_url,
         round(avg(r.placement)::numeric, 2), count(*)
  from theme_rankings r
  join themes t on t.id = r.theme_id
  join anime a on a.id = t.anime_id
  where p_theme_type is null or t.theme_type = p_theme_type
  group by t.id, t.title, t.artist, t.theme_type, a.id, a.title, a.cover_image_url
  order by 8 asc, 9 desc
  limit p_limit;
$$;
grant execute on function get_theme_leaderboard(text, int) to anon, authenticated;
