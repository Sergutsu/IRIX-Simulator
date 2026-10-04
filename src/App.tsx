import React, { useEffect, useRef, useState } from 'react';
import {
  AppId,
  ColorSchemeId,
  DeskId,
  INITIAL_VFS_NODES,
  INITIAL_WINDOWS,
  SGI_COLOR_SCHEMES,
  VfsNode,
  WindowInstance,
  WORKSTATION_PROFILES,
  WorkstationProfileId,
} from './state/osStore';
import { IrixVectorIcon } from './icons/irixIconSet';
import { Toolchest } from './components/Toolchest';
import { DesksOverview } from './components/DesksOverview';
import { WindowFrame } from './components/WindowFrame';
import { MinimizedTile } from './components/MinimizedTile';
import { PromAndLoginModal } from './components/PromAndLoginModal';
import { IconCatalogApp } from './apps/IconCatalogApp';
import { GrOsviewApp } from './apps/GrOsviewApp';
import { WintermApp } from './apps/WintermApp';
import { IconSmithApp } from './apps/IconSmithApp';
import { FsnApp } from './apps/FsnApp';
import { FileManagerApp } from './apps/FileManagerApp';
import { GlShowcaseApp } from './apps/GlShowcaseApp';
import { SystemManagerApp } from './apps/SystemManagerApp';
import { SoftwareManagerApp } from './apps/SoftwareManagerApp';
import { InsightApp } from './apps/InsightApp';
import { NetscapeApp } from './apps/NetscapeApp';
import { JotApp } from './apps/JotApp';
import { ScreenSaverApp, ScreenSaverConfig } from './apps/ScreenSaverApp';
import { ElectroPaintApp } from './apps/ElectroPaintApp';
import { WavefrontExplorerApp } from './apps/WavefrontExplorerApp';
import { ReferenceGalleryApp } from './apps/ReferenceGalleryApp';
import { FcheckApp } from './apps/FcheckApp';
import { ScreenBlanker } from './components/ScreenBlanker';
import { irixAudio } from './sound/irixAudio';

interface DesktopShortcut {
  id: string;
  label: string;
  iconId: string;
  useMagicCarpet: boolean;
  appId: AppId;
  payload?: Record<string, unknown>;
}

const DESKTOP_SHORTCUTS: DesktopShortcut[] = [
  {
    id: 'camera',
    label: 'camera',
    iconId: 'camera',
    useMagicCarpet: false,
    appId: 'gl_showcase',
    payload: { mode: 'indycam' },
  },
  {
    id: 'o2cam_mic',
    label: 'O2cam mic',
    iconId: 'o2cam_mic',
    useMagicCarpet: false,
    appId: 'gl_showcase',
    payload: { mode: 'indycam' },
  },
  {
    id: 'microphone',
    label: 'microphone',
    iconId: 'microphone',
    useMagicCarpet: false,
    appId: 'system_manager',
    payload: { tab: 'audio' },
  },
  {
    id: 'guest_dir',
    label: 'guest',
    iconId: 'folder',
    useMagicCarpet: false,
    appId: 'file_manager',
    payload: { path: '/usr/people/guest' },
  },
  {
    id: 'electropaint_desk',
    label: 'ep',
    iconId: 'electropaint',
    useMagicCarpet: true,
    appId: 'electropaint',
  },
  {
    id: 'explorer_desk',
    label: 'explorer',
    iconId: 'explorer',
    useMagicCarpet: true,
    appId: 'explorer',
  },
  {
    id: 'fcheck_desk',
    label: 'fcheck',
    iconId: 'reference',
    useMagicCarpet: true,
    appId: 'fcheck',
  },
  {
    id: 'screenshots_desk',
    label: 'screenshots',
    iconId: 'reference',
    useMagicCarpet: false,
    appId: 'reference',
  },
  {
    id: 'iconsmith_desk',
    label: 'IconSmith',
    iconId: 'iconsmith',
    useMagicCarpet: true,
    appId: 'iconsmith',
    payload: { iconId: 'buttonfly' },
  },
  {
    id: 'fsn_desk',
    label: 'fsn 3D',
    iconId: 'fsn',
    useMagicCarpet: true,
    appId: 'fsn',
  },
  {
    id: 'showcase_desk',
    label: 'showcase',
    iconId: 'showcase',
    useMagicCarpet: true,
    appId: 'gl_showcase',
    payload: { mode: 'cube' },
  },
  {
    id: 'insight_desk',
    label: 'IRIX 6.5 Specs',
    iconId: 'insight',
    useMagicCarpet: true,
    appId: 'insight',
    payload: { chapter: 'specs' },
  },
  {
    id: 'dumpster',
    label: 'dumpster',
    iconId: 'dumpster',
    useMagicCarpet: false,
    appId: 'file_manager',
    payload: { path: '/dumpster' },
  },
  {
    id: 'cdrom',
    label: 'CDROM',
    iconId: 'cdrom',
    useMagicCarpet: false,
    appId: 'software_manager',
  },
];

