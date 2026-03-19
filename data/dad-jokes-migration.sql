-- =============================================
-- Dad Jokes of the Day — Phase 4
-- Run this in Supabase SQL Editor
-- =============================================

-- Create table
CREATE TABLE IF NOT EXISTS dad_jokes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  setup text NOT NULL,
  punchline text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE dad_jokes ENABLE ROW LEVEL SECURITY;

-- Public read-only
CREATE POLICY "Dad jokes are publicly readable"
  ON dad_jokes FOR SELECT
  USING (true);

-- Seed 30 family-friendly dad jokes
INSERT INTO dad_jokes (setup, punchline) VALUES
  ('Why did the scarecrow win an award?', 'Because he was outstanding in his field!'),
  ('What do you call a fake noodle?', 'An impasta!'),
  ('Why don''t eggs tell jokes?', 'They''d crack each other up!'),
  ('What did the ocean say to the beach?', 'Nothing, it just waved.'),
  ('Why did the bicycle fall over?', 'Because it was two-tired!'),
  ('What do you call a bear with no teeth?', 'A gummy bear!'),
  ('Why can''t a nose be 12 inches long?', 'Because then it would be a foot!'),
  ('What do you call cheese that isn''t yours?', 'Nacho cheese!'),
  ('Why did the math book look so sad?', 'Because it had too many problems.'),
  ('What do you call a sleeping dinosaur?', 'A dino-snore!'),
  ('Why don''t skeletons fight each other?', 'They don''t have the guts.'),
  ('What did one wall say to the other wall?', 'I''ll meet you at the corner!'),
  ('Why did the golfer bring two pairs of pants?', 'In case he got a hole in one!'),
  ('What do you call a dog that does magic tricks?', 'A Labracadabrador!'),
  ('Why did the stadium get hot after the game?', 'All the fans left!'),
  ('What do you call a fish without eyes?', 'A fsh!'),
  ('Why do cows wear bells?', 'Because their horns don''t work!'),
  ('What did the grape do when it got stepped on?', 'Nothing, it just let out a little wine.'),
  ('Why don''t scientists trust atoms?', 'Because they make up everything!'),
  ('What do you call a snowman with a six-pack?', 'An abdominal snowman!'),
  ('Why did the cookie go to the hospital?', 'Because it felt crummy!'),
  ('What do you call a pig that does karate?', 'A pork chop!'),
  ('Why couldn''t the leopard play hide and seek?', 'Because he was always spotted!'),
  ('What did the janitor say when he jumped out of the closet?', 'Supplies!'),
  ('Why do bananas have to put on sunscreen before they go to the beach?', 'Because they might peel!'),
  ('What do you call a boomerang that won''t come back?', 'A stick.'),
  ('Why did the tomato turn red?', 'Because it saw the salad dressing!'),
  ('What do dentists call their X-rays?', 'Tooth pics!'),
  ('Why did the computer go to the doctor?', 'Because it had a virus!'),
  ('What do you call a lazy kangaroo?', 'A pouch potato!');
