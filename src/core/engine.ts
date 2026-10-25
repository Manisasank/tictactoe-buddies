/**
 * XO Arena - Authoritative Game State Engine & The 3-Mark Dynamic Infinity Matrix™
 * Author: Y Mani Sasank Reddy <https://github.com/Manisasank>
 */

import {
  Player,
  CellValue,
  GameMode,
  MatchState,
  WinningLine,
  WinningDirection,
  MoveRecord,
  MoveEvaluation,
  GameState
} from './types';

export const WINNING_COMBOS: { combo: [number, number, number]; direction: WinningDirection }[] = [
  { combo: [0, 1, 2], direction: 'row-0' },
  { combo: [3, 4, 5], direction: 'row-1' },
  { combo: [6, 7, 8], direction: 'row-2' },
  { combo: [0, 3, 6], direction: 'col-0' },
  { combo: [1, 4, 7], direction: 'col-1' },
  { combo: [2, 5, 8], direction: 'col-2' },
  { combo: [0, 4, 8], direction: 'diag-main' },
  { combo: [2, 4, 6], direction: 'diag-anti' }
];

export const COORD_NAMES = ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3'];

export type EngineEvent = 
  | { type: 'STATE_CHANGED'; state: GameState }
  | { type: 'MOVE_MADE'; record: MoveRecord; evaluation: MoveEvaluation }
  | { type: 'MARK_EVICTED'; evictedIndex: number; player: Player }
  | { type: 'ROUND_WON'; winner: Player; line: WinningLine }
  | { type: 'ROUND_TIED' };

export class GameEngine {
  private state: GameState;
  private listeners: ((event: EngineEvent) => void)[] = [];

  constructor(mode: GameMode = 'infinity', blitzDuration: number = 0) {
    this.state = this.createInitialState(mode, blitzDuration);
  }

  private createInitialState(mode: GameMode, blitzDuration: number): GameState {
    return {
      board: Array(9).fill(null),
      turn: 'X',
      mode,
      state: 'IDLE',
      movesX: [],
      movesO: [],
      history: [],
      winningLine: null,
      scoreX: 0,
      scoreO: 0,
      blitzRemaining: blitzDuration,
      blitzDuration
    };
  }

