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
  EP_MAX_SHAPES,
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
import { initialOsState, loadOsState, osReducer, saveOsState } from '../src/state/osState';
import type { OsState } from '../src/state/osState';
import { APP_WINDOW_DEFAULTS } from '../src/state/osStore';

let problems = 0;
const fail = (msg: string) => {
  problems++;
  console.error('  FAIL ' + msg);
};
const ok = (msg: string) => console.log('  ok   ' + msg);

function makeStubCtx() {
  let coords = 0;
  let corners = 0;
  let lastCorners = 0;
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
          if (prop === 'moveTo') corners = 1;
          else corners++;
        }
        if (prop === 'closePath') lastCorners = corners;
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
  return {
    ctx: new Proxy({}, handler) as unknown as CanvasRenderingContext2D,
    count: () => coords,
    /** corners in the most recently closed path: 4 for a quad, 3 for a triangle */
    lastPath: () => lastCorners,
  };
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

  // quads are the default shape, not triangles
  const shape = createEpState({ seed: 7 });
  if (!shape.squares) fail('ElectroPaint defaults to triangles, expected quads');
  const pts = makeStubCtx();
  drawEpFrame(pts.ctx, shape, 640, 480, { clear: true });
  const corners = pts.lastPath();
  if (corners !== 4) fail(`default shape drew ${corners} corners, expected a quad (4)`);
  else ok('shapes are quads by default');

  // the flock can be pushed to the cap and still draws
  const dense = createEpState({ seed: 7 });
  setEpSlider(dense, 'n', EP_MAX_SHAPES, { hold: true });
  stepEp(dense, 1 / 30);
  const big = makeStubCtx();
  drawEpFrame(big.ctx, dense, 1280, 1024, { clear: true, fill: true });
  if (dense.triCount !== EP_MAX_SHAPES) fail(`at n=${EP_MAX_SHAPES} drew ${dense.triCount} polygons`);
  else if (!Number.isFinite(big.count())) fail('geometry went non-finite at the maximum flock size');
  else ok(`flock reaches ${EP_MAX_SHAPES} shapes without breaking`);

  // The helix controls must follow the script, not the dice. Two runs on
  // *different* seeds have different shape jitter and colours, but the control
  // values a viewer sees must match exactly.
  const runA = createEpState({ seed: 1 });
  const runB = createEpState({ seed: 987654 });
  for (let i = 0; i < 400; i++) {
    stepEp(runA, 1 / 30);
    stepEp(runB, 1 / 30);
  }
  const drift = (Object.keys(runA.sliders) as (keyof typeof runA.sliders)[]).filter(
    (k) => Math.abs(runA.sliders[k].value - runB.sliders[k].value) > 1e-9
  );
  if (drift.length) fail(`the control panel depends on the random seed: ${drift.join(', ')}`);
  else ok('control values follow the script, not the seed (no random reshuffling)');

  // a held control keeps the value the user gave it
  const held = createEpState({ seed: 3 });
  setEpSlider(held, 'arm', 0.83, { hold: true });
  for (let i = 0; i < 300; i++) stepEp(held, 1 / 30);
  if (Math.abs(held.sliders.arm.value - 0.83) > 1e-9) fail('a held control was pulled away by the drive');
  else ok('a control you grab stays where you put it');
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

