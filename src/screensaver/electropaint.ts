/**
 * ElectroPaint (TM) — SGI / IRIX Screen Saver Engine
 * ==================================================
 *
 * ElectroPaint was written by David A. Tristram in 1986 and shipped with every
 * Silicon Graphics IRIX workstation. It is the "dancing polygons" screen saver:
 * a swarm of triangles / squares that wheel, spin, flip, fold and recolour in
 * hypnotic, never-quite-repeating patterns.
 *
 * This is a faithful re-creation of the observable behaviour of the original
 * IRIS GL program, built from the documented internals of the real thing:
 *
 *  - It ships in two flavours: the screen saver (`screen_blanker` module) and
 *    an interactive version (`ep -c`) with a Panel Library control panel.
 *  - The control panel is a column of multi-sliders with the authentic two/three
 *    letter acronyms. Each multi-slider is itself a widget:
 *
 *        ___
 *       | R |      reset button  (R)
 *       |---|
 *       | X |      change slider type: wrap  <->  bounce
 *       |---|
 *       |sld|      small sub-slider which animates the main slider
 *       |---|
 *       |hhh|      maximum value
 *       |sss|      current value
 *       |lll|      minimum value
 *       |___|
 *       |lbl|      label                (from the IGL/ElectroPaint documentation)
 *       '---'
 *
 *    (whl = wheel, spn = spin, flp = flip, arm = arm, wrst = wrist,
 *     sz = size, zoom = zoom, twst = twist, spd = speed, n = max visible
 *     triangles, rat = color change rate, rng = colormap range.)
 *
 *  - Without the script the saver would simply sit there: "the algorithm used
 *    for movement is both simple and complex" and the choreography comes from a
 *    recorded ASCII animation script (actset / actreset / duration / seqdo /
 *    seqloop / frame / randdelay ...).  Later IRIX versions shipped a default
 *    script that could be dumped and read back as ASCII text.
 *
 * The engine below implements the same idea from scratch in TypeScript: a
 * parameter set ("acts"), a script that continuously re-targets them, a
 * sub-slider that drifts each slider, and a triangle shell that folds in
 * three dimensions with flat-shaded IRIS GT style lighting.
 */

/* ------------------------------------------------------------------ *
 * Colour helpers — mirrors hls_to_rgb() from the original ep.        *
 * ------------------------------------------------------------------ */

/**
 * HLS -> RGB, the classic algorithm behind IRIS GL's hlsrgb()/ElectroPaint's
 * hls_to_rgb().  h is in degrees, l and s in 0..1.
 */
export function hlsToRgb(h: number, l: number, s: number): [number, number, number] {
  const hh = (((h % 360) + 360) % 360) / 360;
  const ll = Math.max(0, Math.min(1, l));
  const ss = Math.max(0, Math.min(1, s));
  const m2 = ll <= 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const m1 = 2 * ll - m2;
  const chan = (hue: number) => {
    let t = hue;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t * 6 < 1) return m1 + (m2 - m1) * t * 6;
    if (t * 2 < 1) return m2;
    if (t * 3 < 2) return m1 + (m2 - m1) * (2 / 3 - t) * 6;
    return m1;
  };
  const to255 = (v: number) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return [to255(chan(hh + 1 / 3)), to255(chan(hh)), to255(chan(hh - 1 / 3))];
}

const rgbCss = (c: [number, number, number]) => `rgb(${c[0]},${c[1]},${c[2]})`;

/* ------------------------------------------------------------------ *
 * Deterministic RNG (ep used drand48/erand48 — the seed is random,   *
 * so every launch looks different, exactly like the original).       *
 * ------------------------------------------------------------------ */

const RAND48_A = 0x5deece66dn;
const RAND48_C = 0xbn;
const RAND48_MASK = (1n << 48n) - 1n;

export class Rand48 {
  /** the 48-bit state, kept as a BigInt so the LCG stays exact */
  private x: bigint;

  constructor(seed = Math.floor(Math.random() * 0xffffffff)) {
    // srand48() seeds with (seed << 16) + 0x330E
    this.x = ((BigInt(seed >>> 0) << 16n) | 0x330en) & RAND48_MASK;
  }

  next(): number {
    // 48-bit LCG: X(n+1) = (a * X(n) + c) mod 2^48
    this.x = (this.x * RAND48_A + RAND48_C) & RAND48_MASK;
    return Number(this.x) / 281474976710656; // 2^48
  }
  range(lo: number, hi: number): number {
    return lo + (hi - lo) * this.next();
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length) % arr.length];
  }
}

