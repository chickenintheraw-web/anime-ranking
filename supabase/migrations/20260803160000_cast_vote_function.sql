-- Atomically records a head-to-head vote and updates both openings' elo ratings.
-- Runs as security definer so anon clients can update elo_rating without a
-- public UPDATE policy on openings (which would allow arbitrary rating edits).
create or replace function cast_vote(
  p_winner_id uuid,
  p_loser_id uuid,
  p_voter_ip_hash text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  winner_rating int;
  loser_rating int;
  expected_winner numeric;
  expected_loser numeric;
  k constant int := 32;
begin
  if p_winner_id = p_loser_id then
    raise exception 'winner_id and loser_id must differ';
  end if;

  select elo_rating into winner_rating from openings where id = p_winner_id for update;
  select elo_rating into loser_rating from openings where id = p_loser_id for update;

  if winner_rating is null or loser_rating is null then
    raise exception 'invalid opening id';
  end if;

  expected_winner := 1.0 / (1 + power(10, (loser_rating - winner_rating) / 400.0));
  expected_loser := 1.0 / (1 + power(10, (winner_rating - loser_rating) / 400.0));

  update openings set elo_rating = winner_rating + round(k * (1 - expected_winner)) where id = p_winner_id;
  update openings set elo_rating = loser_rating + round(k * (0 - expected_loser)) where id = p_loser_id;

  insert into votes (winner_id, loser_id, voter_ip_hash) values (p_winner_id, p_loser_id, p_voter_ip_hash);
end;
$$;

grant execute on function cast_vote(uuid, uuid, text) to anon, authenticated;
