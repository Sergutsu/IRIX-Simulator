/**
 * Advanced Visualizer Model 4.2.1
 * ===============================
 *
 * This window is Model only. The Director is a separate launcher
 * (DirectorApp) for the rest of the Alias|Wavefront suite: Paint, Property,
 * Dynamation, Kinemation, Preview, Composer and fcheck.
 *
 * The scene lives in awScene so those modules edit the same project.
 * Viewport drawing stays in drawScene so this file can Fast Refresh.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LaunchApp, SgiColorScheme } from '../state/osStore';
import {
  buildPrimitive,
  DeformId,
  PrimitiveId,
  PRIMITIVE_LIBRARY,
  Vec3,
} from './explorer/tavGeometry';
import {
  drawScene,
  MATERIALS,
  meshFor,
  objectRotationAt,
  pickHit,
  RESOLUTIONS,
  type ExplorerObject,
  type ExplorerTool,
  type Keyframe,
  type Camera,
  type RenderQuality,
} from './explorer/drawScene';
import { getAwFrame, pushAwUndo, setAwFrame, setAwRender, setAwSelected, undoAw, redoAw, updateAwObjects, useAwFrame, useAwObjects, useAwSelectedId } from './explorer/awScene';
import { booleanHulls, cameraBasis, mirrorCopy, sceneToObj, type BooleanOp } from './explorer/modelOps';
import { irixAudio } from '../sound/irixAudio';

/* ------------------------------------------------------------------ *
 * Application                                                         *
 * ------------------------------------------------------------------ */

interface WavefrontExplorerAppProps {
  colorScheme: SgiColorScheme;
  initialMode?: ExplorerTool;
  onSaveRender?: (path: string, dataUrl: string, meta: string) => void;
  onSaveFile?: (path: string, content: string) => void;
  onLaunchApp?: LaunchApp;
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
  rot: [0, 0, 0],
  scale: [1, 1, 1],
  deform: 'none',
  deformAmount: 0,
  material: primitive === 'piston' ? 'chrome' : primitive === 'winged' ? 'gold' : 'plastic_blue',
  keys: [{ frame: 0, rx: 0, ry: 0, rz: 0 }],
  visible: true,
  ...{ __at: frame },
});

function pose(o: ExplorerObject, rot: Vec3): ExplorerObject {
  return { ...o, rot, keys: [{ frame: 0, rx: rot[0], ry: rot[1], rz: rot[2] }] };
}

