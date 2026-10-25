/**
 * XO Arena - Application Entrypoint & Orchestration Layer
 * Author: Y Mani Sasank Reddy <https://github.com/Manisasank>
 */

import { GameEngine } from './core/engine';
import { AIEngine } from './core/ai';
import { NetworkManager } from './network/network';
import { QRCodeGenerator } from './network/qr';
import { SoundSynthesizer } from './audio/sound';
import { HapticsManager } from './audio/haptics';
import { StorageManager } from './storage/storage';
import { ParticleEngine } from './ui/particles';
import { UIRenderer } from './ui/ui';
import { GameMode, AIDifficulty, Player } from './core/types';

export class AppOrchestrator {
  private engine: GameEngine;
  private sound: SoundSynthesizer;
  private ui: UIRenderer;
  private network: NetworkManager;
  private particles: ParticleEngine | null = null;
  private currentMode: GameMode = 'infinity';
  private aiDifficulty: AIDifficulty = 'grandmaster';
  private blitzTimerId: number | null = null;
  private blitzRemaining: number = 0;
  private isMyTurnOnline: boolean = false;
  private myOnlinePlayer: Player = 'X';

  constructor() {
    this.engine = new GameEngine('infinity', 0);
    this.sound = new SoundSynthesizer();
    this.ui = new UIRenderer();
    this.network = new NetworkManager();

    this.init();
  }

  private init(): void {
    const profile = StorageManager.loadProfile();
    this.sound.setMuted(profile.muted);
    this.sound.setSoundPack(profile.soundPack);
    HapticsManager.setEnabled(profile.haptics);

    // Initialize Canvas Particles
    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
    if (canvas) {
      this.particles = new ParticleEngine(canvas);
    }

    this.bindEngineEvents();
    this.bindNetworkEvents();
    this.bindDOMEvents();
    this.bindKeyboardShortcuts();
    this.registerServiceWorker();

    // Initial render
    this.engine.startMatch('infinity');
    this.syncHUD();

    // Check URL parameters for instant room invites (?room=ABC123)
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    if (roomCode) {
      this.joinOnlineMatch(roomCode);
    }
  }

  private syncHUD(): void {
    const state = this.engine.getState();
    const profile = StorageManager.loadProfile();
    const { xChance, oChance } = this.engine.calculateWinProbability();
    const expiringX = this.engine.getExpiringNextIndex('X');
    const expiringO = this.engine.getExpiringNextIndex('O');

    this.ui.renderBoard(state, expiringX, expiringO, profile.theme);
    this.ui.updateHUD(state, profile, xChance, oChance);
    this.ui.renderMoveTape(state.history);
  }

  private bindEngineEvents(): void {
    this.engine.subscribe(event => {
      switch (event.type) {
        case 'MOVE_MADE': {
          const rec = event.record;
          if (rec.player === 'X') {
            this.sound.playMoveX();
          } else {
            this.sound.playMoveO();
          }
          HapticsManager.movePlaced();
          this.ui.announce(`Player ${rec.player} placed at ${rec.coord}. ${event.evaluation.message}`);
          break;
        }

        case 'MARK_EVICTED': {
          this.sound.playFade();
          HapticsManager.markEvicted();
          this.ui.announce(`Oldest mark evaporated.`);
          break;
        }

        case 'ROUND_WON': {
          this.stopBlitzTimer();
          this.sound.playVictory();
          HapticsManager.victory();
          this.particles?.blast();

          const isHumanWin = event.winner === 'X';
          const profile = StorageManager.recordMatch(isHumanWin, false, isHumanWin ? 25 : -15);
          this.ui.showToast(`🏆 ${event.winner === 'X' ? profile.name : 'Player O'} CONQUERED THE ARENA!`);
          break;
        }

        case 'ROUND_TIED': {
          this.stopBlitzTimer();
          this.sound.playDefeat();
          HapticsManager.defeat();
          StorageManager.recordMatch(false, true, 0);
          this.ui.showToast('⚖️ STALEMATE! Grid locked.');
          break;
        }

        case 'STATE_CHANGED': {
          this.syncHUD();
          break;
        }
      }
    });
  }

  private bindNetworkEvents(): void {
    this.network.subscribe(event => {
      switch (event.type) {
        case 'CONNECTED':
          this.ui.showToast('🌐 WebRTC Peer Connected!');
          break;

        case 'PEER_JOINED':
          this.ui.showToast(`⚡ Rival ${event.peerName} entered the room!`);
          break;

        case 'OPPONENT_MOVED':
          if (!this.isMyTurnOnline) {
            this.engine.makeMove(event.cellIndex);
            this.isMyTurnOnline = true;
          }
          break;

        case 'OPPONENT_DISCONNECTED':
          this.ui.showToast(`⚠️ Opponent disconnected. Waiting ${event.graceRemainingSec}s...`);
          break;

        case 'OPPONENT_RECONNECTED':
          this.ui.showToast(`✅ Opponent reconnected! Match resuming.`);
          break;

        case 'OPPONENT_FORFEIT':
          this.ui.showToast(`🏆 Opponent forfeited! Victory awarded.`);
          StorageManager.recordMatch(true, false, 25);
          break;

        case 'ERROR':
          this.ui.showToast(`WebRTC Warning: ${event.error}`);
          break;
      }
    });
  }

