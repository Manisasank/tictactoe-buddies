/**
 * XO Arena - Web Audio API Synthetic SFX Synthesizer
 * Zero-dependency procedural sound engine supporting multiple sound packs
 * Author: Y Mani Sasank Reddy <https://github.com/Manisasank>
 */

import { SoundPack } from '../core/types';

export class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private currentPack: SoundPack = 'scifi';
  private isMuted: boolean = false;

  constructor() {}

  private initContext(): void {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();
      } catch {
        // AudioContext not supported
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundPack(pack: SoundPack): void {
    this.currentPack = pack;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public toggleMuted(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playMoveX(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (this.currentPack === 'scifi') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, t);
      osc.frequency.exponentialRampToValueAtTime(560, t + 0.08);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    } else if (this.currentPack === 'arcade') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(880, t + 0.04);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.start(t);
      osc.stop(t + 0.08);
    } else {
      // ASMR Wood
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.06);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      osc.start(t);
      osc.stop(t + 0.07);
    }
  }

  public playMoveO(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (this.currentPack === 'scifi') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(280, t + 0.08);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    } else if (this.currentPack === 'arcade') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(330, t);
      osc.frequency.setValueAtTime(660, t + 0.04);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.start(t);
      osc.stop(t + 0.08);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      osc.start(t);
      osc.stop(t + 0.07);
    }
  }

  public playFade(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);
    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playVictory(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554, 659, 880]; // C-Major / A-Major Arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.type = this.currentPack === 'arcade' ? 'square' : 'triangle';
      osc.frequency.value = freq;
      const nt = t + idx * 0.08;
      gain.gain.setValueAtTime(0.16, nt);
      gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.25);
      osc.start(nt);
      osc.stop(nt + 0.25);
    });
  }

  public playDefeat(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [380, 320, 260];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const nt = t + idx * 0.1;
      gain.gain.setValueAtTime(0.12, nt);
      gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.25);
      osc.start(nt);
      osc.stop(nt + 0.25);
    });
  }

  public playBlitzTick(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(840, t);
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.start(t);
    osc.stop(t + 0.04);
  }
}
