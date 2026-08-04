-- Metadata needed for the redesigned anime detail page and the "This
-- Season" rank tab, plus making profiles.is_admin actually enforce
-- something (it existed but nothing read it until now).
alter table anime add column synopsis text;
alter table anime add column studio text;

alter table themes add column release_season text
  check (release_season in ('winter', 'spring', 'summer', 'fall'));
alter table themes add column release_year int;

create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- profiles is select-by-everyone already, so is_admin() needs no elevated
-- privileges to read it; these policies are the actual enforcement layer
-- for admin writes, not just UI-level hiding of an Edit button.
create policy "anime insertable by admins" on anime for insert with check (is_admin());
create policy "anime updatable by admins" on anime for update using (is_admin());

create policy "themes insertable by admins" on themes for insert with check (is_admin());
create policy "themes updatable by admins" on themes for update using (is_admin());
