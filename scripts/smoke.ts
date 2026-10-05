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
import { drawScene, objectRotationAt, pickObject, type ExplorerObject } from '../src/apps/explorer/drawScene';
import { booleanHulls, cameraBasis, sceneToObj } from '../src/apps/explorer/modelOps';
import { MIN_SCREEN_H, MIN_SCREEN_W, clampWindow, fitScreen, placeWindow, setScreenMetrics } from '../src/state/screen';
import { calcSequence } from '../src/apps/ivcalc/engine';
import { HOME_POSE, drawCalculator, keyFacesCamera, keyScreenPoint, pickCalcKey } from '../src/apps/ivcalc/scene';

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

  const right = cameraBasis({ yaw: 0, pitch: 0, dist: 5, target: [0, 0, 0] }).right;
  if (Math.abs(right[0] - 1) > 1e-6 || Math.abs(right[1]) > 1e-6) fail(`camera right at yaw 0 is ${right}`);
  else ok('camera-relative move basis points along +X when the camera looks down -Z');

  const hull = (id: string, primitive: ExplorerObject['primitive'], pos: [number, number, number]): ExplorerObject => ({
    id,
    name: `${primitive}.mod`,
    primitive,
    pos,
    rot: [0, 0, 0],
    scale: [1, 1, 1],
    deform: 'none',
    deformAmount: 0,
    material: 'gold',
    keys: [{ frame: 0, rx: 0, ry: 0, rz: 0 }],
    visible: true,
  });
  const cube = hull('cube', 'cube', [0, 0, 0]);
  const sphere = hull('sphere', 'sphere', [1.2, 0, 0]);
  const union = booleanHulls(cube, sphere, 'union');
  const cubeVerts = 8;
  if (!union?.baked || union.baked.verts.length <= cubeVerts) fail('union did not merge the two hulls');
  else ok(`boolean union baked ${union.baked.verts.length} vertices`);
  const diff = booleanHulls(cube, sphere, 'difference');
  if (!diff?.baked || diff.baked.faces.length >= 6 || diff.baked.faces.length < 1) {
    fail(`difference faces ${diff?.baked?.faces.length ?? 'none'}`);
  } else ok(`boolean difference kept ${diff.baked.faces.length} of 6 cube faces`);
  const obj = sceneToObj([cube]);
  if (!obj.includes('o cube.mod') || !obj.includes('\nv ')) fail('OBJ export missing object or vertex');
  else ok('scene exports Wavefront OBJ');
  const hit = pickObject([cube, sphere], { yaw: 0.4, pitch: 0.3, dist: 6, target: [0, 0, 0] }, 0, 160, 120, 320, 240);
  if (hit !== 'cube' && hit !== 'sphere' && hit !== null) fail(`pick returned ${hit}`);
  else ok(`pick sample returned ${hit ?? 'empty'}`);
}

/* ------------------------------------------------------------------ *
 * IVcalc                                                              *
 * ------------------------------------------------------------------ */
console.log('IVcalc');
{
  const expect = (labels: string[], display: string) => {
    const got = calcSequence(labels).display;
    if (got !== display) fail(`${labels.join(' ')} => ${got}, expected ${display}`);
  };
  expect(['7', '0', '7', '7', '3'], '70773');
  expect(['1', '2', '+', '7', '='], '19');
  expect(['8', '*', '3', '='], '24');
  expect(['9', '-', '2', '='], '7');
  expect(['8', '/', '2', '='], '4');
  expect(['1', '/', '0', '='], 'Error');
  expect(['5', '+', 'CE', '3', '='], '8');
  expect(['5', '+/-'], '-5');
  expect(['2', '0', '0', '+', '1', '0', '%', '='], '220');
  expect(['2', '+', '3', '*', '4', '='], '20');
  expect(['2', '+', '3', '=', '='], '8');
  expect(['1', '.', '5', '+', '2', '.', '5', '='], '4');
  expect(['0', '0', '5'], '5');
  expect(['1', '/', '0', '=', '7'], 'Error');
  expect(['1', '/', '0', '=', 'AC', '4'], '4');
  ok('calculator sequences: 70773, arithmetic, percent, chain, repeat equals, divide by zero');

  if (!keyFacesCamera('7', HOME_POSE)) fail('key 7 does not face the home camera');
  else ok('home view faces the keypad');
  const point = keyScreenPoint('7', HOME_POSE, 640, 420);
  const hit = point ? pickCalcKey(HOME_POSE, point.x, point.y, 640, 420, null) : null;
  if (hit !== '7') fail(`pick on key 7 returned ${hit}`);
  else ok('click hits the 7 key at the home angle');
  const tumbled = { ...HOME_POSE, rx: HOME_POSE.rx + 0.4, ry: HOME_POSE.ry - 0.5 };
  const point2 = keyScreenPoint('=', tumbled, 640, 420);
  const hit2 = point2 ? pickCalcKey(tumbled, point2.x, point2.y, 640, 420, null) : null;
  if (hit2 !== '=') fail(`pick on = after tumble returned ${hit2}`);
  else ok('click still hits = after a tumble');
  const { ctx, count } = makeStubCtx();
  drawCalculator(ctx, 640, 420, HOME_POSE, null, '70773');
  if (count() < 800) fail(`calculator draw produced too little geometry (${count()} vertices)`);
  else ok(`drew the 3D calculator with polygon legends (${count()} vertices)`);
}

