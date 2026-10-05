/**
 * Polygon glyphs laid out on a quad in object space.
 * Each filled cell is a real face, so the legend tilts with the key.
 */
import type { Vec3 } from './scene';

type Poly2 = [number, number][];

/** 5x7 bitmaps, top row first. '.' is off, 'X' is on. */
const BITMAP: Record<string, string[]> = {
  '0': ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  '1': ['..X..', '.XX..', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..', '.XXX.'],
  '2': ['.XXX.', 'X...X', '....X', '...X.', '..X..', '.X...', 'X....', 'X....', 'XXXXX'],
  '3': ['.XXX.', 'X...X', '....X', '....X', '..XX.', '....X', '....X', 'X...X', '.XXX.'],
  '4': ['...X.', '..XX.', '.X.X.', 'X..X.', 'XXXXX', '...X.', '...X.', '...X.', '...X.'],
  '5': ['XXXXX', 'X....', 'X....', 'XXXX.', '....X', '....X', '....X', 'X...X', '.XXX.'],
  '6': ['.XXX.', 'X...X', 'X....', 'X....', 'XXXX.', 'X...X', 'X...X', 'X...X', '.XXX.'],
  '7': ['XXXXX', '....X', '....X', '...X.', '..X..', '.X...', '.X...', '.X...', '.X...'],
  '8': ['.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.'],
  '9': ['.XXX.', 'X...X', 'X...X', 'X...X', '.XXXX', '....X', '....X', 'X...X', '.XXX.'],
  A: ['..X..', '.X.X.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X', 'X...X'],
  C: ['.XXXX', 'X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'X....', '.XXXX'],
  E: ['XXXXX', 'X....', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'X....', 'XXXXX'],
  e: ['.....', '.....', '.XXX.', 'X...X', 'XXXXX', 'X....', 'X....', '.XXX.', '.....'],
  r: ['.....', '.....', 'XXXX.', 'X...X', 'X....', 'X....', 'X....', 'X....', '.....'],
  o: ['.....', '.....', '.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.', '.....'],
};

const COLS = 5;
const ROWS = 9;
const GAP = 1;

function bitmapPolys(rows: string[]): Poly2[] {
  const polys: Poly2[] = [];
  rows.forEach((row, rowIndex) => {
    const y = ROWS - 1 - rowIndex;
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== 'X') continue;
      polys.push([
        [x, y],
        [x + 1, y],
        [x + 1, y + 1],
        [x, y + 1],
      ]);
    }
  });
  return polys;
}

function bar(x: number, y: number, w: number, h: number): Poly2 {
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
}

function barThrough(cx: number, cy: number, angle: number, halfLen: number, halfThick: number): Poly2 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const px = -s * halfThick;
  const py = c * halfThick;
  const dx = c * halfLen;
  const dy = s * halfLen;
  return [
    [cx + dx + px, cy + dy + py],
    [cx - dx + px, cy - dy + py],
    [cx - dx - px, cy - dy - py],
    [cx + dx - px, cy + dy - py],
  ];
}

function starPolys(): Poly2[] {
  const polys: Poly2[] = [];
  for (let i = 0; i < 3; i++) polys.push(barThrough(2.5, 4.5, (i * Math.PI) / 3, 2.35, 0.34));
  return polys;
}

function glyphPolys(ch: string): Poly2[] {
  if (ch === '❄' || ch === '*') return starPolys();
  if (ch === '+') return [bar(2, 1.2, 1, 6.6), bar(0.4, 4, 4.2, 1)];
  if (ch === '-') return [bar(0.4, 4, 4.2, 1)];
  if (ch === '=') return [bar(0.4, 5.3, 4.2, 0.9), bar(0.4, 2.8, 4.2, 0.9)];
  if (ch === '.') return [bar(1.5, 0.2, 1.8, 2.6)];
  if (ch === '/') {
    const slash: Poly2 = [
      [4.3, 8.2],
      [5.2, 8.2],
      [1.2, 0.4],
      [0.3, 0.4],
    ];
    return [slash];
  }
  const rows = BITMAP[ch] ?? BITMAP[ch.toUpperCase()];
  return rows ? bitmapPolys(rows) : [bar(1.5, 3.5, 2, 2)];
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function mul(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function len(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]) || 1;
}

export interface InkQuad {
  v: [Vec3, Vec3, Vec3, Vec3];
  rgb: [number, number, number];
}

/**
 * Place `text` on the face. Vertex order is bottom-left, bottom-right, top-right, top-left.
 * `align` 'right' keeps the LCD reading against the right edge of the screen.
 */
export function surfaceInk(
  text: string,
  face: [Vec3, Vec3, Vec3, Vec3],
  rgb: [number, number, number],
  align: 'center' | 'right',
  italic: boolean
): InkQuad[] {
  const chars = [...text].filter((ch) => ch !== ' ');
  if (chars.length === 0) return [];
  const origin = face[0];
  const axisU = sub(face[1], face[0]);
  const axisV = sub(face[3], face[0]);
  const width = len(axisU);
  const height = len(axisV);
  const uHat = mul(axisU, 1 / width);
  const vHat = mul(axisV, 1 / height);
  const nx = axisU[1] * axisV[2] - axisU[2] * axisV[1];
  const ny = axisU[2] * axisV[0] - axisU[0] * axisV[2];
  const nz = axisU[0] * axisV[1] - axisU[1] * axisV[0];
  const nHat = mul([nx, ny, nz], 1 / (Math.hypot(nx, ny, nz) || 1));
  const lift = mul(nHat, 0.012);

  const unitsW = chars.length * COLS + (chars.length - 1) * GAP;
  const italicUnits = italic ? 0.32 * ROWS : 0;
  let glyphH = height * (align === 'right' ? 0.72 : 0.62);
  let glyphSpan = (glyphH * (unitsW + italicUnits)) / ROWS;
  const maxW = width * (align === 'right' ? 0.9 : 0.84);
  if (glyphSpan > maxW) {
    const fit = maxW / glyphSpan;
    glyphH *= fit;
    glyphSpan *= fit;
  }
  const margin = width * 0.05;
  const startX = align === 'right' ? width - margin - glyphSpan : (width - glyphSpan) / 2;
  const startY = (height - glyphH) / 2;
  const unit = glyphH / ROWS;
  const shear = italic ? 0.32 * unit : 0;

  const quads: InkQuad[] = [];
  chars.forEach((ch, index) => {
    const x0 = startX + index * (COLS + GAP) * unit;
    for (const poly of glyphPolys(ch)) {
      const v = poly.map(([px, py]) => {
        const x = x0 + px * unit + py * shear;
        const y = startY + py * unit;
        return add(add(add(origin, mul(uHat, x)), mul(vHat, y)), lift);
      }) as [Vec3, Vec3, Vec3, Vec3];
      quads.push({ v, rgb });
    }
  });
  return quads;
}