console.log('Desktop state reducer');
{
  const run = (state: OsState, ...actions: Parameters<typeof osReducer>[1][]): OsState =>
    actions.reduce(osReducer, state);
  const base = { ...initialOsState, windows: [], activeWinId: '' };
  let bad = 0;
  const expect = (cond: boolean, msg: string) => {
    if (!cond) {
      fail(msg);
      bad++;
    }
  };

  // launching gives a window the registry's default geometry
  const launched = osReducer(base, { type: 'launch', appId: 'fcheck' });
  const win = launched.windows[0];
  expect(!!win, 'launch produced no window');
  expect(win.width === APP_WINDOW_DEFAULTS.fcheck.width, `launch width ${win?.width} is not the default`);
  expect(win.title === APP_WINDOW_DEFAULTS.fcheck.title, 'launch title is not the default');
  expect(launched.activeWinId === win.id, 'launch did not focus the new window');

  // relaunching the same app reuses the window instead of stacking another
  const again = osReducer(launched, { type: 'launch', appId: 'fcheck' });
  expect(again.windows.length === 1, 'relaunch opened a second window');

  // each Alias|Wavefront module is its own window
  const aw1 = osReducer(base, { type: 'launch', appId: 'aw_module', payload: { module: 'paint' } });
  const aw2 = osReducer(aw1, { type: 'launch', appId: 'aw_module', payload: { module: 'preview' } });
  expect(aw2.windows.length === 2, 'two Alias|Wavefront modules collapsed into one window');
  expect(aw2.windows[1].title === 'Alias|Wavefront', 'aw_module lost its payload title');

  // `screens bounce` preselects the saver module
  const saver = osReducer(base, { type: 'launch', appId: 'screensaver', payload: { module: 'hops' } });
  expect(saver.saverConfig.moduleId === 'hopalong', `hops mapped to ${saver.saverConfig.moduleId}`);
  const saver2 = osReducer(base, { type: 'launch', appId: 'screensaver', payload: { module: 'bounce' } });
  expect(saver2.saverConfig.moduleId === 'bounce', 'bounce did not preselect the bounce module');

  // a saved render becomes a filesystem node the File Manager can show
  const saved = osReducer(base, {
    type: 'saveRender',
    path: '/usr/people/guest/renders/frame.rgb',
    dataUrl: 'data:image/png;base64,AAAA',
    meta: '320x240',
  });
  const node = saved.vfs.find((n) => n.path === '/usr/people/guest/renders/frame.rgb');
  expect(!!node, 'saveRender wrote no filesystem node');
  expect(node?.imageUrl === 'data:image/png;base64,AAAA', 'saved render lost its image');
  const rewritten = osReducer(saved, {
    type: 'saveRender',
    path: '/usr/people/guest/renders/frame.rgb',
    dataUrl: 'data:image/png;base64,BBBB',
    meta: '640x480',
  });
  expect(rewritten.vfs.filter((n) => n.path === '/usr/people/guest/renders/frame.rgb').length === 1,
    'saving over the same render duplicated the node');

  // a new file lands in the filesystem and the dumpster empties
  const created = run(base, { type: 'createFile', dir: '/usr/people/guest', name: 'notes', content: 'x' });
  expect(created.vfs.some((n) => n.path === '/usr/people/guest/notes'), 'createFile wrote nothing');
  const trashed = osReducer(created, { type: 'moveToDumpster', path: '/usr/people/guest/notes' });
  expect(trashed.vfs.some((n) => n.path === '/dumpster/notes'), 'moveToDumpster left the node in place');
  const emptied = osReducer(trashed, { type: 'emptyDumpster' });
  expect(!emptied.vfs.some((n) => n.path.startsWith('/dumpster/')), 'emptyDumpster left files behind');

  // focus raises z above every other window
  const two = run(base,
    { type: 'launch', appId: 'fcheck' },
    { type: 'launch', appId: 'gl_showcase' });
  const top = two.windows.reduce((m, w) => (w.zIndex > m.zIndex ? w : m), two.windows[0]);
  const raised = osReducer(two, { type: 'focusWindow', id: two.windows[0].id });
  const raisedTop = raised.windows.reduce((m, w) => (w.zIndex > m.zIndex ? w : m), raised.windows[0]);
  expect(raisedTop.id === two.windows[0].id, 'focusWindow did not raise the window');

  // desktop icons: move, delete to the dumpster, restore
  const moved = osReducer(base, { type: 'moveDesktopIcon', id: 'fsn_desk', x: 320, y: 240 });
  expect(moved.desktopIcons.fsn_desk?.pos?.x === 320, 'a desktop icon did not move');
  expect(moved.windows.length === 0, 'moving an icon disturbed the windows');
  const deleted = osReducer(moved, { type: 'deleteDesktopIcon', id: 'fsn_desk', name: 'fsn 3D' });
  expect(deleted.desktopIcons.fsn_desk?.hidden === true, 'the icon was not hidden by delete');
  expect(deleted.vfs.some((n) => n.path === '/dumpster/fsn 3D'), 'the deleted icon is not in the dumpster');
  const deletedTwice = osReducer(deleted, { type: 'deleteDesktopIcon', id: 'fsn_desk', name: 'fsn 3D' });
  expect(deletedTwice.vfs.filter((n) => n.path === '/dumpster/fsn 3D').length === 1,
    'deleting twice put two nodes in the dumpster');
  const restored = osReducer(deletedTwice, { type: 'restoreDesktopIcons' });
  expect(Object.keys(restored.desktopIcons).length === 0, 'restore left icon state behind');
  expect(!restored.vfs.some((n) => n.path === '/dumpster/fsn 3D'), 'restore left the icon in the dumpster');

  // the Toolchest editor
  const renamed = osReducer(base, { type: 'editToolchest', key: 'k', edit: { label: 'Renamed' } });
  expect(renamed.toolchestEdits.k?.label === 'Renamed', 'a Toolchest rename did not stick');
  const entry = {
    id: 't1',
    category: 'Find' as const,
    label: 'Mine',
    order: 99,
    appId: 'fcheck' as const,
  };
  const added = osReducer(renamed, { type: 'addToolchestEntry', entry });
  expect(added.toolchestCustom.length === 1, 'a custom Toolchest entry was not added');
  expect(osReducer(added, { type: 'removeToolchestEntry', id: 't1' }).toolchestCustom.length === 0,
    'a custom Toolchest entry was not removed');
  const reset = osReducer(added, { type: 'resetToolchest' });
  expect(reset.toolchestCustom.length === 0 && Object.keys(reset.toolchestEdits).length === 0,
    'Restore Defaults left Toolchest edits behind');

  // blanking and waking
  const blanked = osReducer(base, { type: 'blankNow', moduleId: 'bounce' });
  expect(blanked.blanked && blanked.saverConfig.moduleId === 'bounce', 'blankNow did not blank or set the module');
  expect(!osReducer(blanked, { type: 'wake' }).blanked, 'wake did not unblank');

  // unknown actions leave the state alone
  const same = osReducer(base, { type: 'hydrate', state: base });
  expect(same === base, 'hydrate did not replace the state');

  if (!bad) ok('launch, focus, filesystem, desktop icons, Toolchest edits and blanking behave');
}

