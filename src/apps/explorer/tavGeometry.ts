/**
 * Polygonal geometry for the Wavefront Explorer simulator.
 *
 * Wavefront's Advanced Visualizer / TDI Explore modeler built everything from
 * polygonal hulls (plus NURBS patches), then handed those vertices to the
 * IRIS GL pipeline for shaded display.  The primitives below are the ones the
 * modeler's primitive menu produced.
 */

export type Vec3 = [number, number, number];

export interface Mesh {
  name: string;
  verts: Vec3[];
  faces: number[][];
}

export interface Mat4 {
  m: number[]; // column-major, 16 entries
}

export const IDENTITY: Mat4 = { m: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] };

export function matMul(a: Mat4, b: Mat4): Mat4 {
  const r = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) {
    for (let row = 0; row < 4; row++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a.m[k * 4 + row] * b.m[c * 4 + k];
      r[c * 4 + row] = s;
    }
  }
  return { m: r };
}

export function matTranslate(x: number, y: number, z: number): Mat4 {
  return { m: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1] };
}

export function matScale(x: number, y: number, z: number): Mat4 {
  return { m: [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1] };
}

export function matRotX(a: number): Mat4 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { m: [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1] };
}
export function matRotY(a: number): Mat4 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { m: [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1] };
}
export function matRotZ(a: number): Mat4 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { m: [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] };
}

export function applyMat(m: Mat4, v: Vec3): Vec3 {
  return [
    m.m[0] * v[0] + m.m[4] * v[1] + m.m[8] * v[2] + m.m[12],
    m.m[1] * v[0] + m.m[5] * v[1] + m.m[9] * v[2] + m.m[13],
    m.m[2] * v[0] + m.m[6] * v[1] + m.m[10] * v[2] + m.m[14],
  ];
}

export function transformMesh(mesh: Mesh, m: Mat4, name?: string): Mesh {
  return {
    name: name ?? mesh.name,
    verts: mesh.verts.map((v) => applyMat(m, v)),
    faces: mesh.faces.map((f) => [...f]),
  };
}

export function mergeMeshes(meshes: Mesh[], name: string): Mesh {
  const verts: Vec3[] = [];
  const faces: number[][] = [];
  for (const mesh of meshes) {
    const offset = verts.length;
    verts.push(...mesh.verts);
    for (const f of mesh.faces) faces.push(f.map((i) => i + offset));
  }
  return { name, verts, faces };
}

/* ------------------------------------------------------------------ *
 * Primitives                                                          *
 * ------------------------------------------------------------------ */

export function makeCube(size = 1): Mesh {
  const s = size / 2;
  const verts: Vec3[] = [
    [-s, -s, -s],
    [s, -s, -s],
    [s, s, -s],
    [-s, s, -s],
    [-s, -s, s],
    [s, -s, s],
    [s, s, s],
    [-s, s, s],
  ];
  const faces = [
    [0, 3, 2, 1],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [3, 7, 6, 2],
    [1, 2, 6, 5],
    [0, 4, 7, 3],
  ];
  return { name: 'cube', verts, faces };
}

export function makeTetrahedron(size = 1): Mesh {
  const s = size;
  const verts: Vec3[] = [
    [s, s, s],
    [s, -s, -s],
    [-s, s, -s],
    [-s, -s, s],
  ];
  const faces = [
    [0, 1, 2],
    [0, 3, 1],
    [0, 2, 3],
    [1, 3, 2],
  ];
  return { name: 'tetrahedron', verts, faces };
}

