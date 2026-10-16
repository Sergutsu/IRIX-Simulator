/**
 * Alias|Wavefront modules other than Model. Each is its own window, launched
 * by The Director. Property, Kinemation, Preview and Composer share the open
 * model. Paint and Dynamation run on their own.
 */
import React, { useEffect, useRef, useState } from 'react';
import type { SgiColorScheme, LaunchApp } from '../state/osStore';
import type { AwModuleId } from './explorer/awProducts';
import {
  setAwFrame,
  setAwRender,
  setAwSelected,
  updateAwObjects,
  useAwFrame,
  useAwObjects,
  useAwRender,
  useAwSelectedId,
} from './explorer/awScene';
import { drawScene, MATERIALS, objectRotationAt, RESOLUTIONS, type Camera, type Keyframe, type RenderQuality } from './explorer/drawScene';

interface AwModuleAppProps {
  module: AwModuleId;
  colorScheme: SgiColorScheme;
  onLaunchApp: LaunchApp;
  onSaveRender?: (path: string, dataUrl: string, meta: string) => void;
}

const shell: React.CSSProperties = {
  height: '100%',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  background: '#cfcfcf',
  color: '#111',
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: '12px',
};

const btn: React.CSSProperties = {
  background: '#dcdcdc',
  borderTop: '1px solid #fff',
  borderLeft: '1px solid #fff',
  borderRight: '1px solid #555',
  borderBottom: '1px solid #555',
  fontFamily: 'inherit',
  fontSize: '12px',
  padding: '2px 8px',
  cursor: 'pointer',
};

function mergeKey(keys: Keyframe[], key: Keyframe): Keyframe[] {
  return [...keys.filter((k) => k.frame !== key.frame), key].sort((a, b) => a.frame - b.frame);
}

export const AwModuleApp: React.FC<AwModuleAppProps> = (props) => {
  const title =
    props.module === 'paint'
      ? 'Paint'
      : props.module === 'property'
        ? 'Property'
        : props.module === 'dynamation'
          ? 'Dynamation'
          : props.module === 'kinemation'
            ? 'Kinemation'
            : props.module === 'preview'
              ? 'Preview'
              : 'Composer';
  return (
    <div style={shell}>
      <div style={{ padding: '3px 8px', borderBottom: '1px solid #9a9a9a', fontWeight: 700 }}>{title}</div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {props.module === 'paint' && <Paint {...props} />}
        {props.module === 'property' && <Property {...props} />}
        {props.module === 'dynamation' && <Dynamation />}
        {props.module === 'kinemation' && <Kinemation {...props} />}
        {props.module === 'preview' && <Preview {...props} />}
        {props.module === 'composer' && <Composer {...props} />}
      </div>
      <div style={{ padding: '2px 8px', borderTop: '1px solid #888', letterSpacing: '0.12em', fontSize: '11px' }}>
        ALIAS|WAVEFRONT, INC.
      </div>
    </div>
  );
};

