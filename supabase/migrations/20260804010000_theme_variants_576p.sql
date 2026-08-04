-- Older/SD-era anime (e.g. Naruto, 2002) never had an HD master, so their
-- real encode resolution is 576p (PAL SD), not one of the HD-era buckets.
-- Widening the quality set rather than mislabeling files as 480p/720p.
alter table theme_variants drop constraint theme_variants_quality_check;
alter table theme_variants add constraint theme_variants_quality_check
  check (quality in ('576p', '480p', '720p', '1080p'));
