/**
 * XO Arena - LocalStorage Abstraction for Profile, Elo & Unlocked Cosmetics
 * Author: Y Mani Sasank Reddy <https://github.com/Manisasank>
 */

import { UserProfile, CosmeticTheme, SoundPack } from '../core/types';

const STORAGE_KEY = 'xo_arena_profile_v3';

export class StorageManager {
  private static defaultProfile: UserProfile = {
    name: 'Tactician',
    avatar: '⚡',
    elo: 1200,
    wins: 0,
    losses: 0,
    draws: 0,
    streak: 0,
    bestStreak: 0,
    matches: 0,
    theme: 'neon',
    soundPack: 'scifi',
    haptics: true,
    muted: false,
    blitzDuration: 0
  };

  public static loadProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return { ...this.defaultProfile, ...JSON.parse(data) };
      }
    } catch {
      // Storage unavailable or blocked
    }
    return { ...this.defaultProfile };
  }

  public static saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Storage unavailable
    }
  }

  public static updateProfile(partial: Partial<UserProfile>): UserProfile {
    const current = this.loadProfile();
    const updated = { ...current, ...partial };
    this.saveProfile(updated);
    return updated;
  }

  public static recordMatch(isWin: boolean, isDraw: boolean = false, eloChange: number = 0): UserProfile {
    const profile = this.loadProfile();
    profile.matches += 1;

    if (isWin) {
      profile.wins += 1;
      profile.streak += 1;
      profile.bestStreak = Math.max(profile.bestStreak, profile.streak);
      profile.elo = Math.min(2600, profile.elo + eloChange);
    } else if (isDraw) {
      profile.draws += 1;
      profile.streak = 0;
    } else {
      profile.losses += 1;
      profile.streak = 0;
      profile.elo = Math.max(800, profile.elo - Math.abs(eloChange));
    }

    this.saveProfile(profile);
    return profile;
  }

  public static getEloTier(elo: number): { name: string; badge: string; color: string } {
    if (elo >= 1800) return { name: 'Grandmaster', badge: '👑', color: '#ffb703' };
    if (elo >= 1600) return { name: 'Diamond', badge: '💎', color: '#00f0ff' };
    if (elo >= 1400) return { name: 'Master', badge: '🥇', color: '#ccff00' };
    if (elo >= 1200) return { name: 'Tactician', badge: '🥈', color: '#94a3b8' };
    return { name: 'Recruit', badge: '🥉', color: '#64748b' };
  }
}
