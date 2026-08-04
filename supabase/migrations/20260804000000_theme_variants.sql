-- Replaces the single unused themes.video_url column with a proper
-- multi-variant model: one theme can have several playable files (e.g.
-- 720p WEB, 1080p NCBD), matching how AnimeThemes.moe tags multiple
-- quality/source versions per opening/ending. Files themselves live in
-- object storage (R2); this table only ever stores the resulting URLs.
alter table themes drop column if exists video_url;

create table theme_variants (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references themes (id) on delete cascade,
  quality text not null check (quality in ('480p', '720p', '1080p')),
  source text not null check (source in ('WEB', 'BD', 'NCWEB', 'NCBD')),
  url text not null,
  created_at timestamptz not null default now(),
  unique (theme_id, quality, source)
);
create index theme_variants_theme_id_idx on theme_variants (theme_id);

alter table theme_variants enable row level security;
create policy "theme_variants readable by everyone" on theme_variants for select using (true);
-- No public insert/update/delete policy: variants are populated out-of-band
-- (direct SQL/CLI for now) until an admin-gated upload flow exists.
