-- Anime and their opening themes
create table anime (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_romaji text,
  season text,
  year int,
  cover_image_url text,
  created_at timestamptz not null default now()
);

create table openings (
  id uuid primary key default gen_random_uuid(),
  anime_id uuid not null references anime (id) on delete cascade,
  sequence_number int not null default 1, -- OP1, OP2, ...
  title text not null,
  artist text,
  video_url text,
  elo_rating int not null default 1500,
  created_at timestamptz not null default now()
);
create index openings_anime_id_idx on openings (anime_id);
create index openings_elo_rating_idx on openings (elo_rating desc);

-- One row per head-to-head vote (winner vs. loser), used to drive the elo_rating above
create table votes (
  id uuid primary key default gen_random_uuid(),
  winner_id uuid not null references openings (id) on delete cascade,
  loser_id uuid not null references openings (id) on delete cascade,
  voter_ip_hash text,
  created_at timestamptz not null default now()
);
create index votes_winner_id_idx on votes (winner_id);
create index votes_loser_id_idx on votes (loser_id);

alter table anime enable row level security;
alter table openings enable row level security;
alter table votes enable row level security;

create policy "anime readable by everyone" on anime for select using (true);
create policy "openings readable by everyone" on openings for select using (true);
create policy "votes insertable by everyone" on votes for insert with check (true);