const APP_DEFAULTS: Record<
  AppId,
  { title: string; iconId: string; width: number; height: number }
> = {
  winterm: {
    title: 'Winterm — root@silicon (/usr/people/guest)',
    iconId: 'winterm',
    width: 615,
    height: 330,
  },
  gr_osview: {
    title: 'gr_osview',
    iconId: 'gr_osview',
    width: 385,
    height: 330,
  },
  icon_catalog: {
    title: 'Icon Catalog: Applications (Page 1 of 6)',
    iconId: 'showcase',
    width: 535,
    height: 365,
  },
  iconsmith: {
    title: 'IconSmith — /usr/lib/filetype/iconlib/buttonfly.fti',
    iconId: 'iconsmith',
    width: 775,
    height: 525,
  },
  file_manager: {
    title: '/usr/people/guest',
    iconId: 'folder',
    width: 590,
    height: 455,
  },
  fsn: {
    title: 'fsn — a 3D File System Navigator (/usr/people/guest)',
    iconId: 'fsn',
    width: 760,
    height: 515,
  },
  gl_showcase: {
    title: 'SGI OpenGL & Buttonfly 3D Showcase (TrueColor 24-bit)',
    iconId: 'showcase',
    width: 585,
    height: 425,
  },
  system_manager: {
    title: 'System Manager — silicon.sgi.com',
    iconId: 'sysmgr',
    width: 635,
    height: 465,
  },
  software_manager: {
    title: 'Software Manager 4.1 — Manage Installed Software',
    iconId: 'swmgr',
    width: 620,
    height: 485,
  },
  screensaver: {
    title: 'Screen Saver — Desktop Customize Control Panel',
    iconId: 'screensaver',
    width: 700,
    height: 590,
  },
  electropaint: {
    title: 'ElectroPaint — ep -c (Interactive Dancing Polygons)',
    iconId: 'electropaint',
    width: 800,
    height: 500,
  },
  explorer: {
    title: 'WAVEFRONT EXPLORER 2.0 — Alias|Wavefront (Maya prototype)',
    iconId: 'explorer',
    width: 900,
    height: 600,
  },
  reference: {
    title: 'Real IRIX Screenshot Reference Gallery',
    iconId: 'reference',
    width: 860,
    height: 620,
  },
  fcheck: {
    title: 'fcheck — SGI image & movie sequence viewer',
    iconId: 'reference',
    width: 800,
    height: 560,
  },
  insight: {
    title: 'SGI InSight — IRIX 6.5 Specifications, Icon Set & Web Framework',
    iconId: 'insight',
    width: 745,
    height: 525,
  },
  netscape: {
    title: 'Netscape: SiliconSurf [SGI IRIX 6.5 Edition]',
    iconId: 'netscape',
    width: 685,
    height: 480,
  },
  jot: {
    title: 'jot — /usr/people/guest/readme.sgi',
    iconId: 'jot',
    width: 560,
    height: 410,
  },
};

