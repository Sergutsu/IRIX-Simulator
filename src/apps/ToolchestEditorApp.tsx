/**
 * Toolchest Editor — change what is in the Toolchest without editing code.
 *
 * Every entry the registry declares can be renamed, reordered, hidden or
 * deleted, and you can add your own entries that launch any registered
 * application. "Restore Defaults" puts the factory Toolchest back.
 */
import React, { useMemo, useState } from 'react';
import {
  APP_REGISTRY,
  toolchestKey,
  type AppRegistration,
  type CustomToolchestEntry,
  type ToolchestCategory,
} from './registry';
import type { SgiColorScheme, AppId, AppLaunchPayload } from '../state/osStore';
import type { ToolchestEdit } from '../state/osState';

export interface ToolchestEditorProps {
  colorScheme: SgiColorScheme;
  edits: Record<string, ToolchestEdit>;
  custom: CustomToolchestEntry[];
  onEdit: (key: string, edit: ToolchestEdit) => void;
  onAdd: (entry: CustomToolchestEntry) => void;
  onRemove: (id: string) => void;
  onReset: () => void;
}

const CATEGORIES: ToolchestCategory[] = ['Desktop', 'Internet', 'Find', 'System', 'Demos', 'Help'];

interface Row {
  key: string;
  label: string;
  order: number;
  appId: AppId;
  hidden: boolean;
  deleted: boolean;
  custom: boolean;
}

/** Built-in entries for one drawer, with the user's edits applied. */
function rowsFor(category: ToolchestCategory, edits: Record<string, ToolchestEdit>): Row[] {
  return (Object.entries(APP_REGISTRY) as [AppId, AppRegistration][])
    .flatMap(([appId, app]) =>
      (app.toolchest ?? [])
        .filter((pl) => pl.category === category)
        .map((pl) => {
          const key = toolchestKey(appId, pl);
          const edit = edits[key] ?? {};
          return {
            key,
            label: edit.label ?? pl.label,
            order: edit.order ?? pl.order,
            appId,
            hidden: !!edit.hidden,
            deleted: !!edit.deleted,
            custom: false,
          };
        })
    )
    .sort((a, b) => a.order - b.order);
}

const ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '3px 6px',
  borderBottom: '1px solid #bbb',
  fontSize: '12px',
};

const MINI: React.CSSProperties = {
  fontSize: '10.5px',
  padding: '1px 5px',
  minWidth: '22px',
};

