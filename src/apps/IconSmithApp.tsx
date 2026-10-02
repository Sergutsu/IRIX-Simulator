import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  exportFtiToSvg,
  FtiColorRef,
  FtiPath,
  IconVisualState,
  parseFtiScript,
  resolveFtiColor,
  serializeFtiPaths,
  SGI_FTI_COLOR_MAP,
} from '../icons/ftiEngine';
import { IRIX_ICON_LIBRARY, IrixVectorIcon } from '../icons/irixIconSet';
import { SgiColorScheme } from '../state/osStore';
import { irixAudio } from '../sound/irixAudio';

interface IconSmithAppProps {
  colorScheme: SgiColorScheme;
  initialIconId?: string;
  onUpdateTitle?: (title: string) => void;
  onSaveFtiToVfs?: (filename: string, ftiCode: string) => void;
}

const FEATURED_PALETTE_KEYS: FtiColorRef[] = [
  'iconcolor',
  'outlinecolor',
  'shadowcolor',
  0,
  7,
  1,
  2,
  3,
  4,
  5,
  6,
  8,
  15,
  -17,
  -34,
  -51,
  -68,
  -81,
  -96,
  -100,
  -102,
  -115,
  -118,
  -128,
  -129,
  -134,
  -136,
  -146,
  -193,
  -196,
  -198,
  -211,
  -212,
  -225,
  -242,
  -243,
  -244,
  -247,
  -251,
  -255,
];

