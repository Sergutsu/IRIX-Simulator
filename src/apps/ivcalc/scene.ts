/**
 * 3D keypad for IVcalc. Boxes are in a y-up space, front face toward +Z.
 */
import type { CalcState } from './engine';
import { surfaceInk, type InkQuad } from './glyphs';

export type Vec3 = [number, number, number];

export interface CalcPose {
  /** radians, tilt about X */
  rx: number;
  /** radians, yaw about Y */
  ry: number;
  dist: number;
  /** vertical field of view, degrees */
  fov: number;
  ortho: boolean;
}

/** Tilted back and to the left so the front and the right edge show, like the demo. */
export const HOME_POSE: CalcPose = { rx: -0.42, ry: -0.48, dist: 5.6, fov: 45, ortho: false };

export interface CalcKey {
  id: string;
  label: string;
  color: 'blue' | 'olive';
}

type Layer = 'body' | 'bezel' | 'screen' | 'key';

interface Quad {
  v: [Vec3, Vec3, Vec3, Vec3];
  rgb: [number, number, number];
  layer: Layer;
  keyId?: string;
  label?: string;
}

const BLUE: [number, number, number] = [44, 78, 196];
const BLUE_SIDE: [number, number, number] = [28, 48, 130];
const OLIVE: [number, number, number] = [92, 108, 52];
const OLIVE_SIDE: [number, number, number] = [62, 74, 34];
const BODY: [number, number, number] = [224, 148, 42];
const BODY_SIDE: [number, number, number] = [186, 112, 28];
const BEZEL: [number, number, number] = [150, 150, 156];
const SCREEN: [number, number, number] = [198, 200, 206];

const KEYS: { id: string; label: string; color: 'blue' | 'olive' }[] = [
  { id: 'AC', label: 'AC', color: 'blue' },
  { id: 'CE', label: 'CE', color: 'blue' },
  { id: '%', label: '❄', color: 'blue' },
  { id: '/', label: '/', color: 'blue' },
  { id: '7', label: '7', color: 'olive' },
  { id: '8', label: '8', color: 'olive' },
  { id: '9', label: '9', color: 'olive' },
  { id: '*', label: '*', color: 'blue' },
  { id: '4', label: '4', color: 'olive' },
  { id: '5', label: '5', color: 'olive' },
  { id: '6', label: '6', color: 'olive' },
  { id: '-', label: '-', color: 'blue' },
  { id: '3', label: '3', color: 'olive' },
  { id: '2', label: '2', color: 'olive' },
  { id: '1', label: '1', color: 'olive' },
  { id: '+', label: '+', color: 'blue' },
  { id: '0', label: '0', color: 'olive' },
  { id: '+/-', label: '+/-', color: 'olive' },
  { id: '.', label: '.', color: 'olive' },
  { id: '=', label: '=', color: 'blue' },
];

export function calcKeys(): CalcKey[] {
  return KEYS.map((k) => ({ id: k.id, label: k.label, color: k.color }));
}

function addBox(
  out: Quad[],
  min: Vec3,
  max: Vec3,
  front: [number, number, number],
  side: [number, number, number],
  layer: Layer,
  key?: { id: string; label: string }
) {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  const face = (
    v: [Vec3, Vec3, Vec3, Vec3],
    rgb: [number, number, number],
    keyId?: string,
    label?: string
  ) => {
    out.push({ v, rgb, layer, keyId, label });
  };
  // Outward normals: front +Z, back -Z, right +X, left -X, top +Y, bottom -Y.
  face(
    [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
    ],
    front,
    key?.id,
    key?.label
  );
  face(
    [
      [x1, y0, z0],
      [x0, y0, z0],
      [x0, y1, z0],
      [x1, y1, z0],
    ],
    side
  );
  face(
    [
      [x1, y0, z1],
      [x1, y0, z0],
      [x1, y1, z0],
      [x1, y1, z1],
    ],
    side
  );
  face(
    [
      [x0, y0, z1],
      [x0, y1, z1],
      [x0, y1, z0],
      [x0, y0, z0],
    ],
    side
  );
  face(
    [
      [x0, y1, z1],
      [x1, y1, z1],
      [x1, y1, z0],
      [x0, y1, z0],
    ],
    side
  );
  face(
    [
      [x0, y0, z0],
      [x1, y0, z0],
      [x1, y0, z1],
      [x0, y0, z1],
    ],
    side
  );
}