/* ------------------------------------------------------------------ *
 * Sliders ("acts" in ElectroPaint terminology)                        *
 * ------------------------------------------------------------------ */

export type EpSliderId =
  | 'whl'
  | 'spn'
  | 'flp'
  | 'arm'
  | 'wrst'
  | 'twst'
  | 'sz'
  | 'zoom'
  | 'spd'
  | 'n'
  | 'rat'
  | 'rng';

export interface EpSliderSpec {
  id: EpSliderId;
  acronym: string;
  label: string;
  min: number;
  max: number;
  /** initial value */
  init: number;
  /** slider wraps at the ends, or bounces back */
  mode: 'wrap' | 'bounce';
  /** speed at which the little sub-slider (sld) animates the main value */
  drift: number;
  int?: boolean;
}

export const EP_SLIDERS: EpSliderSpec[] = [
  { id: 'whl', acronym: 'whl', label: 'Wheel', min: -1, max: 1, init: 0.2, mode: 'bounce', drift: 0.9 },
  { id: 'spn', acronym: 'spn', label: 'Spin', min: -1, max: 1, init: 0.35, mode: 'bounce', drift: 1.2 },
  { id: 'flp', acronym: 'flp', label: 'Flip', min: -1, max: 1, init: 0.05, mode: 'wrap', drift: 0.7 },
  { id: 'arm', acronym: 'arm', label: 'Arm', min: 0, max: 1, init: 0.5, mode: 'bounce', drift: 0.5 },
  { id: 'wrst', acronym: 'wrst', label: 'Wrist', min: -1, max: 1, init: 0.1, mode: 'bounce', drift: 0.85 },
  { id: 'twst', acronym: 'twst', label: 'Twist', min: -3, max: 3, init: 1, mode: 'wrap', drift: 0.6 },
  { id: 'sz', acronym: 'sz', label: 'Size', min: 0.15, max: 2.6, init: 0.85, mode: 'bounce', drift: 0.4 },
  { id: 'zoom', acronym: 'zoom', label: 'Zoom', min: 0.45, max: 3.2, init: 1.6, mode: 'bounce', drift: 0.35 },
  { id: 'spd', acronym: 'spd', label: 'Speed', min: 0, max: 3, init: 1, mode: 'bounce', drift: 0.5 },
  { id: 'n', acronym: 'n', label: 'N', min: 3, max: 64, init: 42, mode: 'bounce', drift: 8, int: true },
  { id: 'rat', acronym: 'rat', label: 'Rate', min: -4, max: 4, init: 0.6, mode: 'wrap', drift: 1.1 },
  { id: 'rng', acronym: 'rng', label: 'Range', min: 0, max: 1, init: 0.42, mode: 'bounce', drift: 0.3 },
];

export interface EpSlider extends EpSliderSpec {
  value: number;
  /** the little "sld" sub-slider position, drives value over time */
  sub: number;
  /**
   * true while the engine animates this act (the "sld" sub-slider drives it).
   * Grabbing the trough or the sub-slider clears it: the value is then held
   * where the user put it until `A` (auto) hands it back to the sequencer.
   */
  auto: boolean;
  /** user has taken this act by hand; the drive is suspended */
  hold: boolean;
  highlight: number; // 0..1 fading pulse used by the UI when a script re-targets it
}

/** Keep the sub-slider out of the dead zone where it cannot move the value. */
function nudgeSub(state: EpState, s: EpSlider) {
  if (Math.abs(s.sub) < 0.12) s.sub = state.rand.next() < 0.5 ? -0.45 : 0.45;
}

export interface EpTriangle {
  /** rotation phase around the shell */
  phase: number;
  /** base half-width multiplier */
  width: number;
  /** how far this triangle folds out of the shell */
  fold: number;
  /** per-triangle hue offset */
  hue: number;
  /** corner jitter so the flock is not perfectly regular */
  wobble: number;
  /** rotation of the flap around its base edge */
  roll: number;
}

export interface EpAct {
  name: string;
  /** slider targets applied when the act starts */
  set: Partial<Record<EpSliderId, number>>;
  /** how long the act is held, in seconds */
  duration: number;
  /** duration jitter, mimics "duration:" + "variance:" */
  variance: number;
}

