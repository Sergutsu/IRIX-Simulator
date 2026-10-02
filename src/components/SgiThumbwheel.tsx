import React, { useRef, useState } from 'react';

interface SgiThumbwheelProps {
  value: number;
  min: number;
  max: number;
  defaultValue?: number;
  onChange: (val: number) => void;
  title?: string;
}

/**
 * Authentic SGI Enhanced Motif Vertical Thumbwheel Widget (SgThumbWheel)
 * Used in File Manager & Icon Catalog to continuously scale .fti vector icons in real time.
 */
export const SgiThumbwheel: React.FC<SgiThumbwheelProps> = ({
  value,
  min,
  max,
  defaultValue = 62,
  onChange,
  title = 'Drag thumbwheel or scroll wheel to scale vector icons in real time',
}) => {
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);
  const startValRef = useRef(value);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;

    const handleMove = (ev: MouseEvent) => {
      // Moving up increases icon size, moving down decreases
      const dy = startYRef.current - ev.clientY;
      const next = Math.max(min, Math.min(max, Math.round(startValRef.current + dy * 0.65)));
      onChange(next);
    };

    const handleUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 4 : -4;
    onChange(Math.max(min, Math.min(max, value + delta)));
  };

  // Phase offset for animated ridges so the wheel visually rotates!
  const ridgeOffset = ((value * 2) % 6 + 6) % 6;

  return (
    <div
      className="sgi-thumbwheel-assembly"
      title={title}
      onWheel={handleWheel}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        userSelect: 'none',
      }}
    >
      {/* Recessed outer housing */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: '18px',
          height: '104px',
          background: '#666',
          borderTop: '2px solid #3a3a3a',
          borderLeft: '2px solid #3a3a3a',
          borderRight: '2px solid #efefef',
          borderBottom: '2px solid #efefef',
          padding: '2px',
          cursor: dragging ? 'grabbing' : 'ns-resize',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 10px 14px rgba(0,0,0,0.45), inset 0 -10px 14px rgba(0,0,0,0.45)',
        }}
      >
        {/* Cylindrical shading + rotating horizontal knurls */}
        <div
          style={{
            width: '100%',
            height: '100%',
            background: `linear-gradient(180deg, #555 0%, #999 18%, #e4e4e4 50%, #999 82%, #484848 100%)`,
            position: 'relative',
          }}
        >
          {Array.from({ length: 17 }).map((_, i) => {
            const topPx = i * 6 - ridgeOffset;
            if (topPx < 0 || topPx > 96) return null;
            // Ridges near top and bottom compress slightly for 3D cylinder illusion
            const distFromCenter = Math.abs(topPx - 48) / 48;
            const opacity = 0.85 - distFromCenter * 0.35;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${topPx}px`,
                  height: '2px',
                  borderTop: '1px solid rgba(30,30,30,0.85)',
                  borderBottom: '1px solid rgba(255,255,255,0.8)',
                  opacity,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Home / Reset Zoom Button */}
      <button
        type="button"
        onClick={() => onChange(defaultValue)}
        title={`Reset vector icon zoom (${defaultValue}px)`}
        className="sgi-btn"
        style={{
          width: '18px',
          height: '18px',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '9px',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            border: '1px solid #111',
            background: value === defaultValue ? '#b8a87e' : '#ddd',
            display: 'inline-block',
          }}
        />
      </button>
    </div>
  );
};
