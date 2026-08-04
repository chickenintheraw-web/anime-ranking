-- Accounts (profiles synced from auth.users) and ranked-list storage.
-- Each row is one entity's placement within one user's current ranking;
-- a user has at most one ranking per entity type, replaced wholesale on
-- edit (see replace_anime_ranking / replace_theme_ranking).
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "profiles readable by everyone" on profiles for select using (true);
create policy "profiles editable by owner" on profiles for update using (auth.uid() = id);

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.profiles (id, username)
    values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  exception when unique_violation then
    insert into public.profiles (id, username) values (new.id, new.id::text);
  end;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create table anime_rankings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  anime_id uuid not null references anime (id) on delete cascade,
  placement int not null check (placement > 0),
  created_at timestamptz not null default now(),
  unique (user_id, anime_id)
);
create index anime_rankings_user_id_idx on anime_rankings (user_id);
create index anime_rankings_anime_id_idx on anime_rankings (anime_id);

create table theme_rankings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  theme_id uuid not null references themes (id) on delete cascade,
  placement int not null check (placement > 0),
  created_at timestamptz not null default now(),
  unique (user_id, theme_id)
);
create index theme_rankings_user_id_idx on theme_rankings (user_id);
create index theme_rankings_theme_id_idx on theme_rankings (theme_id);

alter table anime_rankings enable row level security;
alter table theme_rankings enable row level security;

-- Raw per-user placement rows are owner-only: cross-user aggregation is
-- exposed exclusively through the security-definer leaderboard functions
-- (see ranking_functions.sql), never through direct table access.
create policy "anime_rankings readable by owner" on anime_rankings for select using (auth.uid() = user_id);
create policy "anime_rankings owner insert" on anime_rankings for insert with check (auth.uid() = user_id);
create policy "anime_rankings owner delete" on anime_rankings for delete using (auth.uid() = user_id);

create policy "theme_rankings readable by owner" on theme_rankings for select using (auth.uid() = user_id);
create policy "theme_rankings owner insert" on theme_rankings for insert with check (auth.uid() = user_id);
create policy "theme_rankings owner delete" on theme_rankings for delete using (auth.uid() = user_id);
