import React, { useState, useEffect, useRef } from 'react';
import { AppId, ColorSchemeId, DeskId, LaunchApp, SgiColorScheme } from '../state/osStore';
import { AW_PRODUCTS } from '../apps/explorer/awProducts';
import { APP_REGISTRY, toolchestKey } from '../apps/registry';
import type { AppRegistration, CustomToolchestEntry, ToolchestCategory } from '../apps/registry';
import type { ToolchestEdit } from '../state/osState';
import { irixAudio } from '../sound/irixAudio';

interface ToolchestProps {
  activeDesk: DeskId;
  colorScheme: SgiColorScheme;
  selectedDesktopIcon: string | null;
  soundEnabled: boolean;
  onLaunchApp: LaunchApp;
  onSelectColorScheme: (id: ColorSchemeId) => void;
  onSwitchDesk: (desk: DeskId) => void;
  onToggleSound: () => void;
  quickLaunchBar: boolean;
  onToggleQuickLaunchBar: () => void;
  onEmptyDumpster: () => void;
  onOpenPromMonitor: () => void;
  onOpenClogin: () => void;
  /** user edits and added entries from the Toolchest editor */
  toolchestEdits: Record<string, ToolchestEdit>;
  toolchestCustom: CustomToolchestEntry[];
}

interface MenuItem {
  label: string;
  /** places the item among the other entries in its drawer */
  order: number;
  action?: () => void;
  submenu?: MenuItem[];
  dividerAfter?: boolean;
}

/**
 * Authentic SGI IRIX 6.5 Toolchest (Top-Left Cascading Menu Panel)
 * Replicates *toolchest.clientDecoration: title -border from .Xdefaults
 */
