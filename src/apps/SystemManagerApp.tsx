import React, { useState, useEffect } from 'react';
import {
  ColorSchemeId,
  SGI_COLOR_SCHEMES,
  SgiColorScheme,
  WindowInstance,
  WORKSTATION_PROFILES,
  WorkstationProfile,
  WorkstationProfileId,
} from '../state/osStore';
import { IrixVectorIcon } from '../icons/irixIconSet';
import { irixAudio } from '../sound/irixAudio';

interface SystemManagerAppProps {
  workstation: WorkstationProfile;
  colorScheme: SgiColorScheme;
  focusMode: 'click' | 'followMouse';
  soundEnabled: boolean;
  windows: WindowInstance[];
  initialTab?: 'hardware' | 'customize' | 'processes' | 'audio';
  onSelectWorkstation: (id: WorkstationProfileId) => void;
  onSelectColorScheme: (id: ColorSchemeId) => void;
  onChangeFocusMode: (mode: 'click' | 'followMouse') => void;
  onToggleSound: () => void;
  onCloseWindow: (id: string) => void;
}

export const SystemManagerApp: React.FC<SystemManagerAppProps> = ({
  workstation,
  colorScheme,
  focusMode,
  soundEnabled,
  windows,
  initialTab = 'hardware',
  onSelectWorkstation,
  onSelectColorScheme,
  onChangeFocusMode,
  onToggleSound,
  onCloseWindow,
}) => {
  const [tab, setTab] = useState<'hardware' | 'customize' | 'processes' | 'audio'>(
    initialTab
  );
  const [procFilter, setProcFilter] = useState('');

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: colorScheme.windowSurface,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Top Tab Bar */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '5px 8px',
          background: colorScheme.windowWell,
          borderBottom: '1px solid #444',
        }}
      >
        {(
          [
            { id: 'hardware', label: 'Hardware & SGI System (hinv)' },
            { id: 'customize', label: '4Dwm Color Schemes & Windows' },
            { id: 'processes', label: 'Process Manager' },
            { id: 'audio', label: 'Iris Audio & SoundScheme' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            className="sgi-btn"
            onClick={() => {
              irixAudio.playMenuClick();
              setTab(t.id);
            }}
            style={{
              padding: '3px 9px',
              fontSize: '11px',
              background: tab === t.id ? '#b8a87e' : undefined,
              fontWeight: tab === t.id ? 700 : 500,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Body */}
      <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
        {tab === 'hardware' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#d8d8d8',
                border: '1px solid #333',
                padding: '8px 12px',
              }}
            >
              <IrixVectorIcon iconId="sysmgr" size={58} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, fontStyle: 'italic' }}>
                  {workstation.name} ({workstation.ipArch} — {workstation.codename})
                </div>
                <div style={{ fontSize: '11.5px', color: '#222', marginTop: '2px' }}>
                  <b>CPU:</b> {workstation.cpuCount}× {workstation.cpuMHz} MHz{' '}
                  {workstation.cpuModel}
                </div>
                <div style={{ fontSize: '11.5px', color: '#222' }}>
                  <b>Graphics:</b> {workstation.gfxSubsystem} | <b>Memory:</b>{' '}
                  {workstation.ramMB} MB
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', fontStyle: 'italic', fontWeight: 700 }}>
              Select SGI Workstation Hardware Profile (Live Kernel & gr_osview Reconfiguration):
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
              }}
            >
              {Object.values(WORKSTATION_PROFILES).map((prof) => {
                const active = prof.id === workstation.id;
                return (
                  <div
                    key={prof.id}
                    onClick={() => {
                      irixAudio.playAppLaunch();
                      onSelectWorkstation(prof.id);
                    }}
                    style={{
                      background: active ? '#b8a87e' : '#d2d2d2',
                      border: active ? '2px solid #111' : '1px solid #555',
                      boxShadow: 'inset 1px 1px 0 #fff, inset -1px -1px 0 #666',
                      padding: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 700,
                        fontSize: '12px',
                      }}
                    >
                      <span>{prof.name}</span>
                      <span>[{prof.ipArch}]</span>
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '3px' }}>
                      {prof.cpuCount}× {prof.cpuMHz}MHz • {prof.ramMB}MB RAM
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#222', marginTop: '2px' }}>
                      {prof.gfxSubsystem}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: '11.5px', fontStyle: 'italic', fontWeight: 700 }}>
              Live /sbin/hinv Hardware Inventory Output:
            </div>
            <pre
              style={{
                margin: 0,
                background: '#14202e',
                color: '#88f0b8',
                padding: '8px 10px',
                border: '1px solid #222',
                fontFamily: 'monospace',
                fontSize: '11px',
                lineHeight: 1.35,
              }}
            >
              {workstation.hinvLines.join('\n')}
            </pre>
          </div>
        )}

        {tab === 'customize' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12.5px', fontStyle: 'italic', fontWeight: 700 }}>
              SGI 4Dwm & Motif Color Schemes (*SG_useSchemes: all):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.values(SGI_COLOR_SCHEMES).map((sc) => {
                const active = sc.id === colorScheme.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => {
                      irixAudio.playMenuClick();
                      onSelectColorScheme(sc.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      background: active ? '#b8a87e' : '#d4d4d4',
                      border: active ? '2px solid #111' : '1px solid #555',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '12px' }}>{sc.name}</div>
                      <div style={{ fontSize: '11px', color: '#222' }}>{sc.description}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[sc.desktopBg, sc.activeTitleBg, sc.windowSurface, sc.mauveInput].map(
                        (hex, i) => (
                          <span
                            key={i}
                            style={{
                              width: '20px',
                              height: '20px',
                              background: hex,
                              border: '1px solid #111',
                            }}
                          />
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                background: '#d4d4d4',
                border: '1px solid #444',
                padding: '8px 10px',
              }}
            >
              <div style={{ fontWeight: 700, fontStyle: 'italic', fontSize: '12px' }}>
                4Dwm Window Input Focus Policy (*keyboardFocusPolicy):
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="sgi-btn"
                  onClick={() => onChangeFocusMode('click')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    background: focusMode === 'click' ? '#ffe84a' : undefined,
                    fontWeight: focusMode === 'click' ? 700 : 500,
                  }}
                >
                  Click to Focus (explicit)
                </button>
                <button
                  type="button"
                  className="sgi-btn"
                  onClick={() => onChangeFocusMode('followMouse')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    background: focusMode === 'followMouse' ? '#ffe84a' : undefined,
                    fontWeight: focusMode === 'followMouse' ? 700 : 500,
                  }}
                >
                  Point to Focus (Focus Follows Mouse / pointer)
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'processes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontStyle: 'italic', fontWeight: 700 }}>
              Process Manager on silicon.sgi.com:
            </div>
            <div
              style={{
                background: '#bdbda8',
                border: '2px inset #666',
                height: '185px',
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '11.5px',
                padding: '4px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 70px 95px 1fr 75px',
                  fontWeight: 700,
                  borderBottom: '1px solid #444',
                  paddingBottom: '3px',
                  marginBottom: '3px',
                }}
              >
                <span>Process</span>
                <span>User</span>
                <span>Physical Mem</span>
                <span>Start Date</span>
                <span>Action</span>
              </div>
              {[
                { name: '4Dwm', user: 'root', mem: '1,824 K', date: 'Oct 02 09:00 PST' },
                { name: 'Xsgi', user: 'root', mem: '6,536 K', date: 'Oct 02 09:00 PST' },
                { name: 'toolchest', user: 'root', mem: '1,120 K', date: 'Oct 02 09:00 PST' },
                { name: 'fam', user: 'root', mem: '512 K', date: 'Oct 02 09:00 PST' },
              ].map((sysP) => (
                <div
                  key={sysP.name}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 70px 95px 1fr 75px',
                    padding: '2px 0',
                    alignItems: 'center',
                  }}
                >
                  <span>📄 {sysP.name}</span>
                  <span>{sysP.user}</span>
                  <span>{sysP.mem}</span>
                  <span>{sysP.date}</span>
                  <span style={{ color: '#555', fontSize: '10px' }}>[System]</span>
                </div>
              ))}
              {windows
                .filter((w) =>
                  procFilter
                    ? w.title.toLowerCase().includes(procFilter.toLowerCase()) ||
                      w.appId.toLowerCase().includes(procFilter.toLowerCase())
                    : true
                )
                .map((w) => (
                  <div
                    key={w.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 70px 95px 1fr 75px',
                      padding: '2px 0',
                      alignItems: 'center',
                    }}
                  >
                    <span>⚡ {w.appId}</span>
                    <span>guest</span>
                    <span>2,480 K</span>
                    <span>{w.title.slice(0, 22)}</span>
                    <button
                      type="button"
                      className="sgi-btn"
                      onClick={() => onCloseWindow(w.id)}
                      style={{ padding: '1px 5px', fontSize: '10px' }}
                    >
                      Terminate
                    </button>
                  </div>
                ))}
            </div>

            {/* Mauve Search Box matching screenshot i-2.png */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700 }}>
                Enter process name to search:
              </span>
              <input
                type="text"
                value={procFilter}
                onChange={(e) => setProcFilter(e.target.value)}
                placeholder="e.g. fsn, winterm..."
                style={{
                  background: colorScheme.mauveInput,
                  border: '2px inset #666',
                  padding: '3px 6px',
                  fontSize: '11.5px',
                }}
              />
            </div>
          </div>
        )}

        {tab === 'audio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <IrixVectorIcon iconId="apanel" size={56} />
              <div>
                <div style={{ fontWeight: 700, fontStyle: 'italic', fontSize: '13px' }}>
                  {workstation.audioSubsystem}
                </div>
                <div style={{ fontSize: '11px', color: '#222' }}>
                  Indigo Magic Desktop SoundScheme Synthesizer (48.0 kHz 16-bit Stereo)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="sgi-btn"
                onClick={onToggleSound}
                style={{
                  padding: '4px 12px',
                  fontWeight: 700,
                  background: soundEnabled ? '#b8a87e' : undefined,
                }}
              >
                SoundScheme: {soundEnabled ? 'ENABLED (ON)' : 'MUTED (OFF)'}
              </button>
            </div>

            <div style={{ fontSize: '11.5px', fontWeight: 700, fontStyle: 'italic' }}>
              Audition SGI Indigo Magic Audio Cues:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button
                type="button"
                className="sgi-btn"
                onClick={() => irixAudio.playStartupChime()}
                style={{ padding: '6px', fontSize: '11px' }}
              >
                🔊 SGI PROM Boot Chord
              </button>
              <button
                type="button"
                className="sgi-btn"
                onClick={() => irixAudio.playAppLaunch()}
                style={{ padding: '6px', fontSize: '11px' }}
              >
                🔊 Magic Carpet Launch
              </button>
              <button
                type="button"
                className="sgi-btn"
                onClick={() => irixAudio.playIconSelect()}
                style={{ padding: '6px', fontSize: '11px' }}
              >
                🔊 Icon Select Chime
              </button>
              <button
                type="button"
                className="sgi-btn"
                onClick={() => irixAudio.playWindowMinimize()}
                style={{ padding: '6px', fontSize: '11px' }}
              >
                🔊 4Dwm Minimize
              </button>
              <button
                type="button"
                className="sgi-btn"
                onClick={() => irixAudio.playWindowRestore()}
                style={{ padding: '6px', fontSize: '11px' }}
              >
                🔊 4Dwm Restore
              </button>
              <button
                type="button"
                className="sgi-btn"
                onClick={() => irixAudio.playDumpsterCrunch()}
                style={{ padding: '6px', fontSize: '11px' }}
              >
                🔊 Dumpster Crunch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
