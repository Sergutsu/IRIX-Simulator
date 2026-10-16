/**
 * The right-hand column of desktop icons on the 4Dwm root window.
 *
 * Icons start in their factory slot but can be dragged anywhere on the root
 * window, sent to the dumpster from their Properties dialog, and brought back
 * from there too. The list itself comes from the application registry.
 */
import React, { useRef } from 'react';
import { SgiColorScheme } from '../state/osStore';
import { IrixVectorIcon } from '../icons/irixIconSet';
import type { DesktopIcon } from '../apps/registry';
import { irixAudio } from '../sound/irixAudio';
import type { DesktopIconState } from '../state/osState';

export interface DesktopIconsProps {
  colorScheme: SgiColorScheme;
  icons: DesktopIcon[];
  state: Record<string, DesktopIconState>;
  cellSize: number;
  iconSize: number;
  selectedId: string | null;
  launchingId: string | null;
  onSelect: (id: string | null) => void;
  onLaunch: (icon: DesktopIcon) => void;
  onMove: (id: string, x: number, y: number) => void;
  onProperties: (icon: DesktopIcon, at: { x: number; y: number }) => void;
}

const COLUMN_RIGHT = 14;
const COLUMN_TOP = 12;
/** how close to the root window edge an icon may be dragged */
const EDGE = 6;

export const DesktopIcons: React.FC<DesktopIconsProps> = ({
  icons,
  state,
  cellSize,
  iconSize,
  selectedId,
  launchingId,
  onSelect,
  onLaunch,
  onMove,
  onProperties,
}) => {
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);

  /**
   * The root window is a scaled framebuffer, so client pixels have to be
   * converted before they mean anything. `scale` is framebuffer pixels per
   * client pixel, read off the full-size wrapper.
   */
  const scaleOf = (host: HTMLElement) =>
    host.getBoundingClientRect().width ? host.offsetWidth / host.getBoundingClientRect().width : 1;

  const onMouseMove = (e: React.MouseEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const host = e.currentTarget as HTMLElement;
    const rect = host.getBoundingClientRect();
    const scale = scaleOf(host);
    onMove(
      drag.id,
      Math.max(EDGE, (e.clientX - rect.left) * scale - drag.dx),
      Math.max(EDGE, (e.clientY - rect.top) * scale - drag.dy)
    );
  };

  return (
    <div
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      onMouseMove={onMouseMove}
      onMouseUp={() => {
        dragRef.current = null;
      }}
      onMouseLeave={() => {
        dragRef.current = null;
      }}
    >
      {icons.map((icon, index) => {
        if (state[icon.id]?.hidden) return null;
        const isSelected = selectedId === icon.id;
        const isLaunching = launchingId === icon.id;
        const vState = isLaunching ? 'opened' : isSelected ? 'selected' : 'normal';
        const pos = state[icon.id]?.pos;

        return (
          <div
            key={icon.id}
            onClick={(e) => {
              e.stopPropagation();
              irixAudio.playIconSelect();
              onSelect(icon.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onLaunch(icon);
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onSelect(icon.id);
              onProperties(icon, { x: e.clientX, y: e.clientY });
            }}
            onMouseDown={(e) => {
              // left button drags the icon, as on a real root window
              if (e.button !== 0) return;
              e.stopPropagation();
              const host = e.currentTarget.parentElement as HTMLElement;
              const self = e.currentTarget.getBoundingClientRect();
              const scale = scaleOf(host);
              dragRef.current = {
                id: icon.id,
                dx: (e.clientX - self.left) * scale,
                dy: (e.clientY - self.top) * scale,
              };
            }}
            title={`Double-click to open ${icon.label}`}
            style={{
              position: 'absolute',
              ...(pos
                ? { left: pos.x, top: pos.y }
                : { right: COLUMN_RIGHT, top: COLUMN_TOP + index * cellSize }),
              width: '78px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            <IrixVectorIcon
              iconId={icon.iconId}
              useMagicCarpet={icon.useMagicCarpet}
              state={vState}
              size={iconSize}
            />
            <span
              style={{
                marginTop: '2px',
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: '11.5px',
                color: isSelected ? '#ffe84a' : '#ffffff',
                textShadow: '1px 1px 2px #000, 0 0 3px rgba(0,0,0,0.85)',
                background: isSelected ? 'rgba(0,0,0,0.42)' : 'transparent',
                padding: '0 4px',
                whiteSpace: 'nowrap',
              }}
            >
              {icon.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};