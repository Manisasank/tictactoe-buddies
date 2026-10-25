/**
 * XO Arena - Canvas Particle Engine (Victory & Dissolve Blast)
 * Author: Y Mani Sasank Reddy <https://github.com/Manisasank>
 */

export class ParticleEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    alpha: number;
    rotation: number;
    vr: number;
  }[] = [];
  private animId: number | null = null;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  public resize(): void {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.parentElement?.clientWidth || window.innerWidth;
    this.canvas.height = this.canvas.parentElement?.clientHeight || window.innerHeight;
  }

  public blast(originX?: number, originY?: number, particleCount: number = 80): void {
    if (!this.canvas || !this.ctx) return;
    this.resize();

    const colors = ['#00f0ff', '#ff2d55', '#ccff00', '#ffffff', '#ffb703'];
    const startX = originX ?? this.canvas.width * 0.5;
    const startY = originY ?? this.canvas.height * 0.5;

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.7) * 16,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 12
      });
    }

    if (!this.animId) {
      this.loop();
    }
  }

  private loop(): void {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    let active = false;

    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.38; // Gravity
      p.vx *= 0.98;
      p.rotation += p.vr;
      p.alpha -= 0.012;

      if (p.alpha > 0) {
        active = true;
        this.ctx!.save();
        this.ctx!.globalAlpha = Math.max(0, p.alpha);
        this.ctx!.translate(p.x, p.y);
        this.ctx!.rotate((p.rotation * Math.PI) / 180);
        this.ctx!.fillStyle = p.color;
        this.ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        this.ctx!.restore();
      }
    });

    this.particles = this.particles.filter(p => p.alpha > 0);

    if (active) {
      this.animId = requestAnimationFrame(() => this.loop());
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.animId = null;
    }
  }
}