export const Toolchest: React.FC<ToolchestProps> = ({
  colorScheme,
  selectedDesktopIcon,
  soundEnabled,
  toolchestEdits,
  toolchestCustom,
  onLaunchApp,
  onSelectColorScheme,
  onSwitchDesk,
  onToggleSound,
  quickLaunchBar,
  onToggleQuickLaunchBar,
  onEmptyDumpster,
  onOpenPromMonitor,
  onOpenClogin,
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveCategory(null);
        setActiveSubmenu(null);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, []);

  /**
   * Application entries for a Toolchest drawer come from the application
   * registry, so a new application appears in the menus by being added there.
   * Only the desktop's own actions (colour schemes, desks, toggles, the PROM
   * monitor) stay here, because they are not applications.
   *
   * User edits from the Toolchest editor (rename, reorder, hide, delete) and
   * the user's own added entries are layered on top.
   */
  const placements = (category: ToolchestCategory, submenu?: string): MenuItem[] => {
    const built = (Object.entries(APP_REGISTRY) as [AppId, AppRegistration][]).flatMap(
      ([appId, app]) =>
        (app.toolchest ?? [])
          .filter((pl) => pl.category === category && pl.submenu === submenu)
          .map((pl) => ({ ...pl, appId, key: toolchestKey(appId, pl) }))
    );
    const custom = toolchestCustom
      .filter((c) => c.category === category && c.submenu === submenu)
      .map((c) => ({ ...c, key: `custom:${c.id}`, custom: true }));
    return [...built, ...custom]
      .map((pl) => {
        const edit = toolchestEdits[pl.key] ?? {};
        return {
          label: edit.label ?? pl.label,
          order: edit.order ?? pl.order,
          dividerAfter: 'dividerAfter' in pl ? pl.dividerAfter : undefined,
          key: pl.key,
          edited: Object.keys(edit).length > 0,
          action: () => onLaunchApp(pl.appId, pl.payload),
        };
      })
      .filter((pl) => {
        const edit = toolchestEdits[pl.key] ?? {};
        return !edit.hidden && !edit.deleted;
      })
      .sort((a, b) => a.order - b.order);
  };

  const ordered = (items: MenuItem[]) => items.slice().sort((a, b) => a.order - b.order);

  const categories: { id: string; label: string; items: MenuItem[] }[] = [
    {
      id: 'Desktop',
      label: 'Desktop',
      items: ordered([
        { label: 'Access Files', order: 1, submenu: placements('Desktop', 'Access Files') },
        {
          label: 'Customize',
          order: 2,
          dividerAfter: true,
          submenu: ordered([
            { label: 'Color Schemes (Indigo Magic)', order: 1, action: () => onSelectColorScheme('indigo_magic') },
            { label: 'Color Scheme: Rio Grande', order: 2, action: () => onSelectColorScheme('rio_grande') },
            { label: 'Color Scheme: Redwood', order: 3, action: () => onSelectColorScheme('redwood') },
            { label: 'Color Scheme: Gainsborough', order: 4, action: () => onSelectColorScheme('gainsborough') },
            { label: 'Color Scheme: Midnight Onyx', order: 5, action: () => onSelectColorScheme('midnight_onyx'), dividerAfter: true },
            ...placements('Desktop', 'Customize'),
            {
              label: `Audio Cues: ${soundEnabled ? 'Enabled (ON)' : 'Muted (OFF)'}`,
              order: 9,
              action: onToggleSound,
            },
            {
              label: `Quick Launch Bar: ${quickLaunchBar ? 'Shown' : 'Hidden'}`,
              order: 10,
              action: onToggleQuickLaunchBar,
            },
          ]),
        },
        ...placements('Desktop'),
        {
          label: 'Switch Desk',
          order: 5,
          submenu: [
            { label: 'Main Desk', order: 1, action: () => onSwitchDesk('Main') },
            { label: 'Desk 2 (IconSmith Studio)', order: 2, action: () => onSwitchDesk('Desk 2') },
            { label: 'Desk 3 (3D Graphics / fsn)', order: 3, action: () => onSwitchDesk('Desk 3') },
          ],
        },
        { label: 'Empty Dumpster', order: 6, action: onEmptyDumpster, dividerAfter: true },
        { label: 'Lock Screen (clogin)', order: 8, action: onOpenClogin },
        { label: 'SGI PROM Command Monitor...', order: 9, action: onOpenPromMonitor },
      ]),
    },
    {
      id: 'Selected',
      label: 'Selected',
      items: [
        {
          label: selectedDesktopIcon ? `Open "${selectedDesktopIcon}"` : 'Open Selected Icon',
          order: 1,
          action: () => onLaunchApp('file_manager'),
        },
        {
          label: 'Edit Vector Icon in IconSmith...',
          order: 2,
          action: () => onLaunchApp('iconsmith', { iconId: selectedDesktopIcon || 'showcase' }),
          dividerAfter: true,
        },
        {
          label: 'Get File Type Info (.ftr)',
          order: 3,
          action: () => onLaunchApp('file_manager'),
        },
        { label: 'Open in Text Editor (jot)', order: 4, action: () => onLaunchApp('jot') },
      ],
    },
    {
      id: 'Internet',
      label: 'Internet',
      items: placements('Internet'),
    },
    {
      id: 'Wavefront',
      label: 'Wavefront',
      items: [
        { label: 'The Director', order: 1, action: () => onLaunchApp('director') },
        ...AW_PRODUCTS.map((product, i) => ({
          label: product.id === 'model' ? 'Advanced Visualizer Model 4.2.1' : product.label,
          order: i + 2,
          action: () => onLaunchApp(product.appId, product.payload),
        })),
      ],
    },
    { id: 'Find', label: 'Find', items: placements('Find') },
    { id: 'System', label: 'System', items: placements('System') },
    { id: 'Demos', label: 'SGI Demos', items: placements('Demos') },
    { id: 'Help', label: 'Help', items: placements('Help') },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: '10px',
        top: '10px',
        width: '126px',
        background: colorScheme.windowSurface,
        border: '1px solid #0d0d0d',
        boxShadow: '2px 3px 8px rgba(0, 0, 0, 0.48)',
        zIndex: 8000,
        userSelect: 'none',
      }}
    >
      {/* Toolchest Khaki-Gold Title Header */}
      <div
        style={{
          height: '20px',
          background: colorScheme.activeTitleBg,
          color: colorScheme.activeTitleText,
          borderBottom: '1px solid #111',
          boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.65), inset -1px -1px 0 rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 7px',
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: '12px',
        }}
      >
        Toolchest
      </div>

      {/* Toolchest Category Rows */}
      {categories.map((cat) => {
        const isOpen = activeCategory === cat.id;
        return (
          <div
            key={cat.id}
            style={{ position: 'relative' }}
            onMouseEnter={() => {
              if (activeCategory) {
                setActiveCategory(cat.id);
                setActiveSubmenu(null);
              }
            }}
          >
            <div
              onClick={() => {
                irixAudio.playMenuClick();
                if (isOpen) {
                  setActiveCategory(null);
                  setActiveSubmenu(null);
                } else {
                  setActiveCategory(cat.id);
                  setActiveSubmenu(null);
                }
              }}
              style={{
                height: '23px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 6px 0 8px',
                background: isOpen ? '#adadad' : colorScheme.windowSurface,
                boxShadow: isOpen
                  ? 'inset 1px 1px 0 #555, inset -1px -1px 0 #f2f2f2'
                  : 'inset 1px 1px 0 #f4f4f4, inset -1px -1px 0 #666',
                borderBottom: '1px solid #333',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: '12px',
                  color: '#000',
                }}
              >
                {cat.label}
              </span>

              {/* Authentic SGI Toolchest 3D Ledge/Drawer Cascade Glyph (matching i-3.png) */}
              <span
                style={{
                  width: '10px',
                  height: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1px',
                }}
              >
                <span
                  style={{
                    height: '2px',
                    background: '#ddd',
                    border: '1px solid #111',
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    background: '#ccc',
                    border: '1px solid #111',
                    boxShadow: 'inset 1px 1px 0 #fff',
                  }}
                />
              </span>
            </div>

            {/* Primary Cascading Menu */}
            {isOpen && (
              <div
                style={{
                  position: 'absolute',
                  left: '125px',
                  top: '-1px',
                  width: '215px',
                  background: colorScheme.windowSurface,
                  border: '1px solid #111',
                  boxShadow:
                    '3px 4px 10px rgba(0,0,0,0.52), inset 1px 1px 0 #f4f4f4, inset -1px -1px 0 #666',
                  padding: '2px',
                  zIndex: 8100,
                }}
              >
                {cat.items.map((item, idx) => {
                  const hasSub = Boolean(item.submenu && item.submenu.length > 0);
                  const subOpen = activeSubmenu === item.label;
                  return (
                    <React.Fragment key={idx}>
                      <div
                        style={{ position: 'relative' }}
                        onMouseEnter={() => setActiveSubmenu(hasSub ? item.label : null)}
                      >
                        <div
                          className="sgi-menu-item"
                          onClick={() => {
                            if (item.action) {
                              irixAudio.playMenuClick();
                              item.action();
                              setActiveCategory(null);
                              setActiveSubmenu(null);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 8px',
                            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                            fontStyle: 'italic',
                            fontWeight: 700,
                            fontSize: '12px',
                            color: '#000',
                            cursor: 'pointer',
                            background: subOpen ? '#b8a87e' : 'transparent',
                          }}
                        >
                          <span>{item.label}</span>
                          {hasSub && <span style={{ fontSize: '9px' }}>▸</span>}
                        </div>

                        {/* Secondary Cascading Submenu */}
                        {hasSub && subOpen && item.submenu && (
                          <div
                            style={{
                              position: 'absolute',
                              left: '211px',
                              top: '-2px',
                              width: '225px',
                              background: colorScheme.windowSurface,
                              border: '1px solid #111',
                              boxShadow:
                                '3px 4px 10px rgba(0,0,0,0.52), inset 1px 1px 0 #f4f4f4, inset -1px -1px 0 #666',
                              padding: '2px',
                              zIndex: 8200,
                            }}
                          >
                            {item.submenu.map((sub, sIdx) => (
                              <React.Fragment key={sIdx}>
                                <div
                                  className="sgi-menu-item"
                                  onClick={() => {
                                    irixAudio.playMenuClick();
                                    sub.action?.();
                                    setActiveCategory(null);
                                    setActiveSubmenu(null);
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    fontFamily:
                                      "'Helvetica Neue', Helvetica, Arial, sans-serif",
                                    fontStyle: 'italic',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    color: '#000',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {sub.label}
                                </div>
                                {sub.dividerAfter && (
                                  <div
                                    style={{
                                      borderTop: '1px solid #666',
                                      borderBottom: '1px solid #f4f4f4',
                                      margin: '2px 0',
                                    }}
                                  />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </div>
                      {item.dividerAfter && (
                        <div
                          style={{
                            borderTop: '1px solid #666',
                            borderBottom: '1px solid #f4f4f4',
                            margin: '2px 0',
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