export const IconSmithApp: React.FC<IconSmithAppProps> = ({
  colorScheme,
  initialIconId = 'buttonfly',
  onUpdateTitle,
  onSaveFtiToVfs,
}) => {
  const [selectedIconId, setSelectedIconId] = useState<string>(
    IRIX_ICON_LIBRARY[initialIconId] ? initialIconId : 'buttonfly'
  );
  const [paths, setPaths] = useState<FtiPath[]>(() =>
    parseFtiScript(IRIX_ICON_LIBRARY[selectedIconId]?.ftiScript || '')
  );
  const [selectedPathIdx, setSelectedPathIdx] = useState<number>(0);
  const [activeColor, setActiveColor] = useState<FtiColorRef>('iconcolor');
  const [previewState, setPreviewState] = useState<IconVisualState>('normal');
  const [showMagicCarpet, setShowMagicCarpet] = useState<boolean>(true);
  const [showIsoGrid, setShowIsoGrid] = useState<boolean>(true);
  const [toolMode, setToolMode] = useState<'select' | 'drawPoly' | 'drawLine'>('select');
  const [draftVertices, setDraftVertices] = useState<{ x: number; y: number }[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>(
    'Ready — Drag vertices on 100x100 isometric canvas or select a path to recolor.'
  );

  const svgCanvasRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (initialIconId && IRIX_ICON_LIBRARY[initialIconId]) {
      handleLoadIcon(initialIconId);
    }
  }, [initialIconId]);

  const handleLoadIcon = (id: string) => {
    const def = IRIX_ICON_LIBRARY[id];
    if (!def) return;
    setSelectedIconId(id);
    const parsed = parseFtiScript(def.ftiScript);
    setPaths(parsed);
    setSelectedPathIdx(0);
    setShowMagicCarpet(def.useMagicCarpet);
    setDraftVertices([]);
    onUpdateTitle?.(`IconSmith — /usr/lib/filetype/iconlib/${def.filename}`);
    setStatusMsg(`Loaded ${def.filename} (${parsed.length} IRIS GL vector paths)`);
  };

  const ftiSourceCode = useMemo(() => {
    const def = IRIX_ICON_LIBRARY[selectedIconId];
    return serializeFtiPaths(paths, def?.filename || 'custom.fti');
  }, [paths, selectedIconId]);

  const handleVertexMouseDown = (
    e: React.MouseEvent,
    pathIdx: number,
    vertIdx: number
  ) => {
    e.stopPropagation();
    if (toolMode !== 'select') return;
    setSelectedPathIdx(pathIdx);

    const svgEl = svgCanvasRef.current;
    if (!svgEl) return;

    const onMove = (ev: MouseEvent) => {
      const rect = svgEl.getBoundingClientRect();
      const rawX = ((ev.clientX - rect.left) / rect.width) * 100;
      const rawY = 100 - ((ev.clientY - rect.top) / rect.height) * 100;
      const clampedX = Math.max(0, Math.min(100, Math.round(rawX * 2) / 2));
      const clampedY = Math.max(0, Math.min(100, Math.round(rawY * 2) / 2));

      setPaths((prev) =>
        prev.map((p, pIdx) => {
          if (pIdx !== pathIdx) return p;
          const nextVerts = p.vertices.map((v, vIdx) =>
            vIdx === vertIdx ? { x: clampedX, y: clampedY } : v
          );
          return { ...p, vertices: nextVerts };
        })
      );
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (toolMode === 'select') return;
    const svgEl = svgCanvasRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(
      0,
      Math.min(100, Math.round(100 - ((e.clientY - rect.top) / rect.height) * 100))
    );
    irixAudio.playMenuClick();
    setDraftVertices((prev) => [...prev, { x, y }]);
  };

  const commitDraftShape = () => {
    if (draftVertices.length < 2) return;
    const newPath: FtiPath = {
      id: `path_${Date.now()}`,
      type: toolMode === 'drawLine' ? 'line' : 'outlinepolygon',
      fillColor: activeColor,
      strokeColor: 'outlinecolor',
      vertices: [...draftVertices],
    };
    setPaths((prev) => [...prev, newPath]);
    setSelectedPathIdx(paths.length);
    setDraftVertices([]);
    setToolMode('select');
    setStatusMsg(`Added new ${newPath.type} with ${newPath.vertices.length} vertices.`);
  };

  const applyColorToSelectedPath = (c: FtiColorRef) => {
    irixAudio.playMenuClick();
    setActiveColor(c);
    if (selectedPathIdx >= 0 && selectedPathIdx < paths.length) {
      setPaths((prev) =>
        prev.map((p, idx) => (idx === selectedPathIdx ? { ...p, fillColor: c } : p))
      );
      setStatusMsg(`Applied color(${c}) to Path_${selectedPathIdx}`);
    }
  };

  const deleteSelectedPath = () => {
    if (paths.length <= 1) return;
    setPaths((prev) => prev.filter((_, idx) => idx !== selectedPathIdx));
    setSelectedPathIdx(0);
    setStatusMsg(`Deleted Path_${selectedPathIdx}`);
  };

  const handleDownloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg(`Exported ${filename}`);
  };

  // Generate 30-degree isometric guide lines for the 100x100 canvas
  const isoGridLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = -100; i <= 200; i += 12.5) {
      // 2:1 isometric slope lines (+0.5 and -0.5)
      lines.push({ x1: 0, y1: i, x2: 100, y2: i + 50 });
      lines.push({ x1: 0, y1: i, x2: 100, y2: i - 50 });
    }
    for (let x = 0; x <= 100; x += 12.5) {
      lines.push({ x1: x, y1: 0, x2: x, y2: 100 });
    }
    return lines;
  }, []);

  const currentIconDef = IRIX_ICON_LIBRARY[selectedIconId];

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
        <span
          className="sgi-menubar-item"
          onClick={() => {
            if (currentIconDef && onSaveFtiToVfs) {
              onSaveFtiToVfs(currentIconDef.filename, ftiSourceCode);
              setStatusMsg(
                `Saved /usr/lib/filetype/iconlib/${currentIconDef.filename} to XFS!`
              );
            }
          }}
        >
          <u>S</u>ave to XFS
        </span>
        <span
          className="sgi-menubar-item"
          onClick={() =>
            handleDownloadFile(
              ftiSourceCode,
              currentIconDef?.filename || 'icon.fti',
              'text/plain'
            )
          }
        >
          <u>E</u>xport .FTI
        </span>
        <span
          className="sgi-menubar-item"
          onClick={() =>
            handleDownloadFile(
              exportFtiToSvg(paths, previewState),
              (currentIconDef?.id || 'icon') + '.svg',
              'image/svg+xml'
            )
          }
        >
          Export .<u>S</u>VG
        </span>
        <span
          className="sgi-menubar-item"
          onClick={() => setShowIsoGrid((v) => !v)}
        >
          <u>G</u>rid: {showIsoGrid ? 'ON' : 'OFF'}
        </span>
        <span
          className="sgi-menubar-item"
          onClick={() => handleLoadIcon(selectedIconId)}
        >
          <u>R</u>evert
        </span>
      </div>

      {/* Main 3-Column IconSmith Workspace */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, padding: '5px', gap: '6px' }}>
        {/* Left Column: IRIX .FTI Icon Set Selector & Path List */}
        <div
          style={{
            width: '175px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
          }}
        >
          <div style={{ fontSize: '11px', fontStyle: 'italic', fontWeight: 700 }}>
            IRIX .FTI Icon Library ({Object.keys(IRIX_ICON_LIBRARY).length}):
          </div>
          <div
            style={{
              flex: 1,
              background: '#d8d8d8',
              border: '1px solid #222',
              boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.35)',
              overflowY: 'auto',
              padding: '3px',
            }}
          >
            {Object.values(IRIX_ICON_LIBRARY).map((ic) => {
              const active = ic.id === selectedIconId;
              return (
                <div
                  key={ic.id}
                  onClick={() => {
                    irixAudio.playIconSelect();
                    handleLoadIcon(ic.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 5px',
                    cursor: 'pointer',
                    background: active ? '#325074' : 'transparent',
                    color: active ? '#ffe84a' : '#000',
                    fontWeight: active ? 700 : 500,
                    fontSize: '11px',
                  }}
                >
                  <IrixVectorIcon iconId={ic.id} size={22} useMagicCarpet={false} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ic.filename}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Polygon Paths in Current Icon */}
          <div style={{ fontSize: '11px', fontStyle: 'italic', fontWeight: 700 }}>
            IRIS GL Paths ({paths.length}):
          </div>
          <div
            style={{
              height: '110px',
              background: '#d8d8d8',
              border: '1px solid #222',
              overflowY: 'auto',
              padding: '2px',
              fontSize: '10.5px',
            }}
          >
            {paths.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => setSelectedPathIdx(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '2px 5px',
                  cursor: 'pointer',
                  background: idx === selectedPathIdx ? '#b8a87e' : 'transparent',
                  fontWeight: idx === selectedPathIdx ? 700 : 400,
                }}
              >
                <span>
                  #{idx} {p.type} ({p.vertices.length}v)
                </span>
                <span
                  style={{
                    width: '11px',
                    height: '11px',
                    background: resolveFtiColor(p.fillColor, previewState),
                    border: '1px solid #000',
                    display: 'inline-block',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Center Column: 100x100 Isometric Vector Drawing Canvas + Tool Strip */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            minWidth: 0,
          }}
        >
          {/* Drawing Tool Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexWrap: 'wrap',
              background: colorScheme.windowWell,
              padding: '3px 6px',
              border: '1px solid #666',
            }}
          >
            <button
              type="button"
              className="sgi-btn"
              onClick={() => {
                setToolMode('select');
                setDraftVertices([]);
              }}
              style={{
                padding: '2px 7px',
                fontSize: '11px',
                background: toolMode === 'select' ? '#b8a87e' : undefined,
                fontWeight: toolMode === 'select' ? 700 : 500,
              }}
            >
              ↖ Edit Vertices
            </button>
            <button
              type="button"
              className="sgi-btn"
              onClick={() => {
                setToolMode('drawPoly');
                setDraftVertices([]);
                setStatusMsg('Click points on isometric grid, then click Finish Shape.');
              }}
              style={{
                padding: '2px 7px',
                fontSize: '11px',
                background: toolMode === 'drawPoly' ? '#b8a87e' : undefined,
                fontWeight: toolMode === 'drawPoly' ? 700 : 500,
              }}
            >
              ⬠ +Polygon
            </button>
            <button
              type="button"
              className="sgi-btn"
              onClick={() => {
                setToolMode('drawLine');
                setDraftVertices([]);
                setStatusMsg('Click points on isometric grid, then click Finish Shape.');
              }}
              style={{
                padding: '2px 7px',
                fontSize: '11px',
                background: toolMode === 'drawLine' ? '#b8a87e' : undefined,
                fontWeight: toolMode === 'drawLine' ? 700 : 500,
              }}
            >
              ╱ +Line
            </button>
            {draftVertices.length >= 2 && (
              <button
                type="button"
                className="sgi-btn"
                onClick={commitDraftShape}
                style={{
                  padding: '2px 7px',
                  fontSize: '11px',
                  background: '#ffe84a',
                  fontWeight: 700,
                }}
              >
                ✓ Finish ({draftVertices.length} pts)
              </button>
            )}
            <button
              type="button"
              className="sgi-btn"
              onClick={deleteSelectedPath}
              style={{ padding: '2px 7px', fontSize: '11px', marginLeft: 'auto' }}
            >
              Delete Path
            </button>
          </div>

          {/* Isometric 100x100 Vector Editor Canvas */}
          <div
            style={{
              flex: 1,
              background: '#55799c',
              borderTop: '2px solid #222',
              borderLeft: '2px solid #222',
              borderRight: '2px solid #eee',
              borderBottom: '2px solid #eee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <svg
              ref={svgCanvasRef}
              viewBox="0 0 100 100"
              onClick={handleCanvasClick}
              style={{
                width: '92%',
                height: '92%',
                maxWidth: '330px',
                maxHeight: '330px',
                background: '#4b6e91',
                border: '1px solid rgba(255,255,255,0.45)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                cursor: toolMode === 'select' ? 'default' : 'crosshair',
              }}
            >
              {/* Isometric 30-degree Grid */}
              {showIsoGrid && (
                <g stroke="rgba(255,255,255,0.16)" strokeWidth="0.3">
                  {isoGridLines.map((ln, i) => (
                    <line key={i} x1={ln.x1} y1={ln.y1} x2={ln.x2} y2={ln.y2} />
                  ))}
                </g>
              )}

              {/* Render All Paths */}
              {paths.map((p, idx) => {
                const pts = p.vertices
                  .map((v) => `${v.x},${100 - v.y}`)
                  .join(' ');
                const fill = resolveFtiColor(p.fillColor, previewState);
                const stroke = resolveFtiColor(p.strokeColor ?? 'outlinecolor', previewState);
                const isSelected = idx === selectedPathIdx;

                return (
                  <g
                    key={p.id}
                    onClick={(e) => {
                      if (toolMode === 'select') {
                        e.stopPropagation();
                        setSelectedPathIdx(idx);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {p.type === 'line' ? (
                      <polyline
                        points={pts}
                        fill="none"
                        stroke={fill}
                        strokeWidth={isSelected ? 2.2 : 1.5}
                      />
                    ) : p.type === 'closedline' ? (
                      <polygon
                        points={pts}
                        fill="none"
                        stroke={fill}
                        strokeWidth={isSelected ? 2.2 : 1.5}
                      />
                    ) : (
                      <polygon
                        points={pts}
                        fill={fill}
                        stroke={p.type === 'outlinepolygon' ? stroke : 'none'}
                        strokeWidth={isSelected ? 1.8 : 1.25}
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Draggable Vertex Handles on Selected Path */}
                    {isSelected &&
                      toolMode === 'select' &&
                      p.vertices.map((v, vIdx) => (
                        <rect
                          key={vIdx}
                          x={v.x - 1.7}
                          y={100 - v.y - 1.7}
                          width={3.4}
                          height={3.4}
                          fill="#ffe84a"
                          stroke="#000"
                          strokeWidth={0.5}
                          style={{ cursor: 'move' }}
                          onMouseDown={(e) => handleVertexMouseDown(e, idx, vIdx)}
                        />
                      ))}
                  </g>
                );
              })}

              {/* Draft Shape in Progress */}
              {draftVertices.length > 0 && (
                <g>
                  <polyline
                    points={draftVertices.map((v) => `${v.x},${100 - v.y}`).join(' ')}
                    fill="none"
                    stroke="#ffe84a"
                    strokeWidth="1.2"
                    strokeDasharray="2,1"
                  />
                  {draftVertices.map((v, i) => (
                    <circle
                      key={i}
                      cx={v.x}
                      cy={100 - v.y}
                      r={1.8}
                      fill="#ff3333"
                      stroke="#fff"
                      strokeWidth="0.5"
                    />
                  ))}
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Right Column: IconSmith Color Palette + Multi-State Preview + Live .FTI Code */}
        <div
          style={{
            width: '240px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {/* Dynamic State Preview Box (Figure 2-5 & 2-6 from IRIX UI Guidelines!) */}
          <div
            style={{
              background: colorScheme.windowWell,
              border: '1px solid #555',
              padding: '5px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '11px', fontStyle: 'italic', fontWeight: 700 }}>
                Preview Box & States:
              </span>
              <label style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <input
                  type="checkbox"
                  checked={showMagicCarpet}
                  onChange={(e) => setShowMagicCarpet(e.target.checked)}
                />
                Magic Carpet
              </label>
            </div>

            <div
              style={{
                background: '#55799c',
                border: '1px solid #222',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
              }}
            >
              <IrixVectorIcon
                customPaths={paths}
                useMagicCarpet={showMagicCarpet}
                state={previewState}
                size={68}
              />
              <IrixVectorIcon
                customPaths={paths}
                useMagicCarpet={showMagicCarpet}
                state={previewState}
                size={38}
              />
              <IrixVectorIcon
                customPaths={paths}
                useMagicCarpet={showMagicCarpet}
                state={previewState}
                size={24}
              />
            </div>

            {/* State Toggle Buttons */}
            <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
              {(['normal', 'selected', 'opened', 'located'] as IconVisualState[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  className="sgi-btn"
                  onClick={() => setPreviewState(st)}
                  style={{
                    flex: 1,
                    padding: '2px 0',
                    fontSize: '9.5px',
                    background: previewState === st ? '#ffe84a' : undefined,
                    fontWeight: previewState === st ? 700 : 500,
                    textTransform: 'capitalize',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* IconSmith Color Palette (Dynamic Symbolic Colors + 256 Palette Swatches) */}
          <div
            style={{
              background: colorScheme.windowWell,
              border: '1px solid #555',
              padding: '5px',
            }}
          >
            <div style={{ fontSize: '11px', fontStyle: 'italic', fontWeight: 700, marginBottom: '4px' }}>
              IconSmith Color Palette:
            </div>
            {/* Symbolic Dynamic Colors */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
              {(
                [
                  { id: 'iconcolor', label: 'Icon Color' },
                  { id: 'outlinecolor', label: 'Outline' },
                  { id: 'shadowcolor', label: 'Shadow' },
                ] as const
              ).map((sym) => (
                <button
                  key={sym.id}
                  type="button"
                  className="sgi-btn"
                  onClick={() => applyColorToSelectedPath(sym.id)}
                  style={{
                    flex: 1,
                    padding: '2px 3px',
                    fontSize: '9.5px',
                    border: activeColor === sym.id ? '2px solid #ffe84a' : undefined,
                    fontWeight: 700,
                  }}
                >
                  {sym.label}
                </button>
              ))}
            </div>

            {/* Specific Color Swatch Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(9, 1fr)',
                gap: '2px',
              }}
            >
              {FEATURED_PALETTE_KEYS.filter((k) => typeof k === 'number').map((cKey) => {
                const rgb = SGI_FTI_COLOR_MAP[String(cKey)] || [180, 180, 180];
                const isCurr = activeColor === cKey;
                return (
                  <div
                    key={String(cKey)}
                    title={`SGI FTI color(${cKey}) — rgb(${rgb.join(',')})`}
                    onClick={() => applyColorToSelectedPath(cKey)}
                    style={{
                      height: '16px',
                      background: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`,
                      border: isCurr ? '2px solid #ffe84a' : '1px solid #222',
                      cursor: 'pointer',
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Live IRIS GL .FTI Script Source */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ fontSize: '10.5px', fontStyle: 'italic', fontWeight: 700 }}>
              IRIS GL .FTI Vector Source:
            </div>
            <textarea
              value={ftiSourceCode}
              onChange={(e) => {
                const parsed = parseFtiScript(e.target.value);
                if (parsed.length > 0) setPaths(parsed);
              }}
              spellCheck={false}
              style={{
                flex: 1,
                background: '#18222e',
                color: '#88f0b8',
                fontFamily: "'Courier New', monospace",
                fontSize: '10px',
                padding: '4px',
                border: '1px solid #222',
                resize: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div
        style={{
          height: '20px',
          background: colorScheme.windowWell,
          borderTop: '1px solid #777',
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10.5px',
          color: '#111',
        }}
      >
        <span>{statusMsg}</span>
        <span>Coordinate System: 100×100 IRIS GL Vector</span>
      </div>
    </div>
  );
};
