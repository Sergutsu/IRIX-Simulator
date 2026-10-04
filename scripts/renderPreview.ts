/**
 * Offline preview renderer.
 *
 * There is no browser in the build sandbox, so this script provides a minimal
 * canvas-compatible rasteriser (scanline polygon fill, alpha, additive blend,
 * flat gradients) and dumps PNG frames of the ElectroPaint screen saver and the
 * Wavefront Explorer renderer so the output can be eyeballed against the real
 * IRIX captures in public/screenshots.
 *
 *   ./node_modules/.bin/esbuild scripts/renderPreview.ts --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/preview.cjs && node /tmp/preview.cjs /tmp/out
 */
import * as zlib from 'zlib';
import * as fs from 'fs';
import * as path from 'path';
import { createEpState, stepEp, drawEpFrame } from '../src/screensaver/electropaint';
import { SCREEN_SAVER_MODULES } from '../src/screensaver/saverModules';
import { drawScene, ExplorerObject } from '../src/apps/WavefrontExplorerApp';
import { buildPrimitive, PrimitiveId } from '../src/apps/explorer/tavGeometry';

/* ---------------- PNG writer ---------------- */

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function writePng(file: string, width: number, height: number, rgba: Uint8Array) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
}

/* ---------------- tiny rasteriser ---------------- */

interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseColor(c: string): RGB {
  if (typeof c !== 'string') return { r: 0, g: 0, b: 0, a: 1 };
  let m = /^#([0-9a-f]{6})$/i.exec(c);
  if (m) {
    const v = parseInt(m[1], 16);
    return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255, a: 1 };
  }
  m = /^rgba?\(([^)]+)\)$/.exec(c);
  if (m) {
    const p = m[1].split(',').map((s) => parseFloat(s));
    return { r: p[0] | 0, g: p[1] | 0, b: p[2] | 0, a: p[3] === undefined ? 1 : p[3] };
  }
  m = /^hsla?\(([^)]+)\)$/.exec(c);
  if (m) {
    const p = m[1].split(',').map((s) => parseFloat(s));
    return { ...hsl2rgb(p[0], p[1] / 100, p[2] / 100), a: p[3] === undefined ? 1 : p[3] };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

function hsl2rgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return { r: f(0), g: f(8), b: f(4) };
}

class Gradient {
  stops: { offset: number; color: RGB }[] = [];
  constructor(public kind: 'linear' | 'radial') {}
  addColorStop(offset: number, color: string) {
    this.stops.push({ offset, color: parseColor(color) });
  }
  average(): RGB {
    if (!this.stops.length) return { r: 0, g: 0, b: 0, a: 1 };
    const s = this.stops;
    const sum = s.reduce(
      (acc, st) => ({
        r: acc.r + st.color.r,
        g: acc.g + st.color.g,
        b: acc.b + st.color.b,
        a: acc.a + st.color.a,
      }),
      { r: 0, g: 0, b: 0, a: 0 }
    );
    const n = s.length;
    return { r: sum.r / n, g: sum.g / n, b: sum.b / n, a: sum.a / n };
  }
}

class Ctx {
  w: number;
  h: number;
  buf: Uint8Array;
  fillStyle: string | Gradient = '#000';
  strokeStyle = '#fff';
  lineWidth = 1;
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
  lineJoin = 'round';
  font = '';
  imageSmoothingEnabled = true;
  private cur: { x: number; y: number }[] = [];
  private sub: { x: number; y: number }[] = [];

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.buf = new Uint8Array(w * h * 4);
  }

  private setPx(x: number, y: number, c: RGB, alpha: number) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    const a = Math.max(0, Math.min(1, alpha));
    if (this.globalCompositeOperation === 'lighter') {
      this.buf[i] = Math.min(255, this.buf[i] + c.r * a);
      this.buf[i + 1] = Math.min(255, this.buf[i + 1] + c.g * a);
      this.buf[i + 2] = Math.min(255, this.buf[i + 2] + c.b * a);
    } else {
      this.buf[i] = this.buf[i] * (1 - a) + c.r * a;
      this.buf[i + 1] = this.buf[i + 1] * (1 - a) + c.g * a;
      this.buf[i + 2] = this.buf[i + 2] * (1 - a) + c.b * a;
    }
    this.buf[i + 3] = 255;
  }

  private colorOf(): RGB {
    if (this.fillStyle instanceof Gradient) return this.fillStyle.average();
    return parseColor(this.fillStyle as string);
  }

  fillRect(x: number, y: number, w: number, h: number) {
    const c = this.colorOf();
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.w, Math.ceil(x + w));
    const y1 = Math.min(this.h, Math.ceil(y + h));
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) this.setPx(xx, yy, c, c.a * this.globalAlpha);
    }
  }

  beginPath() {
    this.cur = [];
    this.sub = [];
  }
  moveTo(x: number, y: number) {
    this.cur.push({ x, y });
  }
  lineTo(x: number, y: number) {
    this.cur.push({ x, y });
  }
  closePath() {
    if (this.cur.length) this.cur.push({ ...this.cur[0] });
  }
  arc(cx: number, cy: number, r: number, a0 = 0, a1 = Math.PI * 2) {
    const n = 28;
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      this.cur.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, rot = 0, a0 = 0, a1 = Math.PI * 2) {
    const n = 28;
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      const x = Math.cos(a) * rx;
      const y = Math.sin(a) * ry;
      this.cur.push({
        x: cx + x * Math.cos(rot) - y * Math.sin(rot),
        y: cy + x * Math.sin(rot) + y * Math.cos(rot),
      });
    }
  }
  fill() {
    this.polygon(this.cur, this.colorOf(), this.globalAlpha);
  }
  stroke() {
    const c = parseColor(this.strokeStyle as string);
    for (let i = 0; i < this.cur.length - 1; i++) this.line(this.cur[i], this.cur[i + 1], c);
  }
  save() {}
  restore() {
    this.globalAlpha = 1;
    this.globalCompositeOperation = 'source-over';
  }
  scale() {}
  setTransform() {}
  drawImage() {}
  /** the Gouraud pass reads the frame back, interpolates, and writes it again */
  getImageData(x: number, y: number, gw: number, gh: number) {
    return { width: gw, height: gh, data: this.buf.subarray(0) as unknown as Uint8ClampedArray, originX: x, originY: y };
  }
  putImageData(img: { data: Uint8ClampedArray | Uint8Array }) {
    if (img && img.data) this.buf.set(img.data as Uint8Array);
  }
  fillText() {}
  strokeText() {}
  measureText() {
    return { width: 0 };
  }
  createLinearGradient() {
    return new Gradient('linear');
  }
  createRadialGradient() {
    return new Gradient('radial');
  }

  private line(a: { x: number; y: number }, b: { x: number; y: number }, c: RGB) {
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
    for (let i = 0; i <= steps; i++) {
      const t = steps ? i / steps : 0;
      this.setPx(
        Math.round(a.x + (b.x - a.x) * t),
        Math.round(a.y + (b.y - a.y) * t),
        c,
        c.a * this.globalAlpha
      );
    }
  }

  /** even-odd scanline fill with 1px antialiasing-free edges (IRIS GL look) */
  private polygon(pts: { x: number; y: number }[], c: RGB, alpha: number) {
    if (pts.length < 3) return;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const y0 = Math.max(0, Math.floor(minY));
    const y1 = Math.min(this.h - 1, Math.ceil(maxY));
    const xs: number[] = [];
    for (let y = y0; y <= y1; y++) {
      xs.length = 0;
      const sy = y + 0.5;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        if ((a.y <= sy && b.y > sy) || (b.y <= sy && a.y > sy)) {
          xs.push(a.x + ((sy - a.y) / (b.y - a.y)) * (b.x - a.x));
        }
      }
      if (xs.length < 2) continue;
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const sx = Math.max(0, Math.round(xs[i]));
        const ex = Math.min(this.w - 1, Math.round(xs[i + 1]));
        for (let x = sx; x <= ex; x++) this.setPx(x, y, c, c.a * alpha);
      }
    }
  }
}

