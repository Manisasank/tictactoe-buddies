/**
 * XO Arena - UI Renderer, Accessible DOM Grid, HUD & Laser Line
 * Author: Y Mani Sasank Reddy <https://github.com/Manisasank>
 */

import { GameState, WinningLine, MoveRecord, UserProfile, CosmeticTheme } from '../core/types';
import { COORD_NAMES } from '../core/engine';
import { StorageManager } from '../storage/storage';

export class UIRenderer {
  private announcerEl: HTMLElement | null = null;
  private toastEl: HTMLElement | null = null;

  constructor() {
    this.announcerEl = document.getElementById('aria-announcer');
    this.toastEl = document.getElementById('toast');
  }

  public announce(message: string): void {
    if (this.announcerEl) {
      this.announcerEl.innerText = message;
    }
  }

  public showToast(msg: string): void {
    if (!this.toastEl) return;
    this.toastEl.innerText = msg;
    this.toastEl.classList.add('show');
    setTimeout(() => this.toastEl?.classList.remove('show'), 2600);
  }

  public openModal(id: string): void {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  public closeModal(id: string): void {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }

  public renderBoard(
    state: GameState,
    expiringX: number | null,
    expiringO: number | null,
    theme: CosmeticTheme = 'neon'
  ): void {
    const cells = document.querySelectorAll<HTMLElement>('.grid-cell');
    if (cells.length !== 9) return;

    cells.forEach((cell, idx) => {
      const val = state.board[idx];
      cell.innerHTML = '';
      cell.className = 'grid-cell';
      cell.setAttribute('role', 'gridcell');

      if (val) {
        cell.classList.add('occupied');
        cell.setAttribute('aria-label', `Cell ${COORD_NAMES[idx]}, occupied by ${val}`);

        const markSpan = document.createElement('span');
        markSpan.className = `font-display ${val === 'X' ? 'text-cyan' : 'text-coral'}`;
        markSpan.innerText = val;
        cell.appendChild(markSpan);

        // Highlight expiring oldest piece
        if ((val === 'X' && idx === expiringX) || (val === 'O' && idx === expiringO)) {
          const ring = document.createElement('div');
          ring.className = 'fading-ring';
          ring.title = 'Oldest mark will vanish on 4th move!';
          cell.appendChild(ring);

          const badge = document.createElement('div');
          badge.className = 'decay-badge';
          badge.innerText = 'Expiring Next';
          cell.appendChild(badge);
        }
      } else {
        cell.setAttribute('aria-label', `Cell ${COORD_NAMES[idx]}, empty`);
      }
    });

    this.renderLaserWinLine(state.winningLine);
  }

  public renderLaserWinLine(winningLine: WinningLine | null): void {
    let svgContainer = document.querySelector<SVGSVGElement>('.win-laser-svg');
    if (!svgContainer) {
      const gridContainer = document.querySelector('.game-grid-container');
      if (!gridContainer) return;
      svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgContainer.setAttribute('class', 'win-laser-svg');
      gridContainer.appendChild(svgContainer);
    }

    svgContainer.innerHTML = '';
    if (!winningLine) return;

    const [a, , c] = winningLine.combo;
    const cells = document.querySelectorAll<HTMLElement>('.grid-cell');
    if (cells.length !== 9) return;

    const cellA = cells[a].getBoundingClientRect();
    const cellC = cells[c].getBoundingClientRect();
    const containerRect = svgContainer.getBoundingClientRect();

    const x1 = cellA.left + cellA.width / 2 - containerRect.left;
    const y1 = cellA.top + cellA.height / 2 - containerRect.top;
    const x2 = cellC.left + cellC.width / 2 - containerRect.left;
    const y2 = cellC.top + cellC.height / 2 - containerRect.top;

    const strokeColor = winningLine.winner === 'X' ? '#00f0ff' : '#ff2d55';

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', strokeColor);
    line.setAttribute('class', 'laser-line-path');
    line.setAttribute('style', `filter: drop-shadow(0 0 12px ${strokeColor});`);

    svgContainer.appendChild(line);
  }

  public updateHUD(state: GameState, profile: UserProfile, xChance: number, oChance: number): void {
    // Scores
    const sX = document.getElementById('player-x-score');
    const sO = document.getElementById('player-o-score');
    if (sX) sX.innerText = String(state.scoreX);
    if (sO) sO.innerText = String(state.scoreO);

    // Active Turn Highlight
    const cardX = document.getElementById('player-x-card');
    const cardO = document.getElementById('player-o-card');
    if (cardX) cardX.className = state.turn === 'X' ? 'player-card active-turn-x' : 'player-card';
    if (cardO) cardO.className = state.turn === 'O' ? 'player-card active-turn-o' : 'player-card';

    // Active Marks Tracking
    const marksX = document.getElementById('player-x-marks');
    const marksO = document.getElementById('player-o-marks');
    if (marksX) marksX.innerText = `Marks: ${state.movesX.length}/3`;
    if (marksO) marksO.innerText = `Marks: ${state.movesO.length}/3`;

    // Oracle Win Probability
    const vx = document.getElementById('oracle-val-x');
    const vo = document.getElementById('oracle-val-o');
    const bx = document.getElementById('oracle-bar-fill-x');
    if (vx) vx.innerText = `${xChance}%`;
    if (vo) vo.innerText = `${oChance}%`;
    if (bx) bx.style.width = `${xChance}%`;

    // Top Profile Pill
    const navName = document.getElementById('nav-user-name');
    const navAvatar = document.getElementById('nav-user-avatar');
    const navElo = document.getElementById('nav-elo-pill');
    const pXElo = document.getElementById('player-x-elo');

    const tier = StorageManager.getEloTier(profile.elo);
    if (navName) navName.innerText = profile.name;
    if (navAvatar) navAvatar.innerText = profile.avatar;
    if (navElo) navElo.innerText = `${profile.elo} ELO • ${tier.name} ${tier.badge}`;
    if (pXElo) pXElo.innerText = `ELO: ${profile.elo} (${tier.name})`;
  }

  public updateBlitzBar(remainingSec: number, totalSec: number): void {
    const bar = document.getElementById('blitz-timer-bar');
    if (!bar || totalSec <= 0) return;

    const pct = Math.max(0, (remainingSec / totalSec) * 100);
    bar.style.width = `${pct}%`;

    if (pct > 50) bar.style.backgroundColor = 'var(--neon-lime)';
    else if (pct > 25) bar.style.backgroundColor = 'var(--warning-amber)';
    else bar.style.backgroundColor = 'var(--neon-coral)';
  }

  public renderMoveTape(history: MoveRecord[]): void {
    const tape = document.getElementById('history-chips-row');
    if (!tape) return;

    if (history.length === 0) {
      tape.innerHTML = '<span style="font-size: 0.75rem; color: #64748b;">Match starting... Place first mark.</span>';
      return;
    }

    tape.innerHTML = '';
    history.forEach(rec => {
      const chip = document.createElement('div');
      chip.className = `history-chip ${rec.player === 'X' ? 'chip-x' : 'chip-o'}`;
      let text = `#${rec.moveNum} ${rec.player}: ${rec.coord}`;
      if (rec.evictedIndex !== undefined) {
        text += ` (Vaporized ${COORD_NAMES[rec.evictedIndex]})`;
      }
      chip.innerText = text;
      tape.appendChild(chip);
    });
    tape.scrollLeft = tape.scrollWidth;
  }
}