export function makeSphere(radius = 1, segU = 12, segV = 8): Mesh {
  const verts: Vec3[] = [];
  const faces: number[][] = [];
  for (let iv = 0; iv <= segV; iv++) {
    const phi = (iv / segV) * Math.PI;
    for (let iu = 0; iu <= segU; iu++) {
      const theta = (iu / segU) * Math.PI * 2;
      verts.push([
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
      ]);
    }
  }
  const idx = (iu: number, iv: number) => iv * (segU + 1) + iu;
  for (let iv = 0; iv < segV; iv++) {
    for (let iu = 0; iu < segU; iu++) {
      faces.push([idx(iu, iv), idx(iu + 1, iv), idx(iu + 1, iv + 1), idx(iu, iv + 1)]);
    }
  }
  return { name: 'sphere', verts, faces };
}

export function makeCylinder(radius = 0.5, height = 1.5, seg = 16, capped = true): Mesh {
  const verts: Vec3[] = [];
  const faces: number[][] = [];
  const h = height / 2;
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    verts.push([Math.cos(a) * radius, -h, Math.sin(a) * radius]);
  }
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    verts.push([Math.cos(a) * radius, h, Math.sin(a) * radius]);
  }
  for (let i = 0; i < seg; i++) {
    const nx = (i + 1) % seg;
    faces.push([i, nx, seg + nx, seg + i]);
  }
  if (capped) {
    const bottom: number[] = [];
    const top: number[] = [];
    for (let i = seg - 1; i >= 0; i--) bottom.push(i);
    for (let i = 0; i < seg; i++) top.push(seg + i);
    faces.push(bottom);
    faces.push(top);
  }
  return { name: 'cylinder', verts, faces };
}

export function makeCone(radius = 0.6, height = 1.4, seg = 16): Mesh {
  const verts: Vec3[] = [];
  const faces: number[][] = [];
  const h = height / 2;
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    verts.push([Math.cos(a) * radius, -h, Math.sin(a) * radius]);
  }
  const apex = verts.length;
  verts.push([0, h, 0]);
  for (let i = 0; i < seg; i++) {
    const nx = (i + 1) % seg;
    faces.push([i, nx, apex]);
  }
  const base: number[] = [];
  for (let i = seg - 1; i >= 0; i--) base.push(i);
  faces.push(base);
  return { name: 'cone', verts, faces };
}

export function makeTorus(R = 0.85, r = 0.32, segU = 20, segV = 10): Mesh {
  const verts: Vec3[] = [];
  const faces: number[][] = [];
  for (let iu = 0; iu < segU; iu++) {
    const u = (iu / segU) * Math.PI * 2;
    for (let iv = 0; iv < segV; iv++) {
      const v = (iv / segV) * Math.PI * 2;
      verts.push([
        (R + r * Math.cos(v)) * Math.cos(u),
        r * Math.sin(v),
        (R + r * Math.cos(v)) * Math.sin(u),
      ]);
    }
  }
  const idx = (iu: number, iv: number) => (iu % segU) * segV + (iv % segV);
  for (let iu = 0; iu < segU; iu++) {
    for (let iv = 0; iv < segV; iv++) {
      faces.push([idx(iu, iv), idx(iu + 1, iv), idx(iu + 1, iv + 1), idx(iu, iv + 1)]);
    }
  }
  return { name: 'torus', verts, faces };
}

export function makePlane(size = 2, seg = 6): Mesh {
  const verts: Vec3[] = [];
  const faces: number[][] = [];
  for (let iv = 0; iv <= seg; iv++) {
    for (let iu = 0; iu <= seg; iu++) {
      verts.push([(iu / seg - 0.5) * size, 0, (iv / seg - 0.5) * size]);
    }
  }
  const idx = (iu: number, iv: number) => iv * (seg + 1) + iu;
  for (let iv = 0; iv < seg; iv++) {
    for (let iu = 0; iu < seg; iu++) {
      faces.push([idx(iu, iv), idx(iu + 1, iv), idx(iu + 1, iv + 1), idx(iu, iv + 1)]);
    }
  }
  return { name: 'plane', verts, faces };
}

/**
 * The piston assembly.  Wavefront's own SGI demo tape ("Wavefront Pictureout")
 * modelled a machined piston in the Advanced Visualizer, so it belongs here.
 */
