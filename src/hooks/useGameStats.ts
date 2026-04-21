import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { PlayerStats } from '../lib/gameConfig';

interface LeaderboardEntry {
  player_name: string;
  wins: number;
  games: number;
  avg_turns: number;
}

export function useGameStats() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchLeaderboard() {
    setLoading(true);
    const { data } = await supabase
      .from('game_stats')
      .select('player_name, won, turns_taken');

    if (data && data.length > 0) {
      const map = new Map<string, { wins: number; games: number; totalTurns: number }>();
      for (const row of data) {
        const key = row.player_name.toLowerCase();
        const entry = map.get(key) || { wins: 0, games: 0, totalTurns: 0 };
        entry.games++;
        if (row.won) entry.wins++;
        entry.totalTurns += row.turns_taken;
        map.set(key, entry);
      }
      const entries: LeaderboardEntry[] = [];
      map.forEach((val, key) => {
        entries.push({
          player_name: key.charAt(0).toUpperCase() + key.slice(1),
          wins: val.wins,
          games: val.games,
          avg_turns: val.games > 0 ? Math.round(val.totalTurns / val.games) : 0,
        });
      });
      entries.sort((a, b) => b.wins - a.wins || a.avg_turns - b.avg_turns);
      setLeaderboard(entries.slice(0, 10));
    } else {
      setLeaderboard([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function saveGameResult(
    player1Name: string,
    player2Name: string,
    winnerName: string,
    player1Stats: PlayerStats,
    player2Stats: PlayerStats
  ) {
    const sessionId = crypto.randomUUID();
    await supabase.from('game_stats').insert([
      {
        player_name: player1Name,
        won: winnerName === player1Name,
        turns_taken: player1Stats.turns,
        chutes_hit: player1Stats.chutesHit,
        ladders_climbed: player1Stats.laddersClimbed,
        biggest_chute: player1Stats.biggestChute,
        biggest_ladder: player1Stats.biggestLadder,
        game_session_id: sessionId,
      },
      {
        player_name: player2Name,
        won: winnerName === player2Name,
        turns_taken: player2Stats.turns,
        chutes_hit: player2Stats.chutesHit,
        ladders_climbed: player2Stats.laddersClimbed,
        biggest_chute: player2Stats.biggestChute,
        biggest_ladder: player2Stats.biggestLadder,
        game_session_id: sessionId,
      },
    ]);
    fetchLeaderboard();
  }

  return { leaderboard, loading, saveGameResult, fetchLeaderboard };
}