  private bindDOMEvents(): void {
    // Grid Cell Clicks
    const cells = document.querySelectorAll<HTMLElement>('.grid-cell');
    cells.forEach(cell => {
      const idx = Number(cell.dataset.index);
      cell.addEventListener('click', () => this.handleCellClick(idx));
    });

    // Control Buttons
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      this.engine.resetRound();
      this.ui.showToast('Round Restarted');
    });

    document.getElementById('audio-toggle-btn')?.addEventListener('click', () => {
      const isMuted = this.sound.toggleMuted();
      StorageManager.updateProfile({ muted: isMuted });
      const btn = document.getElementById('audio-toggle-btn');
      if (btn) btn.innerText = isMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
      this.ui.showToast(isMuted ? 'Sound Muted' : 'Sound Enabled');
    });

    // Mode Switcher Tabs
    const modeTabs: { id: string; mode: GameMode }[] = [
      { id: 'tab-infinity', mode: 'infinity' },
      { id: 'tab-classic', mode: 'classic' },
      { id: 'tab-ai', mode: 'ai' },
      { id: 'tab-online', mode: 'online' }
    ];

    modeTabs.forEach(({ id, mode }) => {
      document.getElementById(id)?.addEventListener('click', () => {
        this.switchMode(mode);
      });
    });

    // Daily Puzzle Button
    document.getElementById('btn-daily-puzzle')?.addEventListener('click', () => {
      this.loadDailyPuzzle();
    });

    // Modal Triggers
    document.getElementById('btn-share-modal')?.addEventListener('click', () => {
      this.openShareModal();
    });
  }

  private handleCellClick(index: number): void {
    const state = this.engine.getState();
    if (state.state !== 'PLAYING') return;

    if (this.currentMode === 'online' && !this.isMyTurnOnline) {
      this.ui.showToast("Waiting for rival's move...");
      return;
    }

    const success = this.engine.makeMove(index);
    if (!success) return;

    // Send via network if online
    if (this.currentMode === 'online') {
      this.network.sendMove(index, this.myOnlinePlayer);
      this.isMyTurnOnline = false;
    }

    // AI turn response
    if (this.currentMode === 'ai' && this.engine.getState().state === 'PLAYING') {
      window.setTimeout(() => this.triggerAIMove(), 320);
    }
  }

  private triggerAIMove(): void {
    const state = this.engine.getState();
    if (state.state !== 'PLAYING' || state.turn !== 'O') return;

    const bestMove = AIEngine.computeMove(
      state.board,
      state.movesX,
      state.movesO,
      this.aiDifficulty,
      state.mode === 'infinity' || state.mode === 'ai'
    );

    this.engine.makeMove(bestMove);
  }

  public switchMode(mode: GameMode): void {
    this.currentMode = mode;
    document.querySelectorAll('.mode-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${mode}`)?.classList.add('active');

    const aiBar = document.getElementById('ai-difficulty-bar');
    const onlinePanel = document.getElementById('online-lobby-panel');

    if (aiBar) aiBar.style.display = mode === 'ai' ? 'block' : 'none';
    if (onlinePanel) onlinePanel.style.display = mode === 'online' ? 'block' : 'none';

    this.engine.startMatch(mode);
    this.ui.showToast(`Switched to ${mode.toUpperCase()} Mode`);
  }

  public async createOnlineMatch(): Promise<void> {
    this.myOnlinePlayer = 'X';
    this.isMyTurnOnline = true;
    const roomCode = await this.network.createRoom();

    const codeDisplay = document.getElementById('current-room-code');
    if (codeDisplay) codeDisplay.innerText = roomCode;

    // Render Canvas QR Code
    const qrCanvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (qrCanvas) {
      const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
      QRCodeGenerator.render(qrCanvas, inviteUrl);
    }

    this.ui.showToast(`Room ${roomCode} created! Share link or scan QR.`);
  }

  public async joinOnlineMatch(code: string): Promise<void> {
    this.myOnlinePlayer = 'O';
    this.isMyTurnOnline = false;
    const profile = StorageManager.loadProfile();

    this.switchMode('online');
    await this.network.joinRoom(code, {
      name: profile.name,
      avatar: profile.avatar,
      elo: profile.elo
    });

    this.ui.showToast(`Connected to Room ${code}!`);
  }

  public loadDailyPuzzle(): void {
    const puzzle = AIEngine.DAILY_PUZZLES[0];
    this.engine.startMatch('puzzle');
    this.ui.showToast(`Puzzle: ${puzzle.title}`);
  }

  private openShareModal(): void {
    const room = this.network.getRoomCode();
    const url = `${window.location.origin}${window.location.pathname}${room ? `?room=${room}` : ''}`;

    if (navigator.share) {
      navigator.share({
        title: 'XO Arena - Tactical Tic Tac Toe',
        text: 'Battle me in XO Arena with the 3-Mark Infinity Matrix decay rules!',
        url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.ui.showToast('Game invite link copied to clipboard!');
      });
    }
  }

  private stopBlitzTimer(): void {
    if (this.blitzTimerId) {
      window.clearInterval(this.blitzTimerId);
      this.blitzTimerId = null;
    }
  }

  private bindKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const keyNum = parseInt(e.key);
      if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
        this.handleCellClick(keyNum - 1);
      } else if (e.key === 'r' || e.key === 'R') {
        this.engine.resetRound();
        this.ui.showToast('Round Reset');
      } else if (e.key === 'm' || e.key === 'M') {
        this.sound.toggleMuted();
      } else if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      }
    });
  }

  private registerServiceWorker(): void {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new AppOrchestrator();
});