export const WavefrontExplorerApp: React.FC<WavefrontExplorerAppProps> = ({
  colorScheme,
  initialMode = 'model',
  onSaveRender,
  onSaveFile,
  onLaunchApp,
}) => {
  const [tool, setTool] = useState<ExplorerTool>(initialMode);
  const objects = useAwObjects();
  const selectedId = useAwSelectedId();
  const frame = useAwFrame();
  const setObjects = (next: ExplorerObject[] | ((prev: ExplorerObject[]) => ExplorerObject[]), record = false) =>
    updateAwObjects(next, record);
  const setSelectedId = setAwSelected;
  const setFrame = (n: number | ((f: number) => number)) => setAwFrame(typeof n === 'function' ? n(getAwFrame()) : n);
  const [playing, setPlaying] = useState(false);
  const [quality, setQuality] = useState<RenderQuality>('wireframe');
  // shader smoothing (crease) angle: the Explorer shader's own control
  const [smoothAngle, setSmoothAngle] = useState<number>(45);
  const [showGrid, setShowGrid] = useState(true);
  const [resolution, setResolution] = useState(RESOLUTIONS[1].id);
  const [renderProgress, setRenderProgress] = useState<number | null>(null);
  const [lastRender, setLastRender] = useState<{ url: string; path: string } | null>(null);
  const [status, setStatus] = useState('Model 4.2.1  —  winged_kit.mod');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [camMode, setCamMode] = useState<'tran' | 'rot' | 'zoom' | 'persp'>('rot');
  /** Viewport drag edits the object, or the camera when a cam1 button is active. */
  const [dragTarget, setDragTarget] = useState<'object' | 'camera'>('object');
  const [objectOp, setObjectOp] = useState<'move' | 'rotate' | 'scale'>('move');
  const [showAxes, setShowAxes] = useState(false);
  const [showNormals, setShowNormals] = useState(false);
  const [isolate, setIsolate] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [pickMode, setPickMode] = useState<'point' | 'pointGroup' | 'element' | 'elementGroup'>('elementGroup');
  const [coarse, setCoarse] = useState(false);
  const [command, setCommand] = useState('');
  const commandRef = useRef<HTMLInputElement>(null);
  const beforeDrag = useRef<ExplorerObject[] | null>(null);
  const [camTick, setCamTick] = useState(0);
  const [logLines] = useState<string[]>(() => {
    const mesh = buildPrimitive('winged');
    const verts = mesh.verts.length;
    const elems = mesh.faces.length;
    return [
      `${verts} vertices    ${Math.max(0, verts - 54)} texture vertices    ${verts} normals    ${elems} elements`,
      'current frame, 1',
      'adjusting output aspect ratio from 1.311465 to 1.309639',
      'loading light source, TMP_1558.lgt',
      'loading object, winged_kit.mod',
      'Material file Gold.mtl cannot be opened.',
    ];
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef<Camera>({ yaw: 0.95, pitch: 0.18, dist: 7.2, target: [0.35, 0.05, 0] });
  const dragRef = useRef<{
    mode: 'pending' | 'orbit' | 'pan' | 'dolly' | 'move' | 'rotate' | 'scale' | null;
    x: number;
    y: number;
    sx: number;
    sy: number;
  }>({ mode: null, x: 0, y: 0, sx: 0, sy: 0 });
  const liveRef = useRef({ dragTarget, objectOp, camMode, coarse, selectedId, pickMode });
  liveRef.current = { dragTarget, objectOp, camMode, coarse, selectedId, pickMode };
  const isolateRef = useRef(isolate);
  isolateRef.current = isolate;
  const objectsRef = useRef(objects);
  objectsRef.current = objects;
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
    const shown = isolate && selectedId ? objects.filter((o) => o.id === selectedId) : objects;
    drawScene(ctx, canvas.width, canvas.height, shown, camRef.current, {
      quality,
      showGrid,
      floor: showGrid,
      lightAngle: frameRef.current / 30,
      frame: frameRef.current,
      smoothAngle,
      backdrop: 'modeler',
      wireColor: '#ff2a00',
      axes: showAxes,
      selectedId,
      normals: showNormals,
    });
  }, [objects, quality, showGrid, smoothAngle, showAxes, showNormals, selectedId, isolate]);

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
  const onCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * canvas.width;
    const sy = ((e.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height;
    dragRef.current = { mode: 'pending', x: e.clientX, y: e.clientY, sx, sy };
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d.mode) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (d.mode === 'pending') {
        if (Math.hypot(dx, dy) < 4) return;
        const live = liveRef.current;
        d.mode =
          live.dragTarget === 'camera'
            ? live.camMode === 'tran'
              ? 'pan'
              : live.camMode === 'zoom'
                ? 'dolly'
                : 'orbit'
            : live.objectOp;
        if (d.mode === 'move' || d.mode === 'rotate' || d.mode === 'scale') {
          beforeDrag.current = structuredClone(objectsRef.current);
        }
      }
      d.x = e.clientX;
      d.y = e.clientY;
      const gain = liveRef.current.coarse ? 2.4 : 1;
      if (d.mode === 'orbit') {
        camRef.current.yaw -= dx * 0.008 * gain;
        camRef.current.pitch = Math.max(-1.3, Math.min(1.35, camRef.current.pitch + dy * 0.007 * gain));
        setCamTick((n) => n + 1);
      } else if (d.mode === 'pan') {
        camRef.current.target = [
          camRef.current.target[0] - dx * 0.01 * gain,
          camRef.current.target[1] + dy * 0.01 * gain,
          camRef.current.target[2],
        ];
        setCamTick((n) => n + 1);
      } else if (d.mode === 'dolly') {
        camRef.current.dist = Math.max(1.8, Math.min(28, camRef.current.dist + dy * 0.02 * gain));
        setCamTick((n) => n + 1);
      } else if (d.mode === 'move' || d.mode === 'rotate' || d.mode === 'scale') {
        const id = liveRef.current.selectedId;
        setObjects((prev) =>
          prev.map((o) => {
            if (o.id !== id) return o;
            if (d.mode === 'move') {
              const step = 0.012 * gain;
              const { right, up } = cameraBasis(camRef.current);
              return {
                ...o,
                pos: [
                  o.pos[0] + (right[0] * dx - up[0] * dy) * step,
                  o.pos[1] + (right[1] * dx - up[1] * dy) * step,
                  o.pos[2] + (right[2] * dx - up[2] * dy) * step,
                ],
              };
            }
            if (d.mode === 'rotate') {
              const [rx, ry, rz] = objectRotationAt(o, frameRef.current);
              const next: Vec3 = [rx + dy * 0.01 * gain, ry + dx * 0.012 * gain, rz];
              if (o.keys.length > 1) {
                return {
                  ...o,
                  rot: next,
                  keys: mergeKey(o, { frame: frameRef.current, rx: next[0], ry: next[1], rz: next[2] }),
                };
              }
              return pose(o, next);
            }
            const sc = o.scale ?? [1, 1, 1];
            const f = Math.exp(-dy * 0.01 * gain);
            return { ...o, scale: [sc[0] * f, sc[1] * f, sc[2] * f] };
          })
        );
      }
    };
    const up = () => {
      const d = dragRef.current;
      if (d.mode === 'pending') {
        const canvas = canvasRef.current;
        if (canvas) {
          const shown = isolateRef.current
            ? objectsRef.current.filter((o) => o.id === liveRef.current.selectedId)
            : objectsRef.current;
          const hit = pickHit(
            shown,
            camRef.current,
            frameRef.current,
            d.sx,
            d.sy,
            canvas.width,
            canvas.height
          );
          if (hit) setSelectedId(hit.id);
          const name = objectsRef.current.find((o) => o.id === hit?.id)?.name;
          const point = liveRef.current.pickMode === 'point' || liveRef.current.pickMode === 'pointGroup';
          setStatus(
            hit
              ? point
                ? `Picked ${name ?? hit.id} vertex ${hit.vertex}`
                : `Picked ${name ?? hit.id}`
              : 'No element under the cursor.'
          );
        }
      } else if ((d.mode === 'move' || d.mode === 'rotate' || d.mode === 'scale') && beforeDrag.current) {
        pushAwUndo(beforeDrag.current);
        beforeDrag.current = null;
      }
      dragRef.current.mode = null;
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    camRef.current.dist = Math.max(1.8, Math.min(22, camRef.current.dist + e.deltaY * 0.004));
  };

  /* --- actions -------------------------------------------------- */
  const patchSelected = (fn: (o: ExplorerObject) => ExplorerObject, record = true) => {
    if (!selectedId) return;
    setObjects((prev) => prev.map((o) => (o.id === selectedId ? fn(o) : o)), record);
  };

  const addPrimitive = (id: PrimitiveId) => {
    const obj = newObject(id, objects.length, frame);
    setObjects((prev) => [...prev, obj], true);
    setSelectedId(obj.id);
    setTool('model');
    setDragTarget('object');
    setObjectOp('move');
    setStatus(`Created ${obj.name}. Drag to move it, or type XTRAN / YTRAN / ZTRAN.`);
    irixAudio.playMenuClick();
  };

  const setDeform = (kind: DeformId, amount: number) => {
    setObjects(
      (prev) => prev.map((o) => (o.id === selectedId ? { ...o, deform: kind, deformAmount: amount } : o)),
      true
    );
    setStatus(kind === 'none' ? 'Deformer cleared.' : `${kind} ${amount.toFixed(2)} on ${selected?.name ?? 'selection'}.`);
  };

  const setKeyAtFrame = () => {
    const obj = selected;
    const [rx, ry, rz] = currentRot(obj, frame);
    setObjects(
      (prev) => prev.map((o) => (o.id === obj.id ? { ...o, keys: mergeKey(o, { frame, rx, ry, rz }) } : o)),
      true
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
      pos: [selected.pos[0] + 0.75, selected.pos[1], selected.pos[2] + 0.45],
      rot: selected.rot ? ([...selected.rot] as Vec3) : [0, 0, 0],
      scale: selected.scale ? ([...selected.scale] as Vec3) : [1, 1, 1],
      baked: selected.baked ? structuredClone(selected.baked) : undefined,
      keys: selected.keys.map((k) => ({ ...k })),
    };
    setObjects((prev) => [...prev, copy], true);
    setSelectedId(copy.id);
    setStatus(`Copied ${selected.name} -> ${copy.name}.`);
  };

  const deleteSelected = () => {
    if (!selected) return;
    const remaining = objects.filter((o) => o.id !== selected.id);
    setObjects(remaining, true);
    setSelectedId(remaining[0]?.id ?? '');
    setStatus(remaining.length ? `Deleted ${selected.name}.` : 'Scene is empty. Create a primitive.');
  };

  const newScene = () => {
    const obj = newObject('cube', 0, 0);
    obj.name = 'untitled.mod';
    setObjects([obj], true);
    setSelectedId(obj.id);
    setStatus('New model. Created a cube.');
  };

  const openWinged = () => {
    const obj = newObject('winged', 0, 0);
    obj.name = 'winged_kit.mod';
    obj.rot = [0.15, -0.55, 0.05];
    obj.material = 'gold';
    obj.keys = [{ frame: 0, rx: 0.15, ry: -0.55, rz: 0.05 }];
    setObjects([obj], true);
    setSelectedId(obj.id);
    setStatus('Opened winged_kit.mod');
  };

  const saveModel = () => {
    const text = sceneToObj(objects, frame);
    onSaveFile?.('/usr/local/wave/data/explorer_scene.obj', text);
    setStatus(`Saved ${objects.length} object(s) to /usr/local/wave/data/explorer_scene.obj`);
  };

  const runMirror = () => {
    if (!selected) return;
    const copy = mirrorCopy(selected, ++objectSerial, frame);
    setObjects((prev) => [...prev, copy], true);
    setSelectedId(copy.id);
    setStatus(`Mirrored ${selected.name} -> ${copy.name}`);
  };

  const runBoolean = (op: BooleanOp) => {
    if (!selected) return;
    const other = objects.find((o) => o.id !== selected.id);
    if (!other) {
      setStatus('Boolean needs two objects. Create a second primitive.');
      return;
    }
    const result = booleanHulls(selected, other, op, frame);
    if (!result) {
      setStatus(`${op}: no overlapping faces. Move the hulls so they intersect.`);
      return;
    }
    setObjects((prev) => prev.filter((o) => o.id !== selected.id && o.id !== other.id).concat(result), true);
    setSelectedId(result.id);
    const faces = result.baked?.faces.length ?? 0;
    setStatus(`${op}: ${selected.name} with ${other.name} -> ${faces} faces.`);
  };

  const runCommand = (line: string) => {
    const cmd = line.trim().toLowerCase();
    const prim = PRIMITIVE_LIBRARY.find((p) => p.id === cmd || p.label.toLowerCase() === cmd);
    if (prim) {
      addPrimitive(prim.id);
      return;
    }
    if (cmd === 'delete' || cmd === 'del') deleteSelected();
    else if (cmd === 'undo') setStatus(undoAw() ? 'Undo.' : 'Nothing to undo.');
    else if (cmd === 'redo') setStatus(redoAw() ? 'Redo.' : 'Nothing to redo.');
    else if (cmd === 'bend') setDeform('bend', 0.4);
    else if (cmd === 'twist') setDeform('twist', 0.45);
    else if (cmd === 'taper') setDeform('taper', 0.4);
    else if (cmd === 'mirror') runMirror();
    else if (cmd === 'copy' || cmd === 'dup') duplicateSelected();
    else if (cmd === 'wire') setQuality('wireframe');
    else if (cmd === 'flat') setQuality('flat');
    else if (cmd === 'smooth') setQuality('gouraud');
    else if (cmd === 'hide' || cmd === 'hidden') setQuality('hiddenline');
    else if (cmd === 'material' || cmd === 'shade') setQuality('raytrace');
    else if (cmd === 'new') newScene();
    else if (cmd === 'help')
      setStatus('commands: cube sphere cylinder cone torus plane tetra winged piston copy delete mirror bend twist taper undo new wire flat smooth hide');
    else setStatus(`Unknown command "${line}". Type help.`);
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
      `# Advanced Visualizer Model 4.2.1 — SGI RGB image`,
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
    setAwRender({ url, path });
    setStatus(`Rendered ${w}x${h} ${quality} frame ${frame} -> ${path}`);
  };

  const selectedRot = selected ? currentRot(selected, frame) : [0, 0, 0];
  const cam = camRef.current;
  void camTick;
  const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(3) : '0.000');
  const deg = (r: number) => fmt((r * 180) / Math.PI);
  const meshStats = meshFor(selected ?? objects[0]);
  const fileLabel = (selected?.name ?? 'winged_kit.mod').replace(/\.obj$/, '.mod');

  const pushStatus = (line: string) => setStatus(line);

  const motif = (on: boolean): React.CSSProperties => ({
    background: on ? '#b7dde2' : '#d4d4d4',
    borderTop: '1px solid #f7f7f7',
    borderLeft: '1px solid #f7f7f7',
    borderRight: '1px solid #4a4a4a',
    borderBottom: '1px solid #4a4a4a',
    boxShadow: on ? 'inset 1px 1px 2px rgba(0,0,0,0.25)' : undefined,
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontSize: '11px',
    lineHeight: 1.15,
    padding: '1px 5px',
    cursor: 'pointer',
    color: '#111',
    textAlign: 'left',
  });

  const sideItems: { id: string; label: string; action: () => void }[] = [
    { id: 'file', label: 'File', action: () => setMenuOpen(menuOpen === 'file' ? null : 'file') },
    { id: 'edit', label: 'Edit', action: () => setMenuOpen(menuOpen === 'edit' ? null : 'edit') },
    { id: 'view', label: 'View', action: () => setMenuOpen(menuOpen === 'view' ? null : 'view') },
    { id: 'display', label: 'Display', action: () => setMenuOpen(menuOpen === 'display' ? null : 'display') },
    { id: 'shapes', label: 'Shapes', action: () => setMenuOpen(menuOpen === 'shapes' ? null : 'shapes') },
    { id: 'create', label: 'Create', action: () => setMenuOpen(menuOpen === 'create' ? null : 'create') },
    { id: 'tools', label: 'Tools', action: () => setMenuOpen(menuOpen === 'tools' ? null : 'tools') },
    { id: 'booleans', label: 'Booleans', action: () => setMenuOpen(menuOpen === 'booleans' ? null : 'booleans') },
    { id: 'textures', label: 'Textures', action: () => setMenuOpen(menuOpen === 'textures' ? null : 'textures') },
    { id: 'properties', label: 'Properties', action: () => setMenuOpen(menuOpen === 'properties' ? null : 'properties') },
    { id: 'database', label: 'Database', action: () => setMenuOpen(menuOpen === 'database' ? null : 'database') },
    { id: 'user', label: 'User Defined', action: () => pushStatus('User Defined: no plugins loaded.') },
  ];

  const popup = (
    title: string,
    items: { label: string; action: () => void }[],
    left: number
  ) =>
    menuOpen === title ? (
      <div
        style={{
          position: 'absolute',
          left,
          top: 0,
          zIndex: 40,
          minWidth: '148px',
          background: '#d8d8d8',
          border: '1px solid #111',
          boxShadow: '2px 2px 0 #555',
          padding: '2px 0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((it) => (
          <div
            key={it.label}
            onClick={() => {
              setMenuOpen(null);
              it.action();
            }}
            style={{ padding: '2px 14px 2px 10px', fontSize: '12px', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#b7dde2')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {it.label}
          </div>
        ))}
      </div>
    ) : null;

  return (
    <div
      onClick={() => menuOpen && setMenuOpen(null)}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#cfcfcf',
        color: '#111',
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: '12px',
        minHeight: 0,
      }}
    >
        <div
          style={{
            padding: '2px 8px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            background: '#d0d0d0',
            borderBottom: '1px solid #9a9a9a',
            flexShrink: 0,
          }}
        >
          Current Group: {selected?.group ?? 'Prt_Mtl_Material.00'} &nbsp; Current Element: {objects.findIndex((o) => o.id === selectedId) + 1 || 0} &nbsp; File: {fileLabel}
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <div
            style={{
              width: '112px',
              flexShrink: 0,
              background: '#d7d7d7',
              borderRight: '1px solid #8a8a8a',
              position: 'relative',
              zIndex: 5,
              paddingTop: '2px',
            }}
          >
            {sideItems.map((it) => (
              <div
                key={it.id}
                onClick={(e) => {
                  e.stopPropagation();
                  it.action();
                }}
                style={{
                  padding: '1px 8px',
                  cursor: 'pointer',
                  background: menuOpen === it.id ? '#ffffff' : 'transparent',
                  textDecoration: it.id === 'file' ? 'underline' : undefined,
                }}
              >
                {it.label}
              </div>
            ))}
            {popup(
              'file',
              [
                { label: 'New', action: () => newScene() },
                { label: 'Open winged_kit.mod', action: () => openWinged() },
                { label: 'Merge In Piston', action: () => addPrimitive('piston') },
                { label: 'Save', action: () => saveModel() },
                { label: 'Save As OBJ', action: () => saveModel() },
                { label: 'Save Group As...', action: () => pushStatus('Save Group As: Prt_Mtl_Material.00') },
                { label: 'Ignore Groups', action: () => pushStatus('Ignore Groups toggled.') },
                { label: 'Exit', action: () => pushStatus('Exit Model — close the window from 4Dwm.') },
              ],
              108
            )}
            {popup(
              'edit',
              [
                { label: 'Undo', action: () => setStatus(undoAw() ? 'Undo.' : 'Nothing to undo.') },
                { label: 'Redo', action: () => setStatus(redoAw() ? 'Redo.' : 'Nothing to redo.') },
                { label: 'Copy', action: () => duplicateSelected() },
                { label: 'Delete', action: () => deleteSelected() },
                { label: 'Rename', action: () => setRenaming(true) },
              ],
              108
            )}
            {popup(
              'shapes',
              PRIMITIVE_LIBRARY.map((p) => ({ label: p.label, action: () => addPrimitive(p.id) })),
              108
            )}
            {popup(
              'create',
              [
                ...PRIMITIVE_LIBRARY.map((p) => ({ label: p.label, action: () => addPrimitive(p.id) })),
                { label: 'Duplicate', action: () => duplicateSelected() },
                { label: 'Mirror X', action: () => runMirror() },
              ],
              108
            )}
            {popup(
              'display',
              [
                { label: 'Wireframe', action: () => setQuality('wireframe') },
                { label: 'Hidden Line', action: () => setQuality('hiddenline') },
                { label: 'Flat Shading', action: () => setQuality('flat') },
                { label: 'Smooth Shading', action: () => setQuality('gouraud') },
                { label: 'Material Shading', action: () => setQuality('raytrace') },
              ],
              108
            )}
            {popup(
              'view',
              [
                { label: 'Camera tran', action: () => { setCamMode('tran'); setDragTarget('camera'); } },
                { label: 'Camera rot', action: () => { setCamMode('rot'); setDragTarget('camera'); } },
                { label: 'Camera zoom', action: () => { setCamMode('zoom'); setDragTarget('camera'); } },
                { label: 'Perspective', action: () => { setCamMode('persp'); setDragTarget('camera'); } },
                {
                  label: 'Init',
                  action: () => {
                    camRef.current = { yaw: 0.95, pitch: 0.18, dist: 7.2, target: [0.35, 0.05, 0] };
                    setCamTick((n) => n + 1);
                  },
                },
              ],
              108
            )}
            {popup(
              'tools',
              [
                { label: 'Bend', action: () => setDeform('bend', 0.4) },
                { label: 'Twist', action: () => setDeform('twist', 0.45) },
                { label: 'Taper', action: () => setDeform('taper', 0.4) },
                { label: 'Reset Deformer', action: () => setDeform('none', 0) },
                { label: 'Mirror X', action: () => runMirror() },
              ],
              108
            )}
            {popup(
              'booleans',
              [
                { label: 'Union with next', action: () => runBoolean('union') },
                { label: 'Difference with next', action: () => runBoolean('difference') },
                { label: 'Intersection with next', action: () => runBoolean('intersection') },
              ],
              108
            )}
            {popup(
              'textures',
              [
                { label: 'Assign Gold', action: () => patchSelected((o) => ({ ...o, material: 'gold', tint: undefined })) },
                { label: 'Assign Chrome', action: () => patchSelected((o) => ({ ...o, material: 'chrome', tint: undefined })) },
                { label: 'Assign Clay', action: () => patchSelected((o) => ({ ...o, material: 'matte_grey', tint: undefined })) },
                { label: 'Clear tint', action: () => patchSelected((o) => ({ ...o, tint: undefined })) },
              ],
              108
            )}
            {popup(
              'properties',
              MATERIALS.map((m) => ({
                label: m.label,
                action: () =>
                  setObjects((prev) => prev.map((o) => (o.id === selectedId ? { ...o, material: m.id, tint: undefined } : o)), true),
              })),
              108
            )}
            {popup(
              'database',
              objects.map((o) => ({ label: o.name, action: () => setSelectedId(o.id) })),
              108
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 4px',
                background: '#c8c8c8',
                borderBottom: '1px solid #9a9a9a',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  border: '1px solid #666',
                  background: '#e8e8e8',
                  padding: '0 8px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              >
                cam1
              </span>
              {(['tran', 'rot', 'zoom', 'init', 'persp'] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  style={motif(id !== 'init' && camMode === id)}
                  onClick={() => {
                    if (id === 'init') {
                      camRef.current = { yaw: 0.95, pitch: 0.18, dist: 7.2, target: [0.35, 0.05, 0] };
                      setCamTick((n) => n + 1);
                      setStatus('Camera init.');
                      return;
                    }
                    setCamMode(id);
                    setDragTarget('camera');
                    setStatus(`Camera ${id}. Drag the view. Object move / rotate / scale is on the right.`);
                  }}
                >
                  {id}
                </button>
              ))}
              <button type="button" title="3D grid" style={motif(showGrid)} onClick={() => setShowGrid((v) => !v)}>
                ▦
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 0, position: 'relative', background: '#8d8d8d' }} onWheel={onWheel}>
              <canvas
                ref={canvasRef}
                width={720}
                height={420}
                onMouseDown={onCanvasMouseDown}
                style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '62%',
                  top: '18%',
                  width: '14px',
                  height: '14px',
                  pointerEvents: 'none',
                  borderLeft: '1px solid #222',
                  borderTop: '1px solid #222',
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '2px',
                padding: '3px',
                background: '#cfcfcf',
                borderTop: '1px solid #9a9a9a',
                flexShrink: 0,
              }}
            >
              {(
                [
                  ['Group List', () => setMenuOpen(menuOpen === 'database' ? null : 'database'), false],
                  ['Render(Image)', renderFrame, false],
                  ['Hidden Line', () => setQuality('hiddenline'), quality === 'hiddenline'],
                  ['Normals  All', () => setShowNormals((v) => !v), showNormals],
                  ['Flat Shading', () => setQuality('flat'), quality === 'flat'],
                  ['3D Grid', () => setShowGrid((v) => !v), showGrid],
                  ['Axes', () => setShowAxes((v) => !v), showAxes],
                  ['Smooth Shading', () => setQuality('gouraud'), quality === 'gouraud'],
                  ['Material Shading', () => setQuality('raytrace'), quality === 'raytrace'],
                  ['Restrict Display', () => setIsolate((v) => !v), isolate],
                ] as [string, () => void, boolean][]
              ).map(([label, action, on]) => (
                <button key={label} type="button" style={motif(on)} onClick={action}>
                  {label}
                </button>
              ))}
              <div style={{ gridColumn: 'span 2', fontFamily: 'monospace', fontSize: '11px', padding: '2px 4px' }}>
                cam X {fmt(cam.target[0])} &nbsp; yaw {deg(cam.yaw)}
                <br />
                cam Y {fmt(cam.target[1])} &nbsp; pitch {deg(cam.pitch)}
                <br />
                cam Z {fmt(cam.dist)} &nbsp; obj {fileLabel}
              </div>
            </div>

            <div
              style={{
                height: '78px',
                overflow: 'auto',
                background: '#d5d5d5',
                borderTop: '1px solid #aaa',
                padding: '2px 6px',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: 1.25,
                flexShrink: 0,
                whiteSpace: 'pre',
              }}
            >
              {meshStats.verts.length} vertices &nbsp; {meshStats.verts.length} texture vertices &nbsp;{' '}
              {meshStats.verts.length} normals &nbsp; {meshStats.faces.length} elements
              {'\n'}
              {logLines.slice(1).join('\n')}
              {status ? `\n${status}` : ''}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const line = command.trim();
                if (!line) return;
                runCommand(line);
                setCommand('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 6px 4px',
                background: '#d0d0d0',
                flexShrink: 0,
              }}
            >
              <span>Command Line &gt;</span>
              <input
                ref={commandRef}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                style={{
                  flex: 1,
                  background: '#c8979b',
                  border: '1px solid #111',
                  boxShadow: 'inset 1px 1px 0 #7a5257',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  padding: '0 4px',
                }}
              />
            </form>
          </div>

          <div
            style={{
              width: '168px',
              flexShrink: 0,
              borderLeft: '1px solid #8a8a8a',
              background: '#d2d2d2',
              padding: '4px 4px',
              overflow: 'auto',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
              {(['move', 'rotate', 'scale'] as const).map((op) => (
                <button
                  key={op}
                  type="button"
                  style={{ ...motif(dragTarget === 'object' && objectOp === op), flex: 1, textTransform: 'capitalize' }}
                  onClick={() => {
                    setDragTarget('object');
                    setObjectOp(op);
                    setStatus(`Drag in the view to ${op} ${fileLabel}. Type a number and press Enter to set a channel.`);
                  }}
                >
                  {op}
                </button>
              ))}
            </div>
            <div style={{ fontWeight: 700, textAlign: 'center' }}>Translation</div>
            <Chan label="XTRAN" value={fmt(selected?.pos[0] ?? 0)} onCommit={(n) => patchSelected((o) => ({ ...o, pos: [n, o.pos[1], o.pos[2]] }))} />
            <Chan label="YTRAN" value={fmt(selected?.pos[1] ?? 0)} onCommit={(n) => patchSelected((o) => ({ ...o, pos: [o.pos[0], n, o.pos[2]] }))} />
            <Chan label="ZTRAN" value={fmt(selected?.pos[2] ?? 0)} onCommit={(n) => patchSelected((o) => ({ ...o, pos: [o.pos[0], o.pos[1], n] }))} />
            <div style={{ fontWeight: 700, textAlign: 'center', marginTop: '4px' }}>Rotation</div>
            <Chan label="XROT" value={deg(selectedRot[0])} onCommit={(n) => patchSelected((o) => pose(o, [(n * Math.PI) / 180, objectRotationAt(o, 0)[1], objectRotationAt(o, 0)[2]]))} />
            <Chan label="YROT" value={deg(selectedRot[1])} onCommit={(n) => patchSelected((o) => pose(o, [objectRotationAt(o, 0)[0], (n * Math.PI) / 180, objectRotationAt(o, 0)[2]]))} />
            <Chan label="ZROT" value={deg(selectedRot[2])} onCommit={(n) => patchSelected((o) => pose(o, [objectRotationAt(o, 0)[0], objectRotationAt(o, 0)[1], (n * Math.PI) / 180]))} />
            <div style={{ fontWeight: 700, textAlign: 'center', marginTop: '4px' }}>Scale</div>
            <Chan label="XSCALE" value={fmt(selected?.scale?.[0] ?? 1)} onCommit={(n) => patchSelected((o) => ({ ...o, scale: [n, o.scale?.[1] ?? 1, o.scale?.[2] ?? 1] }))} />
            <Chan label="YSCALE" value={fmt(selected?.scale?.[1] ?? 1)} onCommit={(n) => patchSelected((o) => ({ ...o, scale: [o.scale?.[0] ?? 1, n, o.scale?.[2] ?? 1] }))} />
            <Chan label="ZSCALE" value={fmt(selected?.scale?.[2] ?? 1)} onCommit={(n) => patchSelected((o) => ({ ...o, scale: [o.scale?.[0] ?? 1, o.scale?.[1] ?? 1, n] }))} />
            <Chan
              label="SCALE"
              value={fmt(selected?.scale?.[0] ?? 1)}
              onCommit={(n) => patchSelected((o) => ({ ...o, scale: [n, n, n] }))}
            />
            <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
              <button type="button" style={{ ...motif(coarse), flex: 1 }} onClick={() => setCoarse((v) => !v)}>
                Coarse
              </button>
              <button type="button" style={{ ...motif(!coarse), flex: 1 }} onClick={() => setCoarse(false)}>
                Pos
              </button>
            </div>
            <div style={{ display: 'flex', gap: '3px', marginTop: '3px' }}>
              <button
                type="button"
                style={{ ...motif(false), flex: 1 }}
                onClick={() => {
                  patchSelected((o) => pose({ ...o, pos: [0, 0, 0], scale: [1, 1, 1] }, [0, 0, 0]));
                  pushStatus('Init Chan: translation, rotation and scale reset.');
                }}
              >
                Init Chan
              </button>
              <button type="button" style={{ ...motif(true), flex: 1 }}>
                All
              </button>
            </div>
            <div style={{ display: 'flex', gap: '3px', marginTop: '3px' }}>
              <button
                type="button"
                style={{ ...motif(false), flex: 1 }}
                onClick={() => {
                  commandRef.current?.focus();
                  setStatus('Command line. Try: sphere, copy, delete, bend, undo.');
                }}
              >
                From Kb
              </button>
              <button type="button" style={{ ...motif(true), flex: 1 }}>
                Rel
              </button>
            </div>
            <button
              type="button"
              style={{ ...motif(false), width: '100%', marginTop: '4px' }}
              onClick={() => {
                const order: DeformId[] = ['bend', 'twist', 'taper', 'none'];
                const i = order.indexOf(selected?.deform ?? 'none');
                const next = order[(i + 1) % order.length];
                const amount = next === 'none' ? 0 : Math.min(1.2, (selected?.deformAmount ?? 0) + 0.25);
                setDeform(next, amount);
              }}
            >
              Deformations
            </button>
            {renaming ? (
              <input
                autoFocus
                defaultValue={selected?.name ?? ''}
                onBlur={(e) => {
                  const name = e.target.value.trim();
                  if (name) patchSelected((o) => ({ ...o, name }));
                  setRenaming(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                style={{ width: '100%', marginTop: '3px', fontFamily: 'monospace' }}
              />
            ) : (
              <button type="button" style={{ ...motif(false), width: '100%', marginTop: '3px' }} onClick={() => setRenaming(true)}>
                Change Label
              </button>
            )}
            {(
              [
                ['Point', 'point'],
                ['Point Group', 'pointGroup'],
                ['Element', 'element'],
                ['Element Group', 'elementGroup'],
              ] as const
            ).map(([label, id]) => (
              <button
                key={id}
                type="button"
                style={{ ...motif(pickMode === id), width: '100%', marginTop: '3px' }}
                onClick={() => setPickMode(id)}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              style={{ ...motif(false), width: '100%', marginTop: '3px' }}
              onClick={() => {
                const group = `Group_${(objects.findIndex((o) => o.id === selectedId) + 1) || 1}`;
                patchSelected((o) => ({ ...o, group }));
                setStatus(`Regrouped into ${group}.`);
              }}
            >
              Regroup Elements
            </button>
            <button
              type="button"
              style={{ ...motif(dragTarget === 'camera'), width: '100%', marginTop: '6px' }}
              onClick={() => {
                setDragTarget('object');
                setObjectOp('move');
                setStatus('Object move. Drag the view to translate the selection. cam1 switches to the camera.');
              }}
            >
              Reset All Modes
            </button>
            <div style={{ display: 'flex', gap: '3px', marginTop: '3px' }}>
              <button type="button" style={{ ...motif(false), flex: 1 }} onClick={saveModel}>
                Save
              </button>
              <button type="button" style={{ ...motif(autoSave), flex: 1 }} onClick={() => setAutoSave((v) => !v)}>
                Auto
              </button>
            </div>
            <button
              type="button"
              style={{ ...motif(false), width: '100%', marginTop: '3px' }}
              onClick={() => {
                const i = objects.findIndex((o) => o.id === selectedId);
                const next = objects[(i + 1) % objects.length];
                if (next) setSelectedId(next.id);
              }}
            >
              Next
            </button>
            <button
              type="button"
              style={{ ...motif(false), width: '100%', marginTop: '3px' }}
              onClick={() => {
                const i = objects.findIndex((o) => o.id === selectedId);
                const prev = objects[(i - 1 + objects.length) % objects.length];
                if (prev) setSelectedId(prev.id);
              }}
            >
              Last
            </button>
            <button type="button" style={{ ...motif(false), width: '100%', marginTop: '3px' }} onClick={duplicateSelected}>
              Copy
            </button>
            <button type="button" style={{ ...motif(false), width: '100%', marginTop: '3px' }} onClick={() => setMenuOpen('shapes')}>
              New
            </button>
            <button type="button" style={{ ...motif(false), width: '100%', marginTop: '3px' }} onClick={deleteSelected}>
              Delete
            </button>
          </div>
        </div>

        <div
          style={{
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            background: '#c8c8c8',
            borderTop: '1px solid #888',
            fontSize: '11px',
            letterSpacing: '0.08em',
            flexShrink: 0,
          }}
        >
          <span>Model &nbsp; 4.2.1</span>
          <span style={{ letterSpacing: '0.18em' }}>ALIAS|WAVEFRONT, INC.</span>
          <span>Advanced Visualizer Model 4.2.1</span>
        </div>
    </div>
  );
};

function Chan({ label, value, onCommit }: { label: string; value: string; onCommit: (n: number) => void }) {
  return (
    <label style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', padding: '1px 2px', alignItems: 'center' }}>
      <span>{label}</span>
      <input
        key={value}
        defaultValue={value}
        onBlur={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onCommit(n);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        style={{
          width: '72px',
          background: '#c8979b',
          border: '1px solid #111',
          boxShadow: 'inset 1px 1px 0 #7a5257',
          fontFamily: 'monospace',
          fontSize: '12px',
          textAlign: 'right',
        }}
      />
    </label>
  );
}

function currentRot(obj: ExplorerObject, frame: number): [number, number, number] {
  return objectRotationAt(obj, frame);
}

function mergeKey(obj: ExplorerObject, key: Keyframe): Keyframe[] {
  const others = obj.keys.filter((k) => k.frame !== key.frame);
  return [...others, key].sort((a, b) => a.frame - b.frame);
}