export function makePiston(): Mesh[] {
  const body = transformMesh(makeCylinder(0.45, 0.9, 20, true), matTranslate(0, 0, 0), 'piston_body');
  const skirt = transformMesh(makeCylinder(0.5, 0.3, 20, true), matTranslate(0, -0.55, 0), 'piston_skirt');
  const crown = transformMesh(makeCylinder(0.46, 0.12, 20, true), matTranslate(0, 0.47, 0), 'crown');
  const ring1 = transformMesh(makeTorus(0.46, 0.05, 18, 6), matTranslate(0, 0.32, 0), 'compression_ring_1');
  const ring2 = transformMesh(makeTorus(0.46, 0.05, 18, 6), matTranslate(0, 0.18, 0), 'compression_ring_2');
  const rod = transformMesh(makeCylinder(0.15, 1.5, 12, true), matTranslate(0, -1.4, 0), 'connecting_rod');
  const pin = transformMesh(
    makeCylinder(0.12, 1.1, 10, true),
    matMul(matTranslate(0, 0.1, 0), matRotZ(Math.PI / 2)),
    'wrist_pin'
  );
  return [body, skirt, crown, ring1, ring2, rod, pin];
}

export const PRIMITIVE_LIBRARY = [
  { id: 'cube', label: 'Cube' },
  { id: 'tetrahedron', label: 'Tetrahedron' },
  { id: 'sphere', label: 'Sphere' },
  { id: 'cylinder', label: 'Cylinder' },
  { id: 'cone', label: 'Cone' },
  { id: 'torus', label: 'Torus' },
  { id: 'plane', label: 'Plane' },
  { id: 'piston', label: 'Piston Assembly' },
] as const;

export type PrimitiveId = (typeof PRIMITIVE_LIBRARY)[number]['id'];

export function buildPrimitive(id: PrimitiveId): Mesh {
  switch (id) {
    case 'cube':
      return makeCube(1.1);
    case 'tetrahedron':
      return makeTetrahedron(0.8);
    case 'sphere':
      return makeSphere(0.7, 14, 9);
    case 'cylinder':
      return makeCylinder(0.5, 1.4, 18, true);
    case 'cone':
      return makeCone(0.6, 1.3, 18);
    case 'torus':
      return makeTorus();
    case 'plane':
      return makePlane(1.8, 6);
    case 'piston':
      return mergeMeshes(makePiston(), 'piston');
    default:
      return makeCube(1);
  }
}

/* ------------------------------------------------------------------ *
 * Deformers — the modeling operations of the era                      *
 * ------------------------------------------------------------------ */

export type DeformId = 'none' | 'bend' | 'twist' | 'taper';

export function deformMesh(mesh: Mesh, kind: DeformId, amount: number): Mesh {
  if (kind === 'none' || Math.abs(amount) < 1e-4) return { ...mesh, verts: mesh.verts.map((v) => [...v] as Vec3) };
  let minY = Infinity;
  let maxY = -Infinity;
  for (const v of mesh.verts) {
    minY = Math.min(minY, v[1]);
    maxY = Math.max(maxY, v[1]);
  }
  const span = maxY - minY || 1;

  const verts = mesh.verts.map((v) => {
    const t = (v[1] - minY) / span; // 0 at the bottom, 1 at the top
    if (kind === 'twist') {
      const a = (t - 0.5) * amount * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      return [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c] as Vec3;
    }
    if (kind === 'taper') {
      const kk = Math.max(0.05, 1 + (t - 0.5) * amount * 1.6);
      return [v[0] * kk, v[1], v[2] * kk] as Vec3;
    }
    // bend: rotate each horizontal slice around Z
    const a = (t - 0.5) * amount * Math.PI * 0.9;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const x = v[0];
    const y = v[1] - minY - span / 2;
    return [x * c - y * s, x * s + y * c + minY + span / 2, v[2]] as Vec3;
  });
  return { ...mesh, verts };
}
