-- Ranking storage for the three new rankable categories. season_rankings
-- and movie_rankings are exact clones of anime_rankings. episode_rankings
-- is the same shape again but pooled across every show ("global").
-- episode_rankings_solo is a second, independent list: one per (user,
-- anime) pair, letting a user rank a single show's episodes without
-- touching (or being touched by) their global list - see
-- replace_solo_episode_ranking (next migration) for how the two stay
-- independent yet both feed the same anime detail page display.

create table season_rankings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  season_id uuid not null references seasons (id) on delete cascade,
  placement int not null check (placement > 0),
  created_at timestamptz not null default now(),
  unique (user_id, season_id)
);
create index season_rankings_user_id_idx on season_rankings (user_id);
create index season_rankings_season_id_idx on season_rankings (season_id);

create table movie_rankings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  movie_id uuid not null references movies (id) on delete cascade,
  placement int not null check (placement > 0),
  created_at timestamptz not null default now(),
  unique (user_id, movie_id)
);
create index movie_rankings_user_id_idx on movie_rankings (user_id);
create index movie_rankings_movie_id_idx on movie_rankings (movie_id);

create table episode_rankings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  episode_id uuid not null references episodes (id) on delete cascade,
  placement int not null check (placement > 0),
  created_at timestamptz not null default now(),
  unique (user_id, episode_id)
);
create index episode_rankings_user_id_idx on episode_rankings (user_id);
create index episode_rankings_episode_id_idx on episode_rankings (episode_id);

-- anime_id is denormalized from episodes.anime_id (kept consistent by
-- replace_solo_episode_ranking, the only writer) purely so a solo ranking
-- for one show can be read/deleted with a single-table filter
-- (user_id, anime_id) instead of a join through episodes on every access.
create table episode_rankings_solo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  anime_id uuid not null references anime (id) on delete cascade,
  episode_id uuid not null references episodes (id) on delete cascade,
  placement int not null check (placement > 0),
  created_at timestamptz not null default now(),
  unique (user_id, anime_id, episode_id)
);
create index episode_rankings_solo_user_anime_idx on episode_rankings_solo (user_id, anime_id);
create index episode_rankings_solo_episode_id_idx on episode_rankings_solo (episode_id);

alter table season_rankings enable row level security;
alter table movie_rankings enable row level security;
alter table episode_rankings enable row level security;
alter table episode_rankings_solo enable row level security;

create policy "season_rankings readable by owner" on season_rankings for select using (auth.uid() = user_id);
create policy "season_rankings owner insert" on season_rankings for insert with check (auth.uid() = user_id);
create policy "season_rankings owner delete" on season_rankings for delete using (auth.uid() = user_id);

create policy "movie_rankings readable by owner" on movie_rankings for select using (auth.uid() = user_id);
create policy "movie_rankings owner insert" on movie_rankings for insert with check (auth.uid() = user_id);
create policy "movie_rankings owner delete" on movie_rankings for delete using (auth.uid() = user_id);

create policy "episode_rankings readable by owner" on episode_rankings for select using (auth.uid() = user_id);
create policy "episode_rankings owner insert" on episode_rankings for insert with check (auth.uid() = user_id);
create policy "episode_rankings owner delete" on episode_rankings for delete using (auth.uid() = user_id);

create policy "episode_rankings_solo readable by owner" on episode_rankings_solo for select using (auth.uid() = user_id);
create policy "episode_rankings_solo owner insert" on episode_rankings_solo for insert with check (auth.uid() = user_id);
create policy "episode_rankings_solo owner delete" on episode_rankings_solo for delete using (auth.uid() = user_id);
