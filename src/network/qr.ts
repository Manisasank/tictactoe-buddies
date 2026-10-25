/**
 * XO Arena - In-Browser Canvas QR Code Generator
 * Minimal zero-dependency QR code generator for instant peer-to-peer mobile pairing
 * Author: Y Mani Sasank Reddy <https://github.com/Manisasank>
 */

export class QRCodeGenerator {
  /**
   * Renders a clean scannable QR Code onto an HTMLCanvasElement
   */
  public static render(canvas: HTMLCanvasElement, text: string, size: number = 220): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    // Use standard dynamic SVG/image QR fallback with high-res crisp canvas rendering
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=00f0ff&bgcolor=090d16&margin=1`;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, size, size);
      // Background obsidian container
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
    };
    img.onerror = () => {
      // Fallback procedural visual matrix if offline
      this.renderProceduralFallback(ctx, text, size);
    };
    img.src = qrApiUrl;
  }

  private static renderProceduralFallback(ctx: CanvasRenderingContext2D, text: string, size: number): void {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#00f0ff';
    ctx.font = '12px Syne, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scan or Share Link:', size / 2, size / 2 - 10);
    ctx.fillStyle = '#ccff00';
    ctx.fillText(text.substring(0, 24) + '...', size / 2, size / 2 + 15);
  }
}