export const App: React.FC = () => {
  const [workstationId, setWorkstationId] = useState<WorkstationProfileId>('octane2');
  const [colorSchemeId, setColorSchemeId] = useState<ColorSchemeId>('indigo_magic');
  const [activeDesk, setActiveDesk] = useState<DeskId>('Main');
  const [focusMode, setFocusMode] = useState<'click' | 'followMouse'>('click');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<string>('guest');
  const [modalMode, setModalMode] = useState<'prom' | 'clogin' | null>(null);

  const [windows, setWindows] = useState<WindowInstance[]>(INITIAL_WINDOWS);
  const [saverConfig, setSaverConfig] = useState<ScreenSaverConfig>({
    enabled: true,
    moduleId: 'electropaint',
    idleSeconds: 300,
    lockScreen: false,
    cycleModules: false,
  });
  const [blanked, setBlanked] = useState<boolean>(false);
  const [blankLocked, setBlankLocked] = useState<boolean>(false);
  const [activeWinId, setActiveWinId] = useState<string>('win_winterm');
  const [vfs, setVfs] = useState<VfsNode[]>(INITIAL_VFS_NODES);
  const [selectedDesktopIcon, setSelectedDesktopIcon] = useState<string | null>(null);
  const [launchingDesktopId, setLaunchingDesktopId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const workstation = WORKSTATION_PROFILES[workstationId];
  const colorScheme = SGI_COLOR_SCHEMES[colorSchemeId];

  const bringToFront = (id: string) => {
    setActiveWinId(id);
    setWindows((prev) => {
      const maxZ = prev.reduce((m, w) => Math.max(m, w.zIndex), 10);
      return prev.map((w) => (w.id === id ? { ...w, zIndex: maxZ + 1 } : w));
    });
  };

  const handleLaunchApp = (appId: AppId, payload?: Record<string, unknown>) => {
    irixAudio.playAppLaunch();
    // `screens bounce` / `hops` / `ep` from xwsh preselect a saver module
    if (appId === 'screensaver' && typeof payload?.module === 'string') {
      const requested = payload.module as string;
      const moduleId =
        requested === 'bounce'
          ? 'bounce'
          : requested === 'hops' || requested === 'hopalong' || requested === 'spaceplants'
          ? 'hopalong'
          : requested === 'blank'
          ? 'blank'
          : 'electropaint';
      setSaverConfig((prev) => ({ ...prev, moduleId }));
    }
    setWindows((prev) => {
      const maxZ = prev.reduce((m, w) => Math.max(m, w.zIndex), 10);
      // Check if an instance of this app already exists on the active desk (or global)
      const existing = prev.find(
        (w) =>
          w.appId === appId &&
          (w.deskId === activeDesk || w.deskId === 'Global')
      );

      if (existing) {
        setActiveWinId(existing.id);
        return prev.map((w) =>
          w.id === existing.id
            ? {
                ...w,
                minimized: false,
                shaded: false,
                zIndex: maxZ + 1,
                payload: payload ? { ...w.payload, ...payload } : w.payload,
              }
            : w
        );
      }

      const def = APP_DEFAULTS[appId];
      const offset = (prev.length % 6) * 24;
      const newWin: WindowInstance = {
        id: `win_${appId}_${Date.now()}`,
        appId,
        title: def.title,
        iconId: def.iconId,
        deskId: activeDesk,
        x: Math.min(window.innerWidth - def.width - 110, 155 + offset),
        y: Math.min(window.innerHeight - def.height - 50, 28 + offset),
        width: def.width,
        height: def.height,
        zIndex: maxZ + 1,
        minimized: false,
        maximized: false,
        shaded: false,
        minTileX: 145 + ((prev.length * 78) % 460),
        minTileY: 10,
        payload,
      };
      setActiveWinId(newWin.id);
      return [...prev, newWin];
    });
  };

  const handleCloseWindow = (id: string) => {
    irixAudio.playMenuClick();
    setWindows((prev) => prev.filter((w) => w.id !== id));
  };

  const handleMinimizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: true } : w))
    );
  };

  const handleRestoreWindow = (id: string) => {
    setActiveWinId(id);
    setWindows((prev) => {
      const maxZ = prev.reduce((m, w) => Math.max(m, w.zIndex), 10);
      return prev.map((w) =>
        w.id === id ? { ...w, minimized: false, zIndex: maxZ + 1 } : w
      );
    });
  };

  const handleMaximizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w))
    );
  };

  const handleToggleShade = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, shaded: !w.shaded } : w))
    );
  };

  const handleMoveResizeWindow = (
    id: string,
    patch: Partial<Pick<WindowInstance, 'x' | 'y' | 'width' | 'height'>>
  ) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w))
    );
  };

  const handleMoveTile = (id: string, x: number, y: number) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minTileX: x, minTileY: y } : w))
    );
  };

  const handleChangeWindowDesk = (id: string, deskId: DeskId) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, deskId } : w))
    );
  };

  const handleUpdateWindowTitle = (id: string, title: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, title } : w))
    );
  };

  const handleSaveFile = (path: string, content: string) => {
    setVfs((prev) =>
      prev.map((n) =>
        n.path === path ? { ...n, content, size: content.length, mtime: 'Oct 02 Now' } : n
      )
    );
  };

  /**
   * A render written out by the Wavefront Explorer lands in the XFS filesystem
   * as an image node, so the File Manager Content Viewer can show it — the
   * simulated stand-in for the SGI RGB files the real program wrote.
   */
  const handleSaveRender = (path: string, dataUrl: string, meta: string) => {
    setVfs((prev) => {
      const node: VfsNode = {
        path,
        name: path.split('/').pop() || 'render.rgb',
        type: 'file',
        iconId: 'reference',
        size: Math.round(dataUrl.length * 0.75),
        mtime: 'Oct 03 Now',
        permissions: '-rw-r--r--',
        owner: currentUser,
        tagHex: '0x00020001',
        appId: 'reference',
        imageUrl: dataUrl,
        content: meta,
      };
      const exists = prev.some((n) => n.path === path);
      return exists ? prev.map((n) => (n.path === path ? node : n)) : [...prev, node];
    });
  };

  const handleSaveFtiToVfs = (filename: string, ftiCode: string) => {
    const targetPath = `/usr/lib/filetype/iconlib/${filename}`;
    setVfs((prev) => {
      const exists = prev.some((n) => n.path === targetPath);
      if (exists) {
        return prev.map((n) =>
          n.path === targetPath
            ? { ...n, content: ftiCode, size: ftiCode.length, mtime: 'Oct 02 Now' }
            : n
        );
      }
      return [
        ...prev,
        {
          path: targetPath,
          name: filename,
          type: 'file',
          iconId: 'iconsmith',
          size: ftiCode.length,
          mtime: 'Oct 02 Now',
          permissions: '-rw-r--r--',
          owner: currentUser,
          tagHex: '0x00001088',
          appId: 'iconsmith',
          content: ftiCode,
        },
      ];
    });
  };

  const handleCreateFile = (dir: string, name: string, content: string) => {
    const cleanDir = dir === '/' ? '' : dir.replace(/\/$/, '');
    const path = `${cleanDir}/${name}`;
    setVfs((prev) => [
      ...prev,
      {
        path,
        name,
        type: 'file',
        iconId: 'document',
        size: content.length,
        mtime: 'Oct 02 Now',
        permissions: '-rw-r--r--',
        owner: currentUser,
        tagHex: '0x00000100',
        appId: 'jot',
        content,
      },
    ]);
  };

  const handleMoveToDumpster = (path: string) => {
    setVfs((prev) =>
      prev.map((n) => {
        if (n.path !== path) return n;
        return {
          ...n,
          path: `/dumpster/${n.name}`,
        };
      })
    );
  };

  const handleEmptyDumpster = () => {
    irixAudio.playDumpsterCrunch();
    setVfs((prev) => prev.filter((n) => !n.path.startsWith('/dumpster/')));
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      irixAudio.enabled = next;
      return next;
    });
  };

  const visibleWindows = windows.filter(
    (w) => w.deskId === activeDesk || w.deskId === 'Global'
  );

  /* ------------------------------------------------------------------ *
   * screen_blanker: the IRIX display blanker.
   * After the configured idle period the desktop blanks and the selected
   * screen saver module runs full screen; any input brings the desktop back
   * (or the console lock prompt, if the screen was locked).
   * ------------------------------------------------------------------ */
  const lastActivityRef = useRef<number>(Date.now());
  const blankedRef = useRef<boolean>(false);
  useEffect(() => {
    const bump = () => {
      lastActivityRef.current = Date.now();
    };
    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'wheel',
      'touchstart',
    ];
    events.forEach((e) => window.addEventListener(e, bump as EventListener, { passive: true }));
    const poll = window.setInterval(() => {
      if (!saverConfig.enabled) return;
      if (blankedRef.current) return;
      const idle = (Date.now() - lastActivityRef.current) / 1000;
      if (idle >= saverConfig.idleSeconds) {
        blankedRef.current = true;
        setBlankLocked(saverConfig.lockScreen);
        setBlanked(true);
      }
    }, 1000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump as EventListener));
      window.clearInterval(poll);
    };
  }, [saverConfig]);

  const wakeFromBlanker = () => {
    blankedRef.current = false;
    setBlanked(false);
    setBlankLocked(false);
    lastActivityRef.current = Date.now();
  };

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
      onClick={() => {
        if (contextMenu) setContextMenu(null);
      }}
      style={{
        width: '100vw',
        height: '100vh',
        background: colorScheme.desktopBg,
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* 4Dwm root window stipple pattern */}
      <div
        className="irix-stipple"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
      />

      {/* Top-Left SGI Toolchest Menu */}
      <Toolchest
        activeDesk={activeDesk}
        colorScheme={colorScheme}
        selectedDesktopIcon={selectedDesktopIcon}
        soundEnabled={soundEnabled}
        onLaunchApp={handleLaunchApp}
        onSelectColorScheme={setColorSchemeId}
        onSwitchDesk={setActiveDesk}
        onToggleSound={handleToggleSound}
        onEmptyDumpster={handleEmptyDumpster}
        onOpenPromMonitor={() => setModalMode('prom')}
        onOpenClogin={() => setModalMode('clogin')}
      />

      {/* Minimized 4Dwm Window Square Tiles on Desktop */}
      {visibleWindows
        .filter((w) => w.minimized)
        .map((w) => (
          <MinimizedTile
            key={w.id}
            win={w}
            onRestore={handleRestoreWindow}
            onMoveTile={handleMoveTile}
          />
        ))}

      {/* Right-Edge Column of Authentic SGI Isometric Vector Desktop Icons */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          right: '14px',
          top: '12px',
          bottom: '44px',
          display: 'grid',
          gridAutoFlow: 'column',
          gridTemplateRows: 'repeat(auto-fill, 84px)',
          gap: '6px 14px',
          direction: 'rtl',
          zIndex: 6,
        }}
      >
        {DESKTOP_SHORTCUTS.map((sc) => {
          const isSelected = selectedDesktopIcon === sc.id;
          const isLaunching = launchingDesktopId === sc.id;
          const vState = isLaunching
            ? 'opened'
            : isSelected
            ? 'selected'
            : 'normal';

          return (
            <div
              key={sc.id}
              onClick={() => {
                irixAudio.playIconSelect();
                setSelectedDesktopIcon(sc.id);
              }}
              onDoubleClick={() => {
                setLaunchingDesktopId(sc.id);
                setTimeout(() => setLaunchingDesktopId(null), 220);
                handleLaunchApp(sc.appId, sc.payload);
              }}
              title={`Double-click to open ${sc.label}`}
              style={{
                direction: 'ltr',
                width: '78px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <IrixVectorIcon
                iconId={sc.iconId}
                useMagicCarpet={sc.useMagicCarpet}
                state={vState}
                size={54}
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
                {sc.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active 4Dwm Windows for Current Desk */}
      {visibleWindows
        .filter((w) => !w.minimized)
        .map((win) => (
          <WindowFrame
            key={win.id}
            win={win}
            isActive={activeWinId === win.id}
            focusMode={focusMode}
            colorScheme={colorScheme}
            onFocus={bringToFront}
            onClose={handleCloseWindow}
            onMinimize={handleMinimizeWindow}
            onMaximize={handleMaximizeWindow}
            onToggleShade={handleToggleShade}
            onMoveResize={handleMoveResizeWindow}
            onChangeDesk={handleChangeWindowDesk}
          >
            {win.appId === 'icon_catalog' && (
              <IconCatalogApp
                colorScheme={colorScheme}
                onLaunchApp={handleLaunchApp}
                onUpdateTitle={(t) => handleUpdateWindowTitle(win.id, t)}
              />
            )}
            {win.appId === 'gr_osview' && (
              <GrOsviewApp
                workstation={workstation}
                colorScheme={colorScheme}
                openWindowCount={windows.filter((w) => !w.minimized).length}
              />
            )}
            {win.appId === 'winterm' && (
              <WintermApp
                workstation={workstation}
                vfs={vfs}
                windows={windows}
                initialCommand={win.payload?.runCmd as string | undefined}
                onLaunchApp={handleLaunchApp}
              />
            )}
            {win.appId === 'iconsmith' && (
              <IconSmithApp
                colorScheme={colorScheme}
                initialIconId={win.payload?.iconId as string | undefined}
                onUpdateTitle={(t) => handleUpdateWindowTitle(win.id, t)}
                onSaveFtiToVfs={handleSaveFtiToVfs}
              />
            )}
            {win.appId === 'fsn' && (
              <FsnApp
                vfs={vfs}
                colorScheme={colorScheme}
                onLaunchApp={handleLaunchApp}
                onUpdateTitle={(t) => handleUpdateWindowTitle(win.id, t)}
              />
            )}
            {win.appId === 'file_manager' && (
              <FileManagerApp
                vfs={vfs}
                colorScheme={colorScheme}
                initialPath={win.payload?.path as string | undefined}
                onLaunchApp={handleLaunchApp}
                onMoveToDumpster={handleMoveToDumpster}
                onCreateFile={handleCreateFile}
                onUpdateTitle={(t) => handleUpdateWindowTitle(win.id, t)}
              />
            )}
            {win.appId === 'gl_showcase' && (
              <GlShowcaseApp
                workstation={workstation}
                colorScheme={colorScheme}
                initialMode={
                  win.payload?.mode as
                    | 'cube'
                    | 'buttonfly'
                    | 'torus'
                    | 'indycam'
                    | undefined
                }
                onLaunchApp={handleLaunchApp}
              />
            )}
            {win.appId === 'system_manager' && (
              <SystemManagerApp
                workstation={workstation}
                colorScheme={colorScheme}
                focusMode={focusMode}
                soundEnabled={soundEnabled}
                windows={windows}
                initialTab={
                  win.payload?.tab as
                    | 'hardware'
                    | 'customize'
                    | 'processes'
                    | 'audio'
                    | undefined
                }
                onSelectWorkstation={setWorkstationId}
                onSelectColorScheme={setColorSchemeId}
                onChangeFocusMode={setFocusMode}
                onToggleSound={handleToggleSound}
                onCloseWindow={handleCloseWindow}
              />
            )}
            {win.appId === 'software_manager' && (
              <SoftwareManagerApp colorScheme={colorScheme} />
            )}
            {win.appId === 'insight' && (
              <InsightApp
                colorScheme={colorScheme}
                initialChapter={
                  win.payload?.chapter as
                    | 'specs'
                    | 'framework'
                    | 'icons'
                    | '4dwm'
                    | undefined
                }
                onLaunchApp={handleLaunchApp}
              />
            )}
            {win.appId === 'netscape' && (
              <NetscapeApp
                colorScheme={colorScheme}
                initialPage={
                  win.payload?.page as
                    | 'siliconsurf'
                    | 'irix65'
                    | 'nekoware'
                    | undefined
                }
                onLaunchApp={handleLaunchApp}
              />
            )}
            {win.appId === 'screensaver' && (
              <ScreenSaverApp
                colorScheme={colorScheme}
                workstation={workstation}
                config={saverConfig}
                onChangeConfig={(patch) => setSaverConfig((prev) => ({ ...prev, ...patch }))}
                onBlankNow={(moduleId) => {
                  if (moduleId) setSaverConfig((prev) => ({ ...prev, moduleId }));
                  setBlanked(true);
                  setBlankLocked(false);
                }}
                onSaveFile={handleSaveFile}
                onLaunchApp={handleLaunchApp}
              />
            )}
            {win.appId === 'electropaint' && (
              <ElectroPaintApp
                colorScheme={colorScheme}
                workstation={workstation}
                vfs={vfs}
                onBlankNow={(moduleId) => {
                  if (moduleId) setSaverConfig((prev) => ({ ...prev, moduleId }));
                  setBlanked(true);
                  setBlankLocked(false);
                }}
                onSaveFile={handleSaveFile}
              />
            )}
            {win.appId === 'explorer' && (
              <WavefrontExplorerApp
                colorScheme={colorScheme}
                initialMode={
                  win.payload?.mode as
                    | 'model'
                    | 'shade'
                    | 'animate'
                    | 'render'
                    | undefined
                }
                onSaveRender={handleSaveRender}
                onLaunchApp={handleLaunchApp}
              />
            )}
            {win.appId === 'reference' && (
              <ReferenceGalleryApp colorScheme={colorScheme} onLaunchApp={handleLaunchApp} />
            )}
            {win.appId === 'fcheck' && (
              <FcheckApp
                colorScheme={colorScheme}
                vfs={vfs}
                initialPath={win.payload?.path as string | undefined}
                onUpdateTitle={(t) => handleUpdateWindowTitle(win.id, t)}
                onLaunchApp={handleLaunchApp}
              />
            )}
            {win.appId === 'jot' && (
              <JotApp
                vfs={vfs}
                colorScheme={colorScheme}
                initialPath={win.payload?.path as string | undefined}
                onSaveFile={handleSaveFile}
                onUpdateTitle={(t) => handleUpdateWindowTitle(win.id, t)}
              />
            )}
          </WindowFrame>
        ))}

      {/* Bottom-Left Desks Overview (ov) Virtual Workspace Pager */}
      <DesksOverview
        activeDesk={activeDesk}
        windows={windows}
        colorScheme={colorScheme}
        onSelectDesk={setActiveDesk}
        onFocusWindow={bringToFront}
      />

      {/* Bottom-Right Workstation Status & Quick-Jump Bar */}
      <div
        style={{
          position: 'absolute',
          right: '12px',
          bottom: '10px',
          background: colorScheme.windowSurface,
          border: '1px solid #111',
          boxShadow: '2px 2px 6px rgba(0,0,0,0.45), inset 1px 1px 0 #fff, inset -1px -1px 0 #666',
          padding: '3px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          zIndex: 40,
        }}
      >
        <span style={{ fontStyle: 'italic', fontWeight: 700 }}>
          {workstation.name} ({workstation.ipArch}) • {workstation.osRelease}
        </span>
        <button
          type="button"
          className="sgi-btn"
          onClick={() => handleLaunchApp('iconsmith')}
          style={{ padding: '1px 6px', fontSize: '10.5px', fontWeight: 700 }}
        >
          🎨 IconSmith (.FTI)
        </button>
        <button
          type="button"
          className="sgi-btn"
          onClick={() => handleLaunchApp('fsn')}
          style={{ padding: '1px 6px', fontSize: '10.5px', fontWeight: 700 }}
        >
          🦖 fsn 3D
        </button>
        <button
          type="button"
          className="sgi-btn"
          onClick={() => handleLaunchApp('electropaint')}
          style={{ padding: '1px 6px', fontSize: '10.5px', fontWeight: 700 }}
        >
          🔺 ElectroPaint
        </button>
        <button
          type="button"
          className="sgi-btn"
          onClick={() => handleLaunchApp('explorer')}
          style={{ padding: '1px 6px', fontSize: '10.5px', fontWeight: 700 }}
        >
          🎬 Wavefront Explorer
        </button>
        <button
          type="button"
          className="sgi-btn"
          onClick={() => handleLaunchApp('reference')}
          style={{ padding: '1px 6px', fontSize: '10.5px', fontWeight: 700 }}
        >
          📷 IRIX Screenshots
        </button>
        <button
          type="button"
          className="sgi-btn"
          onClick={() => handleLaunchApp('fcheck')}
          style={{ padding: '1px 6px', fontSize: '10.5px', fontWeight: 700 }}
        >
          🎞 fcheck
        </button>
        <button
          type="button"
          className="sgi-btn"
          onClick={() => handleLaunchApp('insight', { chapter: 'specs' })}
          style={{ padding: '1px 6px', fontSize: '10.5px', fontWeight: 700 }}
        >
          📘 IRIX 6.5 Specs
        </button>
      </div>

      {/* Right-Click 4Dwm Root Desktop Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            width: '215px',
            background: colorScheme.windowSurface,
            border: '1px solid #111',
            boxShadow: '3px 4px 10px rgba(0,0,0,0.52), inset 1px 1px 0 #fff, inset -1px -1px 0 #666',
            padding: '2px',
            zIndex: 9999,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: '12px',
          }}
        >
          <div
            style={{
              background: colorScheme.activeTitleBg,
              padding: '3px 8px',
              borderBottom: '1px solid #222',
              marginBottom: '2px',
            }}
          >
            IRIX Interactive Desktop
          </div>
          <div
            className="sgi-menu-item"
            onClick={() => {
              setContextMenu(null);
              handleLaunchApp('winterm');
            }}
          >
            <span>Open Unix Shell (xwsh)</span>
          </div>
          <div
            className="sgi-menu-item"
            onClick={() => {
              setContextMenu(null);
              handleLaunchApp('icon_catalog');
            }}
          >
            <span>Icon Catalog</span>
          </div>
          <div
            className="sgi-menu-item"
            onClick={() => {
              setContextMenu(null);
              handleLaunchApp('iconsmith');
            }}
          >
            <span>IconSmith (.FTI Vector Studio)</span>
          </div>
          <div
            className="sgi-menu-item"
            onClick={() => {
              setContextMenu(null);
              handleLaunchApp('fsn');
            }}
          >
            <span>3D File System Navigator (fsn)</span>
          </div>
          <div
            className="sgi-menu-item"
            onClick={() => {
              setContextMenu(null);
              handleLaunchApp('electropaint');
            }}
          >
            <span>ElectroPaint (dancing polygons)</span>
          </div>
          <div
            className="sgi-menu-item"
            onClick={() => {
              setContextMenu(null);
              handleLaunchApp('screensaver');
            }}
          >
            <span>Screen Saver Control Panel</span>
          </div>
          <div
            className="sgi-menu-item"
            onClick={() => {
              setContextMenu(null);
              handleLaunchApp('explorer');
            }}
          >
            <span>Wavefront Explorer 2.0 (Maya predecessor)</span>
          </div>
          <div
            className="sgi-menu-item"
            onClick={() => {
              setContextMenu(null);
              handleLaunchApp('reference');
            }}
          >
            <span>Real IRIX Screenshots</span>
          </div>
          <div
            className="sgi-menu-item"
            onClick={() => {
              setContextMenu(null);
              handleLaunchApp('gl_showcase', { mode: 'cube' });
            }}
          >
            <span>SGI 3D OpenGL Showcase</span>
          </div>
          <div
            className="sgi-menu-item"
            onClick={() => {
              setContextMenu(null);
              handleLaunchApp('insight', { chapter: 'specs' });
            }}
          >
            <span>IRIX 6.5 Specifications (InSight)</span>
          </div>
          <div style={{ borderTop: '1px solid #666', borderBottom: '1px solid #fff', margin: '2px 0' }} />
          <div
            className="sgi-menu-item"
            onClick={() => {
              setContextMenu(null);
              setModalMode('prom');
            }}
          >
            <span>SGI PROM Command Monitor...</span>
          </div>
        </div>
      )}

      {/* screen_blanker: the blanked display with the screen saver running */}
      {blanked && (
        <ScreenBlanker
          moduleId={saverConfig.moduleId}
          cycleModules={saverConfig.cycleModules}
          locked={blankLocked}
          workstationName={workstation.name}
          osRelease={workstation.osRelease}
          currentUser={currentUser}
          onExit={wakeFromBlanker}
        />
      )}

      {/* Optional SGI PROM Monitor or clogin Visual Login Modal */}
      {modalMode && (
        <PromAndLoginModal
          mode={modalMode}
          workstation={workstation}
          currentUser={currentUser}
          onSelectUser={setCurrentUser}
          onClose={() => setModalMode(null)}
        />
      )}
    </div>
  );
};
