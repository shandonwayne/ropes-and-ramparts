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
  const [player1State, setPlayer1State] = useState<'default' | 'failure'>('default');
  const [player2State, setPlayer2State] = useState<'default' | 'failure'>('default');
  
  const boardRef = useRef<HTMLDivElement>(null);

  // Calculate rope positions after board renders
  useEffect(() => {
    const calculateAllRopes = () => {
      if (!boardRef.current) return;
      
      const newRopePositions: Array<{start: number, end: number, style: React.CSSProperties}> = [];
      
      // Calculate chute connections (ramparts)
      Object.entries(GAME_CONFIG.chutes).forEach(([start, end]) => {
        const startPos = parseInt(start);
        const endPos = end;
        const ropePos = calculateRopePosition(startPos, endPos);
        
        if (ropePos) {
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
              pointerEvents: 'none',
              background: 'linear-gradient(90deg,rgba(68, 69, 70, 1) 0%, rgba(100, 92, 94, 1) 75%, rgba(68, 69, 70, 1) 100%)', // Chute gradient
              borderRadius: '4px', // Rounded corners
              zIndex: 50 // Lower than player tokens
            }
          });
        }
      });
      
      // Calculate ladder connections (ropes)
      Object.entries(GAME_CONFIG.ladders).forEach(([start, end]) => {
        const startPos = parseInt(start);
        const endPos = end;
        const ropePos = calculateRopePosition(startPos, endPos);
        
        if (ropePos) {
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
              pointerEvents: 'none',
              background: 'linear-gradient(90deg, #F57B35, #FFBC2E)', // Tangerine to Sunflower gradient
              borderRadius: '4px', // Rounded corners
              zIndex: 50 // Lower than player tokens
            }
          });
        }
      });
      
      setRopePositions(newRopePositions);
    };
    
    // Calculate positions after DOM is ready
    const timer = setTimeout(calculateAllRopes, 100);
    
    return () => clearTimeout(timer);
  }, []);

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
    
    // Calculate center positions of squares relative to the board container
    const startCenterX = startRect.left + startRect.width / 2 - boardRect.left;
    const startCenterY = startRect.top + startRect.height / 2 - boardRect.top;
    const endCenterX = endRect.left + endRect.width / 2 - boardRect.left;
    const endCenterY = endRect.top + endRect.height / 2 - boardRect.top;
    
    // Calculate the connection line
    const deltaX = endCenterX - startCenterX;
    const deltaY = endCenterY - startCenterY;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    // Position the connection line to start from the center of start square
    // and extend to the center of end square
    return {
      left: startCenterX,
      top: startCenterY,
      width: length,
      angle
    };
  };

  // Enhanced rope position calculation with better accuracy
  const calculateEnhancedRopePosition = (startPos: number, endPos: number) => {
    if (!boardRef.current) return null;
    
    const boardRect = boardRef.current.getBoundingClientRect();
    const squares = boardRef.current.querySelectorAll('.game-square');
    
    // Find squares by their data-position attribute
    let startSquare: HTMLElement | null = null;
    let endSquare: HTMLElement | null = null;
    
    squares.forEach(square => {
      const position = parseInt((square as HTMLElement).dataset.position || '0');
      if (position === startPos) startSquare = square as HTMLElement;
      if (position === endPos) endSquare = square as HTMLElement;
    });
    
    if (!startSquare || !endSquare) {
      console.warn(`Could not find squares for positions ${startPos} -> ${endPos}`);
      return null;
    }
    
    const startRect = startSquare.getBoundingClientRect();
    const endRect = endSquare.getBoundingClientRect();
    
    // Calculate exact center points relative to board
    const startX = startRect.left + (startRect.width / 2) - boardRect.left;
    const startY = startRect.top + (startRect.height / 2) - boardRect.top;
    const endX = endRect.left + (endRect.width / 2) - boardRect.left;
    const endY = endRect.top + (endRect.height / 2) - boardRect.top;
    
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    console.log(`Connection ${startPos}->${endPos}: start(${startX},${startY}) end(${endX},${endY}) length:${length} angle:${angle}`);
    
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
    
    // Reset player's failure state when they roll the dice
    if (currentPlayerIndex === 0 && player1State === 'failure') {
      setPlayer1State('default');
    }
    
    if (currentPlayerIndex === 1 && player2State === 'failure') {
      setPlayer2State('default');
    }
    
    // Start rolling animation
    setIsRolling(true);
    setIsSettling(false);
    
    // Generate final dice value
    const finalValue = Math.floor(Math.random() * 6) + 1;
    
    // Animate dice face changes during rolling with smooth transition to final value
    const rollDuration = 2000; // 2.2 seconds total
    const changeIntervals = [120, 140, 160, 180, 220, 260, 320]; // Removed last interval to prevent jump
    let currentTime = 0;
    
    for (let i = 0; i < changeIntervals.length; i++) {
      await new Promise(resolve => setTimeout(resolve, changeIntervals[i]));
      currentTime += changeIntervals[i];
      
      // Gradually bias toward final value, with final value guaranteed in last few iterations
      let randomValue;
      if (i >= changeIntervals.length) {
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
    
    // Use the final value that was set in the animation loop
    setDiceValue(activeDiceValue);
    
    // Store the roll for the current player
    if (currentPlayerIndex === 0) {
      setPlayer1LastRoll(activeDiceValue);
    } else {
      setPlayer2LastRoll(activeDiceValue);
    }
    
    setIsRolling(false);
    setIsSettling(true);
    
    // Wait for settling animation to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSettling(false);
    
    // Move current player
    await movePlayer(activeDiceValue); // Use the dice value that's displayed
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
      
      // Set failure state for player hitting a chute
      if (currentPlayer.id === 1) {
        setPlayer1State('failure');
      }
      
      if (currentPlayer.id === 2) {
        setPlayer2State('failure');
      }
      
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
    setPlayer1State('default');
    setPlayer2State('default');
    setGameOver(false);
    setWinner(null);
    setIsRolling(false);
    setIsSettling(false);
    setIsMoving(false);
  };

  // Render game board
  const renderBoard = () => {
    const squares = [];
    
    // Find players at starting position (0)
    const startingPlayers = players.filter(player => player.position === 0);
    
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
            
            <div className="players-container">
              {playersHere.map(player => (
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
                    zIndex: 100 // Ensure tokens are above connections
                  }}
                >
                  {player.id === 1 ? (
                    <img 
                      src="/RowanPlayerToken.svg" 
                      alt="Sir Rowan Token"
                      style={{ 
                        width: '100%', 
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  ) : (
                    <img 
                      src="/IsolderPlayerToken.svg" 
                      alt="Lady Isolde Token"
                      style={{ 
                        width: '100%', 
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  )}
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
        {/* Starting position for players at position 0 */}
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
              zIndex: 100
            }}
          >
            {startingPlayers.map(player => (
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
                  zIndex: 100
                }}
              >
                {player.id === 1 ? (
                  <img 
                    src="/RowanPlayerToken.svg" 
                    alt="Sir Rowan Token"
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                ) : (
                  <img 
                    src="/IsolderPlayerToken.svg" 
                    alt="Lady Isolde Token"
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  // Get game position from visual coordinates
  const getSquareFromVisual = (visualRow: number, visualCol: number): number => {
    const gameRow = GAME_CONFIG.gridHeight - 1 - visualRow;
    const isEvenGameRow = gameRow % 2 === 0;
    const gameCol = isEvenGameRow ? visualCol : GAME_CONFIG.gridWidth - 1 - visualCol;
    
    return gameRow * GAME_CONFIG.gridWidth + gameCol + 1;
  };

// Get character image based on player state and activity
const getCharacterImage = (playerId: number, isActive: boolean) => {
  const playerState = playerId === 1 ? player1State : player2State;
  
  if (playerId === 1) {
    // Sir Rowan
    if (playerState === 'failure') {
      return "/Rowan-Failure.svg";
    }
    return "/SirRowan.svg"; // Default for both active and inactive
  } else {
    // Lady Isolde
    if (playerState === 'failure') {
      return "/Isolde-Failure.svg";
    }
    return isActive ? "/Isolde-Final-Active.svg" : "/Isolde.svg";
  }
};

  return (
    <div className="game-container">
      {/* Temporary Testing Buttons */}
      <div className="testing-buttons">
        <button 
          className="test-button isolde-test"
          onClick={() => {
            setGameOver(true);
            setWinner('Lady Isolde');
          }}
        >
          Test Isolde Win
        </button>
        <button 
          className="test-button rowan-test"
          onClick={() => {
            setGameOver(true);
            setWinner('Player 1');
          }}
        >
          Test Rowan Win
        </button>
      </div>
      
      {gameOver ? (
        <div className="game-main">
          <div className={`game-over ${winner === 'Lady Isolde' ? 'isolde-victory' : 'rowan-victory'}`}>
            {winner === 'Lady Isolde' ? (
              <div className="victory-modal isolde-modal">
                <div className="victory-content">
                  <div className="victory-character">
                    <img 
                      src="/Glory-Isolde.svg" 
                      alt="Victorious Lady Isolde"
                      className="victory-character-image"
                    />
                  </div>
                  <div className="victory-text">
                    <h1 className="victory-title">GLORY IS ISOLDE'S.</h1>
                    <p className="victory-subtitle">THE GOBLIN REIGNS.</p>
                    <button className="play-again-button" onClick={resetGame}>
                      PLAY AGAIN
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="victory-modal rowan-modal">
                <div className="victory-content">
                  <div className="victory-character">
                    <img 
                      src="/SirRowan.svg" 
                      alt="Victorious Sir Rowan"
                      className="victory-character-image"
                    />
                  </div>
                  <div className="victory-text">
                    <h1 className="victory-title">VICTORY IS ROWAN'S.</h1>
                    <p className="victory-subtitle">THE KNIGHT PREVAILS.</p>
                    <button className="play-again-button" onClick={resetGame}>
                      PLAY AGAIN
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="game-main">
          {/* Player 1 Panel */}
          <div className={`player-panel ${currentPlayerIndex === 0 ? 'active' : 'inactive'}`}>
            <div className="player-title">
              <img src="/SirRowan-Name.svg" alt="Sir Rowan" style={{ width: '100%', height: 'auto' }} />
            </div>
            <div className="character-illustration">
              <img 
                src={getCharacterImage(1, currentPlayerIndex === 0)}
                alt="Sir Rowan" 
                className={`character-image player-1 ${player1State} ${currentPlayerIndex === 0 ? 'active' : 'inactive'}`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain'
                }}
              />
            </div>
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
                className={`connection ${GAME_CONFIG.chutes[rope.start] ? 'chute-connection' : 'ladder-connection'}`}
                style={rope.style}
              />
            ))}
          </div>
          
          {/* Player 2 Panel */}
          <div className={`player-panel ${currentPlayerIndex === 1 ? 'active' : 'inactive'}`}>
            <div className="player-title">
              <img src="/LadyIsolde-Name.svg" alt="Lady Isolde" style={{ width: '100%', height: 'auto' }} />
            </div>
            <div className="character-illustration">
              <img 
                src={getCharacterImage(2, currentPlayerIndex === 1)}
                alt="Lady Isolde" 
                className={`character-image player-2 ${player2State} ${currentPlayerIndex === 1 ? 'active' : 'inactive'}`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain'
                }}
              />
            </div>
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