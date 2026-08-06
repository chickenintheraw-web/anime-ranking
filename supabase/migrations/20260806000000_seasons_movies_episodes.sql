-- Seasons/movies/episodes nested under an anime franchise row. Every anime
-- row stays a standalone top-level franchise (no self-reference added) -
-- these new tables reference anime_id directly, giving franchise-level
-- nesting without touching the anime table itself.

create table seasons (
  id uuid primary key default gen_random_uuid(),
  anime_id uuid not null references anime (id) on delete cascade,
  season_number int not null,
  title text,
  year int,
  cover_image_url text,
  created_at timestamptz not null default now(),
  unique (anime_id, season_number)
);
create index seasons_anime_id_idx on seasons (anime_id);

create table movies (
  id uuid primary key default gen_random_uuid(),
  anime_id uuid not null references anime (id) on delete cascade,
  title text not null,
  year int,
  cover_image_url text,
  synopsis text,
  created_at timestamptz not null default now()
);
create index movies_anime_id_idx on movies (anime_id);

-- season_id is nullable: some franchises split episodes across seasons
-- (Jujutsu Kaisen S1/S2), others never do (One Piece has one flat list).
-- A plain unique(anime_id, season_id, episode_number) would not enforce
-- uniqueness among unsectioned (season_id is null) rows, since Postgres
-- NULLs never compare equal - two partial unique indexes instead, mirroring
-- theme_variants_one_youtube_per_theme's precedent.
create table episodes (
  id uuid primary key default gen_random_uuid(),
  anime_id uuid not null references anime (id) on delete cascade,
  season_id uuid references seasons (id) on delete cascade,
  episode_number int not null,
  title text,
  air_date date,
  thumbnail_url text,
  created_at timestamptz not null default now()
);
create index episodes_anime_id_idx on episodes (anime_id);
create index episodes_season_id_idx on episodes (season_id);

create unique index episodes_unsectioned_number_idx
  on episodes (anime_id, episode_number)
  where season_id is null;
create unique index episodes_sectioned_number_idx
  on episodes (season_id, episode_number)
  where season_id is not null;

-- Organizational grouping only (e.g. "Season 2 Openings", a movie's own
-- OP/ED) - anime_id stays required and unchanged, so every existing themes
-- row (season_id/movie_id both null = general franchise-level theme) keeps
-- working exactly as before with zero other changes to theme_variants,
-- theme_rankings, replace_theme_ranking, get_theme_leaderboard,
-- VariantButtons.js, PlacementModal.js, VideoTile.js, or /watch/[themeId].
alter table themes add column season_id uuid references seasons (id) on delete set null;
alter table themes add column movie_id uuid references movies (id) on delete set null;
alter table themes add constraint themes_season_or_movie_not_both
  check (season_id is null or movie_id is null);

alter table seasons enable row level security;
alter table movies enable row level security;
alter table episodes enable row level security;

create policy "seasons readable by everyone" on seasons for select using (true);
create policy "movies readable by everyone" on movies for select using (true);
create policy "episodes readable by everyone" on episodes for select using (true);

create policy "seasons insertable by admins" on seasons for insert with check (is_admin());
create policy "seasons updatable by admins" on seasons for update using (is_admin());
create policy "seasons deletable by admins" on seasons for delete using (is_admin());

create policy "movies insertable by admins" on movies for insert with check (is_admin());
create policy "movies updatable by admins" on movies for update using (is_admin());
create policy "movies deletable by admins" on movies for delete using (is_admin());

create policy "episodes insertable by admins" on episodes for insert with check (is_admin());
create policy "episodes updatable by admins" on episodes for update using (is_admin());
create policy "episodes deletable by admins" on episodes for delete using (is_admin());
