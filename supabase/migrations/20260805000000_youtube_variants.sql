-- A theme variant can now come from YouTube (embed) instead of R2 (a
-- file we store). YouTube variants store no quality/source tier (YouTube's
-- player picks that adaptively) and no R2 url - just the video's id.
alter table theme_variants add column provider text not null default 'r2'
  check (provider in ('r2', 'youtube'));
alter table theme_variants add column youtube_id text;

alter table theme_variants alter column url drop not null;
alter table theme_variants alter column quality drop not null;
alter table theme_variants alter column source drop not null;

alter table theme_variants add constraint theme_variants_provider_fields_check
  check (
    (provider = 'r2' and url is not null and quality is not null and source is not null and youtube_id is null)
    or
    (provider = 'youtube' and youtube_id is not null and url is null and quality is null and source is null)
  );

-- At most one YouTube link per theme (unlike R2, which can have many
-- quality/source combinations) - the existing (theme_id, quality, source)
-- unique constraint doesn't help here since NULLs don't collide in SQL.
create unique index theme_variants_one_youtube_per_theme
  on theme_variants (theme_id)
  where provider = 'youtube';

-- Unlike anime/themes, admins can also delete variants - a mistyped
-- YouTube link is low-risk and common enough to need a quick fix, not
-- just add/edit.
create policy "theme_variants insertable by admins" on theme_variants for insert with check (is_admin());
create policy "theme_variants updatable by admins" on theme_variants for update using (is_admin());
create policy "theme_variants deletable by admins" on theme_variants for delete using (is_admin());
