/**
 * Software viewport for Advanced Visualizer Model 4.2.1.
 * Kept out of the React component file so Vite Fast Refresh can update the UI.
 */
import {
  buildPrimitive,
  cornerNormals,
  deformMesh,
  faceNormalOf,
  DeformId,
  matMul,
  matRotX,
  matRotY,
  matRotZ,
  Mesh,
  PrimitiveId,
  Vec3,
} from './tavGeometry';

export type ExplorerTool = 'model' | 'shade' | 'animate' | 'render';
export type RenderQuality = 'wireframe' | 'hiddenline' | 'flat' | 'gouraud' | 'raytrace';

export interface Keyframe {
  frame: number;
  rx: number;
  ry: number;
  rz: number;
}

export interface ExplorerObject {
  id: string;
  name: string;
  primitive: PrimitiveId;
  /** placement in the modeler's world space */
  pos: Vec3;
  /** Euler rotation in radians. When set, it is the modeled pose. */
  rot?: Vec3;
  /** per-axis scale about the object's origin */
  scale?: Vec3;
  deform: DeformId;
  deformAmount: number;
  material: string;
  /** multiplied in place of the library colour when Property edits it */
  tint?: [number, number, number];
  /** world-space hull after a boolean or mirror. Replaces the primitive. */
  baked?: Mesh;
  keys: Keyframe[];
  visible: boolean;
  group?: string;
}

interface Material {
  id: string;
  label: string;
  color: [number, number, number];
  specular: number;
  shine: number;
  transparency: number;
}

export const MATERIALS: Material[] = [
  { id: 'chrome', label: 'Polished Chrome', color: [196, 205, 214], specular: 0.95, shine: 90, transparency: 0.0 },
  { id: 'gold', label: 'Gold / Metal', color: [214, 168, 62], specular: 0.85, shine: 70, transparency: 0.0 },
  { id: 'copper', label: 'Copper', color: [190, 112, 68], specular: 0.7, shine: 54, transparency: 0.0 },
  { id: 'jade', label: 'Jade', color: [86, 168, 122], specular: 0.5, shine: 42, transparency: 0.12 },
  { id: 'plastic_red', label: 'Plastic Red', color: [198, 54, 58], specular: 0.6, shine: 34, transparency: 0.0 },
  { id: 'plastic_blue', label: 'Plastic Blue', color: [64, 96, 186], specular: 0.6, shine: 34, transparency: 0.0 },
  { id: 'glass', label: 'Glass', color: [188, 214, 226], specular: 0.9, shine: 84, transparency: 0.72 },
  { id: 'matte_grey', label: 'Matte Grey Clay', color: [168, 168, 164], specular: 0.08, shine: 10, transparency: 0.0 },
];

export const RESOLUTIONS = [
  { id: '320x240', w: 320, h: 240 },
  { id: '640x480', w: 640, h: 480 },
  { id: '1024x768', w: 1024, h: 768 },
];

const QUALITY_LABELS: { id: RenderQuality; label: string; hint: string }[] = [
  { id: 'wireframe', label: 'Wireframe', hint: 'IRIS GL lines, no hidden surface removal' },
  { id: 'hiddenline', label: 'Hidden Line', hint: 'Backface culling + line drawing' },
  { id: 'flat', label: 'Flat Shaded', hint: 'One colour per facet, painter sorted' },
  { id: 'gouraud', label: 'Gouraud Shaded', hint: 'Smooth interpolated vertex colours' },
  { id: 'raytrace', label: 'Ray Traced', hint: 'Supersampled with soft ground shadow' },
];

export interface Camera {
  yaw: number;
  pitch: number;
  dist: number;
  target: Vec3;
}

