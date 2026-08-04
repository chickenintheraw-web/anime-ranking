-- Openings and endings are now ranked (and leaderboarded) fully
-- independently: a user has one ranking for OP and a separate one for ED,
-- and there is no combined "all themes" view anywhere.

-- The old single-arg version let a save of one type's ranking wipe out the
-- other type's rows (it deleted ALL of a user's theme_rankings regardless
-- of type). Drop it and replace with a type-scoped version.
drop function if exists replace_theme_ranking(uuid[]);

create or replace function replace_theme_ranking(p_theme_ids uuid[], p_theme_type text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'must be signed in to rank';
  end if;

  if p_theme_type not in ('OP', 'ED') then
    raise exception 'p_theme_type must be OP or ED';
  end if;

  if p_theme_ids is not null and array_length(p_theme_ids, 1) > 0 then
    if (select count(*) from unnest(p_theme_ids) x) <> (select count(distinct x) from unnest(p_theme_ids) x) then
      raise exception 'duplicate theme_id in ranking';
    end if;

    if exists (
      select 1 from unnest(p_theme_ids) x
      join themes t on t.id = x
      where t.theme_type <> p_theme_type
    ) then
      raise exception 'all theme_ids must match p_theme_type';
    end if;
  end if;

  delete from theme_rankings
  where user_id = auth.uid()
    and theme_id in (select id from themes where theme_type = p_theme_type);

  insert into theme_rankings (user_id, theme_id, placement)
  select auth.uid(), tid, ord
  from unnest(p_theme_ids) with ordinality as t(tid, ord);
end;
$$;
grant execute on function replace_theme_ranking(uuid[], text) to authenticated;

-- p_theme_type is now required (no default), and the combined/"all" query
-- path is removed outright rather than just hidden in the UI: passing an
-- invalid or null type naturally matches zero rows (t.theme_type = null is
-- never true), so there is no way to fetch a merged OP+ED leaderboard.
-- Postgres won't let CREATE OR REPLACE drop an existing parameter default,
-- so the old (text default null, int) overload must be dropped first.
drop function if exists get_theme_leaderboard(text, int);

create or replace function get_theme_leaderboard(p_theme_type text, p_limit int default 100)
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
  where t.theme_type = p_theme_type
  group by t.id, t.title, t.artist, t.theme_type, a.id, a.title, a.cover_image_url
  order by 8 asc, 9 desc
  limit p_limit;
$$;
grant execute on function get_theme_leaderboard(text, int) to anon, authenticated;
