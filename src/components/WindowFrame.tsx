import React, { useRef, useState } from 'react';
import { DeskId, SgiColorScheme, WindowInstance } from '../state/osStore';
import { clampWindow, screenMetrics, screenScale } from '../state/screen';
import { irixAudio } from '../sound/irixAudio';

interface WindowFrameProps {
  win: WindowInstance;
  isActive: boolean;
  focusMode: 'click' | 'followMouse';
  colorScheme: SgiColorScheme;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onToggleShade: (id: string) => void;
  onMoveResize: (
    id: string,
    patch: Partial<Pick<WindowInstance, 'x' | 'y' | 'width' | 'height'>>
  ) => void;
  onChangeDesk: (id: string, deskId: DeskId) => void;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  win,
  isActive,
  focusMode,
  colorScheme,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onToggleShade,
  onMoveResize,
  onChangeDesk,
  children,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const handleTitleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    onFocus(win.id);
    setMenuOpen(false);
    if (win.maximized) return;

    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = win.x;
    const origY = win.y;

    const onMove = (ev: MouseEvent) => {
      // the desktop is scaled as a whole, so screen pixels -> framebuffer pixels
      const s = screenScale();
      const p = clampWindow(
        origX + (ev.clientX - startX) / s,
        origY + (ev.clientY - startY) / s,
        win.width,
        win.height
      );
      onMoveResize(win.id, p);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    dir: 'e' | 's' | 'se' | 'w' | 'sw'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    onFocus(win.id);
    if (win.maximized) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = win.x;
    const origW = win.width;
    const origH = win.height;

    const onMove = (ev: MouseEvent) => {
      const s = screenScale();
      const dx = (ev.clientX - startX) / s;
      const dy = (ev.clientY - startY) / s;
      const patch: Partial<Pick<WindowInstance, 'x' | 'y' | 'width' | 'height'>> = {};

      if (dir.includes('e')) {
        patch.width = Math.max(300, origW + dx);
      }
      if (dir.includes('s')) {
        patch.height = Math.max(200, origH + dy);
      }
      if (dir.includes('w')) {
        const newW = Math.max(300, origW - dx);
        patch.x = origX + (origW - newW);
        patch.width = newW;
      }
      onMoveResize(win.id, patch);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const borderBg = isActive ? colorScheme.activeTitleBg : colorScheme.inactiveTitleBg;
  const titleText = isActive ? colorScheme.activeTitleText : colorScheme.inactiveTitleText;

  const metrics = screenMetrics();
  const style: React.CSSProperties = win.maximized
    ? {
        position: 'absolute',
        left: '4px',
        top: '4px',
        width: `${metrics.width - 8}px`,
        height: `${metrics.height - 8}px`,
        zIndex: win.zIndex,
      }
    : {
        position: 'absolute',
        left: `${win.x}px`,
        top: `${win.y}px`,
        width: `${win.width}px`,
        height: win.shaded ? 'auto' : `${win.height}px`,
        zIndex: win.zIndex,
      };

  return (
    <div
      ref={frameRef}
      className={`sgi-4dwm-window ${isActive ? 'active' : 'inactive'}`}
      style={{
        ...style,
        background: borderBg,
        border: '1px solid #0d0d0d',
        boxShadow: isActive
          ? '3px 4px 12px rgba(0, 0, 0, 0.52), inset 1px 1px 0 rgba(255,255,255,0.65), inset -1px -1px 0 rgba(0,0,0,0.5)'
          : '2px 3px 8px rgba(0, 0, 0, 0.35), inset 1px 1px 0 rgba(255,255,255,0.5), inset -1px -1px 0 rgba(0,0,0,0.45)',
        padding: '5px',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
      }}
      onMouseDown={() => onFocus(win.id)}
      onMouseEnter={() => {
        if (focusMode === 'followMouse' && !isActive) {
          onFocus(win.id);
        }
      }}
    >
      {/* 4Dwm Corner Notch Marks */}
      <div className="sgi-corner-notch top-left" />
      <div className="sgi-corner-notch top-right" />
      <div className="sgi-corner-notch bottom-left" />
      <div className="sgi-corner-notch bottom-right" />

      {/* 4Dwm Titlebar */}
      <div
        style={{
          height: '22px',
          display: 'flex',
          alignItems: 'stretch',
          border: '1px solid #181818',
          background: borderBg,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* Left Window Menu Button (—) */}
        <button
          type="button"
          title="4Dwm Window Menu (Double-click to Close)"
          onClick={(e) => {
            e.stopPropagation();
            irixAudio.playMenuClick();
            setMenuOpen((v) => !v);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onClose(win.id);
          }}
          style={{
            width: '22px',
            background: borderBg,
            border: 'none',
            borderRight: '1px solid #181818',
            boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.65), inset -1px -1px 0 rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              width: '11px',
              height: '3px',
              background: borderBg,
              border: '1px solid #111',
              boxShadow: '1px 1px 0 rgba(255,255,255,0.6)',
              display: 'block',
            }}
          />
        </button>

        {/* Center Italic Title Bar */}
        <div
          onMouseDown={handleTitleMouseDown}
          onDoubleClick={() => onMaximize(win.id)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.65), inset -1px -1px 0 rgba(0,0,0,0.5)',
            cursor: 'move',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: '12.5px',
              letterSpacing: '0.1px',
              color: titleText,
              textShadow:
                titleText === '#000000'
                  ? '0 1px 0 rgba(255,255,255,0.35)'
                  : '0 1px 1px rgba(0,0,0,0.65)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {win.title}
          </span>
          {win.deskId === 'Global' && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '9.5px',
                padding: '0 4px',
                background: 'rgba(0,0,0,0.2)',
                color: titleText,
                fontWeight: 600,
              }}
            >
              [Pinned]
            </span>
          )}
        </div>

