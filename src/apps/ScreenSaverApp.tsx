import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppId, SgiColorScheme, WorkstationProfile } from '../state/osStore';
import { IrixVectorIcon } from '../icons/irixIconSet';
import { SCREEN_SAVER_MODULES, SaverInstance, findSaverModule } from '../screensaver/saverModules';
import { EP_DEFAULT_SCRIPT } from '../screensaver/electropaint';
import { irixAudio } from '../sound/irixAudio';

export interface ScreenSaverConfig {
  enabled: boolean;
  moduleId: string;
  idleSeconds: number;
  lockScreen: boolean;
  cycleModules: boolean;
}

interface ScreenSaverAppProps {
  colorScheme: SgiColorScheme;
  workstation: WorkstationProfile;
  config: ScreenSaverConfig;
  onChangeConfig: (patch: Partial<ScreenSaverConfig>) => void;
  onBlankNow: (moduleId?: string) => void;
  onSaveFile?: (path: string, content: string) => void;
  onLaunchApp: (appId: AppId, payload?: Record<string, unknown>) => void;
}

const IDLE_STEPS = [15, 30, 60, 120, 300, 600, 900, 1800];

function formatIdle(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds === 60) return '1 minute';
  if (seconds % 60 === 0) return `${seconds / 60} minutes`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

/**
 * Screen Saver control panel — `Toolchest -> Desktop -> Customize -> Screen Saver`
 *
 * Installed modules are listed by display name (that is how third party savers
 * such as the famous HayeSavers package appeared on a real IRIX box), the idle
 * time is set with a Motif scale, and the selected saver runs in the preview
 * pane exactly as it will when the display blanks.
 */
