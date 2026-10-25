/**
 * XO Arena - AI Engine & Heuristic Minimax with Cycle-Aware Transposition
 * Author: Y Mani Sasank Reddy <https://github.com/Manisasank>
 */

import { Player, CellValue, AIDifficulty, DailyPuzzle } from './types';
import { WINNING_COMBOS } from './engine';

export class AIEngine {
  private static transpositionTable = new Map<string, number>();

  /**
   * Main entry point to compute AI move
   */
  public static computeMove(
    board: CellValue[],
    movesX: number[],
    movesO: number[],
    difficulty: AIDifficulty,
    isInfinityMode: boolean
  ): number {
    const emptyCells = this.getEmptyIndices(board);
    if (emptyCells.length === 0) return 0;
    if (emptyCells.length === 9) return 4; // Center open on turn 1

    switch (difficulty) {
      case 'novice':
        return this.computeNoviceMove(board, emptyCells);
      case 'tactician':
        return this.computeTacticianMove(board, movesX, movesO, isInfinityMode);
      case 'grandmaster':
      default:
        return this.computeGrandmasterMove(board, movesX, movesO, isInfinityMode);
    }
  }

  private static getEmptyIndices(board: CellValue[]): number[] {
    return board.map((v, i) => (v === null ? i : null)).filter((i): i is number => i !== null);
  }

  /**
   * Novice: 60% positional heuristic, 40% random slip
   */
  private static computeNoviceMove(board: CellValue[], emptyCells: number[]): number {
    if (Math.random() < 0.4) {
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    // Take center or corners if available
    if (board[4] === null) return 4;
    const corners = [0, 2, 6, 8].filter(c => board[c] === null);
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
    return emptyCells[0];
  }

  /**
   * Tactician: 2-move lookahead, never misses immediate win or block, controls center
   */
  private static computeTacticianMove(
    board: CellValue[],
    movesX: number[],
    movesO: number[],
    isInfinityMode: boolean
  ): number {
    // 1. Immediate Win
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const testBoard = [...board];
        if (isInfinityMode && movesO.length === 3) testBoard[movesO[0]] = null;
        testBoard[i] = 'O';
        if (this.checkWinner(testBoard) === 'O') return i;
      }
    }

