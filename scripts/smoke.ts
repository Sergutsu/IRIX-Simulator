/**
 * Headless smoke test: exercises the ElectroPaint engine, every screen saver
 * module and the Wavefront Explorer software renderer against a stub canvas
 * context, checking for exceptions and non-finite geometry.
 *
 *   node_modules/.bin/esbuild scripts/smoke.ts --bundle --platform=node --outfile=/tmp/smoke.cjs && node /tmp/smoke.cjs
 */
import {
  createEpState,
  stepEp,
  drawEpFrame,
  parseEpScript,
  EP_DEFAULT_SCRIPT,
  setEpSlider,
  hlsToRgb,
} from '../src/screensaver/electropaint';
import { SCREEN_SAVER_MODULES } from '../src/screensaver/saverModules';
import {
  buildPrimitive,
  deformMesh,
  PRIMITIVE_LIBRARY,
  PrimitiveId,
  DeformId,
} from '../src/apps/explorer/tavGeometry';
import { drawScene, objectRotationAt, ExplorerObject } from '../src/apps/WavefrontExplorerApp';

let problems = 0;
const fail = (msg: string) => {
  problems++;
  console.error('  FAIL ' + msg);
};
const ok = (msg: string) => console.log('  ok   ' + msg);

function makeStubCtx() {
  let coords = 0;
  const grad = { addColorStop: () => undefined };
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return (...args: number[]) => {
          for (const a of args) if (!Number.isFinite(a)) fail(`gradient arg not finite: ${args}`);
          return grad;
        };
      }
      return (...args: unknown[]) => {
        if (prop === 'moveTo' || prop === 'lineTo') {
          const [x, y] = args as number[];
          coords++;
          if (!Number.isFinite(x) || !Number.isFinite(y)) {
            fail(`${prop} got non-finite coordinate (${x}, ${y})`);
          }
        }
        if (prop === 'fillRect' || prop === 'strokeRect') {
          const [x, y, w, h] = args as number[];
          if (![x, y, w, h].every(Number.isFinite)) fail(`${prop} got non-finite args`);
        }
        return undefined;
      };
    },
    set() {
      return true;
    },
  };
  return { ctx: new Proxy({}, handler) as unknown as CanvasRenderingContext2D, count: () => coords };
}

/* 1. ElectroPaint engine ------------------------------------------------ */
console.log('ElectroPaint engine');
{
  const state = createEpState({ seed: 12345 });
  const { ctx, count } = makeStubCtx();
  let frames = 0;
  for (let i = 0; i < 900; i++) {
    stepEp(state, 1 / 30);
    drawEpFrame(ctx, state, 1024, 768, { clear: true, fill: true });
    frames++;
    const s = state.sliders;
    for (const key of Object.keys(s) as (keyof typeof s)[]) {
      const v = s[key].value;
      if (!Number.isFinite(v)) fail(`slider ${key} became non-finite`);
      if (v < s[key].min - 1e-6 || v > s[key].max + 1e-6) fail(`slider ${key} out of range: ${v}`);
      if (s[key].sub > 1.0001 || s[key].sub < -1.0001) fail(`sub-slider ${key} out of range: ${s[key].sub}`);
    }
    if (state.triCount < 1) fail('no polygons drawn on frame ' + i);
  }
  ok(`${frames} frames stepped and drawn, ${count()} finite polygon vertices`);
  const acts = parseEpScript(EP_DEFAULT_SCRIPT);
  if (acts.length < 5) fail(`script parsed only ${acts.length} acts`);
  else ok(`script parsed: ${acts.length} acts (${acts.map((a) => a.name).join(', ')})`);
  setEpSlider(state, 'n', 64);
  stepEp(state, 1 / 30);
  drawEpFrame(ctx, state, 640, 480, { clear: true });
  if (state.triCount !== 64) fail(`expected 64 polygons at n=64, got ${state.triCount}`);
  else ok('n slider drives the polygon count (64 polygons)');
  const [r, g, b] = hlsToRgb(200, 0.5, 0.8);
  if (![r, g, b].every((v) => v >= 0 && v <= 255 && Number.isFinite(v))) fail(`hlsToRgb gave ${r},${g},${b}`);
  else ok(`hlsToRgb(200,0.5,0.8) = ${r},${g},${b}`);
}

