-- Generalize "openings" into "themes" so endings (ED) exist alongside
-- openings (OP), and add a format tag to anime for search/filtering.
alter table openings rename to themes;
alter index openings_anime_id_idx rename to themes_anime_id_idx;
alter policy "openings readable by everyone" on themes rename to "themes readable by everyone";

alter table themes add column theme_type text not null default 'OP'
  check (theme_type in ('OP', 'ED'));
create index themes_theme_type_idx on themes (theme_type);

alter table anime add column format text
  check (format in ('TV', 'OVA', 'ONA', 'Movie', 'Special'));
