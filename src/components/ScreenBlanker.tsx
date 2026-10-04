import React, { useEffect, useRef, useState } from 'react';
import { SaverInstance, findSaverModule } from '../screensaver/saverModules';

interface ScreenBlankerProps {
  /** module id from the Screen Saver control panel */
  moduleId: string;
  /** cycle through every installed module instead of only one */
  cycleModules: boolean;
  /** keep the console locked: a password is required to return to the desktop */
  locked: boolean;
  workstationName: string;
  osRelease: string;
  currentUser: string;
  onExit: () => void;
}

const CYCLE_SECONDS = 34;
const HINT_SECONDS = 6;

/**
 * `screen_blanker` — the IRIX display blanker.
 *
 * After the configured idle time the IRIX desktop blanked the screen and ran
 * the selected screen saver module full screen.  Any key press or mouse
 * movement returned to the desktop, unless the screen was locked, in which
 * case the console lock prompt appeared first.
 */
export const ScreenBlanker: React.FC<ScreenBlankerProps> = ({
  moduleId,
  cycleModules,
  locked,
  workstationName,
  osRelease,
  currentUser,
  onExit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hintVisible, setHintVisible] = useState(true);
  const [unlockValue, setUnlockValue] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState(moduleId);
  const startRef = useRef<number>(performance.now());
  const instanceRef = useRef<SaverInstance | null>(null);
  const moduleRef = useRef(findSaverModule(moduleId));
  const lockInputRef = useRef<HTMLInputElement>(null);

  // cycle modules like a demo reel, the way savers were shown off at trade shows
  useEffect(() => {
    if (!cycleModules) return;
    const timer = window.setInterval(() => {
      const mods = ['electropaint', 'hopalong', 'bounce'];
      const next = mods[(mods.indexOf(activeModuleId) + 1) % mods.length] ?? 'electropaint';
      setActiveModuleId(next);
    }, CYCLE_SECONDS * 1000);
    return () => window.clearInterval(timer);
  }, [cycleModules, activeModuleId]);

  useEffect(() => {
    if (locked) {
      const t = window.setTimeout(() => lockInputRef.current?.focus(), 120);
      return () => window.clearTimeout(t);
    }
  }, [locked]);

  useEffect(() => {
    const t = window.setTimeout(() => setHintVisible(false), HINT_SECONDS * 1000);
    return () => window.clearTimeout(t);
  }, []);

  // (re)create the saver instance whenever the module changes
  useEffect(() => {
    moduleRef.current = findSaverModule(activeModuleId);
    const canvas = canvasRef.current;
    if (!canvas) return;
    instanceRef.current = moduleRef.current.create(canvas.width, canvas.height);
    // a fresh saver wipes the screen, as the real blanker did
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    startRef.current = performance.now();
  }, [activeModuleId]);

  // animation loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const canvas = canvasRef.current;
      const instance = instanceRef.current;
      if (!canvas || !instance) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      instance.step(dt, canvas.width, canvas.height);
      instance.draw(ctx, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  // size the buffer to the display, at a modest 1x scale like an SGI frame buffer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      instanceRef.current = moduleRef.current.create(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // any input wakes the display (unless it is locked)
  useEffect(() => {
    const wake = () => {
      if (locked) return;
      onExit();
    };
    window.addEventListener('mousemove', wake);
    window.addEventListener('mousedown', wake);
    window.addEventListener('keydown', wake);
    window.addEventListener('wheel', wake);
    return () => {
      window.removeEventListener('mousemove', wake);
      window.removeEventListener('mousedown', wake);
      window.removeEventListener('keydown', wake);
      window.removeEventListener('wheel', wake);
    };
  }, [locked, onExit]);

  const tryUnlock = () => {
    // IRIX console lock: the demo machine has an empty guest password,
    // so pressing Return (or typing "guest") unlocks the console.
    const v = unlockValue.trim();
    if (v === '' || v === 'guest' || v === 'demo') {
      onExit();
      return;
    }
    setUnlockError('Permission denied.  (Try pressing Return.)');
    setUnlockValue('');
  };

  const module = findSaverModule(activeModuleId);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 90000,
        cursor: 'none',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        width={1280}
        height={1024}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: 'auto' }}
      />

      {/* Modules that paint incremental trails need a dark scrim reset */}
      {hintVisible && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '34px',
            transform: 'translateX(-50%)',
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontStyle: 'italic',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.72)',
            textShadow: '0 0 6px #000',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          IRIX 6.5 Screen Saver — {module.name} ({module.binary})
          <br />
          Move the mouse or press any key to return to the desktop
        </div>
      )}

      {locked && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.86)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'default',
          }}
        >
          <div
            style={{
              width: '420px',
              background: '#c4c4c4',
              border: '2px solid #0d0d0d',
              boxShadow: 'inset 1px 1px 0 #fff, inset -1px -1px 0 #666, 4px 6px 0 rgba(0,0,0,0.6)',
              padding: '14px 16px',
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: '1px solid #888',
                paddingBottom: '8px',
                marginBottom: '10px',
              }}
            >
              <svg width="34" height="34" viewBox="0 0 34 34">
                <rect x="6" y="14" width="22" height="16" fill="#ffd24a" stroke="#000" strokeWidth="1.5" />
                <path d="M11 14 v-4 a6 6 0 0 1 12 0 v4" fill="none" stroke="#000" strokeWidth="2" />
                <circle cx="17" cy="22" r="2.4" fill="#000" />
              </svg>
              <div>
                <div style={{ fontWeight: 700, fontStyle: 'italic', fontSize: '14px' }}>
                  Screen Locked — {currentUser}@{workstationName}
                </div>
                <div style={{ fontSize: '11px' }}>{osRelease} · console lock (clogin)</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontWeight: 700, fontStyle: 'italic', fontSize: '12px' }}>Password:</label>
              <input
                ref={lockInputRef}
                type="password"
                value={unlockValue}
                onChange={(e) => setUnlockValue(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') tryUnlock();
                  if (e.key === 'Escape') setUnlockError(null);
                }}
                className="sgi-field"
                style={{ flex: 1, fontFamily: 'monospace' }}
              />
              <button type="button" className="sgi-btn" onClick={tryUnlock} style={{ fontWeight: 700 }}>
                Unlock
              </button>
            </div>
            {unlockError && (
              <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#7a0000', fontWeight: 700 }}>
                {unlockError}
              </div>
            )}
            <div style={{ marginTop: '8px', fontSize: '10.5px', color: '#333' }}>
              The guest account on this demo workstation has an empty password: just press Return.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
