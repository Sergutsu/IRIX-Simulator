/**
 * "Properties" for a desktop icon — the same dialog 4Dwm put up when you
 * selected an icon and chose Properties from the root window menu.
 *
 * Shows what the icon is and where it points, and is where an icon is sent to
 * the dumpster or brought back from it.
 */
import React from 'react';
import { SgiColorScheme, VfsNode } from '../state/osStore';
import type { DesktopIcon } from '../apps/registry';

export interface DesktopIconPropertiesProps {
  colorScheme: SgiColorScheme;
  icon: DesktopIcon;
  at: { x: number; y: number };
  /** the matching XFS node, when the icon also exists in the filesystem */
  node?: VfsNode;
  onClose: () => void;
  onOpen: () => void;
  onDelete: () => void;
}

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', gap: '8px', padding: '2px 0', alignItems: 'baseline' }}>
    <span
      style={{
        width: '92px',
        flexShrink: 0,
        textAlign: 'right',
        fontSize: '11px',
        color: '#333',
        fontWeight: 700,
      }}
    >
      {label}:
    </span>
    <span style={{ fontSize: '12px', color: '#111', wordBreak: 'break-all' }}>{value}</span>
  </div>
);

export const DesktopIconProperties: React.FC<DesktopIconPropertiesProps> = ({
  colorScheme,
  icon,
  at,
  node,
  onClose,
  onOpen,
  onDelete,
}) => (
  <div
    style={{
      position: 'fixed',
      left: Math.max(8, at.x),
      top: Math.max(8, at.y),
      minWidth: '320px',
      background: colorScheme.windowSurface,
      border: '1px solid #111',
      boxShadow: '3px 4px 12px rgba(0,0,0,0.55), inset 1px 1px 0 #fff, inset -1px -1px 0 #666',
      zIndex: 10000,
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    }}
  >
    <div
      style={{
        background: colorScheme.activeTitleBg,
        color: colorScheme.activeTitleText,
        padding: '3px 8px',
        borderBottom: '1px solid #222',
        fontStyle: 'italic',
        fontWeight: 700,
        fontSize: '12px',
      }}
    >
      Icon Properties
    </div>

    <div style={{ padding: '8px 10px' }}>
      <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{icon.label}</div>
      <Field label="Name" value={icon.label} />
      <Field label="Icon" value={icon.iconId} />
      <Field label="Opens" value={icon.appId} />
      <Field
        label="Launch args"
        value={icon.payload && Object.keys(icon.payload).length ? JSON.stringify(icon.payload) : '(none)'}
      />
      {node ? (
        <>
          <Field label="Type" value={node.type} />
          <Field label="Path" value={node.path} />
          <Field label="Size" value={`${node.size} bytes`} />
          <Field label="Modified" value={node.mtime} />
          <Field label="Permissions" value={node.permissions} />
          <Field label="Owner" value={node.owner} />
        </>
      ) : (
        <Field label="Path" value="(root window icon, not a file)" />
      )}
    </div>

    <div
      style={{
        display: 'flex',
        gap: '6px',
        padding: '6px 10px 8px',
        borderTop: '1px solid #999',
        justifyContent: 'flex-end',
      }}
    >
      <button type="button" className="sgi-btn" onClick={onDelete} style={BTN}>
        Send to Dumpster
      </button>
      <button type="button" className="sgi-btn" onClick={onOpen} style={BTN}>
        Open
      </button>
      <button type="button" className="sgi-btn" onClick={onClose} style={BTN}>
        Close
      </button>
    </div>
  </div>
);

const BTN: React.CSSProperties = {
  padding: '3px 12px',
  fontSize: '11.5px',
  fontWeight: 700,
};