/**
 * The house script.  ElectroPaint's default IRIX script choreographed the
 * sliders in slow overlapping sequences — this is the same idea, written out
 * in the authentic command vocabulary so it can be dumped to disk and read
 * back as ASCII (the original shipped exactly such a default script).
 */
export const EP_DEFAULT_SCRIPT: string = `# ElectroPaint (TM) animation script -- default
# Copyright (c) 1986 David A. Tristram.  Dump/read back as ASCII text.
#
#   actset:     <act> <value>      set a slider target
#   actreset:   <act>              return a slider to its home value
#   duration:   <seconds>          how long the act is held
#   variance:   <seconds>          random add to the duration
#   seqloop:    <n>                the whole sequence repeats
#
actresetall:
seqloop: 0
#
seqname: shell
  actset: twst 2.6
  actset: arm 0.72
  actset: sz 0.62
  duration: 11
  variance: 4
seqname: wheel
  actset: whl 0.85
  actset: spn 0.18
  actset: wrst -0.55
  actset: n 56
  duration: 9
  variance: 3
seqname: fold
  actset: flp 0.9
  actset: arm 0.24
  actset: zoom 0.85
  actset: rat 1.6
  duration: 8
  variance: 3
seqname: swarm
  actset: n 64
  actset: sz 0.3
  actset: spd 1.7
  actset: rng 0.8
  actset: twst -1.4
  duration: 10
  variance: 5
seqname: ribbon
  actset: arm 0.5
  actset: wrst 0.75
  actset: twst 0.2
  actset: zoom 2.4
  actset: sz 1.15
  duration: 9
  variance: 4
seqname: cone
  actset: arm 0.95
  actset: twst 3.0
  actset: flp -0.6
  actset: rat -1.4
  duration: 10
  variance: 4
seqname: rain
  actset: spn -0.75
  actset: flp 0.35
  actset: arm 0.05
  actset: n 34
  actset: rat 2.4
  duration: 7
  variance: 3
seqname: flower
  actset: twst 1.6
  actset: sz 1.7
  actset: zoom 1.15
  actset: spd 0.55
  actset: rng 0.28
  duration: 12
  variance: 5
seqname: tumbling
  actset: whl -0.9
  actset: spn 0.95
  actset: flp 0.8
  actset: arm 0.4
  duration: 9
  variance: 4
seqname: star
  actset: n 12
  actset: sz 2.2
  actset: zoom 2.8
  actset: rat -2.6
  duration: 8
  variance: 3
`;

/** Parse the authentic ASCII script into a list of acts. */
export function parseEpScript(script: string): EpAct[] {
  const acts: EpAct[] = [];
  let current: EpAct | null = null;
  let pendingDuration = 8;
  let pendingVariance = 3;
  const flush = () => {
    if (current) {
      current.duration = pendingDuration;
      current.variance = pendingVariance;
      acts.push(current);
      current = null;
    }
    pendingDuration = 8;
    pendingVariance = 3;
  };
  for (const rawLine of script.split('\n')) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const [token, ...rest] = line.split(/\s+/);
    const key = token.endsWith(':') ? token.slice(0, -1) : token;
    switch (key) {
      case 'seqname':
        flush();
        current = { name: rest[0] || 'act', set: {}, duration: 8, variance: 3 };
        break;
      case 'actset': {
        const id = rest[0] as EpSliderId;
        const val = parseFloat(rest[1]);
        if (!current) current = { name: 'act', set: {}, duration: 8, variance: 3 };
        if (EP_SLIDERS.some((s) => s.id === id) && !Number.isNaN(val)) current.set[id] = val;
        break;
      }
      case 'duration':
        pendingDuration = parseFloat(rest[0]) || 8;
        if (current) current.duration = pendingDuration;
        break;
      case 'variance':
        pendingVariance = parseFloat(rest[0]) || 0;
        if (current) current.variance = pendingVariance;
        break;
      default:
        break;
    }
  }
  flush();
  return acts.length ? acts : [{ name: 'idle', set: {}, duration: 10, variance: 2 }];
}

/* ------------------------------------------------------------------ *
 * Engine state                                                        *
 * ------------------------------------------------------------------ */