interface DrawOptions {
  quality: RenderQuality;
  showGrid: boolean;
  floor: boolean;
  lightAngle: number;
  /** current timeline frame, used to evaluate the rotation channels */
  frame: number;
  /**
   * Crease/smoothing angle in degrees.  Faces meeting at a shallower angle
   * share a smooth normal; sharper edges stay hard.  0 = faceted, 45 (the
   * default) keeps curved hulls smooth and boxes crisp.
   */
  smoothAngle?: number;
  /** Model 4.2.1 clears the view to Motif grey; IRIS GL preview stays black. */
  backdrop?: 'black' | 'modeler';
  /** wire / hidden-line colour. The modeler draws orange wires on grey. */
  wireColor?: string;
  axes?: boolean;
  /** draw the picked hull in a lighter wire and a marker at its origin */
  selectedId?: string;
  /** short lines along face normals of the picked hull */
  normals?: boolean;
}

/**
 * A Gouraud-shaded triangle, ready for the software rasteriser.
 *
 * Explore and the Advanced Visualizer shaded *vertex* colours and
 * interpolated them across the polygon; that is what makes a low polygon
 * mesh read as a smooth surface instead of a pile of flat facets.
 */
interface ShadedTri {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  cx: number;
  cy: number;
  /** vertex colours 0..255 */
  r0: number;
  g0: number;
  b0: number;
  r1: number;
  g1: number;
  b1: number;
  r2: number;
  g2: number;
  b2: number;
  alpha: number;
  depth: number;
}

/**
 * Software Gouraud rasteriser: barycentric colour interpolation straight into
 * the canvas pixels, painter-sorted exactly like the rest of this renderer.
 * `scale` maps the logical drawing units onto canvas device pixels (the ray
 * traced pass draws at 2x).
 */
function rasterizeShaded(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scale: number,
  tris: ShadedTri[]
): boolean {
  const dw = Math.max(1, Math.round(w * scale));
  const dh = Math.max(1, Math.round(h * scale));
  const getImage =
    typeof (ctx as unknown as { getImageData?: unknown }).getImageData === 'function';
  if (!getImage) return false;
  let img: { data: Uint8ClampedArray | Uint8Array; width: number; height: number } | undefined;
  try {
    img = ctx.getImageData(0, 0, dw, dh);
  } catch {
    return false;
  }
  if (!img || !img.data || img.data.length < dw * dh * 4) return false;
  const data = img.data;

  for (const t of tris) {
    const ax = t.ax * scale;
    const ay = t.ay * scale;
    const bx = t.bx * scale;
    const by = t.by * scale;
    const cx = t.cx * scale;
    const cy = t.cy * scale;
    const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
    const maxX = Math.min(dw - 1, Math.ceil(Math.max(ax, bx, cx)));
    const minY = Math.max(0, Math.floor(Math.min(ay, by, cy)));
    const maxY = Math.min(dh - 1, Math.ceil(Math.max(ay, by, cy)));
    if (maxX < minX || maxY < minY) continue;
    const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
    if (area === 0) continue;
    const inv = 1 / area;
    const a = t.alpha;
    // colour at the third corner plus the two barycentric deltas
    const dr0 = t.r0 - t.r2;
    const dg0 = t.g0 - t.g2;
    const db0 = t.b0 - t.b2;
    const dr1 = t.r1 - t.r2;
    const dg1 = t.g1 - t.g2;
    const db1 = t.b1 - t.b2;
    for (let y = minY; y <= maxY; y++) {
      const py = y + 0.5;
      let row = (y * dw + minX) * 4;
      for (let x = minX; x <= maxX; x++, row += 4) {
        const px = x + 0.5;
        const w0 = ((bx - px) * (cy - py) - (cx - px) * (by - py)) * inv;
        const w1 = ((cx - px) * (ay - py) - (ax - px) * (cy - py)) * inv;
        const w2 = 1 - w0 - w1;
        if (w0 < -0.002 || w1 < -0.002 || w2 < -0.002) continue;
        const r = t.r2 + w0 * dr0 + w1 * dr1;
        const g = t.g2 + w0 * dg0 + w1 * dg1;
        const b = t.b2 + w0 * db0 + w1 * db1;
        if (a >= 1) {
          data[row] = r;
          data[row + 1] = g;
          data[row + 2] = b;
        } else {
          const ia = 1 - a;
          data[row] = data[row] * ia + r * a;
          data[row + 1] = data[row + 1] * ia + g * a;
          data[row + 2] = data[row + 2] * ia + b * a;
        }
        data[row + 3] = 255;
      }
    }
  }
  ctx.putImageData(img as ImageData, 0, 0);
  return true;
}