  public subscribe(listener: (event: EngineEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(event: EngineEvent): void {
    this.listeners.forEach(fn => fn(event));
  }

  public getState(): Readonly<GameState> {
    return { ...this.state, board: [...this.state.board], history: [...this.state.history] };
  }

  public startMatch(mode?: GameMode, blitzDuration?: number): void {
    if (mode) this.state.mode = mode;
    if (blitzDuration !== undefined) {
      this.state.blitzDuration = blitzDuration;
      this.state.blitzRemaining = blitzDuration;
    }
    this.resetRound();
    this.state.state = 'PLAYING';
    this.emit({ type: 'STATE_CHANGED', state: this.getState() });
  }

  public resetRound(): void {
    this.state.board = Array(9).fill(null);
    this.state.movesX = [];
    this.state.movesO = [];
    this.state.history = [];
    this.state.winningLine = null;
    this.state.turn = 'X';
    this.state.state = 'PLAYING';
    this.state.blitzRemaining = this.state.blitzDuration;
    this.emit({ type: 'STATE_CHANGED', state: this.getState() });
  }

  public resetScores(): void {
    this.state.scoreX = 0;
    this.state.scoreO = 0;
    this.emit({ type: 'STATE_CHANGED', state: this.getState() });
  }

  public getExpiringNextIndex(player: Player): number | null {
    if (this.state.mode !== 'infinity' && this.state.mode !== 'ai' && this.state.mode !== 'online') {
      return null;
    }
    const queue = player === 'X' ? this.state.movesX : this.state.movesO;
    return queue.length === 3 ? queue[0] : null;
  }

  public checkWin(board: CellValue[]): WinningLine | null {
    for (const { combo, direction } of WINNING_COMBOS) {
      const [a, b, c] = combo;
      const mark = board[a];
      if (mark && mark === board[b] && mark === board[c]) {
        return { combo, direction, winner: mark };
      }
    }
    return null;
  }

  public evaluateMove(index: number, player: Player): MoveEvaluation {
    const opponent: Player = player === 'X' ? 'O' : 'X';
    
    // Check if this move wins immediately
    const tempBoard = [...this.state.board];
    tempBoard[index] = player;
    if (this.checkWin(tempBoard)) {
      return { type: 'brilliant', message: 'Winning strike!' };
    }

    // Check if this move blocked an opponent win
    const blockTestBoard = [...this.state.board];
    blockTestBoard[index] = opponent;
    if (this.checkWin(blockTestBoard)) {
      return { type: 'great', message: 'Critical block!' };
    }

    // Check if expiring mark causes an opponent win on their next turn
    if (this.state.mode === 'infinity' || this.state.mode === 'ai') {
      const queue = player === 'X' ? this.state.movesX : this.state.movesO;
      if (queue.length === 3) {
        const expiringIdx = queue[0];
        const futureBoard = [...this.state.board];
        futureBoard[expiringIdx] = null;
        futureBoard[index] = player;

        // Would opponent win on their response?
        for (let i = 0; i < 9; i++) {
          if (futureBoard[i] === null) {
            futureBoard[i] = opponent;
            if (this.checkWin(futureBoard)) {
              return { type: 'blunder', message: 'Vaporized piece exposed loss!' };
            }
            futureBoard[i] = null;
          }
        }
      }
    }

    return { type: 'normal', message: 'Solid positional play' };
  }

  public makeMove(index: number): boolean {
    if (this.state.state !== 'PLAYING') return false;
    if (index < 0 || index > 8) return false;
    if (this.state.board[index] !== null) return false;

    const currentPlayer = this.state.turn;
    const evaluation = this.evaluateMove(index, currentPlayer);
    let evictedIndex: number | undefined;

    // The 3-Mark Dynamic Infinity Matrix™ FIFO Decay
    if (this.state.mode === 'infinity' || this.state.mode === 'ai' || this.state.mode === 'online') {
      const queue = currentPlayer === 'X' ? this.state.movesX : this.state.movesO;
      if (queue.length === 3) {
        evictedIndex = queue.shift()!;
        this.state.board[evictedIndex] = null;
        this.emit({ type: 'MARK_EVICTED', evictedIndex, player: currentPlayer });
      }
      queue.push(index);
    }

    this.state.board[index] = currentPlayer;

    const moveRecord: MoveRecord = {
      moveNum: this.state.history.length + 1,
      player: currentPlayer,
      cellIndex: index,
      coord: COORD_NAMES[index],
      timestamp: Date.now(),
      evictedIndex
    };

    this.state.history.push(moveRecord);
    this.emit({ type: 'MOVE_MADE', record: moveRecord, evaluation });

    // Check Win
    const winningLine = this.checkWin(this.state.board);
    if (winningLine) {
      this.state.winningLine = winningLine;
      this.state.state = 'ROUND_OVER';
      if (winningLine.winner === 'X') {
        this.state.scoreX++;
      } else {
        this.state.scoreO++;
      }
      this.emit({ type: 'ROUND_WON', winner: winningLine.winner, line: winningLine });
      this.emit({ type: 'STATE_CHANGED', state: this.getState() });
      return true;
    }

    // Check Stalemate (Classic mode only)
    if (this.state.mode === 'classic' && this.state.board.every(c => c !== null)) {
      this.state.state = 'ROUND_OVER';
      this.emit({ type: 'ROUND_TIED' });
      this.emit({ type: 'STATE_CHANGED', state: this.getState() });
      return true;
    }

    // Switch Turn
    this.state.turn = currentPlayer === 'X' ? 'O' : 'X';
    this.state.blitzRemaining = this.state.blitzDuration;
    this.emit({ type: 'STATE_CHANGED', state: this.getState() });
    return true;
  }

  public calculateWinProbability(): { xChance: number; oChance: number } {
    if (this.state.state === 'ROUND_OVER') {
      if (this.state.winningLine?.winner === 'X') return { xChance: 100, oChance: 0 };
      if (this.state.winningLine?.winner === 'O') return { xChance: 0, oChance: 100 };
      return { xChance: 50, oChance: 50 };
    }

    let xScore = 0;
    let oScore = 0;

    // Center ownership
    if (this.state.board[4] === 'X') xScore += 3.5;
    if (this.state.board[4] === 'O') oScore += 3.5;

    // Corner ownership
    [0, 2, 6, 8].forEach(idx => {
      if (this.state.board[idx] === 'X') xScore += 1.5;
      if (this.state.board[idx] === 'O') oScore += 1.5;
    });

    // Winning combo threat lines
    for (const { combo } of WINNING_COMBOS) {
      const marks = combo.map(i => this.state.board[i]);
      const xCount = marks.filter(m => m === 'X').length;
      const oCount = marks.filter(m => m === 'O').length;

      if (xCount === 2 && oCount === 0) xScore += 7;
      if (oCount === 2 && xCount === 0) oScore += 7;
      if (xCount === 1 && oCount === 0) xScore += 1.5;
      if (oCount === 1 && xCount === 0) oScore += 1.5;
    }

    const total = xScore + oScore + 10;
    const xChance = Math.min(95, Math.max(5, Math.round(((xScore + 5) / total) * 100)));
    return { xChance, oChance: 100 - xChance };
  }

  public serialize(): string {
    return JSON.stringify({
      b: this.state.board,
      t: this.state.turn,
      m: this.state.mode,
      x: this.state.movesX,
      o: this.state.movesO,
      sx: this.state.scoreX,
      so: this.state.scoreO
    });
  }

  public deserialize(serialized: string): boolean {
    try {
      const data = JSON.parse(serialized);
      this.state.board = data.b;
      this.state.turn = data.t;
      this.state.mode = data.m;
      this.state.movesX = data.x || [];
      this.state.movesO = data.o || [];
      this.state.scoreX = data.sx || 0;
      this.state.scoreO = data.so || 0;
      this.state.state = 'PLAYING';
      this.emit({ type: 'STATE_CHANGED', state: this.getState() });
      return true;
    } catch {
      return false;
    }
  }
}
