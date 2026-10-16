import React, { useEffect, useReducer, useRef, useState } from 'react';
import {
  AppLaunchPayload,
  ColorSchemeId,
  DeskId,
  LaunchApp,
  OpenNode,
  SGI_COLOR_SCHEMES,
  WindowInstance,
  WORKSTATION_PROFILES,
  WorkstationProfileId,
} from './state/osStore';
import {
  ScreenMetrics,
  fitScreen,
  screenMetrics,
  screenScale,
  setScreenMetrics,
} from './state/screen';
import { IrixVectorIcon } from './icons/irixIconSet';
import { Toolchest } from './components/Toolchest';
import { DesksOverview } from './components/DesksOverview';
import { WindowFrame } from './components/WindowFrame';
import { MinimizedTile } from './components/MinimizedTile';
import { PromAndLoginModal } from './components/PromAndLoginModal';
import { ScreenBlanker } from './components/ScreenBlanker';
import { DesktopIcons } from './components/DesktopIcons';
import { DesktopIconProperties } from './components/DesktopIconProperties';
import {
  APP_REGISTRY,
  AppRuntime,
  CONTEXT_MENU,
  DESKTOP_ICONS,
  FocusMode,
  QUICK_LAUNCH,
} from './apps/registry';
import type { DesktopIcon } from './apps/registry';
import type { ScreenSaverConfig } from './apps/ScreenSaverApp';
import {
  initialOsState,
  loadOsState,
  osReducer,
  saveOsState,
} from './state/osState';
import { irixAudio } from './sound/irixAudio';

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(osReducer, initialOsState, loadOsState);
  const {
    workstationId,
    colorSchemeId,
    activeDesk,
    focusMode,
    soundEnabled,
    currentUser,
    modalMode,
    windows,
    saverConfig,
    blanked,
    blankLocked,
    activeWinId,
    vfs,
    selectedDesktopIcon,
    launchingDesktopId,
    contextMenu,
    showQuickLaunchBar,
    iconProperties,
  } = state;

  const hiddenIconCount = Object.values(state.desktopIcons).filter((i) => i.hidden).length;

  const [screen, setScreen] = useState<ScreenMetrics>(screenMetrics);

  // The desktop persists: windows, desks, colours, hardware and the filesystem
  // all come back after a reload. Debounced, so dragging a window does not
  // serialise the filesystem on every mousemove.
  useEffect(() => {
    const save = window.setTimeout(() => saveOsState(state), 400);
    return () => window.clearTimeout(save);
  }, [state]);

  // The desktop is laid out in the workstation's own pixels and scaled as a
  // whole to the browser window, so every window fits the display it is on.
  useEffect(() => {
    const update = () => {
      const next = fitScreen(window.innerWidth, window.innerHeight);
      setScreenMetrics(next);
      setScreen(next);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Keep window frames inside the framebuffer when the display changes size.
  useEffect(() => {
    dispatch({ type: 'clampWindows' });
  }, [screen.width, screen.height]);

  const workstation = WORKSTATION_PROFILES[workstationId];
  const colorScheme = SGI_COLOR_SCHEMES[colorSchemeId];

  // Desktop icon column: one row per shortcut, sized to the framebuffer.
  const iconCell = Math.max(
    48,
    Math.min(84, (screen.height - 30) / Math.max(1, DESKTOP_ICONS.length))
  );
  const iconSize = Math.round(iconCell * 0.66);

  const bringToFront = (id: string) => {
    dispatch({ type: 'focusWindow', id });
  };

  // Sound is a side effect, so it happens here rather than in the reducer.
  const launchApp: LaunchApp = (appId, payload) => {
    irixAudio.playAppLaunch();
    dispatch({ type: 'launch', appId, payload });
  };

  const handleCloseWindow = (id: string) => {
    irixAudio.playMenuClick();
    dispatch({ type: 'closeWindow', id });
  };
  const handleMinimizeWindow = (id: string) => dispatch({ type: 'minimizeWindow', id });
  const handleRestoreWindow = (id: string) => dispatch({ type: 'restoreWindow', id });
  const handleMaximizeWindow = (id: string) => dispatch({ type: 'toggleMaximize', id });
  const handleToggleShade = (id: string) => dispatch({ type: 'toggleShade', id });
  const handleMoveResizeWindow = (
    id: string,
    patch: Partial<Pick<WindowInstance, 'x' | 'y' | 'width' | 'height'>>
  ) => dispatch({ type: 'moveResizeWindow', id, patch });
  const handleMoveTile = (id: string, x: number, y: number) =>
    dispatch({ type: 'moveTile', id, x, y });
  const handleChangeWindowDesk = (id: string, desk: DeskId) =>
    dispatch({ type: 'changeWindowDesk', id, desk });
  const handleUpdateWindowTitle = (id: string, title: string) =>
    dispatch({ type: 'setWindowTitle', id, title });
  const handleSaveFile = (path: string, content: string) =>
    dispatch({ type: 'saveFile', path, content });
  const handleSaveRender = (path: string, dataUrl: string, meta: string) =>
    dispatch({ type: 'saveRender', path, dataUrl, meta });
  const handleSaveFtiToVfs = (filename: string, ftiCode: string) =>
    dispatch({ type: 'saveFti', filename, ftiCode });
  const handleCreateFile = (dir: string, name: string, content: string) =>
    dispatch({ type: 'createFile', dir, name, content });
  const handleMoveToDumpster = (path: string) =>
    dispatch({ type: 'moveToDumpster', path });
  const handleEmptyDumpster = () => {
    irixAudio.playDumpsterCrunch();
    dispatch({ type: 'emptyDumpster' });
  };
  const handleToggleSound = () => {
    const next = !soundEnabled;
    irixAudio.enabled = next;
    dispatch({ type: 'toggleSound' });
  };
  const handleBlankNow = (moduleId?: string) => dispatch({ type: 'blankNow', moduleId });
  const handleSelectColorScheme = (id: ColorSchemeId) => dispatch({ type: 'setColorScheme', id });
  const handleSwitchDesk = (desk: DeskId) => dispatch({ type: 'setDesk', desk });
  const handleSelectDesktopIcon = (id: string | null) =>
    dispatch({ type: 'selectDesktopIcon', id });
  const handleSetLaunchingIcon = (id: string | null) =>
    dispatch({ type: 'setLaunchingIcon', id });
  const handleSetContextMenu = (at: { x: number; y: number } | null) =>
    dispatch({ type: 'setContextMenu', at });
  const handleToggleQuickLaunchBar = () => dispatch({ type: 'toggleQuickLaunchBar' });
  const handleMoveIcon = (id: string, x: number, y: number) =>
    dispatch({ type: 'moveDesktopIcon', id, x, y });
  const handleIconProperties = (icon: DesktopIcon, at: { x: number; y: number }) =>
    dispatch({ type: 'iconProperties', icon, at });
  const handleCloseIconProperties = () => dispatch({ type: 'iconProperties', icon: null });
  const handleRestoreIcons = () => {
    irixAudio.playMenuClick();
    dispatch({ type: 'restoreDesktopIcons' });
  };
  const handleSelectWorkstation = (id: WorkstationProfileId) =>
    dispatch({ type: 'setWorkstation', id });
  const handleChangeFocusMode = (mode: FocusMode) => dispatch({ type: 'setFocusMode', mode });
  const handleChangeSaverConfig = (patch: Partial<ScreenSaverConfig>) =>
    dispatch({ type: 'setSaverConfig', patch });
  const handleSetModal = (mode: 'prom' | 'clogin' | null) => dispatch({ type: 'setModal', mode });
  const handleSetUser = (user: string) => dispatch({ type: 'setUser', user });

  /** Launch whatever a filesystem node points at: the one dynamic entry point. */
  const openNode: OpenNode = (node) => {
    if (node.appId) launchApp(node.appId, { ...node.payload, path: node.path } as AppLaunchPayload);
  };

  /** Everything the registry hands to an application. */
  const runtimeFor = (win: WindowInstance): AppRuntime => ({
    win,
    workstation,
    colorScheme,
    windows,
    vfs,
    currentUser,
    focusMode,
    soundEnabled,
    saverConfig,
    onLaunchApp: launchApp,
    onOpenNode: openNode,
    onCloseWindow: handleCloseWindow,
    onUpdateTitle: (title) => handleUpdateWindowTitle(win.id, title),
    onSaveFile: handleSaveFile,
    onSaveRender: handleSaveRender,
    onSaveFtiToVfs: handleSaveFtiToVfs,
    onMoveToDumpster: handleMoveToDumpster,
    onCreateFile: handleCreateFile,
    onSelectWorkstation: handleSelectWorkstation,
    onSelectColorScheme: handleSelectColorScheme,
    onChangeFocusMode: handleChangeFocusMode,
    onToggleSound: handleToggleSound,
    onChangeSaverConfig: handleChangeSaverConfig,
    onBlankNow: handleBlankNow,
    toolchestEdits: state.toolchestEdits,
    toolchestCustom: state.toolchestCustom,
    onEditToolchest: (key, edit) => dispatch({ type: 'editToolchest', key, edit }),
    onAddToolchestEntry: (entry) => dispatch({ type: 'addToolchestEntry', entry }),
    onRemoveToolchestEntry: (id) => dispatch({ type: 'removeToolchestEntry', id }),
    onResetToolchest: () => dispatch({ type: 'resetToolchest' }),
  });

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
        dispatch({ type: 'setSaverConfig', patch: { lockScreen: saverConfig.lockScreen } });
        handleBlankNow();
      }
    }, 1000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump as EventListener));
      window.clearInterval(poll);
    };
  }, [saverConfig]);

  const wakeFromBlanker = () => {
    blankedRef.current = false;
    lastActivityRef.current = Date.now();
    dispatch({ type: 'wake' });
  };

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        // the desktop is scaled as a whole: remember the click in framebuffer pixels
        const s = screenScale();
        handleSetContextMenu({ x: e.clientX / s, y: e.clientY / s });
      }}
      onClick={() => {
        if (contextMenu) handleSetContextMenu(null);
      }}
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000000',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* The workstation framebuffer: everything inside is in virtual pixels */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${screen.width}px`,
          height: `${screen.height}px`,
          transform: `scale(${screen.scale})`,
          transformOrigin: 'top left',
          background: colorScheme.desktopBg,
          overflow: 'hidden',
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
        quickLaunchBar={showQuickLaunchBar}
        onToggleQuickLaunchBar={handleToggleQuickLaunchBar}
        colorScheme={colorScheme}
        selectedDesktopIcon={selectedDesktopIcon}
        soundEnabled={soundEnabled}
        onLaunchApp={launchApp}
        onSelectColorScheme={handleSelectColorScheme}
        onSwitchDesk={handleSwitchDesk}
        onToggleSound={handleToggleSound}
        onEmptyDumpster={handleEmptyDumpster}
        onOpenPromMonitor={() => handleSetModal('prom')}
        onOpenClogin={() => handleSetModal('clogin')}
        toolchestEdits={state.toolchestEdits}
        toolchestCustom={state.toolchestCustom}
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

      {/* Right-Edge Column of Authentic SGI Isometric Vector Desktop Icons.
          The row height follows the framebuffer, so on a short display the
          icons shrink to stay in one column instead of wrapping behind the
          windows. Icons can be dragged anywhere and carry their own
          Properties dialog. */}
      <DesktopIcons
        colorScheme={colorScheme}
        icons={DESKTOP_ICONS}
        state={state.desktopIcons}
        cellSize={iconCell}
        iconSize={iconSize}
        selectedId={selectedDesktopIcon}
        launchingId={launchingDesktopId}
        onSelect={handleSelectDesktopIcon}
        onLaunch={(icon) => {
          handleSetLaunchingIcon(icon.id);
          window.setTimeout(() => handleSetLaunchingIcon(null), 220);
          launchApp(icon.appId, icon.payload);
        }}
        onMove={handleMoveIcon}
        onProperties={handleIconProperties}
      />

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
            {APP_REGISTRY[win.appId].render(runtimeFor(win))}
          </WindowFrame>
        ))}

      {/* Bottom-Left Desks Overview (ov) Virtual Workspace Pager */}
      <DesksOverview
        activeDesk={activeDesk}
        windows={windows}
        colorScheme={colorScheme}
        onSelectDesk={handleSwitchDesk}
        onFocusWindow={bringToFront}
      />

      {/* Bottom-Right Workstation Status & Quick-Jump Bar (off by default;
          Toolchest -> Desktop -> Quick Launch Bar brings it back) */}
      {showQuickLaunchBar && (
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
        {QUICK_LAUNCH.map((q) => (
          <button
            key={q.label}
            type="button"
            className="sgi-btn"
            onClick={() => launchApp(q.appId, q.payload)}
            style={{ padding: '1px 6px', fontSize: '10.5px', fontWeight: 700 }}
          >
            {q.label}
          </button>
        ))}
      </div>
      )}

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
            <div style={{ fontSize: '10px', fontStyle: 'normal', fontWeight: 400, opacity: 0.85 }}>
              {workstation.name} · {workstation.ipArch} · {workstation.osRelease}
            </div>
          </div>
          {CONTEXT_MENU.map((c) => (
            <div
              key={c.label}
              className="sgi-menu-item"
              onClick={() => {
                handleSetContextMenu(null);
                launchApp(c.appId, c.payload);
              }}
            >
              <span>{c.label}</span>
            </div>
          ))}
          {hiddenIconCount > 0 && (
            <>
              <div style={{ borderTop: '1px solid #666', borderBottom: '1px solid #fff', margin: '2px 0' }} />
              <div
                className="sgi-menu-item"
                onClick={() => {
                  handleSetContextMenu(null);
                  handleRestoreIcons();
                }}
              >
                <span>Restore Desktop Icons ({hiddenIconCount})</span>
              </div>
            </>
          )}
          <div style={{ borderTop: '1px solid #666', borderBottom: '1px solid #fff', margin: '2px 0' }} />
          <div
            className="sgi-menu-item"
            onClick={() => {
              handleSetContextMenu(null);
              handleSetModal('prom');
            }}
          >
            <span>SGI PROM Command Monitor...</span>
          </div>
        </div>
      )}

      </div>
      {/* ---- end of the scaled framebuffer: what follows covers the real display ---- */}

      {/* Properties for the desktop icon that was right-clicked */}
      {iconProperties && (
        <DesktopIconProperties
          colorScheme={colorScheme}
          icon={iconProperties.icon}
          at={iconProperties.at}
          node={vfs.find((n) => n.name === iconProperties.icon.label && !n.path.includes('/dumpster/'))}
          onClose={handleCloseIconProperties}
          onOpen={() => {
            handleCloseIconProperties();
            launchApp(iconProperties.icon.appId, iconProperties.icon.payload);
          }}
          onDelete={() => {
            irixAudio.playDumpsterCrunch();
            dispatch({
              type: 'deleteDesktopIcon',
              id: iconProperties.icon.id,
              name: iconProperties.icon.label,
            });
            handleCloseIconProperties();
          }}
        />
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
          onSelectUser={handleSetUser}
          onClose={() => handleSetModal(null)}
        />
      )}
    </div>
  );
};
