-- replace_season_ranking / replace_movie_ranking: exact clones of
-- replace_anime_ranking.
create or replace function replace_season_ranking(p_season_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'must be signed in to rank';
  end if;

  if p_season_ids is not null and array_length(p_season_ids, 1) > 0 then
    if (select count(*) from unnest(p_season_ids) x) <> (select count(distinct x) from unnest(p_season_ids) x) then
      raise exception 'duplicate season_id in ranking';
    end if;
  end if;

  delete from season_rankings where user_id = auth.uid();

  insert into season_rankings (user_id, season_id, placement)
  select auth.uid(), sid, ord
  from unnest(p_season_ids) with ordinality as t(sid, ord);
end;
$$;
grant execute on function replace_season_ranking(uuid[]) to authenticated;

create or replace function replace_movie_ranking(p_movie_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'must be signed in to rank';
  end if;

  if p_movie_ids is not null and array_length(p_movie_ids, 1) > 0 then
    if (select count(*) from unnest(p_movie_ids) x) <> (select count(distinct x) from unnest(p_movie_ids) x) then
      raise exception 'duplicate movie_id in ranking';
    end if;
  end if;

  delete from movie_rankings where user_id = auth.uid();

  insert into movie_rankings (user_id, movie_id, placement)
  select auth.uid(), mid, ord
  from unnest(p_movie_ids) with ordinality as t(mid, ord);
end;
$$;
grant execute on function replace_movie_ranking(uuid[]) to authenticated;

-- Global, cross-show episode ranking - exact clone of replace_anime_ranking.
create or replace function replace_episode_ranking(p_episode_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'must be signed in to rank';
  end if;

  if p_episode_ids is not null and array_length(p_episode_ids, 1) > 0 then
    if (select count(*) from unnest(p_episode_ids) x) <> (select count(distinct x) from unnest(p_episode_ids) x) then
      raise exception 'duplicate episode_id in ranking';
    end if;
  end if;

  delete from episode_rankings where user_id = auth.uid();

  insert into episode_rankings (user_id, episode_id, placement)
  select auth.uid(), eid, ord
  from unnest(p_episode_ids) with ordinality as t(eid, ord);
end;
$$;
grant execute on function replace_episode_ranking(uuid[]) to authenticated;

-- Solo, single-show episode ranking - scoped by anime_id the same way
-- replace_theme_ranking is scoped by theme_type: only that anime's rows
-- are ever deleted, so ranking one show's episodes never touches another
-- show's solo ranking (or the global list above, a fully separate table).
create or replace function replace_solo_episode_ranking(p_anime_id uuid, p_episode_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'must be signed in to rank';
  end if;

  if p_episode_ids is not null and array_length(p_episode_ids, 1) > 0 then
    if (select count(*) from unnest(p_episode_ids) x) <> (select count(distinct x) from unnest(p_episode_ids) x) then
      raise exception 'duplicate episode_id in ranking';
    end if;

    if exists (
      select 1 from unnest(p_episode_ids) x
      join episodes e on e.id = x
      where e.anime_id <> p_anime_id
    ) then
      raise exception 'all episode_ids must belong to p_anime_id';
    end if;
  end if;

  delete from episode_rankings_solo
  where user_id = auth.uid() and anime_id = p_anime_id;

  insert into episode_rankings_solo (user_id, anime_id, episode_id, placement)
  select auth.uid(), p_anime_id, eid, ord
  from unnest(p_episode_ids) with ordinality as t(eid, ord);
end;
$$;
grant execute on function replace_solo_episode_ranking(uuid, uuid[]) to authenticated;

-- Leaderboards: security definer + stable, same reasoning as
-- get_anime_leaderboard/get_theme_leaderboard.
create or replace function get_season_leaderboard(p_limit int default 100)
returns table (
  season_id uuid,
  season_number int,
  season_title text,
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
  select s.id, s.season_number, s.title, a.id, a.title,
         coalesce(s.cover_image_url, a.cover_image_url),
         round(avg(r.placement)::numeric, 2), count(*)
  from season_rankings r
  join seasons s on s.id = r.season_id
  join anime a on a.id = s.anime_id
  group by s.id, s.season_number, s.title, a.id, a.title, s.cover_image_url, a.cover_image_url
  order by 7 asc, 8 desc
  limit p_limit;
$$;
grant execute on function get_season_leaderboard(int) to anon, authenticated;

create or replace function get_movie_leaderboard(p_limit int default 100)
returns table (
  movie_id uuid,
  title text,
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
  select m.id, m.title, a.id, a.title,
         coalesce(m.cover_image_url, a.cover_image_url),
         round(avg(r.placement)::numeric, 2), count(*)
  from movie_rankings r
  join movies m on m.id = r.movie_id
  join anime a on a.id = m.anime_id
  group by m.id, m.title, a.id, a.title, m.cover_image_url, a.cover_image_url
  order by 6 asc, 7 desc
  limit p_limit;
$$;
grant execute on function get_movie_leaderboard(int) to anon, authenticated;

-- Pools the GLOBAL episode_rankings table only - episode_rankings_solo is
-- a personal per-anime organizing tool, not a pooled leaderboard input,
-- same "no cross-type merging" philosophy the OP/ED split established.
create or replace function get_episode_leaderboard(p_limit int default 100)
returns table (
  episode_id uuid,
  episode_number int,
  episode_title text,
  season_id uuid,
  season_number int,
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
  select e.id, e.episode_number, e.title, s.id, s.season_number, a.id, a.title,
         a.cover_image_url,
         round(avg(r.placement)::numeric, 2), count(*)
  from episode_rankings r
  join episodes e on e.id = r.episode_id
  left join seasons s on s.id = e.season_id
  join anime a on a.id = e.anime_id
  group by e.id, e.episode_number, e.title, s.id, s.season_number, a.id, a.title, a.cover_image_url
  order by 9 asc, 10 desc
  limit p_limit;
$$;
grant execute on function get_episode_leaderboard(int) to anon, authenticated;