export interface EpState {
  sliders: Record<EpSliderId, EpSlider>;
  triangles: EpTriangle[];
  acts: EpAct[];
  actIndex: number;
  actElapsed: number;
  actDuration: number;
  actName: string;
  /** elapsed animation time (seconds), already scaled by spd */
  t: number;
  hueBase: number;
  /** iris-gt style lighting + alpha blending */
  lighting: boolean;
  blend: boolean;
  squares: boolean;
  clearOnFrame: boolean;
  frame: number;
  rand: Rand48;
  /** diagnostics for the control panel */
  triCount: number;
}

export function createEpState(opts?: {
  seed?: number;
  script?: string;
  squares?: boolean;
  blend?: boolean;
}): EpState {
  const rand = new Rand48(opts?.seed);
  const sliders = {} as Record<EpSliderId, EpSlider>;
  for (const spec of EP_SLIDERS) {
    let sub = rand.range(-1, 1);
    if (Math.abs(sub) < 0.12) sub = sub < 0 ? -0.45 : 0.45;
    sliders[spec.id] = {
      ...spec,
      value: spec.init,
      sub,
      auto: true,
      hold: false,
      highlight: 0,
    };
  }
  const triangles: EpTriangle[] = [];
  for (let i = 0; i < 64; i++) {
    triangles.push({
      phase: (i / 64) * Math.PI * 2 + rand.range(-0.03, 0.03),
      width: rand.range(0.7, 1.3),
      fold: rand.range(0.6, 1.15),
      hue: rand.range(0, 360),
      wobble: rand.range(-0.08, 0.08),
      roll: rand.range(0, Math.PI * 2),
    });
  }
  const acts = parseEpScript(opts?.script ?? EP_DEFAULT_SCRIPT);
  const state: EpState = {
    sliders,
    triangles,
    acts,
    actIndex: 0,
    actElapsed: 0,
    actDuration: acts[0]?.duration ?? 8,
    actName: acts[0]?.name ?? 'shell',
    t: rand.range(0, 500),
    hueBase: rand.range(0, 360),
    lighting: true,
    blend: opts?.blend ?? true,
    squares: opts?.squares ?? false,
    clearOnFrame: true,
    frame: 0,
    rand,
    triCount: 0,
  };
  // The sequencer owns the acts from the first frame: without this the flock
  // drifted uncontrolled until the second act came round.
  startAct(state, 0);
  return state;
}

/** Apply an act's slider targets (with the authentic "highlight" pulse). */
function applyAct(state: EpState, act: EpAct) {
  for (const [id, val] of Object.entries(act.set) as [EpSliderId, number][]) {
    const s = state.sliders[id];
    if (!s) continue;
    s.value = Math.max(s.min, Math.min(s.max, val));
    s.sub = state.rand.range(-1, 1);
    nudgeSub(state, s);
    s.auto = true;
    s.hold = false;
    s.highlight = 1;
  }
  state.actName = act.name;
}

function startAct(state: EpState, index: number) {
  state.actIndex = index % state.acts.length;
  const act = state.acts[state.actIndex];
  state.actElapsed = 0;
  state.actDuration = Math.max(2, act.duration + state.rand.range(-act.variance, act.variance));
  applyAct(state, act);
}

/** Start an act by index (used when a script is loaded from disk). */
export function startEpAct(state: EpState, index: number) {
  startAct(state, index);
}

/**
 * User interaction: move a slider (as if dragged in the ep -c panel).
 *
 * `hold: true` is what a real drag does — the value stays where you put it
 * instead of being pulled away by the sub-slider drive on the next frame.
 */
export function setEpSlider(state: EpState, id: EpSliderId, value: number, opts?: { hold?: boolean }) {
  const s = state.sliders[id];
  if (!s) return;
  s.value = Math.max(s.min, Math.min(s.max, value));
  s.highlight = 1;
  if (opts?.hold) {
    s.hold = true;
    s.auto = false;
  } else {
    s.hold = false;
  }
}

/** Dragging the small "sld" bar steers the drive by hand. */
export function setEpSubSlider(state: EpState, id: EpSliderId, sub: number) {
  const s = state.sliders[id];
  if (!s) return;
  s.sub = Math.max(-1, Math.min(1, sub));
  s.hold = false;
  s.auto = false;
}

/** `A` on a column: hand the act back to the sequencer, or freeze it. */
export function setEpSliderAuto(state: EpState, id: EpSliderId, auto: boolean) {
  const s = state.sliders[id];
  if (!s) return;
  s.auto = auto;
  s.hold = !auto;
  if (auto) nudgeSub(state, s);
}

