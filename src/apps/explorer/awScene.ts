/**
 * One Alias|Wavefront project. Model, Property, Kinemation, Preview and
 * Composer all read this. The Director does not.
 */
import { useSyncExternalStore } from 'react';
import type { ExplorerObject } from './drawScene';

export interface AwRender {
  url: string;
  path: string;
}

function starter(): ExplorerObject {
  return {
    id: 'obj_start',
    name: 'winged_kit.mod',
    primitive: 'winged',
    pos: [0, 0, 0],
    deform: 'none',
    deformAmount: 0,
    material: 'gold',
    rot: [0.15, -0.55, 0.05],
    scale: [1, 1, 1],
    keys: [{ frame: 0, rx: 0.15, ry: -0.55, rz: 0.05 }],
    visible: true,
    group: 'Prt_Mtl_Material.00',
  };
}

let objects: ExplorerObject[] = [starter()];
let selectedId = 'obj_start';
let frame = 1;
let lastRender: AwRender | null = null;
let undo: ExplorerObject[][] = [];
let redo: ExplorerObject[][] = [];

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function rememberSelection() {
  if (!objects.some((o) => o.id === selectedId)) selectedId = objects[0]?.id ?? '';
}

export function subscribeAw(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAwObjects() {
  return objects;
}
export function getAwSelectedId() {
  return selectedId;
}
export function getAwFrame() {
  return frame;
}
export function getAwRender() {
  return lastRender;
}

export function updateAwObjects(
  next: ExplorerObject[] | ((prev: ExplorerObject[]) => ExplorerObject[]),
  record = false
) {
  const prev = objects;
  const resolved = typeof next === 'function' ? next(prev) : next;
  if (resolved === prev) return;
  if (record) {
    undo.push(structuredClone(prev));
    if (undo.length > 40) undo.shift();
    redo = [];
  }
  objects = resolved;
  rememberSelection();
  emit();
}

export function setAwSelected(id: string) {
  if (id === selectedId) return;
  selectedId = id;
  emit();
}

export function setAwFrame(n: number) {
  const f = Math.max(0, Math.min(120, Math.round(n)));
  if (f === frame) return;
  frame = f;
  emit();
}

export function setAwRender(render: AwRender | null) {
  lastRender = render;
  emit();
}

/** Record a snapshot as the undo point without changing the live scene. */
export function pushAwUndo(snapshot: ExplorerObject[]) {
  undo.push(snapshot);
  if (undo.length > 40) undo.shift();
  redo = [];
}

export function undoAw(): boolean {
  const prev = undo.pop();
  if (!prev) return false;
  redo.push(structuredClone(objects));
  objects = prev;
  rememberSelection();
  emit();
  return true;
}

export function redoAw(): boolean {
  const next = redo.pop();
  if (!next) return false;
  undo.push(structuredClone(objects));
  objects = next;
  rememberSelection();
  emit();
  return true;
}

export function useAwObjects() {
  return useSyncExternalStore(subscribeAw, getAwObjects, getAwObjects);
}
export function useAwSelectedId() {
  return useSyncExternalStore(subscribeAw, getAwSelectedId, getAwSelectedId);
}
export function useAwFrame() {
  return useSyncExternalStore(subscribeAw, getAwFrame, getAwFrame);
}
export function useAwRender() {
  return useSyncExternalStore(subscribeAw, getAwRender, getAwRender);
}
