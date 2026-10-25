/**
 * XO Arena - Core Domain Types & FSM State Definitions
 * Author: Y Mani Sasank Reddy <https://github.com/Manisasank>
 */

export type Player = 'X' | 'O';
export type CellValue = Player | null;

export type GameMode = 'infinity' | 'classic' | 'ai' | 'online' | 'blitz' | 'puzzle';
export type AIDifficulty = 'novice' | 'tactician' | 'grandmaster';

export type MatchState = 'IDLE' | 'MATCHMAKING' | 'PLAYING' | 'ROUND_OVER' | 'MATCH_RESULT';

export type WinningDirection = 'row-0' | 'row-1' | 'row-2' | 'col-0' | 'col-1' | 'col-2' | 'diag-main' | 'diag-anti';

export interface WinningLine {
  combo: [number, number, number];
  direction: WinningDirection;
  winner: Player;
}

export interface MoveRecord {
  moveNum: number;
  player: Player;
  cellIndex: number;
  coord: string; // e.g. "B2", "A1"
  timestamp: number;
  evictedIndex?: number;
}

export interface MoveEvaluation {
  type: 'brilliant' | 'great' | 'normal' | 'blunder';
  message: string;
}

export interface GameState {
  board: CellValue[];
  turn: Player;
  mode: GameMode;
  state: MatchState;
  movesX: number[]; // FIFO queue for Player X (max 3)
  movesO: number[]; // FIFO queue for Player O (max 3)
  history: MoveRecord[];
  winningLine: WinningLine | null;
  scoreX: number;
  scoreO: number;
  blitzRemaining: number;
  blitzDuration: number;
}

export type CosmeticTheme = 'neon' | 'monochrome' | 'retro' | 'gold';
export type SoundPack = 'scifi' | 'arcade' | 'asmr';

export interface UserProfile {
  name: string;
  avatar: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  bestStreak: number;
  matches: number;
  theme: CosmeticTheme;
  soundPack: SoundPack;
  haptics: boolean;
  muted: boolean;
  blitzDuration: number;
}

export interface DailyPuzzle {
  id: string;
  title: string;
  prompt: string;
  board: CellValue[];
  movesX: number[];
  movesO: number[];
  turn: Player;
  solutionMoves: number[]; // Ordered sequence of winning moves
}
