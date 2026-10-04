/**
 * WAVEFRONT EXPLORER 2.0  (TDI Explore -> Alias|Wavefront -> Maya)
 * ===============================================================
 *
 * History this window reproduces:
 *
 *   Wavefront Technologies shipped The Advanced Visualizer (TAV): Model,
 *   Paint, Property, Dynamation, Kinemation, Preview, Composer, fcheck.
 *   In 1993 SGI bought Thomson Digital Images (TDI) and merged their Explore
 *   package into the line; in February 1995 SGI bought both Alias and Wavefront
 *   and created Alias|Wavefront, whose next generation animation system grew
 *   out of PowerAnimator and Wavefront Explorer - that product became Maya in
 *   January 1998.
 *
 * Explore's heritage shows up all over Maya's interface: the gestural (radial)
 * menus, the hotbox, shader-first asset organisation, IPR, and a shading
 * network.  This simulation keeps to the features that had landed by the
 * Explorer/Maya prototype era:
 *
 *   Model     primitive creation, deformers (bend / twist / taper)
 *   Shade     material presets, diffuse colour, specular, transparency
 *   Animate   keyframes on the rotation channels, playback on a timeline
 *   Render    wireframe / hidden line / flat / Gouraud / ray traced frames,
 *             written out as SGI RGB images
 *
 * Everything is drawn with a software pipeline in the style of IRIS GL: the
 * painter's algorithm, flat shading with a single default light, and a black
 * viewport with the product wordmark in the corner.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SgiColorScheme } from '../state/osStore';
import { screenScale } from '../state/screen';
import { IrixVectorIcon } from '../icons/irixIconSet';
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
  PRIMITIVE_LIBRARY,
  transformMesh,
  Vec3,
} from './explorer/tavGeometry';
import { irixAudio } from '../sound/irixAudio';

export type ExplorerTool = 'model' | 'shade' | 'animate' | 'render';
export type RenderQuality = 'wireframe' | 'hiddenline' | 'flat' | 'gouraud' | 'raytrace';

interface Keyframe {
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
  deform: DeformId;
  deformAmount: number;
  material: string;
  keys: Keyframe[];
  visible: boolean;
}

interface Material {
  id: string;
  label: string;
  color: [number, number, number];
  specular: number;
  shine: number;
  transparency: number;
}

const MATERIALS: Material[] = [
  { id: 'chrome', label: 'Polished Chrome', color: [196, 205, 214], specular: 0.95, shine: 90, transparency: 0.0 },
  { id: 'gold', label: 'Gold / Metal', color: [214, 168, 62], specular: 0.85, shine: 70, transparency: 0.0 },
  { id: 'copper', label: 'Copper', color: [190, 112, 68], specular: 0.7, shine: 54, transparency: 0.0 },
  { id: 'jade', label: 'Jade', color: [86, 168, 122], specular: 0.5, shine: 42, transparency: 0.12 },
  { id: 'plastic_red', label: 'Plastic Red', color: [198, 54, 58], specular: 0.6, shine: 34, transparency: 0.0 },
  { id: 'plastic_blue', label: 'Plastic Blue', color: [64, 96, 186], specular: 0.6, shine: 34, transparency: 0.0 },
  { id: 'glass', label: 'Glass', color: [188, 214, 226], specular: 0.9, shine: 84, transparency: 0.72 },
  { id: 'matte_grey', label: 'Matte Grey Clay', color: [168, 168, 164], specular: 0.08, shine: 10, transparency: 0.0 },
];

const RESOLUTIONS = [
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

interface Camera {
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
  if (!obj.keys.length) return [0, 0, 0];
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

function meshFor(obj: ExplorerObject): Mesh {
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
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  objects: ExplorerObject[],
  cam: Camera,
  opts: DrawOptions
) {
  // IRIS GL clears to black in these applications
  ctx.fillStyle = '#000000';
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
    const g = 3.2;
    ctx.strokeStyle = 'rgba(70,110,90,0.55)';
    ctx.lineWidth = 1;
    for (let i = -g; i <= g; i += 0.8) {
      const segs: [Vec3, Vec3][] = [
        [
          [i, -1.25, -g],
          [i, -1.25, g],
        ],
        [
          [-g, -1.25, i],
          [g, -1.25, i],
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

  const draws: FaceDraw[] = [];
  const shaded: ShadedTri[] = [];
  // wireframe deliberately draws every edge, front and back
  const cull = opts.quality !== 'wireframe';

  for (const obj of objects) {
    if (!obj.visible) continue;
    const material = MATERIALS.find((m) => m.id === obj.material) ?? MATERIALS[0];
    const [rx, ry, rz] = objectRotationAt(obj, opts.frame);
    const rot = matMul(matMul(matRotY(ry), matRotX(rx)), matRotZ(rz));
    const mesh = meshFor(obj);
    const world = mesh.verts.map((v) => {
      const p = [
        rot.m[0] * v[0] + rot.m[4] * v[1] + rot.m[8] * v[2] + obj.pos[0],
        rot.m[1] * v[0] + rot.m[5] * v[1] + rot.m[9] * v[2] + obj.pos[1],
        rot.m[2] * v[0] + rot.m[6] * v[1] + rot.m[10] * v[2] + obj.pos[2],
      ] as Vec3;
      return p;
    });
    const view = world.map((v) => viewTransform(v, cam));
    const projected = view.map((v) => projectView(v, w, h));

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
          fill: '#000000',
          stroke: 'rgba(226,236,246,0.92)',
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
            ? `rgba(${material.color[0]},${material.color[1]},${material.color[2]},0.95)`
            : 'rgba(0,0,0,0.55)',
      });
    });
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
      ctx.lineWidth = w > 600 ? 1.2 : 1;
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
}

/* ------------------------------------------------------------------ *
 * Application                                                         *
 * ------------------------------------------------------------------ */