/* ---------------- preview renders ---------------- */

const outDir = process.argv[2] || '/tmp/irix-preview';
fs.mkdirSync(outDir, { recursive: true });

// 1. ElectroPaint, several moments in the choreography
{
  const state = createEpState({ seed: 4242 });
  const ctx = new Ctx(1024, 768);
  let shot = 0;
  const shotAt = [90, 420, 900, 1500, 2400];
  for (let i = 0; i < 2500; i++) {
    stepEp(state, 1 / 30);
    if (shotAt.includes(i)) {
      drawEpFrame(ctx as unknown as CanvasRenderingContext2D, state, 1024, 768, {
        clear: true,
        fill: true,
      });
      writePng(`${outDir}/electropaint-${++shot}-f${i}.png`, 1024, 768, ctx.buf);
    }
  }
  console.log(`ElectroPaint previews written (act: ${state.actName}, n=${Math.round(state.sliders.n.value)})`);
}

// 2. Screen saver modules
{
  for (const mod of SCREEN_SAVER_MODULES.filter((m) => m.id === 'bounce' || m.id === 'hopalong')) {
    const inst = mod.create(800, 600);
    const ctx = new Ctx(800, 600);
    for (let i = 0; i < 900; i++) {
      inst.step(1 / 60, 800, 600);
      inst.draw(ctx as unknown as CanvasRenderingContext2D, 800, 600);
    }
    writePng(`${outDir}/saver-${mod.id}.png`, 800, 600, ctx.buf);
    console.log(`saver preview: ${mod.id}`);
  }
}

// 3. Wavefront Explorer: piston + shading qualities
{
  const piston: ExplorerObject = {
    id: 'p',
    name: 'piston_assembly.obj',
    primitive: 'piston' as PrimitiveId,
    pos: [-0.55, 0, 0],
    deform: 'none',
    deformAmount: 0,
    material: 'chrome',
    keys: [
      { frame: 0, rx: 0.1, ry: 0.4, rz: 0 },
      { frame: 120, rx: 0.1, ry: 2.2, rz: 0 },
    ],
    visible: true,
  };
  const torus: ExplorerObject = {
    id: 't',
    name: 'torus_1.obj',
    primitive: 'torus' as PrimitiveId,
    pos: [0.95, 0.1, 0],
    deform: 'twist',
    deformAmount: 0.35,
    material: 'gold',
    keys: [{ frame: 0, rx: 0.9, ry: 1.2, rz: 0.2 }],
    visible: true,
  };
  for (const q of ['wireframe', 'hiddenline', 'flat', 'gouraud', 'raytrace'] as const) {
    const ctx = new Ctx(640, 480);
    drawScene(
      ctx as unknown as CanvasRenderingContext2D,
      640,
      480,
      [piston, torus],
      { yaw: 0.5, pitch: 0.28, dist: 4.1, target: [0, -0.3, 0] },
      { quality: q, showGrid: true, floor: true, lightAngle: 1.2, frame: 40 }
    );
    writePng(`${outDir}/explorer-${q}.png`, 640, 480, ctx.buf);
  }
  console.log('Explorer previews written (5 shading qualities)');
  console.log(`mesh verts: ${buildPrimitive('piston').verts.length}`);
}

console.log('output:', outDir);