        {/* Minimize Button (Tiny 4Dwm Square Dot) */}
        <button
          type="button"
          title="Minimize to Desktop Icon Tile"
          onClick={(e) => {
            e.stopPropagation();
            irixAudio.playWindowMinimize();
            onMinimize(win.id);
          }}
          style={{
            width: '21px',
            background: borderBg,
            border: 'none',
            borderLeft: '1px solid #181818',
            boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.65), inset -1px -1px 0 rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              width: '4px',
              height: '4px',
              background: borderBg,
              border: '1px solid #111',
              boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.7)',
              display: 'block',
            }}
          />
        </button>

        {/* Maximize Button (Larger 4Dwm Square) */}
        <button
          type="button"
          title={win.maximized ? 'Restore Size' : 'Maximize Window'}
          onClick={(e) => {
            e.stopPropagation();
            irixAudio.playMenuClick();
            onMaximize(win.id);
          }}
          style={{
            width: '21px',
            background: borderBg,
            border: 'none',
            borderLeft: '1px solid #181818',
            boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.65), inset -1px -1px 0 rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              background: borderBg,
              border: '1px solid #111',
              boxShadow: win.maximized
                ? 'inset -1px -1px 0 rgba(255,255,255,0.7), inset 1px 1px 0 rgba(0,0,0,0.6)'
                : 'inset 1px 1px 0 rgba(255,255,255,0.75), inset -1px -1px 0 rgba(0,0,0,0.5)',
              display: 'block',
            }}
          />
        </button>

        {/* 4Dwm Window System Dropdown Menu */}
        {menuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '22px',
              left: 0,
              width: '185px',
              background: colorScheme.windowSurface,
              border: '1px solid #111',
              boxShadow:
                '3px 3px 8px rgba(0,0,0,0.5), inset 1px 1px 0 #fff, inset -1px -1px 0 #666',
              zIndex: 9999,
              padding: '2px',
              fontSize: '12px',
              fontStyle: 'italic',
              fontWeight: 700,
            }}
          >
            <div
              className="sgi-menu-item"
              onClick={() => {
                setMenuOpen(false);
                onMinimize(win.id);
              }}
            >
              <span>Minimize</span>
              <span style={{ fontStyle: 'normal', fontSize: '10px', opacity: 0.75 }}>Alt+F9</span>
            </div>
            <div
              className="sgi-menu-item"
              onClick={() => {
                setMenuOpen(false);
                onMaximize(win.id);
              }}
            >
              <span>{win.maximized ? 'Restore' : 'Maximize'}</span>
              <span style={{ fontStyle: 'normal', fontSize: '10px', opacity: 0.75 }}>Alt+F10</span>
            </div>
            <div
              className="sgi-menu-item"
              onClick={() => {
                setMenuOpen(false);
                onToggleShade(win.id);
              }}
            >
              <span>{win.shaded ? 'Unroll Window' : 'Roll Up (Shade)'}</span>
            </div>
            <div style={{ borderTop: '1px solid #777', borderBottom: '1px solid #fff', margin: '2px 0' }} />
            <div style={{ padding: '3px 8px', fontSize: '10.5px', color: '#444' }}>
              Move to Desk:
            </div>
            {(['Main', 'Desk 2', 'Desk 3', 'Global'] as DeskId[]).map((d) => (
              <div
                key={d}
                className="sgi-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  onChangeDesk(win.id, d);
                }}
              >
                <span>
                  {win.deskId === d ? '✓ ' : '   '}
                  {d === 'Global' ? 'Global (All Desks)' : d}
                </span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #777', borderBottom: '1px solid #fff', margin: '2px 0' }} />
            <div
              className="sgi-menu-item"
              onClick={() => {
                setMenuOpen(false);
                onClose(win.id);
              }}
            >
              <span>Close</span>
              <span style={{ fontStyle: 'normal', fontSize: '10px', opacity: 0.75 }}>Alt+F4</span>
            </div>
          </div>
        )}
      </div>

      {/* Window Client Area */}
      {!win.shaded && (
        <div
          style={{
            flex: 1,
            background: colorScheme.windowSurface,
            border: '1px solid #181818',
            borderTop: 'none',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
          onClick={() => {
            if (menuOpen) setMenuOpen(false);
          }}
        >
          {children}
        </div>
      )}

      {/* Resize Handles */}
      {!win.maximized && !win.shaded && (
        <>
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
            style={{
              position: 'absolute',
              top: '18px',
              bottom: '18px',
              right: 0,
              width: '6px',
              cursor: 'ew-resize',
            }}
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
            style={{
              position: 'absolute',
              top: '18px',
              bottom: '18px',
              left: 0,
              width: '6px',
              cursor: 'ew-resize',
            }}
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
            style={{
              position: 'absolute',
              left: '18px',
              right: '18px',
              bottom: 0,
              height: '6px',
              cursor: 'ns-resize',
            }}
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: '18px',
              height: '18px',
              cursor: 'nwse-resize',
            }}
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: '18px',
              height: '18px',
              cursor: 'nesw-resize',
            }}
          />
        </>
      )}
    </div>
  );
};