interface WavefrontExplorerAppProps {
  colorScheme: SgiColorScheme;
  initialMode?: ExplorerTool;
  onSaveRender?: (path: string, dataUrl: string, meta: string) => void;
  onLaunchApp?: (appId: 'reference' | 'fcheck', payload?: Record<string, unknown>) => void;
}

let objectSerial = 0;

/** the modeler drops new objects beside the ones already in the scene */
function ringPlacement(index: number): Vec3 {
  if (index === 0) return [0, 0, 0];
  const ring = Math.ceil(index / 6);
  const slot = (index - 1) % 6;
  const a = (slot / 6) * Math.PI * 2 + ring * 0.4;
  const r = 1.25 * ring;
  return [Math.cos(a) * r, 0, Math.sin(a) * r];
}

const newObject = (primitive: PrimitiveId, count: number, frame = 0): ExplorerObject => ({
  id: `obj_${++objectSerial}`,
  name: `${primitive}_${objectSerial}.obj`,
  primitive,
  pos: ringPlacement(count),
  deform: 'none',
  deformAmount: 0,
  material: primitive === 'piston' ? 'chrome' : 'plastic_blue',
  keys: [
    { frame: 0, rx: 0.12, ry: 0, rz: 0 },
    { frame: 48, rx: 0.12, ry: Math.PI, rz: 0 },
    { frame: 96, rx: 0.12, ry: Math.PI * 2, rz: 0 },
  ],
  visible: true,
  ...{ __at: frame },
});

