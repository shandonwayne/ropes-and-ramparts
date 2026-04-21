import React, { useState } from 'react';
import { Trophy, BookOpen, X } from 'lucide-react';

interface LeaderboardEntry {
  player_name: string;
  wins: number;
  games: number;
  avg_turns: number;
}

interface PreGameScreenProps {
  onStart: (player1Name: string, player2Name: string) => void;
  leaderboard: LeaderboardEntry[];
  leaderboardLoading: boolean;
}

export default function PreGameScreen({ onStart, leaderboard, leaderboardLoading }: PreGameScreenProps) {
  const [player1Name, setPlayer1Name] = useState('Sir Rowan');
  const [player2Name, setPlayer2Name] = useState('Lady Isolde');
  const [showRules, setShowRules] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  function handleStart() {
    const name1 = player1Name.trim() || 'Sir Rowan';
    const name2 = player2Name.trim() || 'Lady Isolde';
    onStart(name1, name2);
  }

  return (
    <div className="pregame-screen">
      <div className="pregame-card">
        <h1 className="pregame-title">Chutes & Ladders</h1>
        <p className="pregame-subtitle">A medieval quest for glory</p>

        <div className="pregame-players">
          <div className="pregame-player-input">
            <img src="/RowanPlayerToken.svg" alt="Rowan token" className="pregame-token" />
            <div className="pregame-input-group">
              <label className="pregame-label">Player 1</label>
              <input
                type="text"
                value={player1Name}
                onChange={(e) => setPlayer1Name(e.target.value)}
                className="pregame-input rowan-input"
                maxLength={20}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />
            </div>
          </div>

          <div className="pregame-vs">VS</div>

          <div className="pregame-player-input">
            <img src="/IsolderPlayerToken.svg" alt="Isolde token" className="pregame-token" />
            <div className="pregame-input-group">
              <label className="pregame-label">Player 2</label>
              <input
                type="text"
                value={player2Name}
                onChange={(e) => setPlayer2Name(e.target.value)}
                className="pregame-input isolde-input"
                maxLength={20}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />
            </div>
          </div>
        </div>

        <button className="pregame-start-btn" onClick={handleStart}>
          Begin the Quest
        </button>

        <div className="pregame-links">
          <button className="pregame-link" onClick={() => setShowRules(true)}>
            <BookOpen size={16} />
            How to Play
          </button>
          <button className="pregame-link" onClick={() => setShowLeaderboard(true)}>
            <Trophy size={16} />
            Leaderboard
          </button>
        </div>
      </div>

      <div className="pregame-characters">
        <img src="/SirRowan.svg" alt="Sir Rowan" className="pregame-char-left" />
        <img src="/Isolde.svg" alt="Lady Isolde" className="pregame-char-right" />
      </div>

      {showRules && (
        <div className="modal-overlay" onClick={() => setShowRules(false)}>
          <div className="modal-content rules-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRules(false)}>
              <X size={20} />
            </button>
            <h2 className="modal-title">How to Play</h2>
            <div className="rules-list">
              <div className="rule-item">
                <span className="rule-number">1</span>
                <p>Players take turns rolling the dice by clicking it. Your piece moves forward by the number shown.</p>
              </div>
              <div className="rule-item">
                <span className="rule-number">2</span>
                <p>Land on the bottom of a <span className="text-ladder">ladder</span> and climb up to a higher square!</p>
              </div>
              <div className="rule-item">
                <span className="rule-number">3</span>
                <p>Land on the top of a <span className="text-chute">chute</span> and slide down to a lower square.</p>
              </div>
              <div className="rule-item">
                <span className="rule-number">4</span>
                <p>The first player to reach square 100 wins the game and earns eternal glory!</p>
              </div>
              <div className="rule-item">
                <span className="rule-number">5</span>
                <p>Press <kbd>Space</kbd> or <kbd>Enter</kbd> to roll the dice during your turn.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <div className="modal-overlay" onClick={() => setShowLeaderboard(false)}>
          <div className="modal-content leaderboard-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLeaderboard(false)}>
              <X size={20} />
            </button>
            <h2 className="modal-title">
              <Trophy size={22} />
              Leaderboard
            </h2>
            {leaderboardLoading ? (
              <p className="leaderboard-empty">Loading...</p>
            ) : leaderboard.length === 0 ? (
              <p className="leaderboard-empty">No games played yet. Be the first!</p>
            ) : (
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Wins</th>
                    <th>Games</th>
                    <th>Avg Turns</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr key={entry.player_name} className={i < 3 ? `top-${i + 1}` : ''}>
                      <td className="rank-cell">{i + 1}</td>
                      <td className="name-cell">{entry.player_name}</td>
                      <td>{entry.wins}</td>
                      <td>{entry.games}</td>
                      <td>{entry.avg_turns}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
