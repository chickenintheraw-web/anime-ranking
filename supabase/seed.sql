-- Sample data for local development. Real cover_image_url / video_url values
-- should be added later; left null here rather than guessed.
with inserted_anime as (
  insert into anime (title, title_romaji, season, year) values
    ('Attack on Titan', 'Shingeki no Kyojin', 'spring', 2013),
    ('Cowboy Bebop', 'Cowboy Bebop', 'spring', 1998),
    ('Fullmetal Alchemist: Brotherhood', 'Hagane no Renkinjutsushi', 'spring', 2009),
    ('Death Note', 'Death Note', 'fall', 2006),
    ('Demon Slayer', 'Kimetsu no Yaiba', 'spring', 2019),
    ('Naruto', 'Naruto', 'fall', 2002),
    ('Neon Genesis Evangelion', 'Shinseiki Evangelion', 'fall', 1995),
    ('My Hero Academia', 'Boku no Hero Academia', 'spring', 2016)
  returning id, title
)
insert into openings (anime_id, sequence_number, title, artist)
select inserted_anime.id, 1, op.op_title, op.artist
from inserted_anime
join (values
  ('Attack on Titan', 'Guren no Yumiya', 'Linked Horizon'),
  ('Cowboy Bebop', 'Tank!', 'The Seatbelts'),
  ('Fullmetal Alchemist: Brotherhood', 'Again', 'Yui'),
  ('Death Note', 'The World', 'Nightmare'),
  ('Demon Slayer', 'Gurenge', 'LiSA'),
  ('Naruto', 'Rocket', 'Chise'),
  ('Neon Genesis Evangelion', 'A Cruel Angel''s Thesis', 'Yoko Takahashi'),
  ('My Hero Academia', 'The Day', 'Porno Graffitti')
) as op(anime_title, op_title, artist) on op.anime_title = inserted_anime.title;
