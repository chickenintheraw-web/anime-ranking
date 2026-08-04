-- Sample data for local development. Real cover_image_url / video_url values
-- should be added later; left null here rather than guessed.
with inserted_anime as (
  insert into anime (title, title_romaji, season, year, format) values
    ('Attack on Titan', 'Shingeki no Kyojin', 'spring', 2013, 'TV'),
    ('Cowboy Bebop', 'Cowboy Bebop', 'spring', 1998, 'TV'),
    ('Fullmetal Alchemist: Brotherhood', 'Hagane no Renkinjutsushi', 'spring', 2009, 'TV'),
    ('Death Note', 'Death Note', 'fall', 2006, 'TV'),
    ('Demon Slayer', 'Kimetsu no Yaiba', 'spring', 2019, 'TV'),
    ('Naruto', 'Naruto', 'fall', 2002, 'TV'),
    ('Neon Genesis Evangelion', 'Shinseiki Evangelion', 'fall', 1995, 'TV'),
    ('My Hero Academia', 'Boku no Hero Academia', 'spring', 2016, 'TV')
  returning id, title
),
op_data (anime_title, op_title, artist) as (
  values
    ('Attack on Titan', 'Guren no Yumiya', 'Linked Horizon'),
    ('Cowboy Bebop', 'Tank!', 'The Seatbelts'),
    ('Fullmetal Alchemist: Brotherhood', 'Again', 'Yui'),
    ('Death Note', 'the WORLD', 'Nightmare'),
    ('Demon Slayer', 'Gurenge', 'LiSA'),
    ('Naruto', 'Rocket', 'Chise'),
    ('Neon Genesis Evangelion', 'A Cruel Angel''s Thesis', 'Yoko Takahashi'),
    ('My Hero Academia', 'The Day', 'Porno Graffitti')
),
ed_data (anime_title, ed_title, artist) as (
  values
    ('Cowboy Bebop', 'The Real Folk Blues', 'The Seatbelts'),
    ('Death Note', 'Kesenai Tsumi', 'Nightmare')
)
insert into themes (anime_id, theme_type, sequence_number, title, artist)
select ia.id, 'OP', 1, op.op_title, op.artist
from inserted_anime ia
join op_data op on op.anime_title = ia.title
union all
select ia.id, 'ED', 1, ed.ed_title, ed.artist
from inserted_anime ia
join ed_data ed on ed.anime_title = ia.title;