export const WavefrontExplorerApp: React.FC<WavefrontExplorerAppProps> = ({
  colorScheme,
  initialMode = 'model',
  onSaveRender,
  onLaunchApp,
}) => {
  const [tool, setTool] = useState<ExplorerTool>(initialMode);
  const [objects, setObjects] = useState<ExplorerObject[]>([
    {
      id: 'obj_start',
      name: 'piston_assembly.obj',
      primitive: 'piston',
      pos: [0, 0, 0],
      deform: 'none',
      deformAmount: 0,
      material: 'chrome',
      keys: [
        { frame: 0, rx: 0.1, ry: 0, rz: 0 },
        { frame: 60, rx: 0.1, ry: Math.PI * 1.1, rz: 0 },
        { frame: 120, rx: 0.1, ry: Math.PI * 2, rz: 0 },
      ],
      visible: true,
    },
  ]);
  const [selectedId, setSelectedId] = useState('obj_start');
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [quality, setQuality] = useState<RenderQuality>('gouraud');
  // shader smoothing (crease) angle: the Explorer shader's own control
  const [smoothAngle, setSmoothAngle] = useState<number>(45);
  const [showGrid, setShowGrid] = useState(true);
  const [resolution, setResolution] = useState(RESOLUTIONS[1].id);
  const [renderProgress, setRenderProgress] = useState<number | null>(null);
  const [lastRender, setLastRender] = useState<{ url: string; path: string } | null>(null);
  const [status, setStatus] = useState('Ready.  Wavefront Explorer 2.0 (Maya prototype lineage).');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [radial, setRadial] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef<Camera>({ yaw: 0.6, pitch: 0.3, dist: 4.0, target: [0, -0.25, 0] });
  const dragRef = useRef<{ mode: 'orbit' | 'object' | null; x: number; y: number }>({
    mode: null,
    x: 0,
    y: 0,
  });
  const frameRef = useRef(0);
  frameRef.current = frame;

  const selected = objects.find((o) => o.id === selectedId) ?? objects[0];
  const resolutionSize = RESOLUTIONS.find((r) => r.id === resolution) ?? RESOLUTIONS[1];

  /* --- playback ------------------------------------------------- */
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = now - last;
      last = now;
      acc += dt;
      // 24 frames per second, like the era's playback
      if (acc > 1000 / 24) {
        acc = 0;
        setFrame((f) => (f + 1) % 120);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  /* --- viewport draw -------------------------------------------- */
  const drawViewport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // the Gouraud pass reads the frame back to interpolate vertex colours
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    drawScene(ctx, canvas.width, canvas.height, objects, camRef.current, {
      quality,
      showGrid,
      floor: showGrid,
      lightAngle: frameRef.current / 30,
      frame: frameRef.current,
      smoothAngle,
    });

    // wordmark + HUD, the way every Wavefront program labelled its viewport
    ctx.save();
    ctx.font = `bold ${Math.max(11, Math.round(canvas.width * 0.016))}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.fillText('WAVEFRONT', 10, 22);
    ctx.font = `${Math.max(9, Math.round(canvas.width * 0.011))}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.fillStyle = 'rgba(180,220,255,0.8)';
    ctx.fillText('EXPLORER 2.0', 10, 36);
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.fillText(
      `cam  yaw ${((camRef.current.yaw * 180) / Math.PI).toFixed(1)}  pitch ${(
        (camRef.current.pitch * 180) /
        Math.PI
      ).toFixed(1)}  dist ${camRef.current.dist.toFixed(2)}`,
      10,
      canvas.height - 24
    );
    ctx.fillText(
      `frame ${frameRef.current}  ·  ${quality}  ·  ${resolutionSize.w}x${resolutionSize.h}`,
      10,
      canvas.height - 10
    );
    ctx.restore();
  }, [objects, quality, showGrid, resolutionSize, smoothAngle]);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      drawViewport();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [drawViewport]);

  /* --- interaction ---------------------------------------------- */
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setRadial(null);
    dragRef.current = {
      mode: tool === 'animate' ? 'object' : 'orbit',
      x: e.clientX,
      y: e.clientY,
    };
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d.mode) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      d.x = e.clientX;
      d.y = e.clientY;
      if (d.mode === 'orbit') {
        camRef.current.yaw -= dx * 0.008;
        camRef.current.pitch = Math.max(-1.3, Math.min(1.35, camRef.current.pitch + dy * 0.007));
      } else {
        // rotate the selected object and remember the value for keying
        setObjects((prev) =>
          prev.map((o) =>
            o.id === selectedId
              ? {
                  ...o,
                  keys: mergeKey(o, {
                    frame: frameRef.current,
                    rx: currentRot(o, frameRef.current)[0] + dy * 0.01,
                    ry: currentRot(o, frameRef.current)[1] + dx * 0.012,
                    rz: currentRot(o, frameRef.current)[2],
                  }),
                }
              : o
          )
        );
      }
    };
    const up = () => {
      dragRef.current.mode = null;
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [selectedId]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    camRef.current.dist = Math.max(1.8, Math.min(22, camRef.current.dist + e.deltaY * 0.004));
  };

  /* --- actions -------------------------------------------------- */
  const addPrimitive = (id: PrimitiveId) => {
    const obj = newObject(id, objects.length, frame);
    setObjects((prev) => [...prev, obj]);
    setSelectedId(obj.id);
    setTool('model');
    setStatus(`Created ${obj.name} from the primitive menu.`);
    irixAudio.playMenuClick();
  };

  const setDeform = (kind: DeformId, amount: number) => {
    setObjects((prev) =>
      prev.map((o) => (o.id === selectedId ? { ...o, deform: kind, deformAmount: amount } : o))
    );
  };

  const setKeyAtFrame = () => {
    const obj = selected;
    const [rx, ry, rz] = currentRot(obj, frame);
    setObjects((prev) =>
      prev.map((o) => (o.id === obj.id ? { ...o, keys: mergeKey(o, { frame, rx, ry, rz }) } : o))
    );
    setStatus(`Set key on ${obj.name} at frame ${frame}.`);
    irixAudio.playMenuClick();
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const copy: ExplorerObject = {
      ...selected,
      id: `obj_${++objectSerial}`,
      name: `${selected.primitive}_${objectSerial}.obj`,
      pos: ringPlacement(objects.length),
      keys: selected.keys.map((k) => ({ ...k })),
    };
    setObjects((prev) => [...prev, copy]);
    setSelectedId(copy.id);
    setStatus(`Duplicated ${selected.name} -> ${copy.name}.`);
  };

  const deleteSelected = () => {
    if (!selected) return;
    setObjects((prev) => (prev.length === 1 ? prev : prev.filter((o) => o.id !== selected.id)));
    const remaining = objects.filter((o) => o.id !== selected.id);
    if (remaining.length) setSelectedId(remaining[0].id);
  };

  /** Render a frame into an offscreen canvas, then hand it to the VFS. */
  const renderFrame = () => {
    const { w, h } = resolutionSize;
    const scale = quality === 'raytrace' ? 2 : 1; // supersample for the ray traced pass
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (scale > 1) ctx.scale(scale, scale);
    drawScene(ctx, w, h, objects, camRef.current, {
      quality,
      showGrid,
      floor: showGrid,
      lightAngle: frame / 30,
      frame,
      smoothAngle,
    });

    if (quality === 'raytrace') {
      // soften the whole frame the way a supersampled ray traced image looked
      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      const octx = out.getContext('2d');
      if (octx) {
        octx.imageSmoothingEnabled = true;
        octx.drawImage(canvas, 0, 0, w, h);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const url = out.toDataURL('image/png');
        finishRender(url, w, h);
      }
      return;
    }
    finishRender(canvas.toDataURL('image/png'), w, h);
  };

  const finishRender = (url: string, w: number, h: number) => {
    const idx = Math.floor(frame).toString().padStart(4, '0');
    const path = `/usr/people/guest/renders/piston.${idx}.rgb`;
    const meta = [
      `# WAVEFRONT EXPLORER 2.0 — SGI RGB image`,
      `# resolution: ${w} x ${h}`,
      `# quality:    ${quality}`,
      `# frame:      ${frame}`,
      `# camera:     yaw ${camRef.current.yaw.toFixed(3)} pitch ${camRef.current.pitch.toFixed(3)} dist ${camRef.current.dist.toFixed(2)}`,
      `# objects:    ${objects.map((o) => o.name).join(', ')}`,
      `# written by the simulated Wavefront Explorer; the real program wrote 8/16-bit`,
      `# SGI RGB files (and IFF/RIFF, TIFF, Cineon) for Composer, fcheck and video out.`,
    ].join('\n');
    onSaveRender?.(path, url, meta);
    setLastRender({ url, path });
    setStatus(`Rendered ${w}x${h} ${quality} frame ${frame} -> ${path}`);
  };

  const allMaterials = useMemo(() => MATERIALS, []);

  /* --- panel bodies -------------------------------------------- */
  const panelStyle: React.CSSProperties = {
    padding: '8px 9px',
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    overflowY: 'auto',
    background: colorScheme.windowSurface,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
    fontSize: '11.5px',
    fontWeight: 700,
    fontStyle: 'italic',
  };

  const sectionTitle = (text: string) => (
    <div
      style={{
        fontSize: '11px',
        fontWeight: 700,
        fontStyle: 'italic',
        borderBottom: '1px solid #8a8a8a',
        boxShadow: '0 1px 0 #f2f2f2',
        paddingBottom: '2px',
      }}
    >
      {text}
    </div>
  );

  const objectPanel = (
    <>
      {sectionTitle('Scene Objects')}
      <div
        style={{
          background: '#a8a8a8',
          border: '1px solid #111',
          boxShadow: 'inset 1px 1px 0 #555, inset -1px -1px 0 #efefef',
          maxHeight: '132px',
          overflowY: 'auto',
        }}
      >
        {objects.map((o) => (
          <div
            key={o.id}
            onClick={() => setSelectedId(o.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 5px',
              cursor: 'pointer',
              background: o.id === selectedId ? '#b8a87e' : 'transparent',
            }}
          >
            <button
              type="button"
              title="Toggle visibility"
              onClick={(e) => {
                e.stopPropagation();
                setObjects((prev) =>
                  prev.map((x) => (x.id === o.id ? { ...x, visible: !x.visible } : x))
                );
              }}
              style={{
                width: '14px',
                height: '14px',
                fontSize: '9px',
                padding: 0,
                background: '#c4c4c4',
                border: '1px solid #111',
                boxShadow: 'inset 1px 1px 0 #f5f5f5, inset -1px -1px 0 #666',
                cursor: 'pointer',
              }}
            >
              {o.visible ? '●' : '○'}
            </button>
            <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{o.name}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <button type="button" className="sgi-btn" style={{ padding: '2px 7px', fontWeight: 700 }} onClick={duplicateSelected}>
          Duplicate
        </button>
        <button type="button" className="sgi-btn" style={{ padding: '2px 7px', fontWeight: 700 }} onClick={deleteSelected}>
          Delete
        </button>
        <button
          type="button"
          className="sgi-btn"
          style={{ padding: '2px 7px', fontWeight: 700 }}
          onClick={() => {
            camRef.current = { yaw: 0.6, pitch: 0.3, dist: 4.0, target: [0, -0.25, 0] };
            setStatus('Camera framed all objects.');
          }}
        >
          Frame All
        </button>
      </div>
    </>
  );

  const modelPanel = (
    <>
      {objectPanel}
      {sectionTitle('Primitives (Create)')}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
        {PRIMITIVE_LIBRARY.map((p) => (
          <button
            key={p.id}
            type="button"
            className="sgi-btn"
            style={{ padding: '2px 6px', fontWeight: 700, fontSize: '11px' }}
            onClick={() => addPrimitive(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {sectionTitle('Deformers')}
      <div style={{ display: 'flex', gap: '3px' }}>
        {(['none', 'bend', 'twist', 'taper'] as DeformId[]).map((d) => (
          <button
            key={d}
            type="button"
            className="sgi-btn"
            style={{
              padding: '2px 6px',
              fontWeight: 700,
              fontSize: '11px',
              background: selected?.deform === d ? '#b8a87e' : undefined,
            }}
            onClick={() => setDeform(d, selected?.deformAmount || 0.35)}
          >
            {d === 'none' ? 'None' : d[0].toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>
      <div>
        <div style={rowStyle}>
          <span>Amount:</span>
          <span style={{ fontFamily: 'monospace' }}>
            {(selected?.deformAmount ?? 0).toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.01}
          value={selected?.deformAmount ?? 0}
          onChange={(e) => setDeform(selected?.deform ?? 'bend', parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#4a4a4a' }}
        />
      </div>
      <div style={{ fontSize: '10.5px', color: '#262626', lineHeight: 1.32 }}>
        Modeler notes: the era's systems built hulls from primitives and CV curves, then ran
        deformers over the hull. <span style={{ fontStyle: 'italic' }}>Piston Assembly</span> is the
        machined part from Wavefront's own SGI demo reel.
      </div>
    </>
  );

  const shadePanel = (
    <>
      {sectionTitle('Material (Property)')}
      <div
        style={{
          background: '#a8a8a8',
          border: '1px solid #111',
          boxShadow: 'inset 1px 1px 0 #555, inset -1px -1px 0 #efefef',
          maxHeight: '128px',
          overflowY: 'auto',
        }}
      >
        {allMaterials.map((m) => (
          <div
            key={m.id}
            onClick={() =>
              setObjects((prev) =>
                prev.map((o) => (o.id === selectedId ? { ...o, material: m.id } : o))
              )
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 6px',
              cursor: 'pointer',
              background: selected?.material === m.id ? '#b8a87e' : 'transparent',
            }}
          >
            <span
              style={{
                width: '13px',
                height: '13px',
                background: `rgb(${m.color.join(',')})`,
                border: '1px solid #222',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '11.5px', fontWeight: 700, fontStyle: 'italic' }}>{m.label}</span>
          </div>
        ))}
      </div>
      {(() => {
        const m = allMaterials.find((x) => x.id === selected?.material) ?? allMaterials[0];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={rowStyle}>
              <span>Diffuse RGB:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '10.5px' }}>{m.color.join(' ')}</span>
            </div>
            <div style={rowStyle}>
              <span>Specular:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '10.5px' }}>{m.specular.toFixed(2)}</span>
            </div>
            <div style={rowStyle}>
              <span>Shine:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '10.5px' }}>{m.shine}</span>
            </div>
            <div style={rowStyle}>
              <span>Transparency:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '10.5px' }}>
                {m.transparency.toFixed(2)}
              </span>
            </div>
          </div>
        );
      })()}
      {sectionTitle('Shading')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={rowStyle}>
          <span>Smoothing angle:</span>
          <span style={{ fontFamily: 'monospace', fontSize: '10.5px' }}>{smoothAngle}°</span>
        </div>
        <input
          type="range"
          min={0}
          max={180}
          step={5}
          value={smoothAngle}
          onChange={(e) => setSmoothAngle(parseInt(e.target.value, 10))}
          style={{ width: '100%' }}
          title="Faces meeting at a shallower angle share a smooth normal (0 = every facet flat, 180 = fully smoothed)"
        />
        <div style={{ fontSize: '10px', color: '#2a2a2a', lineHeight: 1.3 }}>
          Vertex colours are interpolated across each facet: curved hulls shade smoothly, edges
          sharper than {smoothAngle}° stay hard.
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
        {QUALITY_LABELS.map((q) => (
          <button
            key={q.id}
            type="button"
            className="sgi-btn"
            title={q.hint}
            style={{
              padding: '2px 6px',
              fontWeight: 700,
              fontSize: '11px',
              background: quality === q.id ? '#b8a87e' : undefined,
            }}
            onClick={() => setQuality(q.id)}
          >
            {q.label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: '10.5px', color: '#262626', lineHeight: 1.32 }}>
        Property/IPR notes: materials are assigned to hulls, and in Explore you picked the shader
        first and then dropped geometry underneath it — the inverted hierarchy that reappeared in
        Maya's Hypershade.
      </div>
    </>
  );

  const animatePanel = (
    <>
      {objectPanel}
      {sectionTitle(`Animation — ${selected?.name ?? ''}`)}
      <div style={{ display: 'flex', gap: '3px' }}>
        <button type="button" className="sgi-btn" style={{ padding: '2px 7px', fontWeight: 700 }} onClick={setKeyAtFrame}>
          Set Key
        </button>
        <button
          type="button"
          className="sgi-btn"
          style={{ padding: '2px 7px', fontWeight: 700 }}
          onClick={() =>
            setObjects((prev) =>
              prev.map((o) =>
                o.id === selectedId ? { ...o, keys: o.keys.filter((k) => k.frame !== frame) } : o
              )
            )
          }
        >
          Cut Key
        </button>
        <button
          type="button"
          className="sgi-btn"
          style={{ padding: '2px 7px', fontWeight: 700 }}
          onClick={() =>
            setObjects((prev) =>
              prev.map((o) =>
                o.id === selectedId ? { ...o, keys: [{ frame: 0, rx: 0, ry: 0, rz: 0 }] } : o
              )
            )
          }
        >
          Reset Curve
        </button>
      </div>
      <div
        style={{
          background: '#a8a8a8',
          border: '1px solid #111',
          boxShadow: 'inset 1px 1px 0 #555, inset -1px -1px 0 #efefef',
          maxHeight: '118px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '10.5px',
        }}
      >
        <div style={{ padding: '2px 5px', background: '#9d9d9d' }}>frame    rotX     rotY     rotZ</div>
        {[...(selected?.keys ?? [])]
          .sort((a, b) => a.frame - b.frame)
          .map((k) => (
            <div key={k.frame} style={{ padding: '1px 5px' }}>
              {k.frame.toString().padStart(5, ' ')}
              {'  '}
              {k.rx.toFixed(3).padStart(8, ' ')}
              {k.ry.toFixed(3).padStart(9, ' ')}
              {k.rz.toFixed(3).padStart(9, ' ')}
            </div>
          ))}
      </div>
      <div style={{ fontSize: '10.5px', color: '#262626', lineHeight: 1.32 }}>
        Drag in the viewport with the Animate tool to rotate the selected object, then Set Key to
        burn the pose into the channel. Playback runs at 24 fps, the SGI video standard.
      </div>
    </>
  );

  const renderPanel = (
    <>
      {sectionTitle('Render / Display')}
      <div style={rowStyle}>
        <span>Resolution:</span>
        <select
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          style={{
            background: '#c8979b',
            border: '1px solid #111',
            boxShadow: 'inset 1px 1px 0 #7a5257, inset -1px -1px 0 #f0d8da',
            fontFamily: 'monospace',
            fontSize: '11px',
          }}
        >
          {RESOLUTIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.w} x {r.h}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div style={{ fontSize: '11.5px', fontWeight: 700, fontStyle: 'italic', marginBottom: '2px' }}>
          Quality:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {QUALITY_LABELS.map((q) => (
            <label key={q.id} style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '11.5px' }}>
              <input
                type="radio"
                name="quality"
                checked={quality === q.id}
                onChange={() => setQuality(q.id)}
              />
              <span style={{ fontWeight: 700, fontStyle: 'italic' }}>{q.label}</span>
              <span style={{ fontSize: '10px', color: '#333' }}>{q.hint}</span>
            </label>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <button
          type="button"
          className="sgi-btn"
          style={{ padding: '3px 10px', fontWeight: 700 }}
          onClick={() => {
            setRenderProgress(0);
            let p = 0;
            const timer = window.setInterval(() => {
              p += 8 + Math.random() * 12;
              if (p >= 100) {
                window.clearInterval(timer);
                setRenderProgress(null);
                renderFrame();
              } else {
                setRenderProgress(p);
              }
            }, 90);
          }}
        >
          Render Frame
        </button>
        <span style={{ fontFamily: 'monospace', fontSize: '10.5px' }}>
          {renderProgress !== null ? `${Math.round(renderProgress)}%` : 'idle'}
        </span>
      </div>
      {renderProgress !== null && (
        <div style={{ height: '10px', background: '#8f8f8f', border: '1px solid #111' }}>
          <div
            style={{
              width: `${renderProgress}%`,
              height: '100%',
              background: '#b8a87e',
              boxShadow: 'inset 1px 1px 0 #fff, inset -1px -1px 0 #666',
            }}
          />
        </div>
      )}
      {lastRender && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, fontStyle: 'italic' }}>
            Last render: {lastRender.path}
          </div>
          <img
            src={lastRender.url}
            alt="last render"
            style={{
              width: '100%',
              maxWidth: '190px',
              border: '1px solid #111',
              background: '#000',
              imageRendering: 'auto',
            }}
          />
          <div style={{ fontSize: '10px', color: '#2b2b2b' }}>
            Written into the XFS filesystem — open the File Manager to see it in the Content
            Viewer, or read it with fcheck/jot.
          </div>
        </div>
      )}
      <button
        type="button"
        className="sgi-btn"
        style={{ padding: '3px 10px', fontWeight: 700 }}
        onClick={() => onLaunchApp?.('fcheck', { path: lastRender?.path })}
      >
        Review in fcheck
      </button>
      <div style={{ fontSize: '10.5px', color: '#262626', lineHeight: 1.32 }}>
        In the real pipeline a frame went out to <i>fcheck</i> for review, then into{' '}
        <i>Composer</i> for compositing, and finally to a video deck via <i>Display</i>.
      </div>
    </>
  );

  const panel =
    tool === 'model' ? modelPanel : tool === 'shade' ? shadePanel : tool === 'animate' ? animatePanel : renderPanel;

  const menus: { id: string; label: string; items: { label: string; action: () => void }[] }[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New Scene', action: () => { setObjects([newObject('cube', 0, frame)]); setStatus('New scene.'); } },
        { label: 'Save Scene...', action: () => setStatus('save: /usr/people/guest/scenes/piston.wff (the .wff/.obj scene formats)') },
        { label: 'Load Object...', action: () => setStatus('Reading obj/tri/BYU/SLG formats from the geometry library.') },
        { label: 'Quit (kill the window)', action: () => setStatus('Use the 4Dwm window menu to close an application.') },
      ],
    },
    {
      id: 'object',
      label: 'Object',
      items: [
        { label: 'Cube', action: () => addPrimitive('cube') },
        { label: 'Sphere', action: () => addPrimitive('sphere') },
        { label: 'Torus', action: () => addPrimitive('torus') },
        { label: 'Piston Assembly (demo part)', action: () => addPrimitive('piston') },
        { label: 'Duplicate', action: duplicateSelected },
      ],
    },
    {
      id: 'deform',
      label: 'Deform',
      items: [
        { label: 'Bend', action: () => setDeform('bend', 0.4) },
        { label: 'Twist', action: () => setDeform('twist', 0.5) },
        { label: 'Taper', action: () => setDeform('taper', 0.45) },
        { label: 'Reset Deformer', action: () => setDeform('none', 0) },
      ],
    },
    {
      id: 'animate',
      label: 'Animation',
      items: [
        { label: playing ? 'Stop Playback' : 'Play', action: () => setPlaying((p) => !p) },
        { label: 'Set Key', action: setKeyAtFrame },
        { label: 'Go To Frame 0', action: () => setFrame(0) },
        { label: 'Go To Frame 60', action: () => setFrame(60) },
      ],
    },
    {
      id: 'render',
      label: 'Render',
      items: [
        { label: 'Render Frame', action: renderFrame },
        { label: 'Wireframe', action: () => setQuality('wireframe') },
        { label: 'Hidden Line', action: () => setQuality('hiddenline') },
        { label: 'Gouraud', action: () => setQuality('gouraud') },
        { label: 'Ray Trace', action: () => setQuality('raytrace') },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        {
          label: 'Real IRIX Screenshot Gallery',
          action: () => onLaunchApp?.('reference'),
        },
        { label: 'About Wavefront Explorer', action: () => setTool('model') },
      ],
    },
  ];

  const selectedRot = selected ? currentRot(selected, frame) : [0, 0, 0];

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: colorScheme.windowSurface,
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        position: 'relative',
      }}
      onClick={() => menuOpen && setMenuOpen(null)}
    >
      {/* ViewKit style menu bar */}
      <div style={{ ...menubarStyle, position: 'relative', zIndex: 30 }}>
        {menus.map((m) => (
          <span key={m.id} style={{ position: 'relative' }}>
            <span
              className="sgi-menubar-item"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(menuOpen === m.id ? null : m.id);
              }}
            >
              {m.label}
            </span>
            {menuOpen === m.id && (
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: 0,
                  minWidth: '196px',
                  background: colorScheme.windowSurface,
                  border: '1px solid #111',
                  boxShadow: '3px 4px 10px rgba(0,0,0,0.5), inset 1px 1px 0 #fff, inset -1px -1px 0 #666',
                  padding: '2px',
                  zIndex: 60,
                }}
              >
                {m.items.map((it) => (
                  <div
                    key={it.label}
                    className="sgi-menu-item"
                    style={{ fontSize: '12px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(null);
                      it.action();
                    }}
                  >
                    <span>{it.label}</span>
                  </div>
                ))}
              </div>
            )}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 400, fontStyle: 'normal' }}>
          WAVEFRONT EXPLORER 2.0 · Alias|Wavefront, a Silicon Graphics company
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* tool column */}
        <div
          style={{
            width: '54px',
            background: '#b9b9b9',
            borderRight: '2px solid #6d6d6d',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 0',
          }}
        >
          {(['model', 'shade', 'animate', 'render'] as ExplorerTool[]).map((t) => (
            <button
              key={t}
              type="button"
              title={t}
              onClick={() => {
                setTool(t);
                irixAudio.playIconSelect();
              }}
              style={{
                width: '42px',
                height: '42px',
                background: tool === t ? '#b8a87e' : '#c9c9c9',
                border: '1px solid #111',
                boxShadow:
                  tool === t
                    ? 'inset 1px 1px 0 #555, inset -1px -1px 0 #f4f4f4'
                    : 'inset 1px 1px 0 #f7f7f7, inset -1px -1px 0 #666',
                cursor: 'pointer',
                fontSize: '9.5px',
                fontWeight: 700,
                fontStyle: 'italic',
                lineHeight: 1.05,
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            type="button"
            title="Gestural (radial) menu — right click in the viewport, as Explore did"
            onClick={() => setRadial({ x: 60, y: 200 })}
            style={{
              width: '42px',
              height: '30px',
              background: '#c9c9c9',
              border: '1px solid #111',
              boxShadow: 'inset 1px 1px 0 #f7f7f7, inset -1px -1px 0 #666',
              cursor: 'pointer',
              fontSize: '9px',
              fontWeight: 700,
            }}
          >
            Gesture
          </button>
        </div>

        {/* viewport */}
        <div
          style={{ flex: 1, minWidth: 0, position: 'relative', background: '#000' }}
          onWheel={onWheel}
          onContextMenu={(e) => {
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            // the desktop is scaled as a whole: place the menu in framebuffer px
            const s = screenScale();
            setRadial({ x: (e.clientX - rect.left) / s, y: (e.clientY - rect.top) / s });
          }}
        >
          <canvas
            ref={canvasRef}
            width={620}
            height={430}
            onMouseDown={onCanvasMouseDown}
            style={{ width: '100%', height: '100%', display: 'block', cursor: dragRef.current.mode ? 'grabbing' : 'crosshair' }}
          />

          {/* gestural menu: the Explore/Maya radial menu */}
          {radial && (
            <div
              style={{
                position: 'absolute',
                left: radial.x,
                top: radial.y,
                width: '176px',
                background: colorScheme.windowSurface,
                border: '1px solid #111',
                boxShadow: '3px 4px 12px rgba(0,0,0,0.6), inset 1px 1px 0 #fff, inset -1px -1px 0 #666',
                padding: '2px',
                zIndex: 40,
              }}
            >
              <div
                style={{
                  background: colorScheme.activeTitleBg,
                  fontSize: '11px',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  padding: '2px 6px',
                  marginBottom: '2px',
                }}
              >
                Gestural Menu
              </div>
              {(['model', 'shade', 'animate', 'render'] as ExplorerTool[]).map((t) => (
                <div
                  key={t}
                  className="sgi-menu-item"
                  style={{ fontSize: '12px', textTransform: 'capitalize' }}
                  onClick={() => {
                    setTool(t);
                    setRadial(null);
                  }}
                >
                  <span>{t}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #666', borderBottom: '1px solid #fff', margin: '2px 0' }} />
              <div
                className="sgi-menu-item"
                style={{ fontSize: '12px' }}
                onClick={() => {
                  camRef.current = { yaw: 0.6, pitch: 0.3, dist: 4.0, target: [0, -0.25, 0] };
                  setRadial(null);
                }}
              >
                <span>Frame All</span>
              </div>
              <div
                className="sgi-menu-item"
                style={{ fontSize: '12px' }}
                onClick={() => {
                  setQuality(quality === 'wireframe' ? 'gouraud' : 'wireframe');
                  setRadial(null);
                }}
              >
                <span>Toggle Wireframe</span>
              </div>
            </div>
          )}
        </div>

        {/* side panel + timeline */}
        <div
          style={{
            width: '272px',
            borderLeft: '2px solid #6d6d6d',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <div style={{ flex: 1, minHeight: 0, ...panelStyle }}>{panel}</div>

          {/* timeline */}
          <div style={{ borderTop: '2px solid #6d6d6d', background: '#b9b9b9', padding: '5px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button type="button" className="sgi-btn" style={{ padding: '1px 5px', fontWeight: 700 }} onClick={() => setFrame(0)}>
                |&lt;
              </button>
              <button type="button" className="sgi-btn" style={{ padding: '1px 5px', fontWeight: 700 }} onClick={() => setFrame((f) => Math.max(0, f - 1))}>
                &lt;&lt;
              </button>
              <button
                type="button"
                className="sgi-btn"
                style={{ padding: '1px 8px', fontWeight: 700 }}
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? '■' : '▶'}
              </button>
              <button type="button" className="sgi-btn" style={{ padding: '1px 5px', fontWeight: 700 }} onClick={() => setFrame((f) => Math.min(119, f + 1))}>
                &gt;&gt;
              </button>
              <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: '11px' }}>
                {frame}/120
              </span>
            </div>
            <div
              onMouseDown={(e) => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const setFromX = (cx: number) => {
                  const f = Math.round(((cx - rect.left) / rect.width) * 119);
                  setFrame(Math.max(0, Math.min(119, f)));
                };
                setFromX(e.clientX);
                const move = (ev: MouseEvent) => setFromX(ev.clientX);
                const up = () => {
                  window.removeEventListener('mousemove', move);
                  window.removeEventListener('mouseup', up);
                };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
              }}
              style={{
                position: 'relative',
                height: '26px',
                marginTop: '4px',
                background: '#a8a8a8',
                border: '1px solid #111',
                boxShadow: 'inset 1px 1px 0 #555, inset -1px -1px 0 #efefef',
                cursor: 'ew-resize',
              }}
            >
              {/* tick marks every 12 frames */}
              {Array.from({ length: 11 }, (_, i) => i * 12).map((f) => (
                <div
                  key={f}
                  style={{
                    position: 'absolute',
                    left: `${(f / 120) * 100}%`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    background: '#6f6f6f',
                  }}
                />
              ))}
              {/* keyframe ticks for the selected object */}
              {(selected?.keys ?? []).map((k) => (
                <div
                  key={k.frame}
                  title={`key @ ${k.frame}`}
                  style={{
                    position: 'absolute',
                    left: `${(k.frame / 120) * 100}%`,
                    top: '12px',
                    width: '7px',
                    height: '7px',
                    marginLeft: '-3px',
                    background: '#d8c88a',
                    border: '1px solid #333',
                  }}
                />
              ))}
              {/* playhead */}
              <div
                style={{
                  position: 'absolute',
                  left: `${(frame / 120) * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  background: '#1d1d1d',
                }}
              />
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', marginTop: '2px' }}>
              rotX {selectedRot[0].toFixed(2)} rotY {selectedRot[1].toFixed(2)} rotZ{' '}
              {selectedRot[2].toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* status line, as every SGI program had */}
      <div
        style={{
          borderTop: '1px solid #8a8a8a',
          background: '#bdbdbd',
          padding: '3px 8px',
          fontSize: '11px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <IrixVectorIcon iconId="explorer" size={18} useMagicCarpet={false} />
        <span style={{ flex: 1, fontFamily: 'monospace' }}>{status}</span>
        <span style={{ fontFamily: 'monospace' }}>
          {objects.length} objects · {meshFor(selected ?? objects[0]).verts.length} verts ·{' '}
          {meshFor(selected ?? objects[0]).faces.length} faces
        </span>
      </div>
    </div>
  );
};

const menubarStyle: React.CSSProperties = {
  height: '22px',
  background: '#c4c4c4',
  borderBottom: '1px solid #444',
  boxShadow: 'inset 1px 1px 0 #f4f4f4, inset -1px -1px 0 #777',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '0 8px',
  fontStyle: 'italic',
  fontWeight: 700,
  fontSize: '12px',
  flexShrink: 0,
};

function currentRot(obj: ExplorerObject, frame: number): [number, number, number] {
  return objectRotationAt(obj, frame);
}

function mergeKey(obj: ExplorerObject, key: Keyframe): Keyframe[] {
  const others = obj.keys.filter((k) => k.frame !== key.frame);
  return [...others, key].sort((a, b) => a.frame - b.frame);
}