export const ScreenSaverApp: React.FC<ScreenSaverAppProps> = ({
  colorScheme,
  workstation,
  config,
  onChangeConfig,
  onBlankNow,
  onSaveFile,
  onLaunchApp,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState(config.moduleId);
  const [previewRunning, setPreviewRunning] = useState(true);
  const [dumped, setDumped] = useState(false);

  const previewRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<SaverInstance | null>(null);
  const rafRef = useRef(0);

  const module = useMemo(() => findSaverModule(selectedModuleId), [selectedModuleId]);

  useEffect(() => setSelectedModuleId(config.moduleId), [config.moduleId]);

  // live preview of the selected module
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    instanceRef.current = module.create(canvas.width, canvas.height);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    let last = performance.now();
    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const inst = instanceRef.current;
      const c = previewRef.current;
      if (!inst || !c) return;
      const cctx = c.getContext('2d');
      if (!cctx) return;
      if (previewRunning) {
        inst.step(dt, c.width, c.height);
        inst.draw(cctx, c.width, c.height);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [module, previewRunning]);

  const idleIndex = Math.max(
    0,
    IDLE_STEPS.findIndex((s) => s >= config.idleSeconds) === -1
      ? IDLE_STEPS.length - 1
      : IDLE_STEPS.findIndex((s) => s >= config.idleSeconds)
  );

  const checkbox = (label: string, checked: boolean, onToggle: () => void, hint?: string) => (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
      title={hint}
    >
      <span style={{ fontWeight: 700, fontStyle: 'italic', fontSize: '12px' }}>{label}</span>
      <button
        type="button"
        aria-label={label}
        onClick={() => {
          irixAudio.playMenuClick();
          onToggle();
        }}
        style={{
          width: '17px',
          height: '17px',
          background: '#b9b9b9',
          border: '1px solid #111',
          boxShadow: 'inset 1px 1px 0 #666, inset -1px -1px 0 #f2f2f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        {checked && (
          <span
            style={{
              width: '10px',
              height: '10px',
              background: '#1d1d1d',
              boxShadow: 'inset 1px 1px 0 #000',
            }}
          />
        )}
      </button>
    </div>
  );

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: colorScheme.windowSurface,
        padding: '10px 12px',
        gap: '9px',
        overflow: 'auto',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      {/* Panel heading, exactly like the IRIX Desktop Settings control panel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <IrixVectorIcon iconId="screensaver" size={40} useMagicCarpet={false} />
        <div>
          <div style={{ fontWeight: 700, fontStyle: 'italic', fontSize: '14px' }}>Screen Saver</div>
          <div style={{ fontSize: '10.5px' }}>
            {workstation.osRelease} · {workstation.name}
          </div>
        </div>
      </div>

      <div style={{ height: '1px', background: '#8a8a8a', boxShadow: '0 1px 0 #f0f0f0' }} />

      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Installed modules list box */}
        <div style={{ width: '252px' }}>
          <div style={{ fontWeight: 700, fontStyle: 'italic', fontSize: '12px', marginBottom: '4px' }}>
            Screen Saver Modules:
          </div>
          <div
            style={{
              background: '#a8a8a8',
              border: '1px solid #111',
              boxShadow: 'inset 1px 1px 0 #555, inset -1px -1px 0 #efefef',
              padding: '2px',
              height: '132px',
              overflow: 'auto',
            }}
          >
            {SCREEN_SAVER_MODULES.map((mod) => {
              const selected = mod.id === selectedModuleId;
              return (
                <div
                  key={mod.id}
                  onClick={() => {
                    irixAudio.playIconSelect();
                    setSelectedModuleId(mod.id);
                    onChangeConfig({ moduleId: mod.id });
                  }}
                  style={{
                    padding: '3px 6px',
                    cursor: 'pointer',
                    background: selected ? '#b8a87e' : 'transparent',
                    boxShadow: selected ? 'inset 1px 1px 0 #fff, inset -1px -1px 0 rgba(0,0,0,0.4)' : undefined,
                  }}
                >
                  <div style={{ fontWeight: 700, fontStyle: 'italic', fontSize: '12px' }}>{mod.name}</div>
                  <div style={{ fontSize: '10px', fontFamily: 'monospace' }}>{mod.binary}</div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: '6px',
              fontSize: '10.5px',
              lineHeight: 1.35,
              color: '#1a1a1a',
              minHeight: '48px',
            }}
          >
            {module.description}
          </div>
        </div>

        {/* Preview + settings */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '270px' }}>
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: '12px',
              }}
            >
              <span>Preview:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '10.5px' }}>{module.binary}</span>
            </div>
            <canvas
              ref={previewRef}
              width={286}
              height={168}
              style={{
                width: '100%',
                maxWidth: '286px',
                height: '168px',
                imageRendering: 'auto',
                background: '#000',
                border: '1px solid #111',
                boxShadow: 'inset -1px -1px 0 #efefef, 2px 2px 4px rgba(0,0,0,0.25)',
              }}
            />
          </div>

          {/* Idle time — Motif scale with tick marks */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: '12px',
              }}
            >
              <span>Blank After:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{formatIdle(config.idleSeconds)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="range"
                min={0}
                max={IDLE_STEPS.length - 1}
                step={1}
                value={idleIndex}
                onChange={(e) => {
                  const secs = IDLE_STEPS[parseInt(e.target.value, 10)];
                  onChangeConfig({ idleSeconds: secs });
                }}
                style={{ flex: 1, accentColor: '#4a4a4a' }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '9px',
                fontFamily: 'monospace',
                color: '#2a2a2a',
              }}
            >
              {IDLE_STEPS.map((s) => (
                <span key={s}>{s < 60 ? s : `${s / 60}m`}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px' }}>
            {checkbox('Screen Saver', config.enabled, () => onChangeConfig({ enabled: !config.enabled }), 'Blank the screen after the idle timeout')}
            {checkbox('Lock Screen', config.lockScreen, () => onChangeConfig({ lockScreen: !config.lockScreen }), 'Require the console password to return')}
            {checkbox('Cycle Modules', config.cycleModules, () => onChangeConfig({ cycleModules: !config.cycleModules }), 'Rotate through every installed saver')}
            {checkbox('Preview Running', previewRunning, () => setPreviewRunning((v) => !v))}
          </div>
        </div>
      </div>

      {/* ElectroPaint script strip — the heart of the famous saver */}
      <div
        style={{
          background: '#b7b7b7',
          border: '1px solid #111',
          boxShadow: 'inset 1px 1px 0 #555, inset -1px -1px 0 #ededed',
          padding: '6px 8px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
        }}
      >
        <IrixVectorIcon iconId="electropaint" size={34} useMagicCarpet={false} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontStyle: 'italic', fontSize: '12px' }}>
            ElectroPaint animation script (default)
          </div>
          <div style={{ fontSize: '10.5px', lineHeight: 1.35 }}>
            The saver would sit still without its ASCII choreography script. IRIX 6.5 shipped a
            default script that could be dumped and read back — dump this one to{' '}
            <span style={{ fontFamily: 'monospace' }}>/usr/people/guest/.ep_script</span> and open it
            in <span style={{ fontStyle: 'italic' }}>jot</span>.
          </div>
          {dumped && (
            <div style={{ marginTop: '3px', fontSize: '10.5px', color: '#0a4a0a', fontWeight: 700 }}>
              Dumped {EP_DEFAULT_SCRIPT.split('\n').length} lines to /usr/people/guest/.ep_script
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            type="button"
            className="sgi-btn"
            style={{ padding: '2px 8px', fontWeight: 700, fontSize: '11px' }}
            onClick={() => {
              onSaveFile?.('/usr/people/guest/.ep_script', EP_DEFAULT_SCRIPT);
              setDumped(true);
              setTimeout(() => setDumped(false), 2600);
            }}
          >
            Dump Script...
          </button>
          <button
            type="button"
            className="sgi-btn"
            style={{ padding: '2px 8px', fontWeight: 700, fontSize: '11px' }}
            onClick={() => onLaunchApp('electropaint')}
          >
            Open ep -c (Interactive)
          </button>
          <button
            type="button"
            className="sgi-btn"
            style={{ padding: '2px 8px', fontWeight: 700, fontSize: '11px' }}
            onClick={() =>
              onLaunchApp('jot', { path: '/usr/people/guest/.ep_script' })
            }
          >
            Read Script in jot
          </button>
        </div>
      </div>

      {/* Action buttons, bottom right, as on every SGI control panel */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: 'auto' }}>
        <button
          type="button"
          className="sgi-btn"
          style={{ padding: '3px 12px', fontWeight: 700 }}
          onClick={() => {
            irixAudio.playMenuClick();
            onBlankNow(selectedModuleId);
          }}
        >
          Blank Now
        </button>
        <button
          type="button"
          className="sgi-btn"
          style={{ padding: '3px 12px', fontWeight: 700 }}
          onClick={() =>
            onChangeConfig({
              moduleId: 'electropaint',
              idleSeconds: 300,
              lockScreen: false,
              cycleModules: false,
              enabled: true,
            })
          }
        >
          Reset
        </button>
        <button
          type="button"
          className="sgi-btn"
          style={{ padding: '3px 12px', fontWeight: 700 }}
          onClick={() => onLaunchApp('insight', { chapter: 'help' })}
        >
          Help
        </button>
      </div>
    </div>
  );
};