/* ------------------------------------------------------------------ *
 * Software renderer (IRIS GL style)                                   *
 * ------------------------------------------------------------------ */

interface Projected {
  x: number;
  y: number;
  z: number;
}

/** world -> view space (+Z points away from the camera) */
function viewTransform(v: Vec3, cam: Camera): Vec3 {
  const cy = Math.cos(cam.yaw);
  const sy = Math.sin(cam.yaw);
  const cp = Math.cos(cam.pitch);
  const sp = Math.sin(cam.pitch);
  const x0 = v[0] - cam.target[0];
  const y0 = v[1] - cam.target[1];
  const z0 = v[2] - cam.target[2];
  const x1 = x0 * cy + z0 * sy;
  const z1 = -x0 * sy + z0 * cy;
  const y2 = y0 * cp - z1 * sp;
  const z2 = y0 * sp + z1 * cp;
  return [x1, y2, z2 + cam.dist];
}

/** view space -> screen, given a near plane distance */
function projectView(v: Vec3, w: number, h: number): Projected {
  const fov = Math.min(w, h) * 0.92;
  const s = fov / v[2];
  return { x: w / 2 + v[0] * s, y: h / 2 - v[1] * s, z: v[2] };
}

const NEAR_PLANE = 0.3;

function project(v: Vec3, cam: Camera, w: number, h: number): Projected {
  return projectView(viewTransform(v, cam), w, h);
}

/**
 * Clip a segment against the near plane before projecting.  Without this,
 * geometry behind the camera mirrors through the projection and draws
 * nonsense across the screen — which is exactly what an unclipped grid does.
 */
function projectSegment(
  a: Vec3,
  b: Vec3,
  cam: Camera,
  w: number,
  h: number
): [Projected, Projected] | null {
  let va = viewTransform(a, cam);
  let vb = viewTransform(b, cam);
  if (va[2] < NEAR_PLANE && vb[2] < NEAR_PLANE) return null;
  const t = (NEAR_PLANE - va[2]) / (vb[2] - va[2]);
  const clip = (v0: Vec3, v1: Vec3): Vec3 => [
    v0[0] + (v1[0] - v0[0]) * t,
    v0[1] + (v1[1] - v0[1]) * t,
    v0[2] + (v1[2] - v0[2]) * t,
  ];
  if (va[2] < NEAR_PLANE) va = clip(va, vb);
  if (vb[2] < NEAR_PLANE) vb = clip(va, vb);
  return [projectView(va, w, h), projectView(vb, w, h)];
}

/** Nearest visible vertex under a viewport pixel, or null. */
export function pickHit(
  objects: ExplorerObject[],
  cam: Camera,
  frame: number,
  sx: number,
  sy: number,
  w: number,
  h: number
): { id: string; vertex: number } | null {
  let best: { id: string; vertex: number } | null = null;
  let bestD = 18;
  for (const obj of objects) {
    if (!obj.visible) continue;
    const [rx, ry, rz] = objectRotationAt(obj, frame);
    const rot = matMul(matMul(matRotY(ry), matRotX(rx)), matRotZ(rz));
    const sc = obj.scale ?? [1, 1, 1];
    const mesh = meshFor(obj);
    mesh.verts.forEach((v, vertex) => {
      const sv: Vec3 = [v[0] * sc[0], v[1] * sc[1], v[2] * sc[2]];
      const world: Vec3 = [
        rot.m[0] * sv[0] + rot.m[4] * sv[1] + rot.m[8] * sv[2] + obj.pos[0],
        rot.m[1] * sv[0] + rot.m[5] * sv[1] + rot.m[9] * sv[2] + obj.pos[1],
        rot.m[2] * sv[0] + rot.m[6] * sv[1] + rot.m[10] * sv[2] + obj.pos[2],
      ];
      const q = projectView(viewTransform(world, cam), w, h);
      if (q.z < NEAR_PLANE) return;
      const d = Math.hypot(q.x - sx, q.y - sy);
      if (d < bestD) {
        bestD = d;
        best = { id: obj.id, vertex };
      }
    });
  }
  return best;
}

