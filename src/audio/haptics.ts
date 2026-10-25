/**
 * XO Arena - Mobile Haptic Feedback Triggers
 * Provides native tactile haptic impulses on mobile devices
 * Author: Y Mani Sasank Reddy <https://github.com/Manisasank>
 */

export class HapticsManager {
  private static enabled: boolean = true;

  public static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public static isEnabled(): boolean {
    return this.enabled;
  }

  public static trigger(pattern: number | number[]): void {
    if (!this.enabled) return;
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignored if device lacks vibration motor
      }
    }
  }

  public static movePlaced(): void {
    this.trigger(16);
  }

  public static markEvicted(): void {
    this.trigger([30, 40, 20]);
  }

  public static blitzWarning(): void {
    this.trigger(25);
  }

  public static victory(): void {
    this.trigger([40, 50, 80, 60, 140]);
  }

  public static defeat(): void {
    this.trigger([90, 80]);
  }
}
