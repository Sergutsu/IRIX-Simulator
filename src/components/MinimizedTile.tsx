import React, { useRef } from 'react';
import { WindowInstance } from '../state/osStore';
import { screenMetrics, screenScale } from '../state/screen';
import { IrixVectorIcon } from '../icons/irixIconSet';
import { irixAudio } from '../sound/irixAudio';

interface MinimizedTileProps {
  win: WindowInstance;
  onRestore: (id: string) => void;
  onMoveTile: (id: string, x: number, y: number) => void;
}

/**
 * Authentic 4Dwm Minimized Window Desktop Tile (68x70px Beveled Motif Square)
 * Matches the "Console", "InSight", and "The GIMP" minimized tiles in SGI IRIX 6.5.
 */
export const MinimizedTile: React.FC<MinimizedTileProps> = ({
  win,
  onRestore,
  onMoveTile,
}) => {
  const movedRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    movedRef.current = false;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = win.minTileX;
    const origY = win.minTileY;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        movedRef.current = true;
      }
      // framebuffer pixels, like every other window coordinate
      const s = screenScale();
      const m = screenMetrics();
      onMoveTile(
        win.id,
        Math.max(4, Math.min(m.width - 76, origX + dx / s)),
        Math.max(4, Math.min(m.height - 76, origY + dy / s))
      );
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const shortTitle = win.title.split(/[—:]/)[0].trim();

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={() => {
        irixAudio.playWindowRestore();
        onRestore(win.id);
      }}
      onClick={() => {
        if (!movedRef.current) {
          irixAudio.playWindowRestore();
          onRestore(win.id);
        }
      }}
      title={`Minimized 4Dwm Window: ${win.title} (Click to Restore)`}
      style={{
        position: 'absolute',
        left: `${win.minTileX}px`,
        top: `${win.minTileY}px`,
        width: '72px',
        height: '74px',
        background: '#b4b4b4',
        border: '1px solid #111',
        boxShadow:
          '2px 3px 6px rgba(0,0,0,0.45), inset 2px 2px 0 #efefef, inset -2px -2px 0 #666',
        display: 'flex',
        flexDirection: 'column',
        padding: '3px',
        cursor: 'pointer',
        userSelect: 'none',
        zIndex: 5,
      }}
    >
      {/* Inner recessed icon well */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(155deg, #5d7b99 0%, #334c66 100%)',
          borderTop: '1px solid #444',
          borderLeft: '1px solid #444',
          borderRight: '1px solid #e5e5e5',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <IrixVectorIcon iconId={win.iconId} useMagicCarpet={false} size={42} />
      </div>

      {/* Bottom Title Label Strip */}
      <div
        style={{
          height: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10.5px',
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontWeight: 600,
          color: '#000',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: '0 2px',
          marginTop: '2px',
        }}
      >
        {shortTitle}
      </div>
    </div>
  );
};