export const ToolchestEditorApp: React.FC<ToolchestEditorProps> = ({
  colorScheme,
  edits,
  custom,
  onEdit,
  onAdd,
  onRemove,
  onReset,
}) => {
  const [category, setCategory] = useState<ToolchestCategory>('Desktop');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  // adding an entry
  const [newApp, setNewApp] = useState<AppId>('fcheck');
  const [newLabel, setNewLabel] = useState('');
  const [preset, setPreset] = useState<string>('');

  const built = rowsFor(category, edits);
  const mine = useMemo(
    () =>
      custom
        .filter((c) => c.category === category)
        .map((c) => ({
          key: `custom:${c.id}`,
          label: c.label,
          order: c.order,
          appId: c.appId,
          hidden: false,
          deleted: false,
          custom: true,
        }))
        .sort((a, b) => a.order - b.order),
    [custom, category]
  );
  const rows = [...built, ...mine];

  /** Factory launch targets for an app, offered as presets. */
  const presetsFor = (appId: AppId) => {
    const app = APP_REGISTRY[appId];
    const seen = new Set<string>();
    const out: { label: string; payload?: AppLaunchPayload }[] = [];
    for (const pl of app?.toolchest ?? []) {
      const payload = pl.payload;
      const k = JSON.stringify(payload ?? null);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ label: pl.label, payload });
    }
    if (!out.length) out.push({ label: '(no arguments)' });
    return out;
  };

  const swap = (key: string, delta: number) => {
    const row = rows.find((r) => r.key === key);
    if (!row) return;
    // step past any neighbour that would collide
    const others = rows.filter((r) => r.key !== key).map((r) => r.order);
    let order = row.order + delta;
    let guard = 0;
    while (others.includes(order) && guard++ < rows.length + 1) order += delta;
    onEdit(key, { order });
  };

  const addEntry = () => {
    const chosen = presetsFor(newApp).find((p) => p.label === preset) ?? presetsFor(newApp)[0];
    onAdd({
      id: `t${Date.now().toString(36)}`,
      category,
      label: newLabel.trim() || chosen?.label || newApp,
      order: (rows[rows.length - 1]?.order ?? 0) + 1,
      appId: newApp,
      payload: chosen?.payload,
    });
    setNewLabel('');
  };

  const btn = (onClick: () => void, children: React.ReactNode, title: string) => (
    <button type="button" className="sgi-btn" style={MINI} title={title} onClick={onClick}>
      {children}
    </button>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: colorScheme.windowSurface,
        color: '#111',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: '12px',
      }}
    >
      {/* drawer tabs */}
      <div style={{ display: 'flex', gap: '2px', padding: '4px 6px', borderBottom: '1px solid #888' }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className="sgi-btn"
            onClick={() => setCategory(c)}
            style={{
              ...MINI,
              padding: '2px 8px',
              fontWeight: 700,
              fontStyle: 'italic',
              background: c === category ? colorScheme.activeTitleBg : undefined,
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* entries */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 6px' }}>
        {rows.length === 0 && (
          <div style={{ padding: '10px 4px', fontStyle: 'italic' }}>No entries in this drawer.</div>
        )}
        {rows.map((row) => {
          const gone = row.hidden || row.deleted;
          return (
            <div key={row.key} style={{ ...ROW, opacity: gone ? 0.5 : 1 }}>
              <span style={{ width: '22px', textAlign: 'right', color: '#555' }}>{row.order}</span>
              {renaming === row.key ? (
                <input
                  autoFocus
                  className="sgi-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => {
                    onEdit(row.key, { label: draft.trim() || row.label });
                    setRenaming(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                    if (e.key === 'Escape') {
                      setDraft(row.label);
                      setRenaming(null);
                    }
                  }}
                  style={{ flex: 1, fontSize: '12px', padding: '1px 4px' }}
                />
              ) : (
                <span
                  style={{ flex: 1, textDecoration: row.deleted ? 'line-through' : undefined }}
                  title={row.appId}
                >
                  {row.label}
                  {row.custom ? ' *' : ''}
                </span>
              )}

              {btn(() => swap(row.key, -1), '↑', 'Move up')}
              {btn(() => swap(row.key, 1), '↓', 'Move down')}
              {btn(
                () => {
                  setRenaming(row.key);
                  setDraft(row.label);
                },
                '✎',
                'Rename'
              )}
              {row.custom
                ? btn(() => onRemove(row.key.replace('custom:', '')), '✕', 'Remove this entry')
                : btn(
                    () => onEdit(row.key, { deleted: !row.deleted }),
                    row.deleted ? '↺' : '🗑',
                    row.deleted ? 'Restore entry' : 'Delete entry'
                  )}
              {btn(
                () => onEdit(row.key, { hidden: !row.hidden }),
                row.hidden ? '◻' : '◼',
                row.hidden ? 'Show' : 'Hide'
              )}
            </div>
          );
        })}
      </div>

      {/* add an entry */}
      <div
        style={{
          borderTop: '1px solid #888',
          padding: '6px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '5px',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 700 }}>Add:</span>
        <select className="sgi-input" value={newApp} onChange={(e) => setNewApp(e.target.value as AppId)} style={{ fontSize: '11px' }}>
          {(Object.keys(APP_REGISTRY) as AppId[]).map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <select className="sgi-input" value={preset} onChange={(e) => setPreset(e.target.value)} style={{ fontSize: '11px' }}>
          {presetsFor(newApp).map((p) => (
            <option key={p.label} value={p.label}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          className="sgi-input"
          placeholder="label (optional)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          style={{ fontSize: '11px', flex: 1, minWidth: '90px' }}
        />
        <button type="button" className="sgi-btn" style={MINI} onClick={addEntry}>
          Add
        </button>
        <button
          type="button"
          className="sgi-btn"
          style={MINI}
          onClick={onReset}
          title="Undo every rename, reorder, hide, delete and added entry"
        >
          Restore Defaults
        </button>
      </div>
    </div>
  );
};

/** Short label for the app picker: the id, which matches the binaries. */
function APP_WINDOW_DEFAULTS_TITLE(id: AppId): string {
  return id;
}