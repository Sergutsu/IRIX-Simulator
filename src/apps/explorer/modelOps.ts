/**
 * Mesh edits for Advanced Visualizer Model: world bake, booleans, mirror, OBJ.
 */
import type { Camera, ExplorerObject } from './drawScene';
import { meshFor, objectRotationAt } from './drawScene';
import {
  applyMat,
  matMul,
  matRotX,
  matRotY,
  matRotZ,
  matScale,
  mergeMeshes,
  type Mesh,
  type Vec3,
} from './tavGeometry';

export function cameraBasis(cam: Camera): { right: Vec3; up: Vec3 } {
  const cp = Math.cos(cam.pitch);
  const sp = Math.sin(cam.pitch);
  const cy = Math.cos(cam.yaw);
  const sy = Math.sin(cam.yaw);
  return {
    right: [cy, 0, -sy],
    up: [sp * sy, cp, sp * cy],
  };
}

export function worldMesh(obj: ExplorerObject, frame = 0): Mesh {
  const [rx, ry, rz] = objectRotationAt(obj, frame);
  const rot = matMul(matMul(matRotY(ry), matRotX(rx)), matRotZ(rz));
  const sc = obj.scale ?? [1, 1, 1];
  const placed = matMul(rot, matScale(sc[0], sc[1], sc[2]));
  const src = meshFor(obj);
  return {
    name: obj.name,
    verts: src.verts.map((v) => {
      const p = applyMat(placed, v);
      return [p[0] + obj.pos[0], p[1] + obj.pos[1], p[2] + obj.pos[2]] as Vec3;
    }),
    faces: src.faces.map((f) => [...f]),
  };
}

function bounds(mesh: Mesh) {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const v of mesh.verts) {
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], v[i]);
      max[i] = Math.max(max[i], v[i]);
    }
  }
  return { min, max };
}

function centroid(mesh: Mesh, face: number[]): Vec3 {
  const c: Vec3 = [0, 0, 0];
  for (const i of face) {
    c[0] += mesh.verts[i][0];
    c[1] += mesh.verts[i][1];
    c[2] += mesh.verts[i][2];
  }
  const n = face.length || 1;
  return [c[0] / n, c[1] / n, c[2] / n];
}

function inside(box: { min: Vec3; max: Vec3 }, p: Vec3) {
  return p[0] >= box.min[0] && p[0] <= box.max[0] && p[1] >= box.min[1] && p[1] <= box.max[1] && p[2] >= box.min[2] && p[2] <= box.max[2];
}

export type BooleanOp = 'union' | 'difference' | 'intersection';

/** Bake two hulls. Union merges them. Difference and intersection keep A's faces by B's bounds. */
export function booleanHulls(a: ExplorerObject, b: ExplorerObject, op: BooleanOp, frame = 0): ExplorerObject | null {
  const ma = worldMesh(a, frame);
  const mb = worldMesh(b, frame);
  let mesh: Mesh;
  if (op === 'union') {
    mesh = mergeMeshes([ma, mb], `${a.name}+${b.name}`);
  } else {
    const box = bounds(mb);
    const faces = ma.faces.filter((f) => {
      const hit = inside(box, centroid(ma, f));
      return op === 'intersection' ? hit : !hit;
    });
    if (!faces.length) return null;
    mesh = { name: `${op}_${a.name}`, verts: ma.verts, faces };
  }
  return {
    ...a,
    name: `${op}_${a.primitive}.mod`,
    baked: mesh,
    pos: [0, 0, 0],
    rot: [0, 0, 0],
    scale: [1, 1, 1],
    deform: 'none',
    deformAmount: 0,
    keys: [{ frame: 0, rx: 0, ry: 0, rz: 0 }],
  };
}

export function mirrorCopy(obj: ExplorerObject, serial: number, frame = 0): ExplorerObject {
  const mesh = worldMesh(obj, frame);
  const flipped: Mesh = {
    name: `mirror_${obj.name}`,
    verts: mesh.verts.map((v) => [-v[0], v[1], v[2]] as Vec3),
    faces: mesh.faces.map((f) => [...f].reverse()),
  };
  return {
    ...obj,
    id: `obj_${serial}`,
    name: `mirror_${serial}.mod`,
    baked: flipped,
    pos: [0, 0, 0],
    rot: [0, 0, 0],
    scale: [1, 1, 1],
    deform: 'none',
    deformAmount: 0,
    keys: [{ frame: 0, rx: 0, ry: 0, rz: 0 }],
  };
}

export function sceneToObj(objects: ExplorerObject[], frame = 0): string {
  const lines = ['# Advanced Visualizer Model 4.2.1'];
  let base = 1;
  for (const obj of objects) {
    if (!obj.visible) continue;
    const mesh = worldMesh(obj, frame);
    lines.push(`o ${obj.name}`);
    for (const v of mesh.verts) lines.push(`v ${v[0].toFixed(5)} ${v[1].toFixed(5)} ${v[2].toFixed(5)}`);
    for (const f of mesh.faces) lines.push(`f ${f.map((i) => i + base).join(' ')}`);
    base += mesh.verts.length;
  }
  return lines.join('\n') + '\n';
}
