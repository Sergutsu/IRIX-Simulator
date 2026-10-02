import React, { useEffect, useRef, useState } from 'react';
import { AppId, SgiColorScheme, VfsNode } from '../state/osStore';
import { irixAudio } from '../sound/irixAudio';

interface FsnAppProps {
  vfs: VfsNode[];
  colorScheme: SgiColorScheme;
  onLaunchApp: (appId: AppId, payload?: Record<string, unknown>) => void;
  onUpdateTitle?: (title: string) => void;
}

/**
 * Authentic SGI `fsn` (3D File System Navigator)
 * Matches the 1992/1993 SGI IRIS GL 3D file browser seen in Jurassic Park ("It's a UNIX system!").
 */
export const FsnApp: React.FC<FsnAppProps> = ({
  vfs,
  colorScheme,
  onLaunchApp,
  onUpdateTitle,
}) => {
  const [currentDir, setCurrentDir] = useState<string>('/usr/people/guest');
  const [selectedPath, setSelectedPath] = useState<string>('/usr/people/guest/readme.sgi');
  const [tilt, setTilt] = useState<number>(42); // 15..75
  const [height, setHeight] = useState<number>(55); // 20..100
  const [camYaw, setCamYaw] = useState<number>(0);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitBoxesRef = useRef<
    { path: string; x1: number; y1: number; x2: number; y2: number; node: VfsNode }[]
  >([]);

  const directoryChoices = [
    '/usr/people/guest',
    '/usr/lib/filetype/iconlib',
    '/usr/demos',
    '/usr/sbin',
  ];

  const entries = vfs.filter((n) => {
    if (!n.path.startsWith(currentDir + '/')) return false;
    const rest = n.path.slice(currentDir.length + 1);
    if (rest.includes('/')) return false;
    if (searchFilter.trim()) {
      return n.name.toLowerCase().includes(searchFilter.trim().toLowerCase());
    }
    return true;
  });

  const selectedNode =
    entries.find((e) => e.path === selectedPath) || entries[0] || null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 1. Sky Horizon Gradient (Cyan-Blue sky to Green ground, modulated by Tilt)
    const horizonY = Math.round(h * (0.18 + ((75 - tilt) / 60) * 0.24));
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#0088ee');
    skyGrad.addColorStop(0.7, '#58c8ff');
    skyGrad.addColorStop(1, '#a6f2ff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY);

    // 2. Ground Plane (SGI fsn turf green)
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    groundGrad.addColorStop(0, '#3e763a');
    groundGrad.addColorStop(1, '#2f5e2c');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // 3. Distant Child/Sibling Directory Pedestals connected by 3D lines
    const distantDirs = directoryChoices.filter((d) => d !== currentDir);
    distantDirs.forEach((d, idx) => {
      const dx = w * (0.22 + idx * 0.28) + camYaw * 1.4;
      const dy = horizonY + 26;
      // Connecting line from main pedestal to distant directory pedestal
      ctx.strokeStyle = '#90ff90';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, horizonY + 95);
      ctx.lineTo(dx, dy + 10);
      ctx.stroke();

      // Distant pedestal block
      ctx.fillStyle = '#9e9e9e';
      ctx.fillRect(dx - 28, dy, 56, 12);
      ctx.strokeStyle = '#222';
      ctx.strokeRect(dx - 28, dy, 56, 12);
      ctx.fillStyle = '#e8ffe8';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(d.split('/').pop() || d, dx, dy - 3);
    });

    // 4. Main Foreground 3D Directory Pedestal Slab
    const scale = 0.72 + (100 - height) * 0.005;
    const pedTopY = horizonY + 52;
    const pedBottomY = h - 18;
    const pedTopHalfW = 195 * scale;
    const pedBotHalfW = 285 * scale;
    const centerX = w * 0.5 + camYaw * 2;

    // Pedestal Top Face (Light dotted grey slab)
    ctx.fillStyle = '#d4d4d4';
    ctx.beginPath();
    ctx.moveTo(centerX - pedTopHalfW, pedTopY);
    ctx.lineTo(centerX + pedTopHalfW, pedTopY);
    ctx.lineTo(centerX + pedBotHalfW, pedBottomY);
    ctx.lineTo(centerX - pedBotHalfW, pedBottomY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pedestal Front Extrusion Lip
    ctx.fillStyle = '#7c7c7c';
    ctx.beginPath();
    ctx.moveTo(centerX - pedBotHalfW, pedBottomY);
    ctx.lineTo(centerX + pedBotHalfW, pedBottomY);
    ctx.lineTo(centerX + pedBotHalfW, pedBottomY + 14);
    ctx.lineTo(centerX - pedBotHalfW, pedBottomY + 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Subtle texture dots on pedestal surface
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    for (let r = 0; r < 12; r++) {
      const t = r / 12;
      const y = pedTopY + t * (pedBottomY - pedTopY);
      const hw = pedTopHalfW + t * (pedBotHalfW - pedTopHalfW);
      for (let c = -8; c <= 8; c++) {
        ctx.fillRect(centerX + (c / 9) * hw, y, 1.5, 1.5);
      }
    }

    // 5. Render 3D File Blocks in Perspective Rows on the Pedestal
    const cols = 4;
    const visibleEntries = entries.slice(0, 16);
    const newHitBoxes: typeof hitBoxesRef.current = [];

    let spotlightCoords: { x: number; y: number; w: number; h: number } | null = null;

    visibleEntries.forEach((node, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const totalRows = Math.max(2, Math.ceil(visibleEntries.length / cols));

      const rowT = (row + 0.45) / (totalRows + 0.35);
      const yBase = pedTopY + rowT * (pedBottomY - pedTopY - 22);
      const rowHalfW = pedTopHalfW + rowT * (pedBotHalfW - pedTopHalfW);
      const colFrac = (col - (cols - 1) / 2) / (cols * 0.54);
      const xCenter = centerX + colFrac * rowHalfW;

      const persp = 0.68 + rowT * 0.48;
      const boxW = 54 * persp;
      const boxD = 20 * persp;
      const boxH = Math.min(28, Math.max(11, Math.log2(node.size + 16) * 2.1)) * persp;

      const isSelected = selectedNode?.path === node.path;
      if (isSelected) {
        spotlightCoords = { x: xCenter, y: yBase, w: boxW, h: boxH };

        // Draw illuminated spotlight ellipse on the pedestal under the selected file!
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 225, 0.88)';
        ctx.beginPath();
        ctx.ellipse(xCenter, yBase - boxD * 0.3, boxW * 0.95, boxD * 1.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Color by file type / age (authentic fsn maroon/plum/indigo blocks)
      const topColor = isSelected
        ? '#aa889e'
        : node.type === 'exec'
        ? '#7a3b69'
        : node.name.endsWith('.fti')
        ? '#3b5c85'
        : '#6b2d52';
      const frontColor = isSelected ? '#8c6980' : '#4a1c36';
      const sideColor = isSelected ? '#735268' : '#381228';

      // Front vertical face of 3D file block
      ctx.fillStyle = frontColor;
      ctx.fillRect(xCenter - boxW / 2, yBase - boxH, boxW, boxH);
      ctx.strokeStyle = '#180810';
      ctx.lineWidth = 1;
      ctx.strokeRect(xCenter - boxW / 2, yBase - boxH, boxW, boxH);

      // Top receding face of 3D file block
      const topShrink = 0.84;
      ctx.fillStyle = topColor;
      ctx.beginPath();
      ctx.moveTo(xCenter - boxW / 2, yBase - boxH);
      ctx.lineTo(xCenter + boxW / 2, yBase - boxH);
      ctx.lineTo(xCenter + (boxW * topShrink) / 2, yBase - boxH - boxD);
      ctx.lineTo(xCenter - (boxW * topShrink) / 2, yBase - boxH - boxD);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Side bevel
      ctx.fillStyle = sideColor;
      ctx.fillRect(xCenter - boxW / 2 + 4, yBase - boxH - boxD * 0.65, boxW - 8, boxD * 0.45);

      // File name label on pedestal in front of block (matching gosub.bas in i-4.png!)
      ctx.fillStyle = isSelected ? '#000000' : '#2a2a2a';
      ctx.font = `${isSelected ? 'bold ' : ''}${Math.round(10 * persp)}px monospace`;
      ctx.textAlign = 'center';
      const label =
        node.name.length > 13 ? node.name.slice(0, 12) + '…' : node.name;
      ctx.fillText(label, xCenter, yBase + 11 * persp);

      newHitBoxes.push({
        path: node.path,
        x1: xCenter - boxW * 0.65,
        y1: yBase - boxH - boxD - 6,
        x2: xCenter + boxW * 0.65,
        y2: yBase + 14,
        node,
      });
    });

    // 6. Draw the Iconic Translucent Spotlight Cone from the Sky onto the Selected Block!
    if (spotlightCoords) {
      const sc = spotlightCoords as { x: number; y: number; w: number; h: number };
      ctx.save();
      const coneGrad = ctx.createLinearGradient(sc.x, 0, sc.x, sc.y);
      coneGrad.addColorStop(0, 'rgba(255, 255, 220, 0.45)');
      coneGrad.addColorStop(1, 'rgba(255, 255, 200, 0.22)');
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(sc.x - 18, 0);
      ctx.lineTo(sc.x + 18, 0);
      ctx.lineTo(sc.x + sc.w * 0.92, sc.y - 4);
      ctx.lineTo(sc.x - sc.w * 0.92, sc.y - 4);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }

    hitBoxesRef.current = newHitBoxes;
  }, [currentDir, selectedPath, tilt, height, camYaw, searchFilter, vfs]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const hit = hitBoxesRef.current.find(
      (b) => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2
    );
    if (hit) {
      irixAudio.playIconSelect();
      setSelectedPath(hit.path);
    }
  };

  const handleCanvasDoubleClick = () => {
    if (!selectedNode) return;
    irixAudio.playAppLaunch();
    if (selectedNode.name.endsWith('.fti')) {
      onLaunchApp('iconsmith', { iconId: selectedNode.iconId });
    } else if (selectedNode.appId) {
      onLaunchApp(selectedNode.appId, { path: selectedNode.path });
    } else {
      onLaunchApp('jot', { path: selectedNode.path });
    }
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
      }}
    >
      {/* SGI Motif Menu Bar */}
      <div className="sgi-menubar">
        <span className="sgi-menubar-item">
          <u>S</u>ession
        </span>
        <span className="sgi-menubar-item">
          <u>S</u>how
        </span>
        <span className="sgi-menubar-item">
          <u>D</u>isplay
        </span>
        <span className="sgi-menubar-item">
          <u>D</u>irectory
        </span>
        <span
          className="sgi-menubar-item"
          onClick={handleCanvasDoubleClick}
        >
          <u>F</u>ile (Open)
        </span>
        <span
          className="sgi-menubar-item"
          style={{ marginLeft: 'auto' }}
          onClick={() => onLaunchApp('insight', { chapter: 'specs' })}
        >
          <u>H</u>elp
        </span>
      </div>

      {/* Main fsn Split Layout: Left Control Strip + Right 3D Viewport */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left Motif Control Panel (matching i-4.png!) */}
        <div
          style={{
            width: '144px',
            background: '#cccccc',
            borderRight: '2px solid #555',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
          }}
        >
          <button
            type="button"
            className="sgi-btn"
            onClick={() => {
              setTilt(42);
              setHeight(55);
              setCamYaw(0);
            }}
            style={{ width: '100%', fontSize: '11px', padding: '3px 4px' }}
          >
            reset &nbsp;&nbsp; Alt+R
          </button>
          <button
            type="button"
            className="sgi-btn"
            onClick={() => {
              const idx =
                (directoryChoices.indexOf(currentDir) + 1) % directoryChoices.length;
              const nextDir = directoryChoices[idx];
              setCurrentDir(nextDir);
              onUpdateTitle?.(`fsn — a 3D File System Navigator (${nextDir})`);
            }}
            style={{ width: '100%', fontSize: '11px', padding: '3px 4px' }}
          >
            next dir &nbsp; Alt+B
          </button>
          <button
            type="button"
            className="sgi-btn"
            onClick={() => {
              setTilt(68);
              setHeight(82);
            }}
            style={{ width: '100%', fontSize: '11px', padding: '3px 4px' }}
          >
            birds eye
          </button>
          <button
            type="button"
            className="sgi-btn"
            onClick={() => {
              setTilt(22);
              setHeight(34);
            }}
            style={{ width: '100%', fontSize: '11px', padding: '3px 4px' }}
          >
            front view
          </button>

          {/* Tilt & Height Sliders */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              padding: '6px 0',
              borderTop: '1px solid #888',
              borderBottom: '1px solid #888',
              marginTop: '2px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700 }}>Tilt</span>
              <input
                type="range"
                min={15}
                max={75}
                value={tilt}
                onChange={(e) => setTilt(Number(e.target.value))}
                style={{ width: '58px', marginTop: '4px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700 }}>Height</span>
              <input
                type="range"
                min={20}
                max={95}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                style={{ width: '58px', marginTop: '4px' }}
              />
            </div>
          </div>

          {/* Search Filter with Mauve SGI Input Fields */}
          <div style={{ fontSize: '10.5px', fontWeight: 700, marginTop: '2px' }}>Search</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px', width: '34px' }}>Name:</span>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="filter..."
              style={{
                flex: 1,
                background: colorScheme.mauveInput,
                border: '1px solid #333',
                padding: '2px 4px',
                fontSize: '10.5px',
                width: '70px',
              }}
            />
          </div>

          {/* Directory Quick Switcher List (`Marks`) */}
          <div style={{ fontSize: '10.5px', fontWeight: 700, marginTop: '4px' }}>
            XFS Directories:
          </div>
          <div
            style={{
              flex: 1,
              background: '#bdbdbd',
              border: '1px solid #333',
              padding: '3px',
              overflowY: 'auto',
              fontSize: '10px',
            }}
          >
            {directoryChoices.map((dir) => (
              <div
                key={dir}
                onClick={() => {
                  irixAudio.playMenuClick();
                  setCurrentDir(dir);
                  onUpdateTitle?.(`fsn — a 3D File System Navigator (${dir})`);
                }}
                style={{
                  padding: '3px 4px',
                  cursor: 'pointer',
                  background: currentDir === dir ? '#b8a87e' : 'transparent',
                  fontWeight: currentDir === dir ? 700 : 400,
                }}
              >
                {dir}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className="sgi-btn"
              onClick={handleCanvasDoubleClick}
              style={{ flex: 1, fontSize: '10.5px', padding: '3px 0', fontWeight: 700 }}
            >
              open file
            </button>
          </div>
        </div>

        {/* Right Column: Overview Radar + Path Header + 3D Perspective Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Top Radar Tree Overview (matching green `overview` panel in i-4.png!) */}
          <div
            style={{
              height: '44px',
              background: '#2a6b34',
              borderBottom: '2px solid #222',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '6px',
                top: '3px',
                fontSize: '9.5px',
                fontStyle: 'italic',
                color: '#d8ffd8',
              }}
            >
              overview: /dev/root (XFS 64-bit tree)
            </span>
            <svg width="360" height="40" viewBox="0 0 360 40">
              <rect x="160" y="28" width="40" height="8" fill="#aaa" stroke="#111" />
              {directoryChoices.map((d, i) => {
                const tx = 45 + i * 90;
                const active = d === currentDir;
                return (
                  <g key={d}>
                    <line
                      x1="180"
                      y1="28"
                      x2={tx}
                      y2="12"
                      stroke={active ? '#ffe84a' : '#80e880'}
                      strokeWidth={active ? 1.6 : 1}
                    />
                    <rect
                      x={tx - 16}
                      y="5"
                      width="32"
                      height="8"
                      fill={active ? '#ffe84a' : '#999'}
                      stroke="#111"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Mauve Path Input & File Status Bar */}
          <div style={{ padding: '4px 8px', background: '#d4d4d4', borderBottom: '1px solid #555' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
              fsn: &nbsp; a 3D File System Navigator
            </div>
            <div
              style={{
                background: colorScheme.mauveInput,
                border: '1px solid #333',
                padding: '2px 6px',
                fontSize: '11.5px',
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            >
              {selectedNode ? selectedNode.path : currentDir}
            </div>
            <div style={{ fontSize: '10.5px', marginTop: '2px', color: '#111' }}>
              {selectedNode
                ? `${selectedNode.permissions}   ${selectedNode.size} bytes, modified ${selectedNode.mtime}, SGI tag ${selectedNode.tagHex} (Double-click block to open)`
                : 'Click any 3D block to spotlight; double-click to open.'}
            </div>
          </div>

          {/* 3D Perspective Canvas */}
          <div style={{ flex: 1, position: 'relative', minHeight: 0, background: '#2f5e2c' }}>
            <canvas
              ref={canvasRef}
              width={620}
              height={360}
              onClick={handleCanvasClick}
              onDoubleClick={handleCanvasDoubleClick}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Bottom Age Legend Bar (matching i-4.png!) */}
          <div
            style={{
              height: '20px',
              background: '#c4c4c4',
              borderTop: '1px solid #444',
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            <span>ages:</span>
            {[
              { label: '1 dy', bg: '#b82828', fg: '#fff' },
              { label: '1 wk', bg: '#9e5818', fg: '#fff' },
              { label: '1 mo', bg: '#7c8418', fg: '#fff' },
              { label: '3 mo', bg: '#287c4c', fg: '#fff' },
              { label: '6 mo', bg: '#28589e', fg: '#fff' },
              { label: '1 yr', bg: '#68289e', fg: '#fff' },
              { label: '> 1 yr', bg: '#6b2d52', fg: '#fff' },
              { label: 'Monitored (fam)', bg: '#c8979b', fg: '#000' },
            ].map((b) => (
              <span
                key={b.label}
                style={{
                  background: b.bg,
                  color: b.fg,
                  padding: '0 4px',
                  border: '1px solid #222',
                }}
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
