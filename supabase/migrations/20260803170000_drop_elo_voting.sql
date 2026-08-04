-- Retiring head-to-head Elo voting in favor of ranked-list placement voting
-- (see the profiles_and_rankings / ranking_functions migrations).
drop function if exists cast_vote(uuid, uuid, text);
drop table if exists votes;
drop index if exists openings_elo_rating_idx;
alter table openings drop column elo_rating;