const Paint: React.FC<AwModuleAppProps> = ({ onSaveRender }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<{ on: boolean; x: number; y: number; color: string; size: number }>({
    on: false,
    x: 0,
    y: 0,
    color: '#c4562a',
    size: 4,
  });
  const [color, setColor] = useState('#c4562a');
  const [size, setSize] = useState(4);
  const [status, setStatus] = useState('Drag to paint. Save writes a PNG into renders.');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#8d8d8d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const pos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / Math.max(1, rect.width)) * canvas.width,
      y: ((e.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height,
    };
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '6px', padding: '4px', alignItems: 'center', flexShrink: 0 }}>
        {['#c4562a', '#111111', '#f4f4f4', '#d4a017', '#2a6f4e', '#2a3f8f'].map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            onClick={() => {
              setColor(c);
              drawRef.current.color = c;
            }}
            style={{ ...btn, width: '18px', height: '18px', padding: 0, background: c, outline: color === c ? '2px solid #111' : undefined }}
          />
        ))}
        <label>
          Size{' '}
          <input
            type="range"
            min={1}
            max={24}
            value={size}
            onChange={(e) => {
              const n = Number(e.target.value);
              setSize(n);
              drawRef.current.size = n;
            }}
          />
        </label>
        <button
          type="button"
          style={btn}
          onClick={() => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;
            ctx.fillStyle = '#8d8d8d';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            setStatus('Cleared.');
          }}
        >
          Clear
        </button>
        <button
          type="button"
          style={btn}
          onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const url = canvas.toDataURL('image/png');
            const path = '/usr/people/guest/renders/paint.0001.rgb';
            onSaveRender?.(path, url, '# Paint — Alias|Wavefront\n');
            setAwRender({ url, path });
            setStatus(`Saved ${path}`);
          }}
        >
          Save
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        style={{ flex: 1, width: '100%', minHeight: 0, cursor: 'crosshair', background: '#8d8d8d' }}
        onMouseDown={(e) => {
          const p = pos(e);
          drawRef.current.on = true;
          drawRef.current.x = p.x;
          drawRef.current.y = p.y;
        }}
        onMouseMove={(e) => {
          if (!drawRef.current.on) return;
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (!ctx) return;
          const p = pos(e);
          ctx.strokeStyle = drawRef.current.color;
          ctx.lineWidth = drawRef.current.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(drawRef.current.x, drawRef.current.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          drawRef.current.x = p.x;
          drawRef.current.y = p.y;
        }}
        onMouseUp={() => {
          drawRef.current.on = false;
        }}
        onMouseLeave={() => {
          drawRef.current.on = false;
        }}
      />
      <div style={{ padding: '3px 8px', flexShrink: 0 }}>{status}</div>
    </div>
  );
};

const Property: React.FC<AwModuleAppProps> = ({ onLaunchApp }) => {
  const objects = useAwObjects();
  const selectedId = useAwSelectedId();
  const selected = objects.find((o) => o.id === selectedId) ?? objects[0];
  const tint = selected?.tint ?? MATERIALS.find((m) => m.id === selected?.material)?.color ?? [180, 180, 180];
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'auto' }}>
      <div style={{ width: '200px', borderRight: '1px solid #9a9a9a', overflow: 'auto' }}>
        {objects.map((o) => (
          <div
            key={o.id}
            onClick={() => setAwSelected(o.id)}
            style={{ padding: '3px 8px', cursor: 'pointer', background: o.id === selected?.id ? '#b7dde2' : 'transparent' }}
          >
            {o.name}
          </div>
        ))}
        {!objects.length && <div style={{ padding: '8px' }}>No objects. Open Model and create one.</div>}
      </div>
      <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div>{selected ? selected.name : 'Nothing selected'}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {MATERIALS.map((m) => (
            <button
              key={m.id}
              type="button"
              style={{ ...btn, outline: selected?.material === m.id ? '2px solid #111' : undefined }}
              onClick={() =>
                updateAwObjects(
                  (prev) => prev.map((o) => (o.id === selected?.id ? { ...o, material: m.id, tint: undefined } : o)),
                  true
                )
              }
            >
              {m.label}
            </button>
          ))}
        </div>
        {(['R', 'G', 'B'] as const).map((channel, i) => (
          <label key={channel}>
            {channel}{' '}
            <input
              type="range"
              min={0}
              max={255}
              value={tint[i]}
              onChange={(e) => {
                const next: [number, number, number] = [tint[0], tint[1], tint[2]];
                next[i] = Number(e.target.value);
                updateAwObjects(
                  (prev) => prev.map((o) => (o.id === selected?.id ? { ...o, tint: next } : o)),
                  false
                );
              }}
            />
            <span> {tint[i]}</span>
          </label>
        ))}
        <button type="button" style={{ ...btn, alignSelf: 'flex-start' }} onClick={() => onLaunchApp('explorer')}>
          Open Model
        </button>
      </div>
    </div>
  );
};

