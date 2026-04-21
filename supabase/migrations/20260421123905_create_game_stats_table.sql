/*
  # Create game statistics table

  1. New Tables
    - `game_stats`
      - `id` (uuid, primary key)
      - `player_name` (text, not null) - the player's chosen name
      - `won` (boolean, default false) - whether this player won the game
      - `turns_taken` (integer, default 0) - number of turns this player took
      - `chutes_hit` (integer, default 0) - number of chutes landed on
      - `ladders_climbed` (integer, default 0) - number of ladders climbed
      - `biggest_chute` (integer, default 0) - biggest chute fall (squares dropped)
      - `biggest_ladder` (integer, default 0) - biggest ladder climb (squares gained)
      - `game_session_id` (text, not null) - groups two players from the same game
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `game_stats` table
    - Add policy for anonymous inserts (game doesn't require auth)
    - Add policy for anonymous reads (for leaderboard)
*/

CREATE TABLE IF NOT EXISTS game_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  won boolean DEFAULT false,
  turns_taken integer DEFAULT 0,
  chutes_hit integer DEFAULT 0,
  ladders_climbed integer DEFAULT 0,
  biggest_chute integer DEFAULT 0,
  biggest_ladder integer DEFAULT 0,
  game_session_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert game stats"
  ON game_stats
  FOR INSERT
  TO anon
  WITH CHECK (
    player_name <> '' AND
    game_session_id <> ''
  );

CREATE POLICY "Anyone can read game stats"
  ON game_stats
  FOR SELECT
  TO anon
  USING (
    created_at > now() - interval '90 days'
  );