/** Nearest visible object under a viewport pixel, or null. */
export function pickObject(
  objects: ExplorerObject[],
  cam: Camera,
  frame: number,
  sx: number,
  sy: number,
  w: number,
  h: number
): string | null {
  return pickHit(objects, cam, frame, sx, sy, w, h)?.id ?? null;
}

function faceNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}

function rotateForView(n: Vec3, cam: Camera): Vec3 {
  const cy = Math.cos(cam.yaw);
  const sy = Math.sin(cam.yaw);
  const cp = Math.cos(cam.pitch);
  const sp = Math.sin(cam.pitch);
  const x1 = n[0] * cy + n[2] * sy;
  const z1 = -n[0] * sy + n[2] * cy;
  const y2 = n[1] * cp - z1 * sp;
  const z2 = n[1] * sp + z1 * cp;
  return [x1, y2, z2];
}

/** object rotation at the current frame, linearly interpolated between keys */
export function objectRotationAt(obj: ExplorerObject, frame: number): [number, number, number] {
  // A single key is the modeled pose (obj.rot). Two or more keys are an animation.
  if (!(obj.keys.length > 1) && obj.rot) return [obj.rot[0], obj.rot[1], obj.rot[2]];
  if (!obj.keys.length) return obj.rot ? [obj.rot[0], obj.rot[1], obj.rot[2]] : [0, 0, 0];
  const keys = [...obj.keys].sort((a, b) => a.frame - b.frame);
  if (frame <= keys[0].frame) return [keys[0].rx, keys[0].ry, keys[0].rz];
  const last = keys[keys.length - 1];
  if (frame >= last.frame) return [last.rx, last.ry, last.rz];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const t = (frame - a.frame) / (b.frame - a.frame || 1);
      return [a.rx + (b.rx - a.rx) * t, a.ry + (b.ry - a.ry) * t, a.rz + (b.rz - a.rz) * t];
    }
  }
  return [last.rx, last.ry, last.rz];
}

const meshCache = new Map<string, Mesh>();

export function meshFor(obj: ExplorerObject): Mesh {
  if (obj.baked) {
    return obj.deform === 'none' || Math.abs(obj.deformAmount) < 1e-4
      ? obj.baked
      : deformMesh(obj.baked, obj.deform, obj.deformAmount);
  }
  const key = `${obj.primitive}|${obj.deform}|${obj.deformAmount.toFixed(3)}`;
  let base = meshCache.get(key);
  if (!base) {
    base = deformMesh(buildPrimitive(obj.primitive), obj.deform, obj.deformAmount);
    meshCache.set(key, base);
  }
  return base;
}

