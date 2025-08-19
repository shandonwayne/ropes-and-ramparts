import React, { useState, useEffect, useRef } from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';

// Game Configuration - Easy to modify
const GAME_CONFIG = {
  boardSize: 100,
  gridWidth: 10,
  gridHeight: 10,
  
  // Chutes (snakes) - start position maps to end position
  chutes: {
    98: 78,
    95: 75,
    93: 73,
    87: 24,
    64: 60,
    62: 19,
    54: 34,
    17: 7
  },
  
  // Ladders - start position maps to end position
  ladders: {
    1: 38,
    4: 14,
    9: 21,
    16: 6,
    21: 42,
    28: 84,
    36: 44,
    51: 67,
    71: 91,
    80: 100
  },
  
  // Player configuration
  players: [
    { id: 1, name: 'Player 1', color: 'var(--player1-color)', position: 0 },
    { id: 2, name: 'Player 2', color: 'var(--player2-color)', position: 0 }
  ]
};

const ChutesLaddersGame: React.FC = () => {
  // Game State
  const [players, setPlayers] = useState(GAME_CONFIG.players);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [activeDiceValue, setActiveDiceValue] = useState(1);
  const [inactiveDiceValue, setInactiveDiceValue] = useState(1);
  const [player1LastRoll, setPlayer1LastRoll] = useState(1);
  const [player2LastRoll, setPlayer2LastRoll] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [ropePositions, setRopePositions] = useState<Array<{start: number, end: number, style: React.CSSProperties}>>([]);
  
  const boardRef = useRef<HTMLDivElement>(null);

  // Calculate rope positions after board renders
  useEffect(() => {
    const calculateAllRopes = () => {
      if (!boardRef.current) return;
      
      console.log('Calculating ropes...');
      const newRopePositions: Array<{start: number, end: number, style: React.CSSProperties}> = [];
      
      Object.entries(GAME_CONFIG.ladders).forEach(([start, end]) => {
        const startPos = parseInt(start);
        const endPos = end;
        console.log(`Calculating rope from ${startPos} to ${endPos}`);
        const ropePos = calculateRopePosition(startPos, endPos);
        
        if (ropePos) {
          console.log('Rope position calculated:', ropePos);
          newRopePositions.push({
            start: startPos,
            end: endPos,
            style: {
              position: 'absolute',
              left: `${ropePos.left}px`,
              top: `${ropePos.top}px`,
              width: `${ropePos.width}px`,
              height: '8px',
              transform: `rotate(${ropePos.angle}deg)`,
              transformOrigin: '0 50%',
              zIndex: 100,
              pointerEvents: 'none'
            }
          });
        } else {
          console.log('No rope position calculated for', startPos, endPos);
        }
      });
      
      console.log('Setting rope positions:', newRopePositions);
      setRopePositions(newRopePositions);
    };
    
    // Calculate positions after a short delay to ensure DOM is ready
    const timer = setTimeout(calculateAllRopes, 500);
    
    return () => clearTimeout(timer);
  }, [players]); // Recalculate when players move

  // Calculate rope connection positions
  const calculateRopePosition = (startPos: number, endPos: number) => {
    if (!boardRef.current) return null;
    
    console.log('Looking for squares with positions:', startPos, endPos);
    const boardRect = boardRef.current.getBoundingClientRect();
    const squares = boardRef.current.querySelectorAll('.game-square');
    console.log('Found squares:', squares.length);
    
    const startSquare = Array.from(squares).find(square => 
      parseInt((square as HTMLElement).dataset.position || '0') === startPos
    ) as HTMLElement;
    
    const endSquare = Array.from(squares).find(square => 
      parseInt((square as HTMLElement).dataset.position || '0') === endPos
    ) as HTMLElement;
    
    console.log('Start square:', startSquare, 'End square:', endSquare);
    
    if (!startSquare || !endSquare) return null;
    
    const startRect = startSquare.getBoundingClientRect();
    const endRect = endSquare.getBoundingClientRect();
    
    // Calculate positions relative to the board container, not viewport
    const startX = startRect.left + startRect.width / 2 - boardRect.left;
    const startY = startRect.top + startRect.height / 2 - boardRect.top;
    const endX = endRect.left + endRect.width / 2 - boardRect.left;
    const endY = endRect.top + endRect.height / 2 - boardRect.top;
    
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    return {
      left: startX,
      top: startY,
      width: length,
      angle
    };
  };

  // Render a single dice face with symbol
  const renderDiceFace = (value: number, faceClass: string) => {
    return (
      <div key={faceClass} className={`dice-face ${faceClass}`}>
        {getDiceIcon(value)}
      </div>
    );
  };

  // Render complete 3D dice with all 6 faces
  const render3DDice = (activeValue: number, inactiveValue: number, isActive: boolean) => {
    // For inactive players, show flat SVG instead of 3D dice
    if (!isActive) {
      const lastRollValue = currentPlayerIndex === 0 ? player2LastRoll : player1LastRoll;
      return (
        <img 
          src={`/dice-${lastRollValue}.svg`} 
          alt={`Dice ${lastRollValue}`}
          style={{ 
            width: '95%', 
            height: '95%',
            backgroundColor: '#3A342E', // Iron background
            borderRadius: 'var(--border-radius)'
          }}
        />
      );
    }
    
    const currentValue = isActive ? activeValue : inactiveValue;
    
    // Define all 6 face values (opposite faces add up to 7)
    const faceValues = {
      front: currentValue,      // Current showing face
      back: 7 - currentValue,   // Opposite face
      right: currentValue === 1 ? 2 : (currentValue === 6 ? 5 : (currentValue < 4 ? 6 : 1)),
      left: currentValue === 1 ? 5 : (currentValue === 6 ? 2 : (currentValue < 4 ? 1 : 6)),
      top: currentValue === 1 ? 3 : (currentValue === 6 ? 4 : (currentValue === 2 ? 1 : (currentValue === 5 ? 6 : (currentValue === 3 ? 2 : 5)))),
      bottom: currentValue === 1 ? 4 : (currentValue === 6 ? 3 : (currentValue === 2 ? 6 : (currentValue === 5 ? 1 : (currentValue === 3 ? 5 : 2))))
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

  // Get dice icon component based on value
  const getDiceIcon = (value: number) => {
    return (
      <img 
        src={`/dice-${value}.svg`} 
        alt={`Dice ${value}`}
        style={{ 
          width: '95%', 
          height: '95%',
          filter: 'brightness(0) saturate(100%)' // Makes SVG black
        }}
      />
    );
  };

  // Convert position to board coordinates (handling snake pattern)
  const getSquareNumber = (position: number): number => {
    if (position === 0) return 0;
    
    const row = Math.floor((position - 1) / GAME_CONFIG.gridWidth);
    const col = (position - 1) % GAME_CONFIG.gridWidth;
    
    // Snake pattern: even rows (0, 2, 4...) go left-to-right, odd rows go right-to-left
    const isEvenRow = row % 2 === 0;
    const displayRow = GAME_CONFIG.gridHeight - 1 - row;
    const displayCol = isEvenRow ? col : GAME_CONFIG.gridWidth - 1 - col;
    
    return displayRow * GAME_CONFIG.gridWidth + displayCol + 1;
  };

  // Get visual position for a game position
  const getVisualPosition = (position: number) => {
    if (position === 0) return { row: 10, col: 0 }; // Start position
    
    const row = Math.floor((position - 1) / GAME_CONFIG.gridWidth);
    const col = (position - 1) % GAME_CONFIG.gridWidth;
    
    const isEvenRow = row % 2 === 0;
    const visualRow = GAME_CONFIG.gridHeight - 1 - row;
    const visualCol = isEvenRow ? col : GAME_CONFIG.gridWidth - 1 - col;
    
    return { row: visualRow, col: visualCol };
  };

  // Roll dice animation and logic
  const rollDice = async () => {
    if (isRolling || isSettling || isMoving || gameOver) return;
    
    // Start rolling animation
    setIsRolling(true);
    setIsSettling(false);
    
    // Generate final dice value
    const finalValue = Math.floor(Math.random() * 6) + 1;
    setDiceValue(finalValue); // Set the dice value that will be used for movement
    
    // Animate dice face changes during rolling with smooth transition to final value
    const rollDuration = 2200; // 2.2 seconds total
    const changeIntervals = [120, 140, 160, 180, 220, 260, 320]; // Removed last interval to prevent jump
    let currentTime = 0;
    
    for (let i = 0; i < changeIntervals.length; i++) {
      await new Promise(resolve => setTimeout(resolve, changeIntervals[i]));
      currentTime += changeIntervals[i];
      
      // Gradually bias toward final value, with final value guaranteed in last few iterations
      let randomValue;
      if (i >= changeIntervals.length - 2) {
        // Last two iterations: always show final value
        randomValue = finalValue;
      } else if (i >= changeIntervals.length - 3) {
        // Third-to-last iteration: heavily bias toward final value
        randomValue = Math.random() < 0.9 ? finalValue : Math.floor(Math.random() * 6) + 1;
      } else if (i >= changeIntervals.length - 4) {
        // Fourth-to-last iteration: moderate bias toward final value
        randomValue = Math.random() < 0.6 ? finalValue : Math.floor(Math.random() * 6) + 1;
      } else {
        // Early iterations: completely random
        randomValue = Math.floor(Math.random() * 6) + 1;
      }
      
      setActiveDiceValue(randomValue);
    }
    
    // Store the roll for the current player
    if (currentPlayerIndex === 0) {
      setPlayer1LastRoll(finalValue);
    } else {
      setPlayer2LastRoll(finalValue);
    }
    
    setIsRolling(false);
    setIsSettling(true);
    
    // Wait for settling animation to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSettling(false);
    
    // Move current player
    await movePlayer(finalValue); // Use the final dice value for movement
  };

  // Move player with animation
  const movePlayer = async (steps: number) => {
    setIsMoving(true);
    
    const currentPlayer = players[currentPlayerIndex];
    let newPosition = Math.min(currentPlayer.position + steps, GAME_CONFIG.boardSize);
    
    // Animate step-by-step movement
    for (let step = 1; step <= steps && currentPlayer.position + step <= GAME_CONFIG.boardSize; step++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setPlayers(prevPlayers => 
        prevPlayers.map(player => 
          player.id === currentPlayer.id 
            ? { ...player, position: currentPlayer.position + step }
            : player
        )
      );
    }
    
    // Check for chutes or ladders
    if (GAME_CONFIG.chutes[newPosition]) {
      await new Promise(resolve => setTimeout(resolve, 500));
      newPosition = GAME_CONFIG.chutes[newPosition];
      
      setPlayers(prevPlayers => 
        prevPlayers.map(player => 
          player.id === currentPlayer.id 
            ? { ...player, position: newPosition }
            : player
        )
      );
    } else if (GAME_CONFIG.ladders[newPosition]) {
      await new Promise(resolve => setTimeout(resolve, 500));
      newPosition = GAME_CONFIG.ladders[newPosition];
      
      setPlayers(prevPlayers => 
        prevPlayers.map(player => 
          player.id === currentPlayer.id 
            ? { ...player, position: newPosition }
            : player
        )
      );
    }
    
    // Check for win condition
    if (newPosition >= GAME_CONFIG.boardSize) {
      setGameOver(true);
      setWinner(currentPlayer.name);
    } else {
      // Switch to next player
      setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
    }
    
    setIsMoving(false);
  };

  // Reset game
  const resetGame = () => {
    setPlayers(GAME_CONFIG.players.map(player => ({ ...player, position: 0 })));
    setCurrentPlayerIndex(0);
    setActiveDiceValue(1);
    setInactiveDiceValue(1);
    setPlayer1LastRoll(1);
    setPlayer2LastRoll(1);
    setGameOver(false);
    setWinner(null);
    setIsRolling(false);
    setIsSettling(false);
    setIsMoving(false);
  };

  // Render game board
  const renderBoard = () => {
    const squares = [];
    
    for (let row = 0; row < GAME_CONFIG.gridHeight; row++) {
      for (let col = 0; col < GAME_CONFIG.gridWidth; col++) {
        const squareNumber = row * GAME_CONFIG.gridWidth + col + 1;
        const gamePosition = getSquareFromVisual(row, col);
        
        // Check for chutes and ladders
        const hasChute = GAME_CONFIG.chutes[gamePosition];
        const hasLadder = GAME_CONFIG.ladders[gamePosition];
        
        // Find players on this square
        const playersHere = players.filter(player => {
          const playerVisual = getVisualPosition(player.position);
          return playerVisual.row === row && playerVisual.col === col && player.position > 0;
        });
        
        squares.push(
          <div
            key={`${row}-${col}`}
            className={`game-square ${hasChute ? 'chute-start' : ''} ${hasLadder ? 'ladder-start' : ''}`}
            data-position={gamePosition}
          >
            <span className="square-number">{gamePosition}</span>
            
            {hasChute && (
              <div className="chute-indicator">
                🐍 → {hasChute}
              </div>
            )}
            
            {hasLadder && (
              <div className="ladder-indicator">
                🪜 → {hasLadder}
              </div>
            )}
            
            <div className="players-container">
              {playersHere.map(player => (
                <div
                  key={player.id}
                  className={`player-piece player-${player.id}`}
                  style={{ 
                    backgroundColor: player.id === 1 ? 'var(--Tangerine)' : 'var(--Pink)',
                    border: '2px solid white'
                  }}
                >
                </div>
              ))}
            </div>
          </div>
        );
      }
    }
    
    return squares;
  };

  // Get game position from visual coordinates
  const getSquareFromVisual = (visualRow: number, visualCol: number): number => {
    const gameRow = GAME_CONFIG.gridHeight - 1 - visualRow;
    const isEvenGameRow = gameRow % 2 === 0;
    const gameCol = isEvenGameRow ? visualCol : GAME_CONFIG.gridWidth - 1 - visualCol;
    
    return gameRow * GAME_CONFIG.gridWidth + gameCol + 1;
  };

  return (
    <div className="game-container">
      {gameOver ? (
        <div className="game-main">
          <div className="game-over">
            <h2 className="winner-announcement">🎉 {winner} Wins! 🎉</h2>
            <button className="reset-button" onClick={resetGame}>
              Play Again
            </button>
          </div>
        </div>
      ) : (
        <div className="game-main">
          {/* Player 1 Panel */}
          <div className={`player-panel ${currentPlayerIndex === 0 ? 'active' : 'inactive'}`}>
            <div className="player-title">
              <img src="/SirRowan-Name.svg" alt="Sir Rowan" style={{ width: '100%', height: 'auto' }} />
            </div>
            <div className="character-illustration Rowan"></div>
            <div className="player-info-display">
              {/* <div className="player-position">Position: {players[0].position}</div> */} 
            </div>
            <div 
              className={`player-dice dice-value-${currentPlayerIndex === 0 ? activeDiceValue : inactiveDiceValue} ${
                currentPlayerIndex === 0 && isRolling ? 'rolling' : ''
              } ${currentPlayerIndex === 0 && isSettling ? 'settling' : ''}`}
              onClick={currentPlayerIndex === 0 ? rollDice : undefined}
              style={{ 
                cursor: currentPlayerIndex === 0 && !isRolling && !isSettling ? 'pointer' : 'not-allowed',
                opacity: currentPlayerIndex === 0 ? 1 : 0.5,
                pointerEvents: isRolling || isSettling ? 'none' : 'auto'
              }}
            >
              {render3DDice(activeDiceValue, inactiveDiceValue, currentPlayerIndex === 0)}
            </div>
          </div>
          
          {/* Game Board */}
          <div className="game-board" ref={boardRef} style={{ position: 'relative' }}>
            {renderBoard()}
            
            {/* Rope Connections - positioned relative to board */}
            {ropePositions.map((rope) => (
              <div
                key={`rope-${rope.start}-${rope.end}`}
                className="rope-connection"
                style={rope.style}
              >
                <img src="/rope.svg" alt="rope" className="rope-svg" style={{ width: '100%', height: '100%' }} />
              </div>
            ))}
          </div>
          
          {/* Player 2 Panel */}
          <div className={`player-panel ${currentPlayerIndex === 1 ? 'active' : 'inactive'}`}>
            <div className="player-title">
              <img src="/LadyIsolde-Name.svg" alt="Lady Isolde" style={{ width: '100%', height: 'auto' }} />
            </div>
            <div className="character-illustration Isolde"></div>
            <div className="player-info-display">
              {/* <div className="player-position">Position: {players[1].position}</div> */} 
            </div>
            <div 
              className={`player-dice dice-value-${currentPlayerIndex === 1 ? activeDiceValue : inactiveDiceValue} ${
                currentPlayerIndex === 1 && isRolling ? 'rolling' : ''
              } ${currentPlayerIndex === 1 && isSettling ? 'settling' : ''}`}
              onClick={currentPlayerIndex === 1 ? rollDice : undefined}
              style={{ 
                cursor: currentPlayerIndex === 1 && !isRolling && !isSettling ? 'pointer' : 'not-allowed',
                opacity: currentPlayerIndex === 1 ? 1 : 0.5,
                pointerEvents: isRolling || isSettling ? 'none' : 'auto'
              }}
            >
              {render3DDice(activeDiceValue, inactiveDiceValue, currentPlayerIndex === 1)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChutesLaddersGame;