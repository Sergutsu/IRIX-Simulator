/**
 * IRIX 6.5 Screen Saver Modules
 * =============================
 *
 * `screen_blanker` blanked the IRIX display after the user-configured idle
 * period and ran one of the installed screen saver modules.  Savers were
 * plain IRIS GL programs shown by their display name under
 * Toolchest -> Desktop -> Customize -> Screen Saver, which is why third party
 * saver packages (HayeSavers, etc.) could simply be dropped onto the machine.
 *
 * The classic default is ElectroPaint - the "dancing polygons".  Also
 * authentic to the machine: Hopalong (the "space plants" fractal), the SGI
 * demo Bounce, and the plain black blanker used by the lock screen.
 */

import { createEpState, drawEpFrame, stepEp, EpState, Rand48 } from './electropaint';

export interface SaverContext {
  width: number;
  height: number;
  /** seconds since the saver started */
  age: number;
  /** seconds since the last frame */
  dt: number;
}

export interface SaverModule {
  id: string;
  name: string;
  /** the file on disk, as shown by `ls /usr/lib/screens` */
  binary: string;
  description: string;
  /** true if the module paints every frame from scratch */
  animated: boolean;
  create(width: number, height: number): SaverInstance;
}

export interface SaverInstance {
  step(dt: number, width: number, height: number): void;
  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void;
  /** optional ephemeral user interaction (some savers react to movement) */
  reset?(): void;
  info?: () => string;
}

/* ------------------------------------------------------------------ *
 * ElectroPaint                                                        *
 * ------------------------------------------------------------------ */

