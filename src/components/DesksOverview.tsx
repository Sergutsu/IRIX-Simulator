import React from 'react';
import { DeskId, SgiColorScheme, WindowInstance } from '../state/osStore';
import { irixAudio } from '../sound/irixAudio';

interface DesksOverviewProps {
  activeDesk: DeskId;
  windows: WindowInstance[];
  colorScheme: SgiColorScheme;
  onSelectDesk: (desk: DeskId) => void;
  onFocusWindow: (winId: string) => void;
}

/**
 * Authentic SGI IRIX 6.5 "Desks Overview" (ov) Virtual Workspace Manager
 * Replicates bottom-left pager from Indigo Magic Desktop (with yellow active corner tab).
 */
export const DesksOverview: React.FC<DesksOverviewProps> = ({
  activeDesk,
  windows,
  colorScheme,
  onSelectDesk,
  onFocusWindow,
}) => {
  const desks: { id: DeskId; label: string; bg: string }[] = [
    { id: 'Main', label: 'Main', bg: '#507294' },
    { id: 'Desk 2', label: 'Desk 2', bg: '#7c6571' },
    { id: 'Desk 3', label: 'Desk 3', bg: '#486b5e' },
  ];

  const renderMiniWindows = (deskId: DeskId) => {
    const deskWins = windows.filter(
      (w) => !w.minimized && (w.deskId === deskId || (deskId !== 'Global' && w.deskId === 'Global'))
    );
    return deskWins.map((w) => {
      const leftPct = Math.max(2, Math.min(84, (w.x / 1280) * 100));
      const topPct = Math.max(18, Math.min(82, (w.y / 820) * 100));
      const widthPct = Math.max(14, Math.min(72, (w.width / 1280) * 100));
      const heightPct = Math.max(14, Math.min(62, (w.height / 820) * 100));
      return (
        <div
          key={w.id}
          title={w.title}
          onClick={(e) => {
            e.stopPropagation();
            irixAudio.playMenuClick();
            if (deskId !== 'Global') onSelectDesk(deskId);
            onFocusWindow(w.id);
          }}
          style={{
            position: 'absolute',
            left: `${leftPct}%`,
            top: `${topPct}%`,
            width: `${widthPct}%`,
            height: `${heightPct}%`,
            background: '#c4c4c4',
            border: '1px solid #111',
            boxShadow: 'inset 1px 1px 0 #fff',
          }}
        >
          <div
            style={{
              height: '3px',
              background: colorScheme.activeTitleBg,
              borderBottom: '1px solid #222',
            }}
          />
        </div>
      );
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: '10px',
        bottom: '10px',
        width: '286px',
        background: colorScheme.inactiveTitleBg,
        border: '1px solid #0d0d0d',
        boxShadow:
          '2px 3px 9px rgba(0,0,0,0.48), inset 1px 1px 0 rgba(255,255,255,0.6), inset -1px -1px 0 rgba(0,0,0,0.5)',
        padding: '4px',
        zIndex: 40,
        userSelect: 'none',
      }}
    >
      {/* 4Dwm Mini Header */}
      <div
        style={{
          height: '19px',
          background: colorScheme.activeTitleBg,
          border: '1px solid #181818',
          boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.65), inset -1px -1px 0 rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 6px',
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: '11.5px',
          color: colorScheme.activeTitleText,
        }}
      >
        <span>Desks Overview</span>
        <span style={{ fontSize: '10px', fontStyle: 'normal', opacity: 0.8 }}>
          [{activeDesk}]
        </span>
      </div>

      {/* Motif Menu Bar */}
      <div
        style={{
          height: '19px',
          background: colorScheme.windowSurface,
          borderLeft: '1px solid #181818',
          borderRight: '1px solid #181818',
          borderBottom: '1px solid #666',
          boxShadow: 'inset 1px 1px 0 #f4f4f4',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 7px',
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: '11px',
          color: '#000',
        }}
      >
        <span style={{ textDecoration: 'underline' }}>O</span>verview
        <span>Desk</span>
        <span>Window</span>
        <span style={{ marginLeft: 'auto' }}>Help</span>
      </div>

      {/* Miniature Desks Container */}
      <div
        style={{
          background: colorScheme.windowSurface,
          border: '1px solid #181818',
          borderTop: 'none',
          padding: '6px',
          display: 'flex',
          alignItems: 'stretch',
          gap: '6px',
          height: '72px',
        }}
      >
        {desks.map((d) => {
          const isCurrent = activeDesk === d.id;
          return (
            <div
              key={d.id}
              onClick={() => {
                irixAudio.playMenuClick();
                onSelectDesk(d.id);
              }}
              style={{
                flex: 1,
                background: d.bg,
                border: isCurrent ? '2px solid #111' : '1px solid #333',
                boxShadow: isCurrent
                  ? '0 0 0 1px #ffe84a, inset 1px 1px 2px rgba(0,0,0,0.4)'
                  : 'inset 1px 1px 2px rgba(0,0,0,0.4)',
                position: 'relative',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              {/* Desk Title Header inside Mini Pager (with yellow active indicator) */}
              <div
                style={{
                  height: '13px',
                  background: '#d8d8d8',
                  borderBottom: '1px solid #222',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: '#000',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '100%',
                    background: isCurrent ? '#ffe84a' : '#a8a8a8',
                    borderRight: '1px solid #222',
                    display: 'inline-block',
                    marginRight: '3px',
                  }}
                />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{d.label}</span>
              </div>

              {/* Scaled Live Windows */}
              {renderMiniWindows(d.id)}
            </div>
          );
        })}

        {/* Vertical Separator & Global Desk Column */}
        <div
          style={{
            width: '2px',
            background: '#666',
            borderRight: '1px solid #fff',
          }}
        />

        <div
          title="Global Windows (Visible across all Desks)"
          style={{
            width: '54px',
            background: '#486688',
            border: '1px solid #333',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '13px',
              background: '#d0d0d0',
              borderBottom: '1px solid #222',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '4px',
              fontSize: '9.5px',
              fontWeight: 700,
              color: '#000',
            }}
          >
            Global
          </div>
          {windows
            .filter((w) => w.deskId === 'Global' && !w.minimized)
            .map((w) => (
              <div
                key={w.id}
                style={{
                  position: 'absolute',
                  left: '15%',
                  top: '32%',
                  width: '65%',
                  height: '42%',
                  background: '#c4c4c4',
                  border: '1px solid #111',
                }}
              />
            ))}
        </div>
      </div>
    </div>
  );
};