console.log('Session persistence');
{
  // a minimal localStorage so the save/load path can run outside a browser
  const store = new Map<string, string>();
  let failWrite = false;
  (globalThis as any).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      // modelled quota: what does not fit is the rendered images
      if (failWrite && v.includes('data:image')) {
        const err: any = new Error('quota');
        err.name = 'QuotaExceededError';
        throw err;
      }
      store.set(k, v);
    },
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  };
  let bad = 0;
  const expect = (cond: boolean, msg: string) => {
    if (!cond) {
      fail(msg);
      bad++;
    }
  };

  const session = osReducer(
    { ...initialOsState, windows: [] },
    { type: 'launch', appId: 'gr_osview' }
  );
  const screen = osReducer(session, { type: 'setColorScheme', id: 'redwood' });
  const blanked = osReducer(screen, { type: 'blankNow' });
  saveOsState(blanked);

  const restored = loadOsState();
  expect(restored.colorSchemeId === 'redwood', 'the colour scheme did not survive a reload');
  expect(restored.windows.length === 1 && restored.windows[0].appId === 'gr_osview',
    'open windows did not survive a reload');
  expect(!restored.blanked, 'a reload came back still blanked');
  expect(restored.modalMode === null && restored.contextMenu === null,
    'transient state was persisted');

  // a corrupt save must not stop the desktop booting
  store.set('irix65.osstate.v1', '{not json');
  expect(loadOsState() === initialOsState, 'a corrupt save was not ignored');
  store.set('irix65.osstate.v1', '{"windows":"nope"}');
  expect(loadOsState() === initialOsState, 'a save with no windows was not ignored');

  // an over-quota save drops the rendered images and still persists
  store.clear();
  failWrite = true;
  saveOsState(
    osReducer(initialOsState, {
      type: 'saveRender',
      path: '/usr/people/guest/renders/big.rgb',
      dataUrl: 'data:image/png;base64,' + 'A'.repeat(2000),
      meta: 'big',
    })
  );
  const squeezed = loadOsState();
  expect(squeezed.vfs.some((n) => n.path === '/usr/people/guest/renders/big.rgb'),
    'the over-quota save dropped the whole filesystem');

  if (!bad) ok('state survives a reload, corrupt saves are ignored, quota overflow is survivable');
}

console.log(problems ? `\n${problems} PROBLEM(S)` : '\nall checks passed');
process.exit(problems ? 1 : 0);
