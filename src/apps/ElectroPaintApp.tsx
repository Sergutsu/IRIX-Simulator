import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SgiColorScheme, VfsNode, WorkstationProfile } from '../state/osStore';
import { IrixVectorIcon } from '../icons/irixIconSet';
import {
  EP_DEFAULT_SCRIPT,
  EP_SLIDERS,
  EpSlider,
  EpSliderId,
  EpState,
  createEpState,
  drawEpFrame,
  parseEpScript,
  resetEpSlider,
  setEpSlider,
  stepEp,
  toggleEpSliderMode,
} from '../screensaver/electropaint';
import { irixAudio } from '../sound/irixAudio';

interface ElectroPaintAppProps {
  colorScheme: SgiColorScheme;
  workstation: WorkstationProfile;
  vfs: VfsNode[];
  onBlankNow: (moduleId?: string) => void;
  onSaveFile?: (path: string, content: string) => void;
}

const SCRIPT_PATH = '/usr/people/guest/.ep_script';

/**
 * `ep -c` — ElectroPaint, interactive flavour.
 *
 * The screen saver shipped as a plain IRIS GL program and could be run by hand
 * (`ep -c`), which gave you the same flock of dancing polygons inside a window
 * next to the Panel Library control panel.  Every multi-slider below is drawn
 * exactly the way Panel Library drew them:
 *
 *     ___
 *    | R |   reset            | X |  wrap <-> bounce
 *    |---|
 *    |   |   main value (drag me)
 *    |---|
 *    |sld|   little "sld" sub-slider, animates the main slider
 *    |___|
 *    |whl|   the authentic acronym
 *    '---'
 */
