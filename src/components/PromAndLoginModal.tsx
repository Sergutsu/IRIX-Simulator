import React, { useState } from 'react';
import { WorkstationProfile } from '../state/osStore';
import { IrixVectorIcon } from '../icons/irixIconSet';
import { irixAudio } from '../sound/irixAudio';

interface PromAndLoginModalProps {
  mode: 'prom' | 'clogin';
  workstation: WorkstationProfile;
  currentUser: string;
  onSelectUser: (user: string) => void;
  onClose: () => void;
}

/**
 * Authentic SGI ARCS PROM System Maintenance Menu / Command Monitor
 * AND SGI `clogin` Visual Login Screen
 */
export const PromAndLoginModal: React.FC<PromAndLoginModalProps> = ({
  mode,
  workstation,
  currentUser,
  onSelectUser,
  onClose,
}) => {
  const [promMonitorMode, setPromMonitorMode] = useState(false);
  const [promCmd, setPromCmd] = useState('');
  const [promLog, setPromLog] = useState<string[]>([
    `SGI ARCS PROM Monitor Release 6.5 ${workstation.ipArch} (${workstation.name})`,
    'Type "hinv", "printenv", "version", or "boot" to start IRIX 6.5.',
  ]);

  const handlePromEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const c = promCmd.trim().toLowerCase();
    setPromCmd('');
    if (c === 'boot' || c === 'exit' || c === '1') {
      irixAudio.playStartupChime();
      onClose();
      return;
    }
    let resp = '';
    if (c === 'hinv') {
      resp = workstation.hinvLines.join('\n');
    } else if (c === 'printenv') {
      resp = [
        `SystemPartition=pci(0)scsi(0)disk(1)rdisk(0)partition(8)`,
        `OSLoadPartition=pci(0)scsi(0)disk(1)rdisk(0)partition(0)`,
        `OSLoader=sash`,
        `OSLoadFilename=/unix`,
        `console=g`,
        `gfx=alive`,
      ].join('\n');
    } else if (c === 'version') {
      resp = `PROM Monitor SGI Version 6.5 Rev B (${workstation.ipArch}) Oct 1999`;
    } else {
      resp = `Commands: hinv, printenv, version, boot`;
    }
    setPromLog((prev) => [...prev, `>> ${c}`, resp]);
  };

  if (mode === 'prom') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(8, 16, 28, 0.92)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: '660px',
            height: '430px',
            background: '#c4c4c4',
            border: '2px solid #000',
            boxShadow: '0 14px 40px rgba(0,0,0,0.8), inset 2px 2px 0 #fff',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* SGI PROM Cyan-Teal Console Viewport */}
          <div
            style={{
              flex: 1,
              background: 'linear-gradient(180deg, #123e59 0%, #092234 100%)',
              border: '3px inset #777',
              padding: '22px 28px',
              color: '#ffffff',
              fontFamily: "'Courier New', Courier, monospace",
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {!promMonitorMode ? (
              <>
                <div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#ffe84a',
                      borderBottom: '1px solid rgba(255,255,255,0.35)',
                      paddingBottom: '8px',
                      marginBottom: '16px',
                    }}
                  >
                    System Maintenance Menu — {workstation.name} ({workstation.ipArch})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                    <div
                      onClick={() => {
                        irixAudio.playStartupChime();
                        onClose();
                      }}
                      style={{ cursor: 'pointer', color: '#88ffaa', fontWeight: 700 }}
                    >
                      1) Start System (Boot /unix IRIX 6.5.22m)
                    </div>
                    <div
                      onClick={onClose}
                      style={{ cursor: 'pointer' }}
                    >
                      2) Install System Software
                    </div>
                    <div
                      onClick={() => setPromMonitorMode(true)}
                      style={{ cursor: 'pointer' }}
                    >
                      3) Run Diagnostics (ide)
                    </div>
                    <div onClick={onClose} style={{ cursor: 'pointer' }}>
                      4) Recover System
                    </div>
                    <div
                      onClick={() => setPromMonitorMode(true)}
                      style={{ cursor: 'pointer', color: '#ffe84a', fontWeight: 700 }}
                    >
                      5) Enter Command Monitor (&gt;&gt; prompt)
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#b8dcff' }}>
                  <div>Option? [1-5]: Click 1 to boot IRIX 6.5 Interactive Desktop or 5 for Command Monitor.</div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="sgi-btn"
                      onClick={() => {
                        irixAudio.playStartupChime();
                        onClose();
                      }}
                      style={{ padding: '4px 14px', fontWeight: 700 }}
                    >
                      1) Boot IRIX 6.5 Now
                    </button>
                    <button
                      type="button"
                      className="sgi-btn"
                      onClick={() => setPromMonitorMode(true)}
                      style={{ padding: '4px 14px' }}
                    >
                      5) Command Monitor (&gt;&gt;)
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto', fontSize: '12.5px', lineHeight: 1.4 }}>
                  {promLog.map((ln, idx) => (
                    <pre key={idx} style={{ margin: '0 0 4px 0', fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                      {ln}
                    </pre>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                  <span style={{ color: '#ffe84a', fontWeight: 700 }}>&gt;&gt;</span>
                  <input
                    type="text"
                    value={promCmd}
                    onChange={(e) => setPromCmd(e.target.value)}
                    onKeyDown={handlePromEnter}
                    autoFocus
                    placeholder="Type hinv, printenv, or boot..."
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#fff',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                    }}
                  />
                  <button
                    type="button"
                    className="sgi-btn"
                    onClick={() => {
                      irixAudio.playStartupChime();
                      onClose();
                    }}
                    style={{ padding: '2px 10px', fontSize: '11px', fontWeight: 700 }}
                  >
                    Boot System
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // SGI `clogin` Visual Login Screen
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(145deg, #2b4c70 0%, #142538 100%)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: '490px',
          background: '#c4c4c4',
          border: '2px solid #000',
          boxShadow: '0 14px 36px rgba(0,0,0,0.7), inset 2px 2px 0 #fff, inset -2px -2px 0 #666',
          padding: '6px',
        }}
      >
        <div
          style={{
            background: '#b8a87e',
            border: '1px solid #111',
            padding: '3px 8px',
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: '12.5px',
          }}
        >
          Welcome to Silicon Graphics — silicon.sgi.com (IRIX 6.5.22m)
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ textAlign: 'center', fontStyle: 'italic', fontWeight: 700, fontSize: '14px' }}>
            Click an SGI User Account Icon to Log In (clogin):
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '18px' }}>
            {[
              { user: 'root', role: 'System Administrator', icon: 'sysmgr' },
              { user: 'guest', role: 'IRIX Interactive Desktop', icon: 'showcase' },
              { user: 'demos', role: 'OpenGL & 3D Graphics', icon: 'buttonfly' },
            ].map((u) => {
              const active = currentUser === u.user;
              return (
                <div
                  key={u.user}
                  onClick={() => {
                    irixAudio.playStartupChime();
                    onSelectUser(u.user);
                    onClose();
                  }}
                  style={{
                    width: '120px',
                    background: active ? '#b8a87e' : '#d8d8d8',
                    border: '2px solid #111',
                    boxShadow: 'inset 1px 1px 0 #fff, inset -1px -1px 0 #666',
                    padding: '10px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <IrixVectorIcon iconId={u.icon} size={56} />
                  <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '6px' }}>{u.user}</div>
                  <div style={{ fontSize: '10px', color: '#333', textAlign: 'center' }}>{u.role}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="sgi-btn"
              onClick={onClose}
              style={{ padding: '4px 14px', fontWeight: 700 }}
            >
              Resume Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