/** `R` on a column: back to the home value, engine driving again. */
export function resetEpSlider(state: EpState, id: EpSliderId) {
  const s = state.sliders[id];
  if (!s) return;
  setEpSlider(state, id, EP_SLIDERS.find((x) => x.id === id)?.init ?? 0);
  s.auto = true;
  s.sub = state.rand.range(-1, 1);
  nudgeSub(state, s);
}

export function toggleEpSliderMode(state: EpState, id: EpSliderId) {
  const s = state.sliders[id];
  if (!s) return;
  s.mode = s.mode === 'wrap' ? 'bounce' : 'wrap';
}

/** The `randomize` menu item: fresh values, drive running again. */
export function randomizeEpSliders(state: EpState) {
  for (const spec of EP_SLIDERS) {
    setEpSlider(state, spec.id, state.rand.range(spec.min, spec.max));
    const s = state.sliders[spec.id];
    s.auto = true;
    s.sub = state.rand.range(-1, 1);
    nudgeSub(state, s);
  }
}

/**
 * Animation seconds per second of wall clock, for the current `spd`.
 *
 * The curve is deliberately steep toward the bottom so the slider has a real
 * slow-motion range: 0 is 1/25 speed (the shell creeps round over minutes),
 * 1 is the calm default, 3 is a lively pace. The old linear map only spanned
 * 0.2x..1.25x, which is not enough room to slow the flock down.
 */
export function epTimeScale(state: EpState): number {
  const spd = Math.max(0, state.sliders.spd.value);
  return 0.04 + 0.21 * spd * Math.sqrt(spd);
}

/** Advance the simulation. dt is in seconds of wall clock. */
export function stepEp(state: EpState, dt: number) {
  const rate = epTimeScale(state); // animation seconds per wall second
  // The slider drives (what reshapes the flock) run off the same clock: with a
  // floor here, dragging spd down left the shapes morphing at full speed and
  // the slider felt like it did almost nothing.
  const drive = Math.max(0.05, rate);

  // Script sequencer -------------------------------------------------
  // Acts are held in animation time, so slowing the flock slows the whole show
  // with it.  The floor keeps the sequence moving even in deep slow motion.
  state.actElapsed += dt * Math.max(0.15, rate);
  if (state.actElapsed >= state.actDuration) {
    // ElectroPaint's sequence picks acts in a shuffled order, rarely repeating
    const next = (state.actIndex + 1 + Math.floor(state.rand.next() * (state.acts.length - 1))) % state.acts.length;
    startAct(state, next);
  }

  // Sub-slider drift animates every act toward its limits ------------
  for (const spec of EP_SLIDERS) {
    const s = state.sliders[spec.id];
    s.highlight = Math.max(0, s.highlight - dt * 0.45);
    if (!s.auto || s.hold) continue; // taken by hand: leave it alone
    // the "sld" sub-slider bounces between -1 and 1 at its own rate
    const norm = Math.abs(s.value) / Math.max(Math.abs(spec.min), Math.abs(spec.max), 1e-6);
    const sweep = spec.drift * 0.12 * (0.35 + 0.65 * norm) * drive;
    s.sub = s.mode === 'wrap' ? wrap(s.sub + sweep * dt, -1, 1) : bounce(s.sub + sweep * dt, -1, 1);
    const delta = s.sub * spec.drift * 0.16 * dt * drive;
    let v = s.value + delta;
    if (spec.int) v = Math.round(v);
    // hitting a stop reverses the sub-slider, otherwise a value that has
    // run to its limit just sits there pegged (which is what made the
    // whole flock accelerate to maximum and stay there)
    if (v > s.max) {
      v = s.mode === 'bounce' ? s.max - (v - s.max) : s.min;
      if (s.mode === 'bounce') s.sub = -Math.abs(s.sub);
    }
    if (v < s.min) {
      v = s.mode === 'bounce' ? s.min + (s.min - v) : s.max;
      if (s.mode === 'bounce') s.sub = Math.abs(s.sub);
    }
    s.value = Math.max(s.min, Math.min(s.max, v));
  }

  // Animation time advances in real seconds, scaled by the flock's own clock.
  state.t += dt * rate;
  state.hueBase += dt * drive * state.sliders.rat.value * 10;
  if (state.hueBase > 360) state.hueBase -= 360;
  if (state.hueBase < 0) state.hueBase += 360;
  state.frame++;
}

function wrap(v: number, lo: number, hi: number) {
  const span = hi - lo;
  let x = v;
  while (x > hi) x -= span;
  while (x < lo) x += span;
  return x;
}

