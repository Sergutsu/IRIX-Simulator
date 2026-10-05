/**
 * Four-function calculator for the IVcalc demo.
 * Operations run immediately, the way a desk calculator does: 2 + 3 * 4 = 20.
 */

export type CalcOp = '+' | '-' | '*' | '/';

export interface CalcState {
  display: string;
  acc: number | null;
  op: CalcOp | null;
  fresh: boolean;
  error: boolean;
  lastOp: CalcOp | null;
  lastRhs: number | null;
}

export type CalcInput =
  | { t: 'digit'; d: string }
  | { t: 'dot' }
  | { t: 'op'; op: CalcOp }
  | { t: 'eq' }
  | { t: 'ac' }
  | { t: 'ce' }
  | { t: 'sign' }
  | { t: 'percent' };

export const INITIAL_CALC: CalcState = {
  display: '0',
  acc: null,
  op: null,
  fresh: true,
  error: false,
  lastOp: null,
  lastRhs: null,
};

const MAX_DIGITS = 12;

export function formatCalc(n: number): string {
  if (!Number.isFinite(n)) return 'Error';
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e10 || abs < 1e-7)) {
    const exp = n.toExponential(6).replace(/\.?0+e/, 'e');
    return exp.length > 12 ? n.toExponential(4) : exp;
  }
  const rounded = Math.round(n * 1e8) / 1e8;
  let text = String(rounded);
  if (text.length > MAX_DIGITS) text = rounded.toExponential(6).replace(/\.?0+e/, 'e');
  return text;
}

function parseDisplay(state: CalcState): number {
  if (state.error) return NaN;
  const n = Number(state.display);
  return Number.isFinite(n) ? n : NaN;
}

function applyOp(a: number, op: CalcOp, b: number): number {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '*') return a * b;
  if (b === 0) return NaN;
  return a / b;
}

function fail(): CalcState {
  return { ...INITIAL_CALC, display: 'Error', error: true, fresh: true };
}

function withResult(state: CalcState, n: number, extra: Partial<CalcState>): CalcState {
  if (!Number.isFinite(n)) return fail();
  return { ...state, ...extra, display: formatCalc(n), error: false };
}

function digitCount(display: string): number {
  return display.replace('-', '').replace('.', '').length;
}

export function calcPress(state: CalcState, input: CalcInput): CalcState {
  if (input.t === 'ac') return { ...INITIAL_CALC };
  if (state.error && input.t !== 'ce') return state;
  if (input.t === 'ce') {
    return { ...state, display: '0', fresh: true, error: false };
  }

  if (input.t === 'digit') {
    if (state.fresh || state.display === '0') {
      return { ...state, display: input.d, fresh: false, error: false };
    }
    if (state.display === '-0') {
      return { ...state, display: `-${input.d}`, fresh: false };
    }
    if (digitCount(state.display) >= MAX_DIGITS) return state;
    return { ...state, display: state.display + input.d };
  }

  if (input.t === 'dot') {
    if (state.fresh) return { ...state, display: '0.', fresh: false };
    if (state.display.includes('.')) return state;
    return { ...state, display: `${state.display}.` };
  }

  if (input.t === 'sign') {
    if (state.display === '0' || state.display === '0.') return state;
    const display = state.display.startsWith('-') ? state.display.slice(1) : `-${state.display}`;
    return { ...state, display };
  }

  if (input.t === 'percent') {
    const cur = parseDisplay(state);
    if (!Number.isFinite(cur)) return fail();
    const n =
      state.acc != null && (state.op === '+' || state.op === '-') ? (state.acc * cur) / 100 : cur / 100;
    return withResult(state, n, { fresh: false });
  }

  if (input.t === 'op') {
    const cur = parseDisplay(state);
    if (!Number.isFinite(cur)) return fail();
    if (state.op && state.acc != null && !state.fresh) {
      const n = applyOp(state.acc, state.op, cur);
      return withResult(state, n, { acc: n, op: input.op, fresh: true, lastOp: state.op, lastRhs: cur });
    }
    return { ...state, acc: cur, op: input.op, fresh: true };
  }

  const cur = parseDisplay(state);
  if (!Number.isFinite(cur)) return fail();
  if (state.op && state.acc != null && !state.fresh) {
    const n = applyOp(state.acc, state.op, cur);
    return withResult(state, n, { acc: n, op: null, fresh: true, lastOp: state.op, lastRhs: cur });
  }
  if (state.lastOp && state.lastRhs != null) {
    const n = applyOp(cur, state.lastOp, state.lastRhs);
    return withResult(state, n, { acc: n, fresh: true });
  }
  return { ...state, fresh: true, acc: cur };
}

/** Apply a sequence of key labels from the keypad. */
export function calcSequence(labels: string[], start: CalcState = INITIAL_CALC): CalcState {
  return labels.reduce((state, label) => calcPress(state, inputForLabel(label)), start);
}

export function inputForLabel(label: string): CalcInput {
  if (label === 'AC') return { t: 'ac' };
  if (label === 'CE') return { t: 'ce' };
  if (label === '+/-') return { t: 'sign' };
  if (label === '%') return { t: 'percent' };
  if (label === '.') return { t: 'dot' };
  if (label === '=') return { t: 'eq' };
  if (label === '+' || label === '-' || label === '*' || label === '/') return { t: 'op', op: label };
  if (/^[0-9]$/.test(label)) return { t: 'digit', d: label };
  return { t: 'ac' };
}
