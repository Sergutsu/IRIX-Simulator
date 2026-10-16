import React, { useState } from 'react';
import { LaunchApp, SgiColorScheme } from '../state/osStore';
import { IrixVectorIcon } from '../icons/irixIconSet';
import { IRIX_REFERENCE_SCREENSHOTS } from '../reference/irixScreenshots';

interface ReferenceGalleryAppProps {
  colorScheme: SgiColorScheme;
  onLaunchApp: LaunchApp;
}

/**
 * Real IRIX Screenshot Reference Gallery (SGI InSight book shelf style).
 *
 * The simulator ships the genuine captures it was tuned against; this reader
 * shows them together with notes on what each one is evidence for.
 */
export const ReferenceGalleryApp: React.FC<ReferenceGalleryAppProps> = ({
  colorScheme,
  onLaunchApp,
}) => {
  const [selectedId, setSelectedId] = useState(IRIX_REFERENCE_SCREENSHOTS[0].id);
  const [zoom, setZoom] = useState(1);
  const shot =
    IRIX_REFERENCE_SCREENSHOTS.find((s) => s.id === selectedId) ?? IRIX_REFERENCE_SCREENSHOTS[0];

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: colorScheme.windowSurface,
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <div className="sgi-menubar">
        <span className="sgi-menubar-item" onClick={() => setZoom(1)}>
          Full Size
        </span>
        <span className="sgi-menubar-item" onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}>
          Zoom In
        </span>
        <span className="sgi-menubar-item" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
          Zoom Out
        </span>
        <span
          className="sgi-menubar-item"
          onClick={() => onLaunchApp('explorer', { mode: 'model' })}
        >
          Open Wavefront Explorer
        </span>
        <span
          className="sgi-menubar-item"
          onClick={() => onLaunchApp('screensaver')}
        >
          Screen Saver Panel
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 400, fontStyle: 'normal' }}>
          {IRIX_REFERENCE_SCREENSHOTS.length} real captures · /usr/people/guest/screenshots
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* capture list */}
        <div
          style={{
            width: '236px',
            borderRight: '2px solid #6d6d6d',
            overflowY: 'auto',
            padding: '4px',
            background: '#b6b6b6',
          }}
        >
          {IRIX_REFERENCE_SCREENSHOTS.map((s) => {
            const active = s.id === selectedId;
            return (
              <div
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                style={{
                  display: 'flex',
                  gap: '7px',
                  alignItems: 'center',
                  padding: '5px 6px',
                  cursor: 'pointer',
                  background: active ? '#b8a87e' : 'transparent',
                  boxShadow: active
                    ? 'inset 1px 1px 0 #fff, inset -1px -1px 0 rgba(0,0,0,0.4)'
                    : undefined,
                  marginBottom: '2px',
                }}
              >
                <img
                  src={`/screenshots/${s.file}`}
                  alt=""
                  style={{
                    width: '52px',
                    height: '40px',
                    objectFit: 'cover',
                    border: '1px solid #222',
                    background: '#000',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    fontStyle: 'italic',
                    lineHeight: 1.2,
                  }}
                >
                  {s.title.split('(')[0].trim()}
                </span>
              </div>
            );
          })}
        </div>

        {/* viewer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              background: '#33506e',
              borderTop: '2px solid #2c3e50',
              borderLeft: '2px solid #2c3e50',
              borderRight: '2px solid #efefef',
              borderBottom: '2px solid #efefef',
              padding: '10px',
              textAlign: 'center',
            }}
          >
            <img
              src={`/screenshots/${shot.file}`}
              alt={shot.title}
              style={{
                maxWidth: zoom === 1 ? '100%' : 'none',
                width: zoom === 1 ? undefined : `${zoom * 100}%`,
                border: '1px solid #101820',
                boxShadow: '0 3px 10px rgba(0,0,0,0.5)',
                background: '#000',
                imageRendering: 'auto',
              }}
            />
          </div>

          <div
            style={{
              maxHeight: '188px',
              overflowY: 'auto',
              padding: '8px 12px',
              borderTop: '1px solid #8f8f8f',
              background: colorScheme.windowSurface,
            }}
          >
            <div style={{ fontWeight: 700, fontStyle: 'italic', fontSize: '12.5px' }}>{shot.title}</div>
            <div style={{ fontSize: '11px', marginTop: '2px' }}>
              <b>Source:</b> {shot.source}
            </div>
            <div style={{ fontSize: '11px' }}>
              <b>Credit:</b> {shot.credit}
            </div>
            <div style={{ fontSize: '11px' }}>
              <b>Licence / status:</b> {shot.license}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '5px' }}>
              What it is evidence for:
            </div>
            <ul style={{ margin: '2px 0 0 16px', padding: 0, fontSize: '11px', lineHeight: 1.35 }}>
              {shot.shows.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            {shot.notes && (
              <div style={{ fontSize: '11px', fontStyle: 'italic', marginTop: '4px' }}>{shot.notes}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