const Dynamation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parts = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const [rate, setRate] = useState(8);
  const [gravity, setGravity] = useState(0.08);
  const rateRef = useRef(rate);
  const gravRef = useRef(gravity);
  rateRef.current = rate;
  gravRef.current = gravity;

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < rateRef.current; i++) {
        parts.current.push({
          x: canvas.width / 2,
          y: canvas.height * 0.72,
          vx: (Math.random() - 0.5) * 3.2,
          vy: -2.2 - Math.random() * 3.4,
          life: 1,
        });
      }
      const next = [];
      ctx.fillStyle = '#f0c14a';
      for (const p of parts.current) {
        p.vy += gravRef.current;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.008;
        if (p.life > 0 && p.y < canvas.height) {
          next.push(p);
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillRect(p.x, p.y, 2, 2);
        }
      }
      ctx.globalAlpha = 1;
      parts.current = next.slice(-4000);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '10px', padding: '4px 8px', alignItems: 'center', flexShrink: 0 }}>
        <label>
          Emit{' '}
          <input type="range" min={0} max={30} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
        </label>
        <label>
          Gravity{' '}
          <input
            type="range"
            min={0}
            max={40}
            value={Math.round(gravity * 100)}
            onChange={(e) => setGravity(Number(e.target.value) / 100)}
          />
        </label>
        <button
          type="button"
          style={btn}
          onClick={() => {
            parts.current = [];
          }}
        >
          Reset
        </button>
      </div>
      <canvas ref={canvasRef} width={640} height={360} style={{ flex: 1, width: '100%', minHeight: 0, background: '#1a1a1a' }} />
    </div>
  );
};

const Kinemation: React.FC<AwModuleAppProps> = ({ onLaunchApp }) => {
  const objects = useAwObjects();
  const selectedId = useAwSelectedId();
  const frame = useAwFrame();
  const [playing, setPlaying] = useState(false);
  const selected = objects.find((o) => o.id === selectedId) ?? objects[0];
  const rot = selected ? objectRotationAt(selected, frame) : [0, 0, 0];

  return (
    <KinemationBody
      playing={playing}
      setPlaying={setPlaying}
      frame={frame}
      selectedName={selected?.name ?? '(none)'}
      keys={selected?.keys ?? []}
      rot={rot}
      onOpenModel={() => onLaunchApp('explorer')}
      onSelect={(id) => setAwSelected(id)}
      objects={objects.map((o) => ({ id: o.id, name: o.name }))}
      selectedId={selected?.id ?? ''}
      onSetKey={() => {
        if (!selected) return;
        const [rx, ry, rz] = objectRotationAt(selected, frame);
        updateAwObjects(
          (prev) =>
            prev.map((o) => (o.id === selected.id ? { ...o, keys: mergeKey(o.keys, { frame, rx, ry, rz }) } : o)),
          true
        );
      }}
      onDeleteKey={(at) => {
        if (!selected) return;
        updateAwObjects(
          (prev) => prev.map((o) => (o.id === selected.id ? { ...o, keys: o.keys.filter((k) => k.frame !== at) } : o)),
          true
        );
      }}
    />
  );
};