export const ElectroPaintApp: React.FC<ElectroPaintAppProps> = ({
  colorScheme,
  workstation,
  vfs,
  onBlankNow,
  onSaveFile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<EpState>(createEpState({ blend: true }));
  const [, forceUpdate] = useState(0);
  const [frozen, setFrozen] = useState(false);
  const [showSliders, setShowSliders] = useState(true);
  const [scriptName, setScriptName] = useState('default (built-in)');
  const [dumpedPath, setDumpedPath] = useState<string | null>(null);
  const [actInfo, setActInfo] = useState({ act: 'shell', polys: 0 });
  const [fps, setFps] = useState(60);

  const scriptFromDisk = useMemo(() => {
    const node = vfs.find((n) => n.path === SCRIPT_PATH);
    return node?.content ?? null;
  }, [vfs]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let frames = 0;
    let acc = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (!frozen) {
        stepEp(state, dt * 1.6);
        drawEpFrame(ctx, state, canvas.width, canvas.height, { clear: true });
      }
      frames++;
      acc += dt;
      if (acc >= 0.5) {
        setFps(Math.round(frames / acc));
        frames = 0;
        acc = 0;
        setActInfo({ act: state.actName, polys: state.triCount });
        forceUpdate((v) => v + 1);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [frozen]);

  const loadScript = (text: string, source: string) => {
    const state = stateRef.current;
    const acts = parseEpScript(text);
    state.acts = acts;
    state.actIndex = 0;
    state.actElapsed = 0;
    state.actDuration = acts[0].duration;
    state.actName = acts[0].name;
    for (const [id, v] of Object.entries(acts[0].set) as [EpSliderId, number][]) {
      setEpSlider(state, id, v);
    }
    setScriptName(source);
    irixAudio.playMenuClick();
  };

  const dumpScript = () => {
    onSaveFile?.(SCRIPT_PATH, EP_DEFAULT_SCRIPT);
    setDumpedPath(SCRIPT_PATH);
    setTimeout(() => setDumpedPath(null), 3000);
  };

  const randomize = () => {
    const state = stateRef.current;
    for (const spec of EP_SLIDERS) {
      setEpSlider(state, spec.id, state.rand.range(spec.min, spec.max));
    }
  };

  const sliderWidget = (spec: (typeof EP_SLIDERS)[number]) => {
    const state = stateRef.current;
    const slider: EpSlider = state.sliders[spec.id];
    const pct = (slider.value - spec.min) / (spec.max - spec.min);
    const subPct = (slider.sub + 1) / 2;
    const display = spec.int ? Math.round(slider.value).toString() : slider.value.toFixed(2);
    return (
      <div
        key={spec.id}
        style={{
          width: '52px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          userSelect: 'none',
        }}
      >
        {/* R (reset) + X (slider type) */}
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            type="button"
            title={`Reset ${spec.label}`}
            onClick={() => resetEpSlider(stateRef.current, spec.id)}
            style={{
              width: '17px',
              height: '15px',
              fontSize: '9px',
              fontWeight: 700,
              background: '#c4c4c4',
              border: '1px solid #111',
              boxShadow: 'inset 1px 1px 0 #f5f5f5, inset -1px -1px 0 #666',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            R
          </button>
          <button
            type="button"
            title={`Wrap / Bounce (${slider.mode})`}
            onClick={() => {
              toggleEpSliderMode(stateRef.current, spec.id);
              forceUpdate((v) => v + 1);
            }}
            style={{
              width: '17px',
              height: '15px',
              fontSize: '9px',
              fontWeight: 700,
              background: slider.mode === 'bounce' ? '#c4c4c4' : '#b8b8b8',
              border: '1px solid #111',
              boxShadow:
                slider.mode === 'bounce'
                  ? 'inset 1px 1px 0 #f5f5f5, inset -1px -1px 0 #666'
                  : 'inset 1px 1px 0 #666, inset -1px -1px 0 #f5f5f5',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            X
          </button>
        </div>

        {/* main slider trough */}
        <div
          title={`${spec.label} = ${display}`}
          onMouseDown={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const setFromEvent = (clientY: number) => {
              const frac = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
              setEpSlider(stateRef.current, spec.id, spec.min + frac * (spec.max - spec.min));
            };
            setFromEvent(e.clientY);
            const move = (ev: MouseEvent) => setFromEvent(ev.clientY);
            const up = () => {
              window.removeEventListener('mousemove', move);
              window.removeEventListener('mouseup', up);
            };
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
          }}
          style={{
            position: 'relative',
            width: '22px',
            height: '86px',
            background: '#a8a8a8',
            border: '1px solid #111',
            boxShadow: 'inset 1px 1px 0 #555, inset -1px -1px 0 #efefef',
            cursor: 'ns-resize',
            overflow: 'hidden',
          }}
        >
          {/* value bar, drawn from the bottom like Panel Library */}
          <div
            style={{
              position: 'absolute',
              left: '2px',
              right: '2px',
              bottom: '2px',
              height: `${Math.max(0, Math.min(1, pct)) * 90}%`,
              background:
                slider.highlight > 0.02
                  ? `rgba(184,168,126,${0.55 + 0.45 * slider.highlight})`
                  : '#6f8fb5',
              border: '1px solid #333',
            }}
          />
          {/* tick marks */}
          {[0.25, 0.5, 0.75].map((t) => (
            <div
              key={t}
              style={{
                position: 'absolute',
                left: 0,
                right: '60%',
                bottom: `${t * 100}%`,
                height: '1px',
                background: '#7a7a7a',
              }}
            />
          ))}
        </div>

        {/* sub-slider (sld) */}
        <div
          onMouseDown={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const setFromEvent = (clientX: number) => {
              const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
              stateRef.current.sliders[spec.id].sub = frac * 2 - 1;
            };
            setFromEvent(e.clientX);
            const move = (ev: MouseEvent) => setFromEvent(ev.clientX);
            const up = () => {
              window.removeEventListener('mousemove', move);
              window.removeEventListener('mouseup', up);
            };
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
          }}
          style={{
            position: 'relative',
            width: '42px',
            height: '9px',
            background: '#9d9d9d',
            border: '1px solid #111',
            boxShadow: 'inset 1px 1px 0 #555, inset -1px -1px 0 #efefef',
            cursor: 'ew-resize',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '1px',
              width: '3px',
              height: '5px',
              left: `calc(${subPct * 100}% - 2px)`,
              background: '#222',
            }}
          />
        </div>

        <div
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontStyle: 'italic',
            fontSize: '10.5px',
          }}
        >
          {slider.acronym}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '9px' }}>{display}</div>
      </div>
    );
  };

  const state = stateRef.current;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: colorScheme.windowSurface,
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <div className="sgi-menubar">
        <span
          className="sgi-menubar-item"
          onClick={() => onBlankNow('electropaint')}
          title="Run ElectroPaint full screen, exactly as the screen saver does"
        >
          Screen Saver
        </span>
        <span className="sgi-menubar-item" onClick={randomize}>
          Randomize
        </span>
        <span className="sgi-menubar-item" onClick={() => setFrozen((f) => !f)}>
          {frozen ? 'Resume' : 'Freeze'}
        </span>
        <span
          className="sgi-menubar-item"
          onClick={() => loadScript(EP_DEFAULT_SCRIPT, 'default (built-in)')}
        >
          Default Script
        </span>
        <span
          className="sgi-menubar-item"
          onClick={() => {
            if (scriptFromDisk) loadScript(scriptFromDisk, SCRIPT_PATH);
          }}
          title={scriptFromDisk ? `Load ${SCRIPT_PATH}` : 'Dump the script first'}
        >
          Read .ep_script
        </span>
        <span className="sgi-menubar-item" onClick={dumpScript}>
          Dump Script
        </span>
        <span className="sgi-menubar-item" onClick={() => setShowSliders((s) => !s)}>
          {showSliders ? 'Hide Panel' : 'Show Panel'}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 400, fontStyle: 'normal' }}>
          ep -c · {workstation.name.split(' ').slice(-1)[0]} · {fps} fps
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* IRIS GL window */}
        <div style={{ flex: 1, minWidth: '220px', background: '#000', position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={520}
            height={430}
            style={{ width: '100%', height: '100%', display: 'block', background: '#000' }}
          />
          <div
            style={{
              position: 'absolute',
              left: '6px',
              bottom: '5px',
              fontSize: '10px',
              fontFamily: 'monospace',
              color: 'rgba(255,255,255,0.62)',
              textShadow: '0 0 3px #000',
            }}
          >
            act:{actInfo.act} · n={Math.round(state.sliders.n.value)} · {actInfo.polys} polys ·{' '}
            {state.lighting ? 'IRIS GT lighting + blend' : 'flat'}
          </div>
        </div>

        {/* Panel Library control panel */}
        {showSliders && (
          <div
            style={{
              width: '266px',
              padding: '6px 8px',
              borderLeft: '1px solid #6d6d6d',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IrixVectorIcon iconId="electropaint" size={30} useMagicCarpet={false} />
              <div>
                <div style={{ fontWeight: 700, fontStyle: 'italic', fontSize: '12.5px' }}>
                  ElectroPaint
                </div>
                <div style={{ fontSize: '10px' }}>
                  (c) 1986 David A. Tristram — script: {scriptName}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 6px' }}>
              {EP_SLIDERS.slice(0, 6).map((spec) => sliderWidget(spec))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 6px' }}>
              {EP_SLIDERS.slice(6).map((spec) => sliderWidget(spec))}
            </div>

            <div
              style={{
                borderTop: '1px solid #8a8a8a',
                paddingTop: '5px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
              }}
            >
              <button
                type="button"
                className="sgi-btn"
                style={{ padding: '2px 7px', fontWeight: 700, fontSize: '10.5px' }}
                onClick={() => {
                  stateRef.current.squares = !stateRef.current.squares;
                  forceUpdate((v) => v + 1);
                }}
              >
                {state.squares ? 'Squares' : 'Triangles'}
              </button>
              <button
                type="button"
                className="sgi-btn"
                style={{ padding: '2px 7px', fontWeight: 700, fontSize: '10.5px' }}
                onClick={() => {
                  stateRef.current.blend = !stateRef.current.blend;
                  forceUpdate((v) => v + 1);
                }}
              >
                {state.blend ? 'Blend On' : 'Blend Off'}
              </button>
              <button
                type="button"
                className="sgi-btn"
                style={{ padding: '2px 7px', fontWeight: 700, fontSize: '10.5px' }}
                onClick={() => {
                  stateRef.current.lighting = !stateRef.current.lighting;
                  forceUpdate((v) => v + 1);
                }}
              >
                {state.lighting ? 'Lighting On' : 'Lighting Off'}
              </button>
              <button
                type="button"
                className="sgi-btn"
                style={{ padding: '2px 7px', fontWeight: 700, fontSize: '10.5px' }}
                onClick={() => onBlankNow('electropaint')}
              >
                Full Screen
              </button>
            </div>

            {dumpedPath && (
              <div style={{ fontSize: '10.5px', color: '#0a4a0a', fontWeight: 700 }}>
                Wrote {dumpedPath} (read it with jot, or 'Read .ep_script')
              </div>
            )}
            <div style={{ fontSize: '10px', color: '#2a2a2a', lineHeight: 1.3 }}>
              Panel Library notes: each column is a multi-slider — <b>R</b> resets it, <b>X</b>{' '}
              switches it between <i>wrap</i> and <i>bounce</i>, and the thin <i>sld</i> below each
              trough is the little slider that animates the main value.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