/* 2. Screen saver modules ---------------------------------------------- */
console.log('Screen saver modules');
for (const mod of SCREEN_SAVER_MODULES) {
  const { ctx } = makeStubCtx();
  const inst = mod.create(1280, 1024);
  let err: unknown = null;
  try {
    for (let i = 0; i < 240; i++) {
      inst.step(1 / 60, 1280, 1024);
      inst.draw(ctx, 1280, 1024);
    }
    inst.draw(ctx, 800, 600);
  } catch (e) {
    err = e;
  }
  if (err) fail(`${mod.id}: ${(err as Error).message}`);
  else ok(`${mod.id} "${mod.name}" (${mod.binary}) ran 240 frames at two sizes`);
}

/* 3. Wavefront Explorer geometry + renderer ----------------------------- */
console.log('Wavefront Explorer');
for (const p of PRIMITIVE_LIBRARY) {
  const mesh = buildPrimitive(p.id as PrimitiveId);
  if (!mesh.verts.length || !mesh.faces.length) fail(`${p.id} produced an empty mesh`);
  const bad = mesh.faces.some((f) => f.some((i) => i < 0 || i >= mesh.verts.length));
  if (bad) fail(`${p.id} has out-of-range face indices`);
  for (const d of ['bend', 'twist', 'taper'] as DeformId[]) {
    const dm = deformMesh(mesh, d, 0.5);
    if (dm.verts.some((v) => v.some((c) => !Number.isFinite(c)))) fail(`${p.id}/${d} produced non-finite verts`);
  }
}
ok(`${PRIMITIVE_LIBRARY.length} primitives built, deformers finite`);

{
  const objects: ExplorerObject[] = PRIMITIVE_LIBRARY.slice(0, 4).map((p, i) => ({
    id: `o${i}`,
    name: `${p.id}.obj`,
    primitive: p.id as PrimitiveId,
    pos: [i * 1.1 - 1.6, 0, 0],
    deform: i % 2 ? 'twist' : 'none',
    deformAmount: 0.4,
    material: ['chrome', 'gold', 'jade', 'glass'][i % 4],
    keys: [
      { frame: 0, rx: 0, ry: 0, rz: 0 },
      { frame: 60, rx: 0.5, ry: 3.1, rz: 0.2 },
      { frame: 120, rx: 0, ry: 6.28, rz: 0 },
    ],
    visible: true,
  }));
  const { ctx } = makeStubCtx();
  const qualities = ['wireframe', 'hiddenline', 'flat', 'gouraud', 'raytrace'] as const;
  for (const q of qualities) {
    for (const size of [
      [320, 240],
      [1024, 768],
    ]) {
      for (let frame = 0; frame <= 120; frame += 24) {
        drawScene(ctx, size[0], size[1], objects, { yaw: 0.6, pitch: 0.35, dist: 5.4, target: [0, 0, 0] }, {
          quality: q,
          showGrid: true,
          floor: true,
          lightAngle: frame / 30,
          frame,
        });
      }
    }
  }
  ok(`rendered ${qualities.length} qualities x 2 resolutions x 6 frames, plus grid/floor/shadow`);
  const rot = objectRotationAt(objects[0], 30);
  if (!rot.every(Number.isFinite) || Math.abs(rot[1] - 1.55) > 0.05) fail(`interpolation wrong: ${rot}`);
  else ok(`keyframe interpolation mid-way between 0 and 60 = ${rot.map((v) => v.toFixed(3)).join(', ')}`);
  const end = objectRotationAt(objects[0], 200);
  if (Math.abs(end[1] - 6.28) > 1e-6) fail('extrapolation past the last key is wrong');
  else ok('poses hold after the last keyframe');
}

console.log(problems ? `\n${problems} PROBLEM(S)` : '\nall checks passed');
process.exit(problems ? 1 : 0);
