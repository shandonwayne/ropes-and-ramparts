import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import {
  GAME_CONFIG,
  getVisualPosition,
  getSquareFromVisual,
  type Player,
  type MoveLogEntry,
  type PlayerStats,
} from './lib/gameConfig';
import { playSound, isMuted, setMuted } from './lib/sounds';
import { useGameStats } from './hooks/useGameStats';
import { useFloatingIndicators } from './components/FloatingIndicator';
import FloatingIndicators from './components/FloatingIndicator';
import PreGameScreen from './components/PreGameScreen';
import VictoryModal from './components/VictoryModal';
import MoveLog from './components/MoveLog';

type GamePhase = 'pregame' | 'playing' | 'gameover';

const ChutesLaddersGame: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('pregame');
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'Sir Rowan', color: 'var(--player1-color)', position: 0 },
    { id: 2, name: 'Lady Isolde', color: 'var(--player2-color)', position: 0 },
  ]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [player1LastRoll, setPlayer1LastRoll] = useState(1);
  const [player2LastRoll, setPlayer2LastRoll] = useState(1);
  const [winner, setWinner] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [ropePositions, setRopePositions] = useState<Array<{ start: number; end: number; style: React.CSSProperties }>>([]);
  const [player1State, setPlayer1State] = useState<'default' | 'failure'>('default');
  const [player2State, setPlayer2State] = useState<'default' | 'failure'>('default');
  const [moveLog, setMoveLog] = useState<MoveLogEntry[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [highlightedSquares, setHighlightedSquares] = useState<number[]>([]);
  const [playerStats, setPlayerStats] = useState<[PlayerStats, PlayerStats]>([
    { turns: 0, chutesHit: 0, laddersClimbed: 0, biggestChute: 0, biggestLadder: 0 },
    { turns: 0, chutesHit: 0, laddersClimbed: 0, biggestChute: 0, biggestLadder: 0 },
  ]);

  const boardRef = useRef<HTMLDivElement>(null);
  const playersRef = useRef(players);
  playersRef.current = players;
  const currentPlayerIndexRef = useRef(currentPlayerIndex);
  currentPlayerIndexRef.current = currentPlayerIndex;
  const turnCountRef = useRef(turnCount);
  turnCountRef.current = turnCount;
  const playerStatsRef = useRef(playerStats);
  playerStatsRef.current = playerStats;

  const { leaderboard, loading: leaderboardLoading, saveGameResult, fetchLeaderboard } = useGameStats();
  const { indicators, addIndicator } = useFloatingIndicators();

  // Calculate rope positions after board renders
  useEffect(() => {
    if (phase !== 'playing') return;

    const calculateAllRopes = () => {
      if (!boardRef.current) return;
      const newRopePositions: Array<{ start: number; end: number; style: React.CSSProperties }> = [];

      Object.entries(GAME_CONFIG.chutes).forEach(([start, end]) => {
        const startPos = parseInt(start);
        const ropePos = calculateRopePosition(startPos, end);
        if (ropePos) {
          newRopePositions.push({
            start: startPos,
            end,
            style: {
              position: 'absolute',
              left: `${ropePos.left}px`,
              top: `${ropePos.top}px`,
              width: `${ropePos.width}px`,
              height: '8px',
              transform: `rotate(${ropePos.angle}deg)`,
              transformOrigin: '0 50%',
              pointerEvents: 'none',
              background: 'linear-gradient(90deg,rgba(68, 69, 70, 1) 0%, rgba(100, 92, 94, 1) 75%, rgba(68, 69, 70, 1) 100%)',
              borderRadius: '4px',
              zIndex: 50,
            },
          });
        }
      });

      Object.entries(GAME_CONFIG.ladders).forEach(([start, end]) => {
        const startPos = parseInt(start);
        const ropePos = calculateRopePosition(startPos, end);
        if (ropePos) {
          newRopePositions.push({
            start: startPos,
            end,
            style: {
              position: 'absolute',
              left: `${ropePos.left}px`,
              top: `${ropePos.top}px`,
              width: `${ropePos.width}px`,
              height: '8px',
              transform: `rotate(${ropePos.angle}deg)`,
              transformOrigin: '0 50%',
              pointerEvents: 'none',
              background: 'linear-gradient(90deg, #F57B35, #FFBC2E)',
              borderRadius: '4px',
              zIndex: 50,
            },
          });
        }
      });

      setRopePositions(newRopePositions);
    };

    const timer = setTimeout(calculateAllRopes, 100);
    return () => clearTimeout(timer);
  }, [phase]);

  const calculateRopePosition = (startPos: number, endPos: number) => {
    if (!boardRef.current) return null;
    const boardRect = boardRef.current.getBoundingClientRect();
    const squares = boardRef.current.querySelectorAll('.game-square');

    const startSquare = Array.from(squares).find(
      (square) => parseInt((square as HTMLElement).dataset.position || '0') === startPos
    ) as HTMLElement;
    const endSquare = Array.from(squares).find(
      (square) => parseInt((square as HTMLElement).dataset.position || '0') === endPos
    ) as HTMLElement;

    if (!startSquare || !endSquare) return null;

    const startRect = startSquare.getBoundingClientRect();
    const endRect = endSquare.getBoundingClientRect();
    const startCenterX = startRect.left + startRect.width / 2 - boardRect.left;
    const startCenterY = startRect.top + startRect.height / 2 - boardRect.top;
    const endCenterX = endRect.left + endRect.width / 2 - boardRect.left;
    const endCenterY = endRect.top + endRect.height / 2 - boardRect.top;
    const deltaX = endCenterX - startCenterX;
    const deltaY = endCenterY - startCenterY;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    return { left: startCenterX, top: startCenterY, width: length, angle };
  };

  // Highlight reachable squares on hover
  useEffect(() => {
    if (phase !== 'playing' || isRolling || isMoving) {
      setHighlightedSquares([]);
      return;
    }
    const pos = players[currentPlayerIndex].position;
    const reachable: number[] = [];
    for (let i = 1; i <= 6; i++) {
      const target = pos + i;
      if (target <= GAME_CONFIG.boardSize) reachable.push(target);
    }
    setHighlightedSquares(reachable);
  }, [currentPlayerIndex, players, phase, isRolling, isMoving]);

  // Keyboard controls
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (phase === 'pregame') return;
      if (e.key === ' ' || e.key === 'Enter') {
        if (phase === 'playing' && !isRolling && !isSettling && !isMoving) {
          e.preventDefault();
          rollDice();
        }
      }
      if (e.key === 'Escape' && phase === 'gameover') {
        handlePlayAgain();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, isRolling, isSettling, isMoving, currentPlayerIndex]);

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setMuted(!next);
  }

  // 3D Dice rendering
  const renderDiceFace = (value: number, faceClass: string) => (
    <div key={faceClass} className={`dice-face ${faceClass}`}>
      <img
        src={`/dice-${value}.svg`}
        alt={`Dice ${value}`}
        style={{ width: '95%', height: '95%', filter: 'brightness(0) saturate(100%)' }}
      />
    </div>
  );

  const render3DDice = (lastRollValue: number, isActive: boolean) => {
    if (!isActive) {
      return (
        <img
          src={`/dice-${lastRollValue}.svg`}
          alt={`Dice ${lastRollValue}`}
          style={{
            width: '95%',
            height: '95%',
            backgroundColor: '#3A342E',
            borderRadius: 'var(--border-radius)',
          }}
        />
      );
    }
    const v = lastRollValue;
    const faceValues = {
      front: v,
      back: v,
      right: v === 1 ? 2 : v === 6 ? 5 : v < 4 ? 6 : 1,
      left: v === 1 ? 5 : v === 6 ? 2 : v < 4 ? 1 : 6,
      top: v === 1 ? 3 : v === 6 ? 4 : v === 2 ? 1 : v === 5 ? 6 : v === 3 ? 2 : 5,
      bottom: v === 1 ? 4 : v === 6 ? 3 : v === 2 ? 6 : v === 5 ? 1 : v === 3 ? 5 : 2,
    };
    return (
      <>
        {renderDiceFace(faceValues.front, 'front')}
        {renderDiceFace(faceValues.back, 'back')}
        {renderDiceFace(faceValues.right, 'right')}
        {renderDiceFace(faceValues.left, 'left')}
        {renderDiceFace(faceValues.top, 'top')}
        {renderDiceFace(faceValues.bottom, 'bottom')}
      </>
    );
  };

  const rollDice = async () => {
    if (isRolling || isSettling || isMoving || phase !== 'playing') return;

    const idx = currentPlayerIndexRef.current;
    if (idx === 0 && player1State === 'failure') setPlayer1State('default');
    if (idx === 1 && player2State === 'failure') setPlayer2State('default');

    setIsRolling(true);
    setIsSettling(false);
    playSound('diceRoll');

    const finalValue = Math.floor(Math.random() * 6) + 1;
    const changeIntervals = [120, 140, 160, 180, 220, 260, 320];
    for (const interval of changeIntervals) {
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    if (idx === 0) setPlayer1LastRoll(finalValue);
    else setPlayer2LastRoll(finalValue);
    setIsRolling(false);

    await movePlayer(finalValue);
  };

  const movePlayer = async (steps: number) => {
    setIsMoving(true);
    setHighlightedSquares([]);

    const idx = currentPlayerIndexRef.current;
    const currentPlayer = playersRef.current[idx];
    const startPos = currentPlayer.position;
    let newPosition = Math.min(startPos + steps, GAME_CONFIG.boardSize);
    const newTurn = turnCountRef.current + 1;
    setTurnCount(newTurn);

    setPlayerStats((prev) => {
      const updated = [...prev] as [PlayerStats, PlayerStats];
      updated[idx] = { ...updated[idx], turns: updated[idx].turns + 1 };
      return updated;
    });

    for (let step = 1; step <= steps && startPos + step <= GAME_CONFIG.boardSize; step++) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      playSound('step');
      const pos = startPos + step;
      setPlayers((prev) =>
        prev.map((p) => (p.id === currentPlayer.id ? { ...p, position: pos } : p))
      );
    }

    let event: MoveLogEntry['event'] = 'move';
    let eventFrom: number | undefined;
    let eventTo: number | undefined;

    if (GAME_CONFIG.chutes[newPosition]) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      eventFrom = newPosition;
      eventTo = GAME_CONFIG.chutes[newPosition];
      const drop = eventFrom - eventTo;

      if (currentPlayer.id === 1) setPlayer1State('failure');
      if (currentPlayer.id === 2) setPlayer2State('failure');

      playSound('chute');
      event = 'chute';
      newPosition = eventTo;

      if (boardRef.current) {
        const sq = boardRef.current.querySelector(`[data-position="${eventFrom}"]`);
        if (sq) {
          const rect = sq.getBoundingClientRect();
          const boardRect = boardRef.current.getBoundingClientRect();
          addIndicator(`-${drop}`, 'chute', rect.left - boardRect.left + rect.width / 2, rect.top - boardRect.top);
        }
      }

      setPlayerStats((prev) => {
        const updated = [...prev] as [PlayerStats, PlayerStats];
        const s = updated[idx];
        updated[idx] = {
          ...s,
          chutesHit: s.chutesHit + 1,
          biggestChute: Math.max(s.biggestChute, drop),
        };
        return updated;
      });

      setPlayers((prev) =>
        prev.map((p) => (p.id === currentPlayer.id ? { ...p, position: newPosition } : p))
      );
    } else if (GAME_CONFIG.ladders[newPosition]) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      eventFrom = newPosition;
      eventTo = GAME_CONFIG.ladders[newPosition];
      const climb = eventTo - eventFrom;

      playSound('ladder');
      event = 'ladder';
      newPosition = eventTo;

      if (boardRef.current) {
        const sq = boardRef.current.querySelector(`[data-position="${eventFrom}"]`);
        if (sq) {
          const rect = sq.getBoundingClientRect();
          const boardRect = boardRef.current.getBoundingClientRect();
          addIndicator(`+${climb}`, 'ladder', rect.left - boardRect.left + rect.width / 2, rect.top - boardRect.top);
        }
      }

      setPlayerStats((prev) => {
        const updated = [...prev] as [PlayerStats, PlayerStats];
        const s = updated[idx];
        updated[idx] = {
          ...s,
          laddersClimbed: s.laddersClimbed + 1,
          biggestLadder: Math.max(s.biggestLadder, climb),
        };
        return updated;
      });

      setPlayers((prev) =>
        prev.map((p) => (p.id === currentPlayer.id ? { ...p, position: newPosition } : p))
      );
    }

    if (newPosition >= GAME_CONFIG.boardSize) {
      event = 'win';
      setWinner(currentPlayer.name);
      setPhase('gameover');
      playSound('victory');

      const stats = playerStatsRef.current;
      saveGameResult(
        playersRef.current[0].name,
        playersRef.current[1].name,
        currentPlayer.name,
        stats[0],
        stats[1]
      );
    } else {
      setCurrentPlayerIndex((idx + 1) % 2);
    }

    setMoveLog((prev) => [
      ...prev,
      {
        turn: newTurn,
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        roll: steps,
        fromPosition: startPos,
        toPosition: newPosition,
        event,
        eventFrom,
        eventTo,
      },
    ]);

    setIsMoving(false);
  };

  function handleStart(name1: string, name2: string) {
    setPlayers([
      { id: 1, name: name1, color: 'var(--player1-color)', position: 0 },
      { id: 2, name: name2, color: 'var(--player2-color)', position: 0 },
    ]);
    setPhase('playing');
    playSound('click');
  }

  function handlePlayAgain() {
    setPlayers((prev) => prev.map((p) => ({ ...p, position: 0 })));
    setCurrentPlayerIndex(0);
    setPlayer1LastRoll(1);
    setPlayer2LastRoll(1);
    setPlayer1State('default');
    setPlayer2State('default');
    setWinner(null);
    setIsRolling(false);
    setIsSettling(false);
    setIsMoving(false);
    setMoveLog([]);
    setTurnCount(0);
    setPlayerStats([
      { turns: 0, chutesHit: 0, laddersClimbed: 0, biggestChute: 0, biggestLadder: 0 },
      { turns: 0, chutesHit: 0, laddersClimbed: 0, biggestChute: 0, biggestLadder: 0 },
    ]);
    setPhase('pregame');
    fetchLeaderboard();
  }

  const renderBoard = () => {
    const squares = [];
    const startingPlayers = players.filter((player) => player.position === 0);

    for (let row = 0; row < GAME_CONFIG.gridHeight; row++) {
      for (let col = 0; col < GAME_CONFIG.gridWidth; col++) {
        const gamePosition = getSquareFromVisual(row, col);
        const hasChute = GAME_CONFIG.chutes[gamePosition];
        const hasLadder = GAME_CONFIG.ladders[gamePosition];
        const isHighlighted = highlightedSquares.includes(gamePosition);

        const playersHere = players.filter((player) => {
          const playerVisual = getVisualPosition(player.position);
          return playerVisual.row === row && playerVisual.col === col && player.position > 0;
        });

        squares.push(
          <div
            key={`${row}-${col}`}
            className={`game-square ${hasChute ? 'chute-start' : ''} ${hasLadder ? 'ladder-start' : ''} ${isHighlighted ? 'highlighted-square' : ''}`}
            data-position={gamePosition}
          >
            <span className="square-number">{gamePosition}</span>
            {hasChute && <span className="square-badge chute-badge">&#x25BC;</span>}
            {hasLadder && <span className="square-badge ladder-badge">&#x25B2;</span>}
            <div className="players-container">
              {playersHere.map((player) => (
                <div
                  key={player.id}
                  className={`player-piece player-${player.id}`}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 200,
                  }}
                >
                  <img
                    src={player.id === 1 ? '/RowanPlayerToken.svg' : '/IsolderPlayerToken.svg'}
                    alt={player.id === 1 ? 'Sir Rowan Token' : 'Lady Isolde Token'}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }
    }

    return (
      <>
        {squares}
        {startingPlayers.length > 0 && (
          <div
            className="starting-position"
            style={{
              position: 'absolute',
              bottom: '-60px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
            }}
          >
            {startingPlayers.map((player) => (
              <div
                key={player.id}
                className={`player-piece player-${player.id}`}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 200,
                }}
              >
                <img
                  src={player.id === 1 ? '/RowanPlayerToken.svg' : '/IsolderPlayerToken.svg'}
                  alt={player.id === 1 ? 'Sir Rowan Token' : 'Lady Isolde Token'}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  if (phase === 'pregame') {
    return (
      <div className="game-container">
        <PreGameScreen
          onStart={handleStart}
          leaderboard={leaderboard}
          leaderboardLoading={leaderboardLoading}
        />
      </div>
    );
  }

  if (phase === 'gameover' && winner) {
    const isIsolde = winner === players[1].name;
    return (
      <div className="game-container">
        <VictoryModal winner={winner} isIsolde={isIsolde} onPlayAgain={handlePlayAgain} />
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-toolbar">
        <button
          className="toolbar-btn"
          onClick={toggleSound}
          title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
          aria-label={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <div className="turn-indicator">
          <span className={`turn-dot player-${currentPlayerIndex + 1}-dot`} />
          {players[currentPlayerIndex].name}'s Turn
        </div>
        <div className="turn-counter">Turn {turnCount + 1}</div>
      </div>

      <div className="game-main">
        {/* Player 1 Panel */}
        <div className={`player-panel ${currentPlayerIndex === 0 ? 'active' : 'inactive'}`}>
          <div className="player-title">
            <img src="/SirRowan-Name.svg" alt={players[0].name} style={{ width: '100%', height: 'auto' }} />
          </div>
          <div className="character-illustration rowan">
            <img
              src="/SirRowan.svg"
              alt={players[0].name}
              className={`character-image player-1 ${player1State} ${currentPlayerIndex === 0 ? 'active' : 'inactive'}`}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div className="player-info-display" />
          <div
            className={`player-dice ${currentPlayerIndex === 0 && isRolling ? 'rolling' : ''} ${currentPlayerIndex === 0 && isSettling ? 'settling' : ''}`}
            onClick={currentPlayerIndex === 0 ? rollDice : undefined}
            style={{
              cursor: currentPlayerIndex === 0 && !isRolling && !isSettling ? 'pointer' : 'not-allowed',
              opacity: currentPlayerIndex === 0 ? 1 : 0.5,
              pointerEvents: isRolling || isSettling ? 'none' : 'auto',
            }}
            role="button"
            aria-label="Roll dice"
            tabIndex={currentPlayerIndex === 0 ? 0 : -1}
          >
            {render3DDice(player1LastRoll, currentPlayerIndex === 0)}
          </div>
        </div>

        {/* Game Board */}
        <div className="board-and-log">
          <div className="game-board" ref={boardRef} style={{ position: 'relative' }}>
            {renderBoard()}
            {ropePositions.map((rope) => (
              <div
                key={`rope-${rope.start}-${rope.end}`}
                className={`connection ${GAME_CONFIG.chutes[rope.start] ? 'chute-connection' : 'ladder-connection'}`}
                style={rope.style}
              />
            ))}
            <FloatingIndicators indicators={indicators} />
          </div>
          <MoveLog entries={moveLog} />
        </div>

        {/* Player 2 Panel */}
        <div className={`player-panel ${currentPlayerIndex === 1 ? 'active' : 'inactive'}`}>
          <div className="player-title">
            <img src="/LadyIsolde-Name.svg" alt={players[1].name} style={{ width: '100%', height: 'auto' }} />
          </div>
          <div className="character-illustration isolde">
            <img
              src="/Isolde.svg"
              alt={players[1].name}
              className={`character-image player-2 ${player2State} ${currentPlayerIndex === 1 ? 'active' : 'inactive'}`}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div className="player-info-display" />
          <div
            className={`player-dice ${currentPlayerIndex === 1 && isRolling ? 'rolling' : ''} ${currentPlayerIndex === 1 && isSettling ? 'settling' : ''}`}
            onClick={currentPlayerIndex === 1 ? rollDice : undefined}
            style={{
              cursor: currentPlayerIndex === 1 && !isRolling && !isSettling ? 'pointer' : 'not-allowed',
              opacity: currentPlayerIndex === 1 ? 1 : 0.5,
              pointerEvents: isRolling || isSettling ? 'none' : 'auto',
            }}
            role="button"
            aria-label="Roll dice"
            tabIndex={currentPlayerIndex === 1 ? 0 : -1}
          >
            {render3DDice(player2LastRoll, currentPlayerIndex === 1)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChutesLaddersGame;
