import React, { useState } from 'react';
import { SgiColorScheme } from '../state/osStore';
import { IrixVectorIcon } from '../icons/irixIconSet';
import { irixAudio } from '../sound/irixAudio';

interface SoftwareManagerAppProps {
  colorScheme: SgiColorScheme;
}

interface SwPackage {
  id: string;
  name: string;
  subsystem: string;
  status: 'Installed' | 'Upgrade Available' | 'Optional';
  sizeKB: number;
  selected: boolean;
}

export const SoftwareManagerApp: React.FC<SoftwareManagerAppProps> = ({
  colorScheme,
}) => {
  const [sourcePath, setSourcePath] = useState('/CDROM/IRIX_6.5.22_Overlay_1_of_3/dist');
  const [packages, setPackages] = useState<SwPackage[]>([
    { id: '4dwm', name: '4Dwm', subsystem: 'desktop_eoe.sw.4Dwm', status: 'Installed', sizeKB: 984, selected: false },
    { id: 'eoe', name: 'IRIX Execution Env', subsystem: 'eoe.sw.base (6.5.22m)', status: 'Installed', sizeKB: 84210, selected: false },
    { id: 'xfs', name: 'XFS 64-bit Filesystem', subsystem: 'eoe.sw.xfs', status: 'Installed', sizeKB: 18420, selected: false },
    { id: 'inperson', name: 'InPerson', subsystem: 'inperson.sw.eoe', status: 'Installed', sizeKB: 6988, selected: false },
    { id: 'viewkit', name: 'ViewKit_dev', subsystem: 'viewkit_dev.sw.lib', status: 'Installed', sizeKB: 12248, selected: true },
    { id: 'opengl', name: 'OpenGL & IRIS GL', subsystem: 'gl_dev.sw.opengl', status: 'Installed', sizeKB: 24600, selected: false },
    { id: 'mipspro', name: 'MIPSpro 7.4.4m C/C++', subsystem: 'c++_dev.sw.c++', status: 'Optional', sizeKB: 68400, selected: false },
    { id: 'nekoware', name: 'Nekoware Freeware Bundle', subsystem: 'neko_base.sw.rse', status: 'Upgrade Available', sizeKB: 42150, selected: false },
  ]);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([
    'Reading /var/inst/hist ...',
    'Reading product descriptions from /CDROM/IRIX_6.5.22_Overlay_1_of_3/dist ...',
    'Pre-installation dependency check complete: 0 conflicts.',
  ]);

  const toggleSelect = (id: string) => {
    irixAudio.playMenuClick();
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleStartInstall = () => {
    const chosen = packages.filter((p) => p.selected);
    if (chosen.length === 0) {
      setLogs((prev) => [...prev, 'inst: Nothing selected for installation.']);
      return;
    }
    irixAudio.playAppLaunch();
    setInstalling(true);
    setProgress(25);
    setLogs((prev) => [
      ...prev,
      `Installing ${chosen.map((c) => c.name).join(', ')} from ${sourcePath}...`,
    ]);

    setTimeout(() => setProgress(68), 400);
    setTimeout(() => {
      setProgress(100);
      setInstalling(false);
      setPackages((prev) =>
        prev.map((p) => (p.selected ? { ...p, status: 'Installed', selected: false } : p))
      );
      setLogs((prev) => [
        ...prev,
        'Running exitop: tag -u /usr/lib/filetype/install ...',
        'Installation complete. 0 errors.',
      ]);
    }, 950);
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: colorScheme.windowSurface,
        overflow: 'hidden',
        userSelect: 'none',
        fontSize: '11.5px',
      }}
    >
      {/* SGI Motif Menu Bar */}
      <div className="sgi-menubar">
        <span className="sgi-menubar-item">
          <u>F</u>ile
        </span>
        <span className="sgi-menubar-item" onClick={handleStartInstall}>
          <u>I</u>nstall
        </span>
        <span className="sgi-menubar-item">
          <u>S</u>elected
        </span>
        <span className="sgi-menubar-item">
          <u>S</u>oftware
        </span>
        <span className="sgi-menubar-item">
          <u>V</u>iews
        </span>
        <span className="sgi-menubar-item" style={{ marginLeft: 'auto' }}>
          <u>H</u>elp
        </span>
      </div>

      <div style={{ flex: 1, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
        {/* Available Software Mauve Input Row (matching i-5.png!) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 700, fontStyle: 'italic' }}>Available Software:</span>
          <div
            style={{
              padding: '2px',
              border: '1px solid #333',
              background: '#ddd',
              display: 'flex',
            }}
          >
            <IrixVectorIcon iconId="cdrom" size={22} useMagicCarpet={false} />
          </div>
          <input
            type="text"
            value={sourcePath}
            onChange={(e) => setSourcePath(e.target.value)}
            style={{
              flex: 1,
              background: colorScheme.mauveInput,
              border: '2px inset #666',
              padding: '3px 6px',
              fontSize: '11.5px',
              fontWeight: 700,
            }}
          />
        </div>

        {/* Software Inventory Table (Slate-Teal background matching i-5.png!) */}
        <div
          style={{
            background: '#678291',
            border: '2px inset #555',
            height: '138px',
            overflowY: 'auto',
            color: '#000',
            padding: '4px',
          }}
        >
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => toggleSelect(pkg.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '26px 80px 140px 1fr 120px 80px',
                alignItems: 'center',
                padding: '2px 4px',
                background: pkg.selected ? 'rgba(255, 255, 255, 0.35)' : 'transparent',
                border: pkg.selected ? '1px solid #fff' : '1px solid transparent',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              <input
                type="checkbox"
                checked={pkg.selected}
                onChange={() => {}}
                style={{ margin: 0 }}
              />
              <span>✓ Product</span>
              <span
                style={{
                  fontWeight: 700,
                  color: pkg.selected ? '#0000cc' : '#000',
                  textDecoration: pkg.selected ? 'underline' : 'none',
                }}
              >
                {pkg.name}
              </span>
              <span style={{ fontSize: '10px', opacity: 0.85 }}>{pkg.subsystem}</span>
              <span>{pkg.status}</span>
              <span style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                {pkg.sizeKB.toLocaleString()} K
              </span>
            </div>
          ))}
        </div>

        {/* Start / Stop / Conflicts Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="sgi-btn"
            onClick={handleStartInstall}
            disabled={installing}
            style={{ padding: '3px 14px', fontWeight: 700 }}
          >
            Start
          </button>
          <button type="button" className="sgi-btn" style={{ padding: '3px 14px' }}>
            Stop
          </button>
          <button
            type="button"
            className="sgi-btn"
            onClick={() =>
              setLogs((prev) => [...prev, 'Conflict check: 0 subsystem conflicts detected.'])
            }
            style={{ padding: '3px 14px' }}
          >
            Conflicts ...
          </button>
        </div>

        {/* Status & 3D Disk Space Cylinder Row (matching i-5.png!) */}
        <div style={{ display: 'flex', gap: '8px', height: '86px' }}>
          {/* Left Status Box */}
          <div
            style={{
              flex: 1,
              background: '#d4d4d4',
              border: '1px solid #444',
              padding: '6px 8px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#0033cc', fontWeight: 700, fontSize: '14px' }}>i</span>
              <span style={{ fontWeight: 700 }}>
                {installing
                  ? `Installing selected subsystems (${progress}%)...`
                  : packages.some((p) => p.selected)
                  ? `${packages.filter((p) => p.selected).length} subsystem(s) queued for installation.`
                  : 'Nothing selected for installation.'}
              </span>
            </div>

            <div>
              <div
                style={{
                  height: '6px',
                  background: '#999',
                  border: '1px solid #333',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: '#00aa44',
                    transition: 'width 0.25s',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '9.5px',
                  marginTop: '2px',
                }}
              >
                <span>Initialize</span>
                <span>Install</span>
                <span>Post-Install</span>
              </div>
            </div>
          </div>

          {/* Right Disk Space Box with 3D Cylinder Chart */}
          <div
            style={{
              flex: 1,
              background: '#678291',
              border: '1px solid #333',
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#000',
            }}
          >
            {/* SVG 3D Disk Cylinder Pie matching i-5.png */}
            <svg width="92" height="64" viewBox="0 0 92 64">
              {/* Bottom white Free cylinder body */}
              <path
                d="M12,26 L12,44 A34,12 0 0,0 80,44 L80,26 Z"
                fill="#d8e4ec"
                stroke="#111"
              />
              {/* Dark Used top slice */}
              <ellipse cx="46" cy="26" rx="34" ry="12" fill="#2c3a42" stroke="#111" />
              <path
                d="M46,26 L80,26 A34,12 0 0,1 22,34 Z"
                fill="#50626c"
                stroke="#111"
              />
            </svg>

            <div style={{ fontSize: '10.5px', fontFamily: 'monospace' }}>
              <div style={{ fontWeight: 700, marginBottom: '3px' }}>XFS /dev/root:</div>
              <div>■ Used: 11,408,504 K</div>
              <div>□ Free: 24,243,080 K</div>
            </div>
          </div>
        </div>

        {/* Bottom Log Box */}
        <div
          style={{
            height: '62px',
            background: '#b0b0b0',
            border: '2px inset #666',
            padding: '4px 6px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '10.5px',
          }}
        >
          {logs.map((l, idx) => (
            <div key={idx}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
