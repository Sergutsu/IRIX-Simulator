import React, { useEffect, useRef, useState } from 'react';
import { AppId, LaunchApp, SgiColorScheme, WorkstationProfile } from '../state/osStore';
import { irixAudio } from '../sound/irixAudio';

interface GlShowcaseAppProps {
  workstation: WorkstationProfile;
  colorScheme: SgiColorScheme;
  initialMode?: 'cube' | 'buttonfly' | 'torus' | 'indycam';
  onLaunchApp: LaunchApp;
}

export const GlShowcaseApp: React.FC<GlShowcaseAppProps> = ({
  workstation,
  colorScheme,
  initialMode = 'cube',
  onLaunchApp,
}) => {
  const [mode, setMode] = useState<'cube' | 'buttonfly' | 'torus' | 'indycam'>(
    initialMode
  );
  const [renderStyle, setRenderStyle] = useState<'shaded' | 'wireframe' | 'hiddenline'>(
    'shaded'
  );
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(60);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotRef = useRef({ rx: 0.45, ry: 0.65, rz: 0.1 });
  const dragRef = useRef<{ active: boolean; lx: number; ly: number }>({
    active: false,
    lx: 0,
    ly: 0,
  });
  const buttonflyBoxesRef = useRef<
    { label: string; sub: string; appId: AppId; x: number; y: number; r: number }[]
  >([]);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    let animId = 0;
    let lastTime = performance.now();
    let frames = 0;

    const renderFrame = (now: number) => {
      frames++;
      if (now - lastTime >= 500) {
        setFps(Math.min(75, Math.round((frames * 1000) / (now - lastTime))));
        frames = 0;
        lastTime = now;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      if (autoRotate && !dragRef.current.active) {
        rotRef.current.ry += 0.018;
        rotRef.current.rx += 0.009;
      }

      // Deep SGI IRIS GL viewport gradient background
      const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 20, w * 0.5, h * 0.5, w * 0.7);
      bg.addColorStop(0, '#1a2d4c');
      bg.addColorStop(1, '#080e1a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const { rx, ry } = rotRef.current;
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);

      const project3D = (x: number, y: number, z: number) => {
        // Rotate Y then X
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        const fov = 340;
        const dist = 4.2;
        const scale = fov / (dist + z2);
        return {
          sx: w * 0.5 + x1 * scale,
          sy: h * 0.5 + y2 * scale,
          z: z2,
          scale,
        };
      };

      if (mode === 'cube') {
        // Render SGI 3D Cube + Inner Octahedron / Tubular Struts
        const s = 1.15;
        const verts = [
          [-s, -s, -s],
          [s, -s, -s],
          [s, s, -s],
          [-s, s, -s],
          [-s, -s, s],
          [s, -s, s],
          [s, s, s],
          [-s, s, s],
        ];
        const faces = [
          { idx: [0, 1, 2, 3], color: [48, 168, 220] },
          { idx: [4, 5, 6, 7], color: [180, 68, 210] },
          { idx: [0, 1, 5, 4], color: [52, 200, 140] },
          { idx: [2, 3, 7, 6], color: [240, 185, 48] },
          { idx: [0, 3, 7, 4], color: [225, 72, 95] },
          { idx: [1, 2, 6, 5], color: [75, 115, 240] },
        ];

        const projected = verts.map(([vx, vy, vz]) => project3D(vx, vy, vz));

        const sortedFaces = faces
          .map((f) => {
            const avgZ =
              f.idx.reduce((acc, i) => acc + projected[i].z, 0) / f.idx.length;
            return { ...f, avgZ };
          })
          .sort((a, b) => b.avgZ - a.avgZ);

        sortedFaces.forEach((f) => {
          const pts = f.idx.map((i) => projected[i]);
          ctx.beginPath();
          ctx.moveTo(pts[0].sx, pts[0].sy);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].sx, pts[i].sy);
          }
          ctx.closePath();

          if (renderStyle !== 'wireframe') {
            const shade = Math.max(0.35, Math.min(1.15, 0.85 - f.avgZ * 0.28));
            const [r, g, b] = f.color.map((c) => Math.min(255, Math.round(c * shade)));
            ctx.fillStyle =
              renderStyle === 'hiddenline'
                ? '#122238'
                : `rgba(${r}, ${g}, ${b}, 0.86)`;
            ctx.fill();
          }

          ctx.strokeStyle =
            renderStyle === 'wireframe' ? '#40ffff' : '#ffffff';
          ctx.lineWidth = renderStyle === 'wireframe' ? 2.0 : 2.4;
          ctx.stroke();
        });

        // Inner glowing SGI core
        const core = project3D(0, 0, 0);
        ctx.fillStyle = '#ffe84a';
        ctx.beginPath();
        ctx.arc(core.sx, core.sy, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (mode === 'torus') {
        // 3D Parametric Trefoil Torus Knot (Odyssey VPro Geometry Engine Demo)
        const segments = 140;
        const segList: {
          x1: number;
          y1: number;
          x2: number;
          y2: number;
          z: number;
          hue: number;
        }[] = [];

        for (let i = 0; i < segments; i++) {
          const t1 = (i / segments) * Math.PI * 2;
          const t2 = ((i + 1) / segments) * Math.PI * 2;

          const knotPt = (t: number) => {
            const r = 0.9 + 0.38 * Math.cos(3 * t);
            return {
              x: r * Math.cos(2 * t),
              y: r * Math.sin(2 * t),
              z: 0.48 * Math.sin(3 * t),
            };
          };

          const p1 = knotPt(t1);
          const p2 = knotPt(t2);
          const pr1 = project3D(p1.x, p1.y, p1.z);
          const pr2 = project3D(p2.x, p2.y, p2.z);

          segList.push({
            x1: pr1.sx,
            y1: pr1.sy,
            x2: pr2.sx,
            y2: pr2.sy,
            z: (pr1.z + pr2.z) * 0.5,
            hue: Math.round((i / segments) * 360),
          });
        }

        segList
          .sort((a, b) => b.z - a.z)
          .forEach((s) => {
            ctx.strokeStyle =
              renderStyle === 'wireframe'
                ? '#00ffcc'
                : `hsl(${s.hue}, 85%, ${Math.round(58 - s.z * 14)}%)`;
            ctx.lineWidth = renderStyle === 'wireframe' ? 2 : 11;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();
          });
      } else if (mode === 'buttonfly') {
        // SGI Buttonfly 3D Interactive Polyhedral Launcher
        const items: { label: string; sub: string; appId: AppId; color: string }[] = [
          { label: 'fsn 3D', sub: 'File Navigator', appId: 'fsn', color: '#38a868' },
          { label: 'IconSmith', sub: '.FTI Vector Studio', appId: 'iconsmith', color: '#d49a2a' },
          { label: 'gr_osview', sub: 'Kernel Telemetry', appId: 'gr_osview', color: '#3878c8' },
          { label: 'InSight', sub: 'IRIX 6.5 Specs', appId: 'insight', color: '#9c48b8' },
          { label: 'Winterm', sub: 'xwsh Shell', appId: 'winterm', color: '#2b8a9e' },
          { label: 'swmgr 4.1', sub: 'Subsystems', appId: 'software_manager', color: '#c44858' },
        ];

        const nextBoxes: typeof buttonflyBoxesRef.current = [];
        items.forEach((it, idx) => {
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          const cx = w * (0.23 + col * 0.27);
          const cy = h * (0.34 + row * 0.36);
          const phase = now * 0.002 + idx * 0.9;
          const tiltW = Math.cos(phase * 0.6) * 10;

          ctx.save();
          ctx.translate(cx, cy);

          // 3D Beveled Polyhedron Button Tile
          ctx.fillStyle = it.color;
          ctx.beginPath();
          ctx.moveTo(-54 + tiltW * 0.3, -34);
          ctx.lineTo(54 + tiltW * 0.3, -34);
          ctx.lineTo(62 - tiltW * 0.3, 0);
          ctx.lineTo(54 - tiltW * 0.3, 34);
          ctx.lineTo(-54 - tiltW * 0.3, 34);
          ctx.lineTo(-62 + tiltW * 0.3, 0);
          ctx.closePath();
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold italic 13px Helvetica, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(it.label, 0, -3);
          ctx.fillStyle = '#ffe84a';
          ctx.font = '10.5px monospace';
          ctx.fillText(it.sub, 0, 15);
          ctx.restore();

          nextBoxes.push({
            label: it.label,
            sub: it.sub,
            appId: it.appId,
            x: cx,
            y: cy,
            r: 56,
          });
        });
        buttonflyBoxesRef.current = nextBoxes;
      } else if (mode === 'indycam') {
        // Simulated SGI IndyCam / O2Cam Digital Video Capture Feed
        const t = now * 0.002;
        for (let y = 0; y < h; y += 8) {
          for (let x = 0; x < w; x += 8) {
            const v1 = Math.sin(x * 0.02 + t);
            const v2 = Math.cos(y * 0.02 - t * 0.8);
            const r = Math.round(75 + 60 * v1);
            const g = Math.round(110 + 70 * v2);
            const b = Math.round(165 + 65 * Math.sin((x + y) * 0.015 + t));
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 8, 8);
          }
        }
        // Crosshair & SGI Video Overlay HUD
        ctx.strokeStyle = 'rgba(255, 232, 74, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(24, 24, w - 48, h - 48);
        ctx.fillStyle = '#ffe84a';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(
          `LIVE INPUT: ${workstation.id === 'o2' ? 'O2Cam MVP Digital Video' : 'SGI IndyCam Vino NTSC 640x480'}`,
          36,
          46
        );
        ctx.fillStyle = '#64ff96';
        ctx.fillText('30.00 fps | Compression: SGI MVC1 / ICE | Audio: 48.0kHz 16-bit Stereo', 36, h - 36);
      }

      // Top-Left OpenGL Viewport Telemetry Overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `GL_RENDERER: ${workstation.gfxSubsystem} | ${fps} FPS`,
        10,
        18
      );

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [mode, renderStyle, autoRotate, workstation, fps]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === 'buttonfly') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
      const hit = buttonflyBoxesRef.current.find(
        (b) => Math.hypot(x - b.x, y - b.y) <= b.r
      );
      if (hit) {
        irixAudio.playAppLaunch();
        onLaunchApp(hit.appId);
        return;
      }
    }

    dragRef.current = { active: true, lx: e.clientX, ly: e.clientY };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = ev.clientX - dragRef.current.lx;
      const dy = ev.clientY - dragRef.current.ly;
      dragRef.current.lx = ev.clientX;
      dragRef.current.ly = ev.clientY;
      rotRef.current.ry += dx * 0.01;
      rotRef.current.rx += dy * 0.01;
    };
    const onUp = () => {
      dragRef.current.active = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
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
      {/* Mode Selector Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 6px',
          background: colorScheme.windowWell,
          borderBottom: '1px solid #444',
          gap: '4px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '4px' }}>
          {(
            [
              { id: 'cube', label: 'SGI 3D Cube' },
              { id: 'buttonfly', label: 'Buttonfly 3D' },
              { id: 'torus', label: 'Odyssey NURBS Knot' },
              { id: 'indycam', label: 'IndyCam / O2cam' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              className="sgi-btn"
              onClick={() => {
                irixAudio.playMenuClick();
                setMode(m.id);
              }}
              style={{
                padding: '2px 8px',
                fontSize: '11px',
                background: mode === m.id ? '#b8a87e' : undefined,
                fontWeight: mode === m.id ? 700 : 500,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {(['shaded', 'wireframe', 'hiddenline'] as const).map((st) => (
            <button
              key={st}
              type="button"
              className="sgi-btn"
              onClick={() => setRenderStyle(st)}
              style={{
                padding: '2px 6px',
                fontSize: '10.5px',
                background: renderStyle === st ? '#ffe84a' : undefined,
                textTransform: 'capitalize',
              }}
            >
              {st}
            </button>
          ))}
          <button
            type="button"
            className="sgi-btn"
            onClick={() => setAutoRotate((v) => !v)}
            style={{ padding: '2px 6px', fontSize: '10.5px' }}
          >
            {autoRotate ? 'Pause Spin' : 'Spin'}
          </button>
        </div>
      </div>

      {/* 3D OpenGL Viewport Canvas */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, background: '#080e1a' }}>
        <canvas
          ref={canvasRef}
          width={560}
          height={350}
          onMouseDown={handleMouseDown}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: mode === 'buttonfly' ? 'pointer' : 'grab',
          }}
        />
      </div>

      {/* Bottom Status Strip */}
      <div
        style={{
          height: '20px',
          background: colorScheme.windowSurface,
          borderTop: '1px solid #666',
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10.5px',
        }}
      >
        <span>
          {mode === 'buttonfly'
            ? 'Buttonfly: Click any 3D polyhedral tile to launch its IRIX tool!'
            : 'Drag inside 3D viewport to orbit geometry in real time.'}
        </span>
        <span>Visual: 0x34 TrueColor 24-bit Z-buffer</span>
      </div>
    </div>
  );
};