function buildQuads(pressedId: string | null): Quad[] {
  const quads: Quad[] = [];
  const faceZ = 0.22;
  addBox(quads, [-1.28, -1.72, 0], [1.28, 1.58, faceZ], BODY, BODY_SIDE, 'body');
  addBox(quads, [-1.05, 0.92, faceZ], [1.05, 1.4, 0.26], BEZEL, BEZEL, 'bezel');
  quads.push({
    v: [
      [-0.96, 0.98, 0.265],
      [0.96, 0.98, 0.265],
      [0.96, 1.34, 0.265],
      [-0.96, 1.34, 0.265],
    ],
    rgb: SCREEN,
    layer: 'screen',
  });

  const cols = 4;
  const keyW = 0.5;
  const keyH = 0.4;
  const gapX = 0.07;
  const gapY = 0.06;
  const gridW = cols * keyW + (cols - 1) * gapX;
  const x0 = -gridW / 2;
  const yTop = 0.78;
  KEYS.forEach((key, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = x0 + col * (keyW + gapX);
    const y = yTop - (row + 1) * keyH - row * gapY;
    const sunk = pressedId === key.id;
    const z1 = sunk ? faceZ + 0.04 : faceZ + 0.1;
    const rgb = key.color === 'blue' ? BLUE : OLIVE;
    const side = key.color === 'blue' ? BLUE_SIDE : OLIVE_SIDE;
    addBox(quads, [x, y, faceZ], [x + keyW, y + keyH, z1], rgb, side, 'key', { id: key.id, label: key.label });
  });
  return quads;
}

export function rotatePoint(v: Vec3, pose: CalcPose): Vec3 {
  const cy = Math.cos(pose.ry);
  const sy = Math.sin(pose.ry);
  const x1 = v[0] * cy + v[2] * sy;
  const z1 = -v[0] * sy + v[2] * cy;
  const cx = Math.cos(pose.rx);
  const sx = Math.sin(pose.rx);
  const y2 = v[1] * cx - z1 * sx;
  const z2 = v[1] * sx + z1 * cx;
  return [x1, y2, z2];
}

interface Proj {
  x: number;
  y: number;
  z: number;
}

function project(v: Vec3, pose: CalcPose, w: number, h: number): Proj {
  const r = rotatePoint(v, pose);
  // +Z on the keypad points at the camera, so it reduces depth.
  const z = pose.dist - r[2];
  if (pose.ortho) {
    const s = (h * 0.42) / Math.max(0.2, pose.fov / 45);
    return { x: w / 2 + r[0] * s, y: h / 2 - r[1] * s, z };
  }
  const f = h / 2 / Math.tan((pose.fov * Math.PI) / 360);
  const safe = Math.max(0.15, z);
  return { x: w / 2 + (r[0] * f) / safe, y: h / 2 - (r[1] * f) / safe, z: safe };
}

function normalOf(v: [Vec3, Vec3, Vec3, Vec3]): Vec3 {
  const ax = v[1][0] - v[0][0];
  const ay = v[1][1] - v[0][1];
  const az = v[1][2] - v[0][2];
  const bx = v[2][0] - v[0][0];
  const by = v[2][1] - v[0][1];
  const bz = v[2][2] - v[0][2];
  const nx = ay * bz - az * by;
  const ny = az * bx - ax * bz;
  const nz = ax * by - ay * bx;
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}