/* ------------------------------------------------------------------ *
 * Desktop display scaling                                             *
 * ------------------------------------------------------------------ */
console.log('Desktop display scaling');

{
  const cases: [number, number, number, number][] = [
    // viewport, expected scale, expected framebuffer w, h
    [1920, 1080, 1, 1920, 1080],
    [1280, 800, 1, 1280, 800],
    [1024, 700, 1, 1024, 700],
    [1024, 620, 620 / 700, 1156, 700],
    [800, 600, 0.78125, 1024, 768],
  ];
  let bad = 0;
  for (const [vw, vh, scale, fw, fh] of cases) {
    const m = fitScreen(vw, vh);
    if (Math.abs(m.scale - scale) > 1e-6 || Math.abs(m.width - fw) > 1 || Math.abs(m.height - fh) > 1) {
      fail(`fitScreen(${vw}, ${vh}) = ${m.scale.toFixed(4)} ${m.width}x${m.height}, expected ${scale.toFixed(4)} ${fw}x${fh}`);
      bad++;
    }
    // the scaled framebuffer must cover the viewport exactly
    if (Math.abs(m.width * m.scale - vw) > 1 || Math.abs(m.height * m.scale - vh) > 1) {
      fail(`framebuffer does not fill the viewport: ${m.width * m.scale}x${m.height * m.scale} vs ${vw}x${vh}`);
      bad++;
    }
    if (m.width < MIN_SCREEN_W || m.height < MIN_SCREEN_H) {
      fail(`framebuffer ${m.width}x${m.height} is below the ${MIN_SCREEN_W}x${MIN_SCREEN_H} floor`);
      bad++;
    }
  }
  if (!bad) ok('framebuffer fills the viewport at 1920x1080, 1280x800, 1024x700, 1024x620 and 800x600');

  // clamping keeps windows on screen at the smallest framebuffer
  setScreenMetrics(fitScreen(800, 600));
  const cases2: [number, number, number, number, number, number][] = [
    // x, y, w, h, expected x, expected y
    [900, 26, 530, 360, 486, 26],
    [155, -40, 700, 600, 155, 0],
    [-80, 400, 400, 300, 0, 400],
  ];
  let bad2 = 0;
  for (const [x, y, w, h, ex, ey] of cases2) {
    const p = clampWindow(x, y, w, h);
    if (Math.abs(p.x - ex) > 1 || Math.abs(p.y - ey) > 1) {
      fail(`clampWindow(${x}, ${y}, ${w}, ${h}) = ${p.x},${p.y}, expected ${ex},${ey}`);
      bad2++;
    }
    if (p.x + Math.min(w, 1024) > 1024 + 1 || p.y + Math.min(h, 768) > 768 + 1) {
      fail(`clamped window sticks out of the framebuffer: ${p.x}+${w}, ${p.y}+${h}`);
      bad2++;
    }
  }
  const at = placeWindow(900, 600, 0);
  if (at.x + 900 > 1024 || at.y + 600 > 768) fail(`new window placed off screen at ${at.x},${at.y}`);
  if (!bad2) ok('windows stay inside the framebuffer when placed, dragged and cascaded');

  // 1:1 displays keep the requested framebuffer
  setScreenMetrics(fitScreen(1920, 1080));
  const big = placeWindow(900, 600, 48);
  if (big.x <= 155) fail(`cascade did not step: ${big.x}`);
  else ok(`cascade steps at 1:1 (155 -> ${big.x}) and stays on the display`);
}

console.log(problems ? `\n${problems} PROBLEM(S)` : '\nall checks passed');
process.exit(problems ? 1 : 0);