const electroPaint: SaverModule = {
  id: 'electropaint',
  name: 'ElectroPaint',
  binary: '/usr/lib/screens/electropaint',
  description:
    'The famous one.  Triangles and squares wheel, spin, flip and fold in an ' +
    'endless colour-shifting pattern.  Written by David A. Tristram, 1986.',
  animated: true,
  create: (): SaverInstance => {
    const state: EpState = createEpState({ blend: true });
    return {
      step: (dt: number) => stepEp(state, dt),
      draw: (ctx, w, h) => drawEpFrame(ctx, state, w, h, { clear: true, fill: true }),
      info: () => `${state.actName} · n=${Math.round(state.sliders.n.value)} · ${state.triCount} polys`,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Hopalong  ("space plants")                                          *
 * ------------------------------------------------------------------ */

class HopalongInstance implements SaverInstance {
  private x = 0;
  private y = 0;
  private a = 0;
  private b = 0;
  private c = 0;
  private hue = 0;
  private age = 0;
  private rand = new Rand48();
  private w = 0;
  private h = 0;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.reseed();
  }

  private reseed() {
    this.x = this.rand.range(-1, 1);
    this.y = this.rand.range(-1, 1);
    this.a = this.rand.range(5, 10);
    this.b = this.rand.range(1, 3);
    this.c = Math.sqrt(this.rand.range(1, 2));
    this.hue = this.rand.range(0, 360);
    this.age = 0;
  }

  step(dt: number, w: number, h: number) {
    if (w !== this.w || h !== this.h) {
      this.w = w;
      this.h = h;
      this.reseed();
    }
    this.age += dt;
    // the saver clears and starts a fresh plant every ~40 seconds
    if (this.age > 42) this.reseed();
    this.hue += dt * 18;
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // fade the previous plant a little so overlapping orbits blend
    ctx.fillStyle = 'rgba(0,0,0,0.022)';
    ctx.fillRect(0, 0, w, h);

    const scale = Math.min(w, h) * 0.11;
    const cx = w / 2;
    const cy = h / 2;
    const points = 900;
    for (let i = 0; i < points; i++) {
      const nx = this.y - Math.sign(this.x) * Math.sqrt(Math.abs(this.b * this.x - this.c));
      const ny = this.a - this.x;
      this.x = nx;
      this.y = ny;
      if (Math.abs(this.x) > 60 || Math.abs(this.y) > 60) {
        this.x = this.rand.range(-1, 1);
        this.y = this.rand.range(-1, 1);
        continue;
      }
      const px = cx + this.x * scale;
      const py = cy + this.y * scale;
      if (px < 0 || py < 0 || px >= w || py >= h) continue;
      const hue = (this.hue + Math.abs(this.x) * 9 + i * 0.05) % 360;
      const light = 0.34 + 0.3 * Math.min(1, Math.abs(this.y) / 12);
      ctx.fillStyle = `hsl(${hue}, 88%, ${(light * 100).toFixed(1)}%)`;
      ctx.fillRect(px, py, 1.4, 1.4);
    }
  }
}

const hopalong: SaverModule = {
  id: 'hopalong',
  name: 'Hopalong (space plants)',
  binary: '/usr/lib/screens/spaceplants',
  description:
    'Plane fractal point orbits from a 1986 Scientific American article. ' +
    'Slowly grows a luminous "space plant", then starts a new seed.',
  animated: true,
  create: (w, h) => new HopalongInstance(w, h),
};

/* ------------------------------------------------------------------ *
 * Bounce  (SGI demo)                                                  *
 * ------------------------------------------------------------------ */

class BounceInstance implements SaverInstance {
  private x = 0.2;
  private y = 0.8;
  private vx = 0.47;
  private vy = 0.0;
  private rand = new Rand48();
  private w = 0;
  private h = 0;
  private trail: { x: number; y: number }[] = [];
  private hue = 200;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
  }

  step(dt: number, w: number, h: number) {
    this.w = w;
    this.h = h;
    const g = 2.6;
    const d = Math.min(dt, 0.05);
    this.vy += g * d;
    this.x += this.vx * d;
    this.y += this.vy * d;

    if (this.y > 1) {
      this.y = 1;
      this.vy = -Math.abs(this.vy) * 0.92;
      this.hue = (this.hue + 47) % 360;
    }
    if (this.y < 0.08) {
      this.y = 0.08;
      this.vy = Math.abs(this.vy);
    }
    if (this.x > 0.94 || this.x < 0.06) {
      this.vx = -this.vx;
      this.hue = (this.hue + 31) % 360;
    }
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 26) this.trail.shift();
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // black IRIS GL background with a hint of horizon
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#000004');
    grad.addColorStop(1, '#04040c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const floorY = h * 0.9;
    // checkerboard floor in perspective
    const cols = 16;
    for (let i = 0; i < cols; i++) {
      const t0 = i / cols;
      const t1 = (i + 1) / cols;
      const x0 = (t0 * 2 - 1) * w * 1.6;
      const x1 = (t1 * 2 - 1) * w * 1.6;
      ctx.fillStyle = i % 2 ? '#101018' : '#181822';
      ctx.beginPath();
      ctx.moveTo(x0 + (x0 - w / 2) * 0.6, h);
      ctx.lineTo(x1 + (x1 - w / 2) * 0.6, h);
      ctx.lineTo(x1, floorY);
      ctx.lineTo(x0, floorY);
      ctx.closePath();
      ctx.fill();
    }

    const px = this.x * w;
    const py = floorY - (1 - this.y) * (floorY - h * 0.1);
    const radius = Math.min(w, h) * 0.06;

    // squash and stretch from the vertical velocity
    const squash = Math.max(0.72, Math.min(1.25, 1 - this.vy * 0.12));
    const rx = radius / squash;
    const ry = radius * squash;

    // motion trail
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const f = i / this.trail.length;
      const tx = p.x * w;
      const ty = floorY - (1 - p.y) * (floorY - h * 0.1);
      ctx.fillStyle = `hsla(${(this.hue + 40) % 360}, 90%, 60%, ${0.05 + f * 0.22})`;
      ctx.beginPath();
      ctx.arc(tx, ty, radius * (0.35 + f * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }

    // contact shadow on the floor
    if (this.y > 0.6) {
      const k = (this.y - 0.6) / 0.4;
      ctx.fillStyle = `rgba(0,0,0,${0.55 * k})`;
      ctx.beginPath();
      ctx.ellipse(px, floorY + 2, radius * (1.5 - k * 0.6), radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // lit sphere with SGI-ish gradient
    const g = ctx.createRadialGradient(px - rx * 0.35, py - ry * 0.4, rx * 0.1, px, py, rx * 1.1);
    g.addColorStop(0, `hsl(${this.hue}, 95%, 82%)`);
    g.addColorStop(0.45, `hsl(${this.hue}, 92%, 58%)`);
    g.addColorStop(1, `hsl(${(this.hue + 25) % 360}, 88%, 26%)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // specular highlight
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.ellipse(px - rx * 0.32, py - ry * 0.36, rx * 0.18, ry * 0.13, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

const bounce: SaverModule = {
  id: 'bounce',
  name: 'Bounce',
  binary: '/usr/lib/screens/bounce',
  description:
    'One of the classic SGI demos: a lit, squashing rubber ball bouncing ' +
    'across a checkerboard floor, spraying a colour-cycling motion trail.',
  animated: true,
  create: (w, h) => new BounceInstance(w, h),
};

/* ------------------------------------------------------------------ *
 * Blank                                                              *
 * ------------------------------------------------------------------ */

const blank: SaverModule = {
  id: 'blank',
  name: 'Blank Screen',
  binary: '/usr/lib/screens/blank',
  description: 'Simply blanks the display.  Used by the lock screen and by the ' +
    'power saving mode of the SGI monitors.',
  animated: false,
  create: () => ({
    step: () => undefined,
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
    },
  }),
};

export const SCREEN_SAVER_MODULES: SaverModule[] = [electroPaint, hopalong, bounce, blank];

export function findSaverModule(id: string): SaverModule {
  return SCREEN_SAVER_MODULES.find((m) => m.id === id) ?? electroPaint;
}

export { electroPaint, hopalong, bounce, blank };