interface FaceDraw {
  pts: Projected[];
  depth: number;
  fill: string | null;
  stroke: string;
  width?: number;
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  objects: ExplorerObject[],
  cam: Camera,
  opts: DrawOptions
) {
  const modeler = opts.backdrop === 'modeler';
  const paper = modeler ? '#8d8d8d' : '#000000';
  const wire = opts.wireColor ?? 'rgba(226,236,246,0.92)';
  // IRIS GL preview clears to black; Advanced Visualizer Model clears to grey
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);

  const lightDir: Vec3 = [
    Math.cos(opts.lightAngle) * 0.5,
    0.78,
    Math.sin(opts.lightAngle) * 0.5,
  ];
  const ll = Math.hypot(...lightDir) || 1;
  const L: Vec3 = [lightDir[0] / ll, lightDir[1] / ll, lightDir[2] / ll];

  const dx = cam.dist * Math.cos(cam.pitch) * Math.sin(cam.yaw);
  const dy = cam.dist * Math.sin(cam.pitch);
  const dz = cam.dist * Math.cos(cam.pitch) * Math.cos(cam.yaw);
  const eye: Vec3 = [cam.target[0] + dx, cam.target[1] + dy, cam.target[2] + dz];

  // ground grid + soft shadow (the "studio" setup the demo reels used)
  if (opts.floor) {
    const g = modeler ? 6 : 3.2;
    const step = modeler ? 0.5 : 0.8;
    ctx.strokeStyle = modeler ? 'rgba(48,48,48,0.8)' : 'rgba(70,110,90,0.55)';
    ctx.lineWidth = 1;
    for (let i = -g; i <= g + 0.001; i += step) {
      const segs: [Vec3, Vec3][] = [
        [
          [i, modeler ? -1.05 : -1.25, -g],
          [i, modeler ? -1.05 : -1.25, g],
        ],
        [
          [-g, modeler ? -1.05 : -1.25, i],
          [g, modeler ? -1.05 : -1.25, i],
        ],
      ];
      for (const [p0, p1] of segs) {
        const seg = projectSegment(p0, p1, cam, w, h);
        if (!seg) continue;
        ctx.beginPath();
        ctx.moveTo(seg[0].x, seg[0].y);
        ctx.lineTo(seg[1].x, seg[1].y);
        ctx.stroke();
      }
    }
    if (opts.quality === 'raytrace') {
      const centre = project([cam.target[0], -1.24, cam.target[2]], cam, w, h);
      const radius = Math.min(w, h) * 0.16;
      const grad = ctx.createRadialGradient(centre.x, centre.y, 1, centre.x, centre.y, radius);
      grad.addColorStop(0, 'rgba(0,0,0,0.75)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(centre.x, centre.y, radius * 1.5, radius * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (opts.axes) {
    const origin: Vec3 = [0, modeler ? -1.05 : -1.25, 0];
    const axes: [Vec3, string][] = [
      [[1.4, 0, 0], '#c03030'],
      [[0, 1.4, 0], '#2e8a3a'],
      [[0, 0, 1.4], '#2a4ea8'],
    ];
    ctx.lineWidth = 1.4;
    for (const [dir, color] of axes) {
      const seg = projectSegment(origin, [origin[0] + dir[0], origin[1] + dir[1], origin[2] + dir[2]], cam, w, h);
      if (!seg) continue;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(seg[0].x, seg[0].y);
      ctx.lineTo(seg[1].x, seg[1].y);
      ctx.stroke();
    }
  }

  const draws: FaceDraw[] = [];
  const shaded: ShadedTri[] = [];
  const markers: Projected[] = [];
  const normalSegs: [Projected, Projected][] = [];
  // wireframe deliberately draws every edge, front and back
  const cull = opts.quality !== 'wireframe';

  for (const obj of objects) {
    if (!obj.visible) continue;
    const library = MATERIALS.find((m) => m.id === obj.material) ?? MATERIALS[0];
    const material = obj.tint ? { ...library, color: obj.tint } : library;
    const picked = opts.selectedId === obj.id;
    const [rx, ry, rz] = objectRotationAt(obj, opts.frame);
    const rot = matMul(matMul(matRotY(ry), matRotX(rx)), matRotZ(rz));
    const mesh = meshFor(obj);
    const sc = obj.scale ?? [1, 1, 1];
    const world = mesh.verts.map((v) => {
      const sv: Vec3 = [v[0] * sc[0], v[1] * sc[1], v[2] * sc[2]];
      const p = [
        rot.m[0] * sv[0] + rot.m[4] * sv[1] + rot.m[8] * sv[2] + obj.pos[0],
        rot.m[1] * sv[0] + rot.m[5] * sv[1] + rot.m[9] * sv[2] + obj.pos[1],
        rot.m[2] * sv[0] + rot.m[6] * sv[1] + rot.m[10] * sv[2] + obj.pos[2],
      ] as Vec3;
      return p;
    });
    const view = world.map((v) => viewTransform(v, cam));
    const projected = view.map((v) => projectView(v, w, h));
    if (picked) {
      const origin = project(obj.pos, cam, w, h);
      if (origin.z >= NEAR_PLANE) markers.push(origin);
    }

    // Face normals (Newell) plus crease-aware per-corner normals, which is
    // what the era's shaders did: curved hulls get one smooth normal per
    // corner, sharp edges keep their own so a box still reads as a box.
    const crease = opts.smoothAngle ?? 45;
    const facenorms: Vec3[] = mesh.faces.map((f) => faceNormalOf(world, f));
    const cnorms: Vec3[][] = cornerNormals(world, mesh.faces, crease);

    const smooth = opts.quality === 'gouraud' || opts.quality === 'raytrace';
    const smoothAlpha = 1 - material.transparency;
    const AMBIENT = 0.3;
    const DIFFUSE = 0.95;
    /** Lambert + a restrained highlight, evaluated per vertex. */
    const shadeVertex = (
      n: Vec3,
      spec: number,
      out: [number, number, number]
    ): [number, number, number] => {
      const lam = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
      const lit = AMBIENT + DIFFUSE * lam;
      const gloss = 255 * spec * 0.45;
      out[0] = Math.min(255, material.color[0] * lit + gloss);
      out[1] = Math.min(255, material.color[1] * lit + gloss);
      out[2] = Math.min(255, material.color[2] * lit + gloss);
      return out;
    };

    mesh.faces.forEach((face, fi) => {
      const pts = face.map((idx) => projected[idx]);
      const depth = face.reduce((s, idx) => s + projected[idx].z, 0) / face.length;
      const nWorld = facenorms[fi];
      const viewNormal = rotateForView(nWorld, cam);

      // view vector + specular (Phong, as the era's renderers did)
      const cxw = world[face[0]];
      const view = [
        eye[0] - cxw[0],
        eye[1] - cxw[1],
        eye[2] - cxw[2],
      ] as Vec3;
      const vl = Math.hypot(view[0], view[1], view[2]) || 1;
      const V: Vec3 = [view[0] / vl, view[1] / vl, view[2] / vl];
      const half: Vec3 = [L[0] + V[0], L[1] + V[1], L[2] + V[2]];
      const hl = Math.hypot(half[0], half[1], half[2]) || 1;
      const H: Vec3 = [half[0] / hl, half[1] / hl, half[2] / hl];
      const lambert = Math.max(0, nWorld[0] * L[0] + nWorld[1] * L[1] + nWorld[2] * L[2]);
      const spec = Math.pow(Math.max(0, nWorld[0] * H[0] + nWorld[1] * H[1] + nWorld[2] * H[2]), material.shine) * material.specular;
      const ambient = 0.3;
      const diffuse = 0.95 * lambert;
      const shade = (c: number) => Math.min(255, Math.round(material.color[c] * (ambient + diffuse) + 255 * spec));
      const alpha = 1 - material.transparency;
      const fill = `rgba(${shade(0)},${shade(1)},${shade(2)},${alpha.toFixed(2)})`;

      // IRIS GL back-face removal (frontface(GL_CCW) by default).  Every solid
      // hull is closed, so culling both halves the work and cleans the
      // silhouette; only the single-sided grid plane is duplicated.
      const backface = viewNormal[2] > 0;
      if (cull && backface) return;
      // skip facets whose centroid is behind the near plane
      if (depth < NEAR_PLANE) return;

      if (opts.quality === 'hiddenline') {
        // the era's hidden line pass: paint the hull black to occlude what is
        // behind it, then draw the facet outline bright
        draws.push({
          pts,
          depth,
          fill: paper,
          stroke: picked ? '#ffe14a' : wire,
        });
        return;
      }

      if (smooth) {
        // Gouraud: shade every corner from its own smooth normal and let the
        // rasteriser interpolate across the facets.  No facet outlines — the
        // surface reads as one continuous low polygon skin.
        const cornerCount = face.length;
        const cols: [number, number, number][] = [];
        for (let k = 0; k < cornerCount; k++) {
          cols.push(shadeVertex(cnorms[fi][k], spec * 0.35, [0, 0, 0]));
        }
        // fan-triangulate quads
        for (let k = 1; k + 1 < cornerCount; k++) {
          shaded.push({
            ax: pts[0].x,
            ay: pts[0].y,
            bx: pts[k].x,
            by: pts[k].y,
            cx: pts[k + 1].x,
            cy: pts[k + 1].y,
            r0: cols[0][0],
            g0: cols[0][1],
            b0: cols[0][2],
            r1: cols[k][0],
            g1: cols[k][1],
            b1: cols[k][2],
            r2: cols[k + 1][0],
            g2: cols[k + 1][1],
            b2: cols[k + 1][2],
            alpha: smoothAlpha,
            depth,
          });
        }
        return;
      }

      draws.push({
        pts,
        depth,
        fill: opts.quality === 'wireframe' ? null : fill,
        stroke:
          opts.quality === 'wireframe'
            ? picked
              ? '#ffe14a'
              : opts.wireColor ??
                `rgba(${material.color[0]},${material.color[1]},${material.color[2]},0.95)`
            : 'rgba(0,0,0,0.55)',
        width: picked && opts.quality === 'wireframe' ? 2.2 : undefined,
      });
    });

    if (opts.normals && picked) {
      mesh.faces.forEach((face, fi) => {
        const c: Vec3 = [0, 0, 0];
        for (const idx of face) {
          c[0] += world[idx][0];
          c[1] += world[idx][1];
          c[2] += world[idx][2];
        }
        const n = face.length || 1;
        const p0: Vec3 = [c[0] / n, c[1] / n, c[2] / n];
        const fn = facenorms[fi];
        const p1: Vec3 = [p0[0] + fn[0] * 0.28, p0[1] + fn[1] * 0.28, p0[2] + fn[2] * 0.28];
        const seg = projectSegment(p0, p1, cam, w, h);
        if (seg) normalSegs.push(seg);
      });
    }
  }

  draws.sort((a, b) => b.depth - a.depth);

  if (shaded.length) {
    shaded.sort((a, b) => b.depth - a.depth);
    const tf =
      typeof (ctx as unknown as { getTransform?: unknown }).getTransform === 'function'
        ? ctx.getTransform()
        : null;
    const scale = tf && Number.isFinite(tf.a) && tf.a > 0 ? tf.a : 1;
    if (!rasterizeShaded(ctx, w, h, scale, shaded)) {
      // no direct pixel access (headless stubs): fall back to per-facet fills
      for (const t of shaded) {
        draws.push({
          pts: [
            { x: t.ax, y: t.ay, z: t.depth },
            { x: t.bx, y: t.by, z: t.depth },
            { x: t.cx, y: t.cy, z: t.depth },
          ],
          depth: t.depth,
          fill: `rgb(${t.r0 | 0},${t.g0 | 0},${t.b0 | 0})`,
          stroke: 'rgba(0,0,0,0)',
        });
      }
    }
  }

  for (const d of draws) {
    if (d.pts.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(d.pts[0].x, d.pts[0].y);
    for (let i = 1; i < d.pts.length; i++) ctx.lineTo(d.pts[i].x, d.pts[i].y);
    ctx.closePath();
    if (d.fill) {
      ctx.fillStyle = d.fill;
      ctx.fill();
    }
    if (d.fill === null) {
      // wireframe
      ctx.strokeStyle = d.stroke;
      ctx.lineWidth = d.width ?? (w > 600 ? 1.2 : 1);
      ctx.stroke();
    } else if (opts.quality === 'hiddenline') {
      // black fill already laid down; outline it
      ctx.strokeStyle = d.stroke;
      ctx.lineWidth = w > 600 ? 1.1 : 1;
      ctx.stroke();
    } else if (opts.quality === 'raytrace') {
      // ray traced frames read as smooth, so only a whisper of an edge
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.strokeStyle = '#d7e48a';
  ctx.lineWidth = 1;
  for (const seg of normalSegs) {
    ctx.beginPath();
    ctx.moveTo(seg[0].x, seg[0].y);
    ctx.lineTo(seg[1].x, seg[1].y);
    ctx.stroke();
  }
  for (const m of markers) {
    ctx.strokeStyle = '#ffe14a';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(m.x - 6, m.y - 6, 12, 12);
  }
}

