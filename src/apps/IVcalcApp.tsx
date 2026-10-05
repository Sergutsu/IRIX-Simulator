/**
 * IVcalc — the Inventor 3D calculator demo.
 * Left-drag tumbles the keypad. Middle-drag and the wheel dolly it.
 * A click on a key (pick mode) runs the calculator.
 */
import React, { useEffect, useRef, useState } from 'react';
import { calcPress, INITIAL_CALC, inputForLabel, type CalcState } from './ivcalc/engine';
import { drawCalculator, HOME_POSE, pickCalcKey, type CalcPose } from './ivcalc/scene';

const toolBtn: React.CSSProperties = {
  width: '28px',
  height: '28px',
  padding: 0,
  background: '#c5c8ce',
  borderTop: '1px solid #fff',
  borderLeft: '1px solid #fff',
  borderRight: '1px solid #555',
  borderBottom: '1px solid #555',
  cursor: 'pointer',
  fontSize: '14px',
  lineHeight: '26px',
};

export const IVcalcApp: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<CalcPose>({ ...HOME_POSE });
  const homeRef = useRef<CalcPose>({ ...HOME_POSE });
  const calcRef = useRef<CalcState>(INITIAL_CALC);
  const pressedRef = useRef<string | null>(null);
  const dragRef = useRef<{ button: number; x: number; y: number; sx: number; sy: number; moved: boolean } | null>(
    null
  );
  const [pose, setPose] = useState<CalcPose>({ ...HOME_POSE });
  const [calc, setCalc] = useState<CalcState>(INITIAL_CALC);
  const [pressed, setPressed] = useState<string | null>(null);
  const [pickMode, setPickMode] = useState(true);
  const [help, setHelp] = useState('Left drag rotates. Middle drag zooms. Click a key to calculate.');
  const [seek, setSeek] = useState(false);

  useEffect(() => {
    poseRef.current = pose;
  }, [pose]);
  useEffect(() => {
    calcRef.current = calc;
  }, [calc]);
  useEffect(() => {
    pressedRef.current = pressed;
  }, [pressed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawCalculator(ctx, canvas.width, canvas.height, pose, pressed, calc.display);
  }, [pose, pressed, calc.display]);

  const commitPose = (next: CalcPose) => {
    const clamped: CalcPose = {
      ...next,
      dist: Math.max(2.4, Math.min(16, next.dist)),
      fov: Math.max(8, Math.min(120, next.fov)),
    };
    poseRef.current = clamped;
    setPose(clamped);
  };

  const pressLabel = (label: string) => {
    setPressed(label);
    setCalc((prev) => calcPress(prev, inputForLabel(label)));
    window.setTimeout(() => setPressed((cur) => (cur === label ? null : cur)), 120);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const map: Record<string, string> = {
      Enter: '=',
      '=': '=',
      Escape: 'AC',
      Backspace: 'CE',
      '%': '%',
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '.': '.',
      n: '+/-',
      N: '+/-',
    };
    const label = map[e.key] ?? (/^[0-9]$/.test(e.key) ? e.key : '');
    if (!label) return;
    e.preventDefault();
    pressLabel(label);
  };

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onMouseDown={() => rootRef.current?.focus()}
      onKeyDown={onKeyDown}
      style={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#9aa0a8',
        color: '#111',
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: '12px',
        outline: 'none',
      }}
    >
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <canvas
          ref={canvasRef}
          width={640}
          height={420}
          style={{ flex: 1, width: '100%', height: '100%', display: 'block', cursor: seek ? 'crosshair' : 'default', background: '#000' }}
          onContextMenu={(e) => e.preventDefault()}
          onMouseDown={(e) => {
            if (e.button !== 0 && e.button !== 1) return;
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            const sx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * e.currentTarget.width;
            const sy = ((e.clientY - rect.top) / Math.max(1, rect.height)) * e.currentTarget.height;
            dragRef.current = { button: e.button, x: e.clientX, y: e.clientY, sx, sy, moved: false };
          }}
          onMouseMove={(e) => {
            const drag = dragRef.current;
            if (!drag) return;
            const dx = e.clientX - drag.x;
            const dy = e.clientY - drag.y;
            if (!drag.moved && Math.hypot(dx, dy) < 4) return;
            drag.moved = true;
            drag.x = e.clientX;
            drag.y = e.clientY;
            const cur = poseRef.current;
            if (drag.button === 1) {
              commitPose({ ...cur, dist: cur.dist + dy * 0.03 });
              return;
            }
            commitPose({ ...cur, rx: cur.rx + dy * 0.01, ry: cur.ry + dx * 0.01 });
          }}
          onMouseUp={(e) => {
            const drag = dragRef.current;
            dragRef.current = null;
            if (!drag || drag.button !== 0 || drag.moved) return;
            if (seek) {
              commitPose({ ...poseRef.current, dist: 3.3 });
              setSeek(false);
              setHelp('Seeked in. Home restores the saved view.');
              return;
            }
            if (!pickMode) return;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const hit = pickCalcKey(poseRef.current, drag.sx, drag.sy, canvas.width, canvas.height, pressedRef.current);
            if (hit) pressLabel(hit);
          }}
          onMouseLeave={() => {
            dragRef.current = null;
          }}
          onWheel={(e) => {
            e.preventDefault();
            commitPose({ ...poseRef.current, dist: poseRef.current.dist + e.deltaY * 0.004 });
          }}
        />
        <div
          style={{
            width: '36px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            padding: '4px 4px',
            background: '#b7bcc4',
            borderLeft: '1px solid #6e747c',
          }}
        >
          <button type="button" title="Pick keys" style={{ ...toolBtn, outline: pickMode ? '2px solid #222' : undefined }} onClick={() => setPickMode(true)}>
            ↖
          </button>
          <button type="button" title="View only" style={{ ...toolBtn, outline: !pickMode ? '2px solid #222' : undefined }} onClick={() => setPickMode(false)}>
            ✋
          </button>
          <button type="button" title="Help" style={toolBtn} onClick={() => setHelp('Left drag rotates. Middle drag zooms. Keys: AC CE % / 7-9 * 4-6 - 3-1 + 0 +/- . =')}>
            ?
          </button>
          <button
            type="button"
            title="Home view"
            style={toolBtn}
            onClick={() => commitPose({ ...homeRef.current })}
          >
            ⌂
          </button>
          <button
            type="button"
            title="Set home"
            style={toolBtn}
            onClick={() => {
              homeRef.current = { ...poseRef.current };
              setHelp('Home view saved.');
            }}
          >
            ✎
          </button>
          <button
            type="button"
            title="View all"
            style={toolBtn}
            onClick={() => commitPose({ ...poseRef.current, dist: HOME_POSE.dist, fov: 45 })}
          >
            ▣
          </button>
          <button type="button" title="Seek" style={{ ...toolBtn, outline: seek ? '2px solid #222' : undefined }} onClick={() => setSeek((v) => !v)}>
            ⊕
          </button>
          <button
            type="button"
            title="Perspective / orthographic"
            style={toolBtn}
            onClick={() => commitPose({ ...poseRef.current, ortho: !poseRef.current.ortho })}
          >
            {pose.ortho ? '▭' : '◇'}
          </button>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '3px 8px',
          background: '#b7bcc4',
          borderTop: '1px solid #6e747c',
          flexShrink: 0,
        }}
      >
        <span>Rotx</span>
        <input
          aria-label="Rotx"
          type="range"
          min={-180}
          max={180}
          value={Math.round((pose.rx * 180) / Math.PI)}
          onChange={(e) => commitPose({ ...poseRef.current, rx: (Number(e.target.value) * Math.PI) / 180 })}
        />
        <span>Roty</span>
        <input
          aria-label="Roty"
          type="range"
          min={-180}
          max={180}
          value={Math.round((pose.ry * 180) / Math.PI)}
          onChange={(e) => commitPose({ ...poseRef.current, ry: (Number(e.target.value) * Math.PI) / 180 })}
        />
        <span style={{ marginLeft: 'auto' }}>Zoom</span>
        <input
          aria-label="Zoom"
          type="range"
          min={8}
          max={120}
          value={Math.round(pose.fov)}
          onChange={(e) => commitPose({ ...poseRef.current, fov: Number(e.target.value) })}
        />
        <span style={{ width: '36px', textAlign: 'right', fontFamily: 'monospace' }}>{pose.fov.toFixed(1)}</span>
        <span>Dolly</span>
        <input
          aria-label="Dolly"
          type="range"
          min={24}
          max={160}
          value={Math.round(pose.dist * 10)}
          onChange={(e) => commitPose({ ...poseRef.current, dist: Number(e.target.value) / 10 })}
        />
      </div>
      <div style={{ padding: '1px 8px 2px', background: '#aeb4bc', fontSize: '11px', flexShrink: 0 }}>{help}</div>
    </div>
  );
};
