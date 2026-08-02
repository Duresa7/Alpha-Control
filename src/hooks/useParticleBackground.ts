import { useRef, useEffect } from 'react';

/**
 * A field of glass and dust that swirls around the pointer. Particles within
 * reach of the cursor are pulled along the vector towards it and pushed along
 * that vector's perpendicular at the same time: the pull gathers them, the
 * perpendicular push keeps them orbiting instead of collapsing to a point, and
 * together they read as a vortex. Whatever the cursor stirs up also brightens,
 * so the swirl leaves a glow trailing behind it.
 */

/** Cool white flecks read as glass; the rest is dimmer dust. */
const GLASS_COLOR = '240, 245, 255';
const DUST_COLOR = '150, 158, 172';
const GLASS_SHARE = 0.3;

/** Density is per unit of area, so a laptop and an ultrawide look the same. */
const AREA_PER_PARTICLE = 2000;
const MIN_PARTICLES = 350;
const MAX_PARTICLES = 1100;

const MAGNET_RADIUS = 280;
const PULL = 0.12;
const SWIRL = 0.7;
const FRICTION = 0.95;
/** Keeps the field alive when the pointer is nowhere near it. */
const JITTER = 0.04;
/**
 * Trails fade by painting the backdrop back over them. Erasing towards
 * transparency instead leaves a permanent ghost of everywhere a particle has
 * been: that multiplies alpha by a fraction each frame, and 8-bit rounding
 * never carries the low values the last step down to zero. Fading towards the
 * backdrop converges on the backdrop, so nothing is left behind.
 */
const DECAY = 0.16;
/** Lit slate at the centre falling away to near black, drawn once per resize. */
const BACKDROP_STOPS: [offset: number, color: string][] = [
  [0, 'rgb(28, 37, 53)'],
  [0.4, 'rgb(18, 22, 32)'],
  [0.74, 'rgb(10, 11, 16)'],
  [1, 'rgb(7, 8, 12)'],
];
const BACKDROP_CENTRE_Y = 0.44;
const BACKDROP_SPREAD = 0.62;
const GLOW_DECAY = 0.92;
const GLOW_THRESHOLD = 0.3;
const MAX_ALPHA = 0.9;
const WRAP_MARGIN = 20;
/** Frames drawn up front when motion is off, to leave a still image. */
const STATIC_FRAMES = 90;
const POINTER_AWAY = -10000;

export function useParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pointer = { x: POINTER_AWAY, y: POINTER_AWAY };

    let width = 0;
    let height = 0;
    let frameId = 0;

    class Particle {
      x = Math.random() * width;
      y = Math.random() * height;
      vx = (Math.random() - 0.5) * 0.2;
      vy = (Math.random() - 0.5) * 0.2;
      size = 0.5 + Math.random() * 1.5;
      alpha = 0.1 + Math.random() * 0.4;
      color = Math.random() < GLASS_SHARE ? GLASS_COLOR : DUST_COLOR;
      rotation = Math.random() * Math.PI * 2;
      spin = (Math.random() - 0.5) * 0.05;
      glow = 0;

      update() {
        const dx = pointer.x - this.x;
        const dy = pointer.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0 && dist < MAGNET_RADIUS) {
          const force = (MAGNET_RADIUS - dist) / MAGNET_RADIUS;
          this.vx += ((dx * PULL + dy * SWIRL) / dist) * force;
          this.vy += ((dy * PULL - dx * SWIRL) / dist) * force;
          this.glow = force * 0.7;
        } else {
          this.glow *= GLOW_DECAY;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vx = this.vx * FRICTION + (Math.random() - 0.5) * JITTER;
        this.vy = this.vy * FRICTION + (Math.random() - 0.5) * JITTER;
        this.rotation += this.spin + (Math.abs(this.vx) + Math.abs(this.vy)) * 0.05;

        if (this.x < -WRAP_MARGIN) this.x = width + WRAP_MARGIN;
        else if (this.x > width + WRAP_MARGIN) this.x = -WRAP_MARGIN;
        if (this.y < -WRAP_MARGIN) this.y = height + WRAP_MARGIN;
        else if (this.y > height + WRAP_MARGIN) this.y = -WRAP_MARGIN;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.fillStyle = `rgba(${this.color}, ${Math.min(this.alpha + this.glow, MAX_ALPHA)})`;
        if (this.glow > GLOW_THRESHOLD) {
          ctx.shadowBlur = 8 * this.glow;
          ctx.shadowColor = `rgba(180, 220, 255, ${this.glow})`;
        }

        ctx.beginPath();
        ctx.moveTo(0, -this.size * 2.5);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0, this.size * 2.5);
        ctx.lineTo(-this.size, 0);
        ctx.fill();

        ctx.restore();
      }
    }

    let particles: Particle[] = [];
    let backdrop!: CanvasGradient;

    const paintBackdrop = (alpha: number) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = backdrop;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    };

    const seed = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const centreY = height * BACKDROP_CENTRE_Y;
      const spread = Math.sqrt(width * width + height * height) * BACKDROP_SPREAD;
      backdrop = ctx.createRadialGradient(width / 2, centreY, 0, width / 2, centreY, spread);
      for (const [offset, color] of BACKDROP_STOPS) backdrop.addColorStop(offset, color);
      paintBackdrop(1);

      const target = Math.round((width * height) / AREA_PER_PARTICLE);
      const count = Math.min(Math.max(target, MIN_PARTICLES), MAX_PARTICLES);
      particles = Array.from({ length: count }, () => new Particle());
    };

    const step = () => {
      for (const particle of particles) particle.update();
      paintBackdrop(DECAY);
      for (const particle of particles) particle.draw(ctx);
    };

    const loop = () => {
      step();
      frameId = requestAnimationFrame(loop);
    };

    const start = () => {
      cancelAnimationFrame(frameId);
      seed();
      if (motionQuery.matches) {
        for (let i = 0; i < STATIC_FRAMES; i++) step();
        return;
      }
      frameId = requestAnimationFrame(loop);
    };

    const trackPointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
    };

    const onMouseMove = (event: MouseEvent) => trackPointer(event.clientX, event.clientY);

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) trackPointer(touch.clientX, touch.clientY);
    };

    const releasePointer = () => {
      pointer.x = POINTER_AWAY;
      pointer.y = POINTER_AWAY;
    };

    start();
    window.addEventListener('resize', start);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', releasePointer);
    document.addEventListener('mouseleave', releasePointer);
    motionQuery.addEventListener('change', start);

    return () => {
      window.removeEventListener('resize', start);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', releasePointer);
      document.removeEventListener('mouseleave', releasePointer);
      motionQuery.removeEventListener('change', start);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return canvasRef;
}