    // 2. Immediate Block
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const testBoard = [...board];
        if (isInfinityMode && movesX.length === 3) testBoard[movesX[0]] = null;
        testBoard[i] = 'X';
        if (this.checkWinner(testBoard) === 'X') return i;
      }
    }

    // 3. Center Control
    if (board[4] === null) return 4;

    // 4. Corners
    const corners = [0, 2, 6, 8].filter(c => board[c] === null);
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

    return this.getEmptyIndices(board)[0];
  }

  /**
   * Grandmaster: Unbeatable Minimax with Transposition & Cycle Detection
   */
  private static computeGrandmasterMove(
    board: CellValue[],
    movesX: number[],
    movesO: number[],
    isInfinityMode: boolean
  ): number {
    this.transpositionTable.clear();

    // 1. Quick Win Check
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const testBoard = [...board];
        if (isInfinityMode && movesO.length === 3) testBoard[movesO[0]] = null;
        testBoard[i] = 'O';
        if (this.checkWinner(testBoard) === 'O') return i;
      }
    }

    // 2. Quick Block Check
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const testBoard = [...board];
        if (isInfinityMode && movesX.length === 3) testBoard[movesX[0]] = null;
        testBoard[i] = 'X';
        if (this.checkWinner(testBoard) === 'X') return i;
      }
    }

    let bestScore = -Infinity;
    let bestMove = this.getEmptyIndices(board)[0];
    const visited = new Set<string>();

    const empty = this.getEmptyIndices(board);

    // Prefer center, then corners, then edges
    empty.sort((a, b) => {
      const order = [4, 0, 2, 6, 8, 1, 3, 5, 7];
      return order.indexOf(a) - order.indexOf(b);
    });

    const maxDepth = isInfinityMode ? 6 : 9;

    for (const move of empty) {
      const nextBoard = [...board];
      const nextO = [...movesO];
      if (isInfinityMode && nextO.length === 3) {
        nextBoard[nextO.shift()!] = null;
      }
      nextBoard[move] = 'O';
      nextO.push(move);

      const stateKey = this.hashState(nextBoard, movesX, nextO, 'X');
      visited.add(stateKey);

      const score = this.minimax(
        nextBoard,
        movesX,
        nextO,
        0,
        false,
        -Infinity,
        Infinity,
        maxDepth,
        isInfinityMode,
        visited
      );

      visited.delete(stateKey);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  private static minimax(
    board: CellValue[],
    movesX: number[],
    movesO: number[],
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    maxDepth: number,
    isInfinity: boolean,
    visited: Set<string>
  ): number {
    const winner = this.checkWinner(board);
    if (winner === 'O') return 100 - depth;
    if (winner === 'X') return depth - 100;
    if (!isInfinity && board.every(c => c !== null)) return 0;
    if (depth >= maxDepth) return this.evaluateHeuristic(board);

    const hash = this.hashState(board, movesX, movesO, isMaximizing ? 'O' : 'X');
    if (this.transpositionTable.has(hash)) {
      return this.transpositionTable.get(hash)!;
    }

    const empty = this.getEmptyIndices(board);
    if (empty.length === 0) return 0;

    let evalScore: number;

    if (isMaximizing) {
      evalScore = -Infinity;
      for (const move of empty) {
        const nextBoard = [...board];
        const nextO = [...movesO];
        if (isInfinity && nextO.length === 3) {
          nextBoard[nextO.shift()!] = null;
        }
        nextBoard[move] = 'O';
        nextO.push(move);

        const nextKey = this.hashState(nextBoard, movesX, nextO, 'X');
        if (visited.has(nextKey)) {
          // Cycle detected: penalize repetition loop
          continue;
        }

        visited.add(nextKey);
        const res = this.minimax(nextBoard, movesX, nextO, depth + 1, false, alpha, beta, maxDepth, isInfinity, visited);
        visited.delete(nextKey);

        evalScore = Math.max(evalScore, res);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break; // Alpha-beta prune
      }
    } else {
      evalScore = Infinity;
      for (const move of empty) {
        const nextBoard = [...board];
        const nextX = [...movesX];
        if (isInfinity && nextX.length === 3) {
          nextBoard[nextX.shift()!] = null;
        }
        nextBoard[move] = 'X';
        nextX.push(move);

        const nextKey = this.hashState(nextBoard, nextX, movesO, 'O');
        if (visited.has(nextKey)) {
          continue;
        }

        visited.add(nextKey);
        const res = this.minimax(nextBoard, nextX, movesO, depth + 1, true, alpha, beta, maxDepth, isInfinity, visited);
        visited.delete(nextKey);

        evalScore = Math.min(evalScore, res);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break; // Alpha-beta prune
      }
    }

    this.transpositionTable.set(hash, evalScore);
    return evalScore;
  }

  private static checkWinner(board: CellValue[]): Player | null {
    for (const { combo } of WINNING_COMBOS) {
      const [a, b, c] = combo;
      const mark = board[a];
      if (mark && mark === board[b] && mark === board[c]) {
        return mark;
      }
    }
    return null;
  }

  private static evaluateHeuristic(board: CellValue[]): number {
    let score = 0;
    if (board[4] === 'O') score += 4;
    if (board[4] === 'X') score -= 4;

    [0, 2, 6, 8].forEach(idx => {
      if (board[idx] === 'O') score += 2;
      if (board[idx] === 'X') score -= 2;
    });

    for (const { combo } of WINNING_COMBOS) {
      const marks = combo.map(i => board[i]);
      const oCount = marks.filter(m => m === 'O').length;
      const xCount = marks.filter(m => m === 'X').length;

      if (oCount === 2 && xCount === 0) score += 10;
      if (xCount === 2 && oCount === 0) score -= 10;
    }

    return score;
  }

  private static hashState(board: CellValue[], movesX: number[], movesO: number[], turn: Player): string {
    return `${board.map(c => c || '-').join('')}|${movesX.join('')}|${movesO.join('')}|${turn}`;
  }

  /**
   * Curated Daily Tactical Puzzles
   */
  public static readonly DAILY_PUZZLES: DailyPuzzle[] = [
    {
      id: 'puzzle-01',
      title: 'The Fork Trap',
      prompt: 'Find the winning move for Player X to create an unstoppable double threat!',
      board: ['X', null, 'O', null, 'X', null, 'O', null, null],
      movesX: [0, 4],
      movesO: [2, 6],
      turn: 'X',
      solutionMoves: [8]
    },
    {
      id: 'puzzle-02',
      title: 'Decay Defense',
      prompt: 'Infinity Mode: Move Player X to block O without vaporizing your winning diagonal!',
      board: ['X', 'O', null, null, 'O', null, 'X', null, 'X'],
      movesX: [0, 6, 8],
      movesO: [1, 4],
      turn: 'X',
      solutionMoves: [7]
    },
    {
      id: 'puzzle-03',
      title: 'Center Breach',
      prompt: 'Seize the decisive square to secure immediate victory!',
      board: ['X', 'O', 'X', 'O', null, 'O', null, 'X', null],
      movesX: [0, 2, 7],
      movesO: [1, 3, 5],
      turn: 'X',
      solutionMoves: [4]
    }
  ];
}