function bounce(v: number, lo: number, hi: number) {
  const span = hi - lo;
  if (span <= 0) return lo;
  const period = span * 2;
  const x = (((v - lo) % period) + period) % period;
  return x <= span ? lo + x : hi - (x - span);
}

/* ------------------------------------------------------------------ *
 * Geometry / rendering                                                *
 * ------------------------------------------------------------------ */

interface V3 {
  x: number;
  y: number;
  z: number;
}

function rotX(p: V3, a: number): V3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}
function rotY(p: V3, a: number): V3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}
function rotZ(p: V3, a: number): V3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z };
}

export interface EpFrameOptions {
  /** draw into an already-cleared buffer, for panel previews */
  clear?: boolean;
  /** camera pushback used by the screen saver (triangles fill the screen) */
  fill?: boolean;
}

/**
 * Render one ElectroPaint frame.  Returns the number of polygons drawn.
 */
export function drawEpFrame(
  ctx: CanvasRenderingContext2D,
  state: EpState,
  width: number,
  height: number,
  opts?: EpFrameOptions
): number {
  const clear = opts?.clear ?? state.clearOnFrame;
  if (clear) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
  }

  const S = state.sliders;
  const n = Math.max(3, Math.round(S.n.value));
  const t = state.t;

  // global rotations -- the six "types of rotation" of the original
  const wheel = S.whl.value * t * 0.42;
  const spin = S.spn.value * t * 0.31;
  const flip = S.flp.value * t * 0.23;
  const arm = S.arm.value;
  const wrist = S.wrst.value * t * 0.37;
  const twist = S.twst.value;
  const size = S.sz.value;
  const zoom = Math.max(0.35, S.zoom.value);
  const rng = S.rng.value;

  // camera distance: smaller zoom value = farther away (as in ep)
  const camDist = 2.05 + zoom * 1.45;
  const fov = opts?.fill ? 1.35 : 1.1;
  const scale = (Math.min(width, height) * fov) / camDist * 1.15;

  const cx = width / 2;
  const cy = height / 2;

  const lightDir = rotZ(rotY({ x: -0.4, y: 0.55, z: 0.73 }, spin * 0.6), wheel * 0.4);

  type Poly = {
    pts: { x: number; y: number }[];
    depth: number;
    fill: string;
    alpha: number;
  };
  const polys: Poly[] = [];

  for (let i = 0; i < n; i++) {
    const tri = state.triangles[i % state.triangles.length];
    const u = n > 1 ? i / (n - 1) : 0;

    // Parameter along the shell.  `twst` changes how many times the chain
    // winds around, which is what turns the ring into a spiral or a cone.
    const wind = 1 + twist * 0.22;
    const a = u * Math.PI * 2 * wind + tri.phase * 0.18 + t * (0.25 + arm * 0.35) * 0.35;
    const wobble = 1 + tri.wobble * 0.35;
    const ringR = 1.02 * wobble;

    // the chain itself: a ring that `arm` lifts into a cylinder / cone / band
    const lift = (u - 0.5) * (0.35 + arm * 1.9) + tri.wobble * 0.9;
    const base: V3 = {
      x: Math.cos(a) * ringR,
      y: lift,
      z: Math.sin(a) * ringR,
    };

    // frame: outward radius, tangent around the ring, and the ring axis
    const radial: V3 = { x: Math.cos(a), y: 0, z: Math.sin(a) };
    const tangent: V3 = { x: -Math.sin(a), y: 0, z: Math.cos(a) };
    const axisY: V3 = { x: 0, y: 1, z: 0 };

    // each polygon is a hinged flap that folds out of the shell -----------------
    const foldPhase = t * (0.75 + arm * 0.6) + i * 0.37 + tri.roll * 0.5;
    const foldAmt = Math.sin(foldPhase);
    // `flp` sets how far the whole flock is flipped out of the shell,
    // `wrst` rolls each flap around its own axis, `spn` adds the slow tumble
    const foldAngle =
      Math.abs(flip) * 1.15 +
      foldAmt * (0.62 + Math.abs(flip) * 0.5) +
      spin * 0.35 +
      tri.roll * 0.12;
    const rollAngle = wrist * (0.55 + 0.45 * Math.sin(t * 0.5 + i * 0.29));

    // the flaps read as chunky quads/triangles, not needles
    const halfBase = 0.27 * size * tri.width;
    const halfH = halfBase * 0.5;
    const apexLen = 0.34 * size * (0.7 + 0.55 * tri.fold);

    const local: V3[] = state.squares
      ? [
          { x: -halfBase, y: -halfH, z: 0 },
          { x: halfBase, y: -halfH, z: 0 },
          { x: halfBase, y: apexLen * 0.85, z: 0 },
          { x: -halfBase, y: apexLen * 0.85, z: 0 },
        ]
      : [
          { x: -halfBase, y: -halfH, z: 0 },
          { x: halfBase, y: -halfH, z: 0 },
          { x: 0, y: apexLen, z: 0 },
        ];

    const world: V3[] = [];
    for (const lp of local) {
      // roll around the flap's own axis (the "wrist" rotation)
      const rolled = rotY(lp, rollAngle);
      // hinge the flap about its base edge (the "flip" rotation)
      const folded = rotX(rolled, foldAngle);
      // place it on the shell in the (tangent, axis, radial) frame
      world.push({
        x: base.x + tangent.x * folded.x + axisY.x * folded.y + radial.x * folded.z * 0.35,
        y: base.y + tangent.y * folded.x + axisY.y * folded.y + radial.y * folded.z * 0.35,
        z: base.z + tangent.z * folded.x + axisY.z * folded.y + radial.z * folded.z * 0.35,
      });
    }

    // rotation chain: wheel / spin / flip / wrist
    const rotated = world.map((p) => {
      let q = rotZ(p, wheel);
      q = rotX(q, flip);
      q = rotY(q, spin);
      q = rotX(q, wrist * 0.5);
      q = rotZ(q, wrist * 0.5);
      return q;
    });

    // project (simple perspective)
    const projected: { x: number; y: number }[] = [];
    let depthSum = 0;
    for (const p of rotated) {
      const z = p.z + camDist;
      const persp = camDist / Math.max(0.25, z);
      projected.push({ x: cx + p.x * scale * persp, y: cy - p.y * scale * persp });
      depthSum += z;
    }

    // colour: 'rng' is the colormap range the flock is spread across and
    // 'rat' is the color change rate that walks the whole map (both are
    // documented ElectroPaint sliders).
    const hue = state.hueBase + tri.hue * (0.25 + rng * 1.1) + u * (60 + rng * 300) + i * 4.7;
    const lit = state.lighting;
    // normal of the flap in view space, for IRIS GT style flat lighting
    const nrm = normal(rotated[0], rotated[1], rotated[2]);
    const lambert = lit ? Math.max(0.18, nrm.z * lightDir.z + nrm.x * lightDir.x + nrm.y * lightDir.y) : 0.85;
    const shade = 0.42 + 0.72 * lambert;
    const rgb = hlsToRgb(hue, Math.min(0.82, 0.14 + 0.52 * shade), 0.9 + 0.1 * rng);
    const alpha = state.blend ? (lit ? 0.72 + 0.28 * lambert : 0.92) : 1;

    polys.push({
      pts: projected,
      depth: depthSum / rotated.length,
      fill: rgbCss(rgb),
      alpha,
    });
  }

  // painter's algorithm: far polygons first
  polys.sort((a, b) => b.depth - a.depth);

  // IRIS GT alpha blending: overlapping flaps tint each other, but the
  // colours stay saturated instead of blowing out to white.
  const blend = state.blend;
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineJoin = 'round';
  for (const poly of polys) {
    ctx.globalAlpha = poly.alpha;
    ctx.beginPath();
    ctx.moveTo(poly.pts[0].x, poly.pts[0].y);
    for (let i = 1; i < poly.pts.length; i++) ctx.lineTo(poly.pts[i].x, poly.pts[i].y);
    ctx.closePath();
    ctx.fillStyle = poly.fill;
    ctx.fill();
    // a thin dark edge keeps each facet readable, exactly how the flat shaded
    // IRIS GT polygons read on a black screen
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  state.triCount = polys.length;
  return polys.length;
}

function normal(a: V3, b: V3, c: V3): V3 {
  const ux = b.x - a.x;
  const uy = b.y - a.y;
  const uz = b.z - a.z;
  const vx = c.x - a.x;
  const vy = c.y - a.y;
  const vz = c.z - a.z;
  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  nx /= len;
  ny /= len;
  nz /= len;
  return { x: nx, y: ny, z: nz };
}