function KinemationBody(props: {
  playing: boolean;
  setPlaying: (v: boolean) => void;
  frame: number;
  selectedName: string;
  keys: Keyframe[];
  rot: number[];
  objects: { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  onSetKey: () => void;
  onDeleteKey: (frame: number) => void;
  onOpenModel: () => void;
}) {
  useEffect(() => {
    if (!props.playing) return;
    const id = window.setInterval(() => {
      setAwFrame(props.frame >= 120 ? 0 : props.frame + 1);
    }, 1000 / 24);
    return () => window.clearInterval(id);
  }, [props.playing, props.frame]);

  const deg = (r: number) => ((r * 180) / Math.PI).toFixed(1);
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '6px', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ width: '180px' }}>
          {props.objects.map((o) => (
            <div
              key={o.id}
              onClick={() => props.onSelect(o.id)}
              style={{ padding: '2px 4px', cursor: 'pointer', background: o.id === props.selectedId ? '#b7dde2' : 'transparent' }}
            >
              {o.name}
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div>{props.selectedName}</div>
          <div>
            frame {props.frame} &nbsp; XROT {deg(props.rot[0])} &nbsp; YROT {deg(props.rot[1])} &nbsp; ZROT {deg(props.rot[2])}
          </div>
          <input type="range" min={0} max={120} value={props.frame} onChange={(e) => setAwFrame(Number(e.target.value))} style={{ width: '100%' }} />
          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
            <button type="button" style={btn} onClick={() => props.setPlaying(!props.playing)}>
              {props.playing ? 'Stop' : 'Play'}
            </button>
            <button type="button" style={btn} onClick={props.onSetKey}>
              Set Key
            </button>
            <button type="button" style={btn} onClick={props.onOpenModel}>
              Open Model
            </button>
          </div>
          <div style={{ marginTop: '6px' }}>
            {props.keys.map((k) => (
              <button key={k.frame} type="button" style={{ ...btn, marginRight: '4px' }} onClick={() => props.onDeleteKey(k.frame)}>
                key {k.frame} ×
              </button>
            ))}
          </div>
          <div style={{ marginTop: '6px', color: '#333' }}>Set Key stores this frame. A second key turns the rotation into an animation Model will play.</div>
        </div>
      </div>
    </div>
  );
}

const Preview: React.FC<AwModuleAppProps> = ({ onSaveRender, onLaunchApp }) => {
  const objects = useAwObjects();
  const frame = useAwFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef<Camera>({ yaw: 0.95, pitch: 0.18, dist: 7.2, target: [0.35, 0.05, 0] });
  const [quality, setQuality] = useState<RenderQuality>('gouraud');
  const [resolution, setResolution] = useState(RESOLUTIONS[1].id);
  const [status, setStatus] = useState('Preview shades the model that is open in Model.');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    drawScene(ctx, canvas.width, canvas.height, objects, camRef.current, {
      quality,
      showGrid: true,
      floor: true,
      lightAngle: frame / 30,
      frame,
      smoothAngle: 45,
      backdrop: 'black',
    });
  }, [objects, frame, quality]);

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '4px', padding: '4px', flexWrap: 'wrap', flexShrink: 0 }}>
        {(['wireframe', 'hiddenline', 'flat', 'gouraud', 'raytrace'] as const).map((q) => (
          <button key={q} type="button" style={btn} onClick={() => setQuality(q)}>
            {q}
          </button>
        ))}
        <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
          {RESOLUTIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id}
            </option>
          ))}
        </select>
        <button
          type="button"
          style={btn}
          onClick={() => {
            const size = RESOLUTIONS.find((r) => r.id === resolution) ?? RESOLUTIONS[1];
            const canvas = document.createElement('canvas');
            canvas.width = size.w;
            canvas.height = size.h;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            drawScene(ctx, size.w, size.h, objects, camRef.current, {
              quality,
              showGrid: true,
              floor: true,
              lightAngle: frame / 30,
              frame,
              smoothAngle: 45,
            });
            const url = canvas.toDataURL('image/png');
            const path = `/usr/people/guest/renders/preview.${String(frame).padStart(4, '0')}.rgb`;
            onSaveRender?.(path, url, `# Preview ${size.w}x${size.h} ${quality} frame ${frame}\n`);
            setAwRender({ url, path });
            setStatus(`Wrote ${path}`);
          }}
        >
          Render
        </button>
        <button type="button" style={btn} onClick={() => onLaunchApp('fcheck')}>
          fcheck
        </button>
      </div>
      <canvas ref={canvasRef} width={640} height={360} style={{ flex: 1, width: '100%', minHeight: 0, background: '#000' }} />
      <div style={{ padding: '3px 8px', flexShrink: 0 }}>{status}</div>
    </div>
  );
};

const Composer: React.FC<AwModuleAppProps> = ({ onSaveRender }) => {
  const render = useAwRender();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bg, setBg] = useState('#10243a');
  const [opacity, setOpacity] = useState(100);
  const [status, setStatus] = useState(render ? render.path : 'Render a frame in Preview or Paint, then grade it here.');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!render?.url) return;
    const img = new Image();
    img.onload = () => {
      ctx.globalAlpha = opacity / 100;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    };
    img.src = render.url;
  }, [render, bg, opacity]);

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '8px', padding: '4px', alignItems: 'center', flexShrink: 0 }}>
        <label>
          Background <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
        </label>
        <label>
          Plate{' '}
          <input type="range" min={0} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} /> {opacity}%
        </label>
        <button
          type="button"
          style={btn}
          onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const url = canvas.toDataURL('image/png');
            const path = '/usr/people/guest/renders/composer.0001.rgb';
            onSaveRender?.(path, url, `# Composer bg ${bg} opacity ${opacity}\n`);
            setAwRender({ url, path });
            setStatus(`Wrote ${path}`);
          }}
        >
          Save composite
        </button>
      </div>
      <canvas ref={canvasRef} width={640} height={360} style={{ flex: 1, width: '100%', minHeight: 0 }} />
      <div style={{ padding: '3px 8px', flexShrink: 0 }}>{status}</div>
    </div>
  );
};
