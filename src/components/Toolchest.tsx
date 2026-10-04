import React, { useState, useEffect, useRef } from 'react';
import { AppId, ColorSchemeId, DeskId, SgiColorScheme } from '../state/osStore';
import { irixAudio } from '../sound/irixAudio';

interface ToolchestProps {
  activeDesk: DeskId;
  colorScheme: SgiColorScheme;
  selectedDesktopIcon: string | null;
  soundEnabled: boolean;
  onLaunchApp: (appId: AppId, payload?: Record<string, unknown>) => void;
  onSelectColorScheme: (id: ColorSchemeId) => void;
  onSwitchDesk: (desk: DeskId) => void;
  onToggleSound: () => void;
  onEmptyDumpster: () => void;
  onOpenPromMonitor: () => void;
  onOpenClogin: () => void;
}

interface MenuItem {
  label: string;
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
  onLaunchApp,
  onSelectColorScheme,
  onSwitchDesk,
  onToggleSound,
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

  const categories: { id: string; label: string; items: MenuItem[] }[] = [
    {
      id: 'Desktop',
      label: 'Desktop',
      items: [
        {
          label: 'Access Files',
          submenu: [
            {
              label: 'Home Directory (/usr/people/guest)',
              action: () => onLaunchApp('file_manager', { path: '/usr/people/guest' }),
            },
            {
              label: 'Icon Library (/usr/lib/filetype/iconlib)',
              action: () => onLaunchApp('file_manager', { path: '/usr/lib/filetype/iconlib' }),
            },
            {
              label: 'SGI Demos (/usr/demos)',
              action: () => onLaunchApp('file_manager', { path: '/usr/demos' }),
            },
            {
              label: '3D File System Navigator (fsn)',
              action: () => onLaunchApp('fsn'),
            },
          ],
        },
        {
          label: 'Customize',
          dividerAfter: true,
          submenu: [
            {
              label: 'Color Schemes (Indigo Magic)',
              action: () => onSelectColorScheme('indigo_magic'),
            },
            {
              label: 'Color Scheme: Rio Grande',
              action: () => onSelectColorScheme('rio_grande'),
            },
            {
              label: 'Color Scheme: Redwood',
              action: () => onSelectColorScheme('redwood'),
            },
            {
              label: 'Color Scheme: Gainsborough',
              action: () => onSelectColorScheme('gainsborough'),
            },
            {
              label: 'Color Scheme: Midnight Onyx',
              action: () => onSelectColorScheme('midnight_onyx'),
              dividerAfter: true,
            },
            {
              label: 'Screen Saver...',
              action: () => onLaunchApp('screensaver'),
            },
            {
              label: 'Background / Desktop Pattern...',
              action: () => onLaunchApp('system_manager', { tab: 'customize' }),
            },
            {
              label: 'Windows & Desktop Settings...',
              action: () => onLaunchApp('system_manager', { tab: 'customize' }),
            },
            {
              label: `Audio Cues: ${soundEnabled ? 'Enabled (ON)' : 'Muted (OFF)'}`,
              action: onToggleSound,
            },
          ],
        },
        {
          label: 'Open Unix Shell (xwsh)',
          action: () => onLaunchApp('winterm'),
        },
        {
          label: 'Icon Catalog',
          action: () => onLaunchApp('icon_catalog'),
        },
        {
          label: 'Switch Desk',
          submenu: [
            { label: 'Main Desk', action: () => onSwitchDesk('Main') },
            { label: 'Desk 2 (IconSmith Studio)', action: () => onSwitchDesk('Desk 2') },
            { label: 'Desk 3 (3D Graphics / fsn)', action: () => onSwitchDesk('Desk 3') },
          ],
        },
        {
          label: 'Empty Dumpster',
          action: onEmptyDumpster,
          dividerAfter: true,
        },
        {
          label: 'Run Screen Saver Now (screen_blanker)',
          action: () => onLaunchApp('screensaver'),
        },
        {
          label: 'Lock Screen (clogin)',
          action: onOpenClogin,
        },
        {
          label: 'SGI PROM Command Monitor...',
          action: onOpenPromMonitor,
        },
      ],
    },
    {
      id: 'Selected',
      label: 'Selected',
      items: [
        {
          label: selectedDesktopIcon ? `Open "${selectedDesktopIcon}"` : 'Open Selected Icon',
          action: () => onLaunchApp('file_manager'),
        },
        {
          label: 'Edit Vector Icon in IconSmith...',
          action: () =>
            onLaunchApp('iconsmith', {
              iconId: selectedDesktopIcon || 'showcase',
            }),
          dividerAfter: true,
        },
        {
          label: 'Get File Type Info (.ftr)',
          action: () => onLaunchApp('file_manager'),
        },
        {
          label: 'Open in Text Editor (jot)',
          action: () => onLaunchApp('jot'),
        },
      ],
    },
    {
      id: 'Internet',
      label: 'Internet',
      items: [
        {
          label: 'Netscape Communicator 4.78',
          action: () => onLaunchApp('netscape', { page: 'siliconsurf' }),
        },
        {
          label: 'SGI SiliconSurf Portal',
          action: () => onLaunchApp('netscape', { page: 'siliconsurf' }),
        },
        {
          label: 'IRIX 6.5 Release Stream Notes',
          action: () => onLaunchApp('netscape', { page: 'irix65' }),
        },
        {
          label: 'Nekoware & SGI Freeware Archive',
          action: () => onLaunchApp('netscape', { page: 'nekoware' }),
        },
      ],
    },
    {
      id: 'Wavefront',
      label: 'WAVEFRONT Products',
      items: [
        {
          label: 'Explorer 2.0 (Maya predecessor)',
          action: () => onLaunchApp('explorer', { mode: 'model' }),
        },
        {
          label: 'Modeler / director (TAV)',
          action: () => onLaunchApp('explorer', { mode: 'model' }),
        },
        {
          label: 'Property (materials)',
          action: () => onLaunchApp('explorer', { mode: 'shade' }),
        },
        {
          label: 'Kinemation (animation)',
          action: () => onLaunchApp('explorer', { mode: 'animate' }),
        },
        {
          label: 'Preview / display (render)',
          action: () => onLaunchApp('explorer', { mode: 'render' }),
        },
        {
          label: 'fcheck (frame/sequence review)',
          action: () => onLaunchApp('fcheck'),
        },
      ],
    },
    {
      id: 'Find',
      label: 'Find',
      items: [
        {
          label: 'Icon Catalog (Applications & Tools)',
          action: () => onLaunchApp('icon_catalog'),
        },
        {
          label: 'Find an Icon (.fti Library)',
          action: () => onLaunchApp('iconsmith'),
        },
        {
          label: 'Files & Directories (File Manager)',
          action: () => onLaunchApp('file_manager'),
        },
        {
          label: '3D File System Navigator (fsn)',
          action: () => onLaunchApp('fsn'),
        },
      ],
    },
    {
      id: 'System',
      label: 'System',
      items: [
        {
          label: 'System Manager (sysmgr)',
          action: () => onLaunchApp('system_manager', { tab: 'hardware' }),
        },
        {
          label: 'System Performance (gr_osview)',
          action: () => onLaunchApp('gr_osview'),
        },
        {
          label: 'Software Manager 4.1 (swmgr)',
          action: () => onLaunchApp('software_manager'),
        },
        {
          label: 'Hardware Inventory (hinv)',
          action: () => onLaunchApp('winterm', { runCmd: 'hinv -v' }),
          dividerAfter: true,
        },
        {
          label: 'Switch SGI Workstation Hardware...',
          action: () => onLaunchApp('system_manager', { tab: 'hardware' }),
          dividerAfter: true,
        },
        {
          label: 'Real IRIX Screenshot Reference Gallery',
          action: () => onLaunchApp('reference'),
        },
      ],
    },
    {
      id: 'Demos',
      label: 'SGI Demos',
      items: [
        {
          label: 'fsn — 3D File System Navigator (1993)',
          action: () => onLaunchApp('fsn'),
        },
        {
          label: 'SGI 3D Cube & OpenGL Showcase',
          action: () => onLaunchApp('gl_showcase', { mode: 'cube' }),
        },
        {
          label: 'Buttonfly — 3D Flipping Polyhedra',
          action: () => onLaunchApp('gl_showcase', { mode: 'buttonfly' }),
        },
        {
          label: 'NURBS Torus Knot (Odyssey VPro)',
          action: () => onLaunchApp('gl_showcase', { mode: 'torus' }),
          dividerAfter: true,
        },
        {
          label: 'IconSmith (.FTI Vector Icon Editor)',
          action: () => onLaunchApp('iconsmith'),
          dividerAfter: true,
        },
        {
          label: 'ElectroPaint — Dancing Polygons Screen Saver',
          action: () => onLaunchApp('electropaint'),
        },
        {
          label: 'ElectroPaint — Run Full Screen Now',
          action: () => onLaunchApp('screensaver'),
        },
        {
          label: 'Bounce / Hopalong Saver Modules',
          action: () => onLaunchApp('screensaver'),
          dividerAfter: true,
        },
        {
          label: 'Wavefront Explorer 2.0 (Maya predecessor)',
          action: () => onLaunchApp('explorer'),
        },
        {
          label: 'fcheck — Image & Movie Sequence Viewer',
          action: () => onLaunchApp('fcheck'),
        },
      ],
    },
    {
      id: 'Help',
      label: 'Help',
      items: [
        {
          label: 'IRIX 6.5 Specifications & Framework Guide',
          action: () => onLaunchApp('insight', { chapter: 'specs' }),
        },
        {
          label: 'Web Framework Selection Analysis',
          action: () => onLaunchApp('insight', { chapter: 'framework' }),
        },
        {
          label: 'IRIX Vector Icon (.fti / .ftr) Spec',
          action: () => onLaunchApp('insight', { chapter: 'icons' }),
        },
        {
          label: '4Dwm & Indigo Magic UI Guidelines',
          action: () => onLaunchApp('insight', { chapter: '4dwm' }),
          dividerAfter: true,
        },
        {
          label: 'Real IRIX Screenshots (compare the simulation)',
          action: () => onLaunchApp('reference'),
        },
      ],
    },
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