function lit(rgb: [number, number, number], n: Vec3, pose: CalcPose): string {
  const rn = rotatePoint(n, pose);
  const len = Math.hypot(rn[0], rn[1], rn[2]) || 1;
  const L: Vec3 = [0.25, 0.72, 0.65];
  const ll = Math.hypot(L[0], L[1], L[2]);
  const lam = Math.max(0, (rn[0] / len) * (L[0] / ll) + (rn[1] / len) * (L[1] / ll) + (rn[2] / len) * (L[2] / ll));
  const k = 0.42 + 0.7 * lam;
  const c = rgb.map((ch) => Math.max(0, Math.min(255, Math.round(ch * k))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function pointInTri(px: number, py: number, a: Proj, b: Proj, c: Proj): boolean {
  const sign = (p: Proj, q: Proj, r: { x: number; y: number }) =>
    (p.x - r.x) * (q.y - r.y) - (q.x - r.x) * (p.y - r.y);
  const hit = { x: px, y: py };
  const d1 = sign(a, b, hit);
  const d2 = sign(b, c, hit);
  const d3 = sign(c, a, hit);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

function pointInQuad(px: number, py: number, q: Proj[]): boolean {
  return pointInTri(px, py, q[0], q[1], q[2]) || pointInTri(px, py, q[0], q[2], q[3]);
}

export function keyScreenPoint(label: string, pose: CalcPose, w: number, h: number): { x: number; y: number } | null {
  const quad = buildQuads(null).find((q) => q.keyId === label);
  if (!quad) return null;
  const proj = quad.v.map((v) => project(v, pose, w, h));
  return {
    x: proj.reduce((s, p) => s + p.x, 0) / proj.length,
    y: proj.reduce((s, p) => s + p.y, 0) / proj.length,
  };
}

export function keyFacesCamera(label: string, pose: CalcPose): boolean {
  const quad = buildQuads(null).find((q) => q.keyId === label);
  if (!quad) return false;
  const n = normalOf(quad.v);
  return rotatePoint(n, pose)[2] > 0.2;
}

export function pickCalcKey(
  pose: CalcPose,
  sx: number,
  sy: number,
  w: number,
  h: number,
  pressedId: string | null
): string | null {
  let best: { id: string; z: number } | null = null;
  for (const quad of buildQuads(pressedId)) {
    if (!quad.keyId) continue;
    const proj = quad.v.map((v) => project(v, pose, w, h));
    if (proj.some((p) => p.z < 0.2)) continue;
    if (!pointInQuad(sx, sy, proj)) continue;
    const z = proj.reduce((s, p) => s + p.z, 0) / proj.length;
    if (!best || z < best.z) best = { id: quad.keyId, z };
  }
  return best?.id ?? null;
}

export function drawCalculator(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pose: CalcPose,
  pressedId: string | null,
  display: string
) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  const quads = buildQuads(pressedId)
    .map((quad) => {
      const proj = quad.v.map((v) => project(v, pose, w, h));
      const z = proj.reduce((s, p) => s + p.z, 0) / proj.length;
      return { quad, proj, z, n: normalOf(quad.v) };
    })
    .filter((item) => item.proj.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)))
    .sort((a, b) => b.z - a.z);

  const ink: { proj: Proj[]; z: number; rgb: [number, number, number] }[] = [];
  const pushInk = (quadsOnFace: InkQuad[]) => {
    for (const glyph of quadsOnFace) {
      const proj = glyph.v.map((v) => project(v, pose, w, h));
      if (proj.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.z < 0.2)) continue;
      const z = proj.reduce((s, p) => s + p.z, 0) / proj.length;
      ink.push({ proj, z, rgb: glyph.rgb });
    }
  };
  const layers: Layer[] = ['body', 'bezel', 'screen', 'key'];
  for (const layer of layers) {
    for (const item of quads) {
      if (item.quad.layer !== layer) continue;
      const facing = rotatePoint(item.n, pose)[2];
      if (facing <= 0.02) continue;
      ctx.beginPath();
      ctx.moveTo(item.proj[0].x, item.proj[0].y);
      for (let i = 1; i < item.proj.length; i++) ctx.lineTo(item.proj[i].x, item.proj[i].y);
      ctx.closePath();
      ctx.fillStyle = lit(item.quad.rgb, item.n, pose);
      ctx.fill();
      if (facing <= 0.12) continue;
      if (item.quad.label) pushInk(surfaceInk(item.quad.label, item.quad.v, [244, 244, 244], 'center', false));
      if (item.quad.layer === 'screen') pushInk(surfaceInk(display, item.quad.v, [22, 22, 22], 'right', true));
    }
  }

  ink.sort((a, b) => b.z - a.z);
  for (const item of ink) {
    ctx.beginPath();
    ctx.moveTo(item.proj[0].x, item.proj[0].y);
    for (let i = 1; i < item.proj.length; i++) ctx.lineTo(item.proj[i].x, item.proj[i].y);
    ctx.closePath();
    ctx.fillStyle = `rgb(${item.rgb[0]},${item.rgb[1]},${item.rgb[2]})`;
    ctx.fill();
  }
}

export function displayOf(state: CalcState): string {
  return state.display;
}
