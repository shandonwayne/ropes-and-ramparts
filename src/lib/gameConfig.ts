export const GAME_CONFIG = {
  boardSize: 100,
  gridWidth: 10,
  gridHeight: 10,

  chutes: {
    98: 78,
    95: 75,
    93: 73,
    87: 24,
    64: 60,
    62: 19,
    54: 34,
    17: 7,
  } as Record<number, number>,

  ladders: {
    1: 38,
    4: 14,
    9: 21,

    21: 42,
    28: 84,
    36: 44,
    51: 67,
    71: 91,
    80: 100,
  } as Record<number, number>,
};

export interface Player {
  id: number;
  name: string;
  color: string;
  position: number;
}

export interface MoveLogEntry {
  turn: number;
  playerId: number;
  playerName: string;
  roll: number;
  fromPosition: number;
  toPosition: number;
  event: 'move' | 'chute' | 'ladder' | 'win';
  eventFrom?: number;
  eventTo?: number;
}

export interface PlayerStats {
  turns: number;
  chutesHit: number;
  laddersClimbed: number;
  biggestChute: number;
  biggestLadder: number;
}

export const getVisualPosition = (position: number) => {
  if (position === 0) return { row: 10, col: 0 };
  const row = Math.floor((position - 1) / GAME_CONFIG.gridWidth);
  const col = (position - 1) % GAME_CONFIG.gridWidth;
  const isEvenRow = row % 2 === 0;
  const visualRow = GAME_CONFIG.gridHeight - 1 - row;
  const visualCol = isEvenRow ? col : GAME_CONFIG.gridWidth - 1 - col;
  return { row: visualRow, col: visualCol };
};

export const getSquareFromVisual = (visualRow: number, visualCol: number): number => {
  const gameRow = GAME_CONFIG.gridHeight - 1 - visualRow;
  const isEvenGameRow = gameRow % 2 === 0;
  const gameCol = isEvenGameRow ? visualCol : GAME_CONFIG.gridWidth - 1 - visualCol;
  return gameRow * GAME_CONFIG.gridWidth + gameCol + 1;
};
