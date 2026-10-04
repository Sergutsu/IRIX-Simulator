import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SgiColorScheme, VfsNode } from '../state/osStore';
import { irixAudio } from '../sound/irixAudio';

interface FcheckAppProps {
  colorScheme: SgiColorScheme;
  vfs: VfsNode[];
  initialPath?: string;
  onUpdateTitle?: (title: string) => void;
  onLaunchApp: (appId: 'explorer' | 'reference', payload?: Record<string, unknown>) => void;
}

/**
 * fcheck — the SGI image and movie sequence viewer.
 *
 * fcheck shipped with the Advanced Visualizer / Alias|Wavefront tool set (and
 * with IRIX itself) as the quick way to check a rendered frame or flip through
 * an image sequence before it went to Composer or out to video.  It plays SGI
 * RGB files, IFF/RIFF, TIFF, GIF, PNG, JPEG, MPEG and SGI movies.
 *
 * Here it displays everything on the virtual filesystem that carries an image:
 * frames rendered by the Wavefront Explorer, image files, and the real IRIX
 * reference captures.
 */
export const FcheckApp: React.FC<FcheckAppProps> = ({
  colorScheme,
  vfs,
  initialPath,
  onUpdateTitle,
  onLaunchApp,
}) => {
  const images = useMemo(
    () =>
      vfs
        .filter((n) => !!n.imageUrl)
        .map((n) => ({
          path: n.path,
          name: n.name,
          url: n.imageUrl as string,
          size: n.size,
          mtime: n.mtime,
          content: n.content,
        }))
        .sort((a, b) => a.path.localeCompare(b.path)),
    [vfs]
  );

  const initialIndex = Math.max(
    0,
    images.findIndex((i) => i.path === initialPath)
  );
  const [index, setIndex] = useState(initialIndex);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showInfo, setShowInfo] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const timerRef = useRef(0);

  useEffect(() => {
    const idx = images.findIndex((i) => i.path === initialPath);
    if (idx >= 0) setIndex(idx);
  }, [initialPath, images]);

  useEffect(() => {
    onUpdateTitle?.(
      images.length
        ? `fcheck — ${images[index]?.name ?? ''} (${index + 1} of ${images.length})`
        : 'fcheck — no images found'
    );
  }, [index, images, onUpdateTitle]);

  // sequence playback
  useEffect(() => {
    if (!playing || images.length < 2) return;
    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 400);
    return () => window.clearInterval(timerRef.current);
  }, [playing, images.length]);

  const current = images[index];

  // the renders written by the Explorer land in /usr/people/guest/renders
  const renderCount = images.filter((i) => i.path.startsWith('/usr/people/guest/renders/')).length;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: colorScheme.windowSurface,
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        position: 'relative',
      }}
      onClick={() => menuOpen && setMenuOpen(null)}
    >
      <div style={{ ...menubar, position: 'relative', zIndex: 20 }}>
        {[
          {
            id: 'file',
            label: 'File',
            items: [
              { label: 'Open Selection...', action: () => setShowInfo(true) },
              {
                label: 'Reload Sequence From Disk',
                action: () => {
                  setIndex(0);
                  setPlaying(false);
                },
              },
            ],
          },
          {
            id: 'view',
            label: 'View',
            items: [
              { label: 'Zoom In', action: () => setZoom((z) => Math.min(3, z + 0.25)) },
              { label: 'Zoom Out', action: () => setZoom((z) => Math.max(0.25, z - 0.25)) },
              { label: 'Fit to Window', action: () => setZoom(1) },
              { label: 'Toggle Info Line', action: () => setShowInfo((v) => !v) },
            ],
          },
          {
            id: 'play',
            label: 'Play',
            items: [
              { label: playing ? 'Stop' : `Play at 2.5 fps`, action: () => setPlaying((p) => !p) },
              { label: 'Next Frame', action: () => setIndex((i) => Math.min(images.length - 1, i + 1)) },
              { label: 'Previous Frame', action: () => setIndex((i) => Math.max(0, i - 1)) },
              { label: 'First Frame', action: () => setIndex(0) },
              { label: 'Last Frame', action: () => setIndex(Math.max(0, images.length - 1)) },
            ],
          },
          {
            id: 'help',
            label: 'Help',
            items: [
              { label: 'Open Wavefront Explorer', action: () => onLaunchApp('explorer', { mode: 'render' }) },
              { label: 'Real IRIX Screenshot Gallery', action: () => onLaunchApp('reference') },
            ],
          },
        ].map((m) => (
          <span key={m.id} style={{ position: 'relative' }}>
            <span
              className="sgi-menubar-item"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(menuOpen === m.id ? null : m.id);
              }}
            >
              {m.label}
            </span>
            {menuOpen === m.id && (
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: 0,
                  minWidth: '192px',
                  background: colorScheme.windowSurface,
                  border: '1px solid #111',
                  boxShadow: '3px 4px 10px rgba(0,0,0,0.5), inset 1px 1px 0 #fff, inset -1px -1px 0 #666',
                  padding: '2px',
                  zIndex: 40,
                }}
              >
                {m.items.map((it) => (
                  <div
                    key={it.label}
                    className="sgi-menu-item"
                    style={{ fontSize: '12px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(null);
                      it.action();
                    }}
                  >
                    <span>{it.label}</span>
                  </div>
                ))}
              </div>
            )}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 400, fontStyle: 'normal' }}>
          fcheck · SGI image &amp; movie sequence viewer
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* sequence list */}
        <div
          style={{
            width: '204px',
            background: '#b6b6b6',
            borderRight: '2px solid #6d6d6d',
            overflowY: 'auto',
            padding: '3px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              fontStyle: 'italic',
              padding: '3px 5px',
              borderBottom: '1px solid #8a8a8a',
            }}
          >
            {images.length} images ({renderCount} rendered)
          </div>
          {images.map((img, i) => (
            <div
              key={img.path}
              onClick={() => {
                setIndex(i);
                irixAudio.playIconSelect();
              }}
              style={{
                padding: '2px 5px',
                cursor: 'pointer',
                background: i === index ? '#b8a87e' : 'transparent',
                fontFamily: 'monospace',
                fontSize: '10.5px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={img.path}
            >
              {img.name}
            </div>
          ))}
          {!images.length && (
            <div style={{ padding: '8px', fontSize: '11px' }}>
              No images on this filesystem yet. Render a frame in the Wavefront Explorer.
            </div>
          )}
        </div>

        {/* image viewport — fcheck drew on a black IRIS GL window */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {current ? (
            <img
              src={current.url}
              alt={current.name}
              style={{
                maxWidth: zoom <= 1 ? '100%' : 'none',
                maxHeight: zoom <= 1 ? '100%' : 'none',
                width: zoom === 1 ? undefined : `${zoom * 100}%`,
                imageRendering: 'auto',
                transition: 'width 60ms linear',
              }}
            />
          ) : (
            <div style={{ color: '#8fb0d0', fontFamily: 'monospace', fontSize: '12px' }}>
              fcheck: no input files
            </div>
          )}
        </div>
      </div>

      {/* scrub bar */}
      <div
        style={{
          borderTop: '2px solid #6d6d6d',
          background: '#b9b9b9',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <button type="button" className="sgi-btn" style={{ padding: '1px 6px', fontWeight: 700 }} onClick={() => setIndex(0)}>
          |&lt;
        </button>
        <button
          type="button"
          className="sgi-btn"
          style={{ padding: '1px 6px', fontWeight: 700 }}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          &lt;
        </button>
        <button
          type="button"
          className="sgi-btn"
          style={{ padding: '1px 10px', fontWeight: 700 }}
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? '■ Stop' : '▶ Play'}
        </button>
        <button
          type="button"
          className="sgi-btn"
          style={{ padding: '1px 6px', fontWeight: 700 }}
          onClick={() => setIndex((i) => Math.min(images.length - 1, i + 1))}
        >
          &gt;
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(0, images.length - 1)}
          value={index}
          onChange={(e) => setIndex(parseInt(e.target.value, 10))}
          style={{ flex: 1, accentColor: '#4a4a4a' }}
        />
        <span style={{ fontFamily: 'monospace', fontSize: '11px', minWidth: '74px', textAlign: 'right' }}>
          {images.length ? `${index + 1}/${images.length}` : '0/0'}
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
          zoom {Math.round(zoom * 100)}%
        </span>
      </div>

      {showInfo && (
        <div
          style={{
            borderTop: '1px solid #8a8a8a',
            background: '#bdbdbd',
            padding: '3px 8px',
            fontFamily: 'monospace',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {current
            ? `${current.path}   ${current.size} bytes   ${current.mtime}   SGI RGB / 24-bit   (fcheck -n -f ${index + 1})`
            : 'fcheck: usage: fcheck [options] file...'}
        </div>
      )}
    </div>
  );
};

const menubar: React.CSSProperties = {
  height: '22px',
  background: '#c4c4c4',
  borderBottom: '1px solid #444',
  boxShadow: 'inset 1px 1px 0 #f4f4f4, inset -1px -1px 0 #777',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '0 8px',
  fontStyle: 'italic',
  fontWeight: 700,
  fontSize: '12px',
  flexShrink: 0,
};
