-- Pre-Blu-ray-era anime (e.g. Naruto, 2002) were only ever released on DVD,
-- so DVD is a legitimate source tier alongside WEB/BD, not an exception.
alter table theme_variants drop constraint theme_variants_source_check;
alter table theme_variants add constraint theme_variants_source_check
  check (source in ('DVD', 'NCDVD', 'WEB', 'NCWEB', 'BD', 'NCBD'));
