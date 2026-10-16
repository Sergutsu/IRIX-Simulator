/**
 * The application registry: one entry per AppId, and the only place that knows
 * how an application is titled, sized, rendered and where it appears on the
 * desktop.
 *
 * Adding an application is one entry here (plus its icon in
 * src/icons/irixIconSet.tsx). App.tsx reads this map for window defaults, the
 * desktop icons, the root menu and the quick launch bar; Toolchest reads the
 * toolchest placements. Nothing else needs to know the application exists.
 */
import React from 'react';
import {
  AppId,
  AppLaunchPayload,
  ColorSchemeId,
  LaunchApp,
  OpenNode,
  SgiColorScheme,
  APP_WINDOW_DEFAULTS,
  VfsNode,
  WindowInstance,
  WorkstationProfile,
  WorkstationProfileId,
  payloadOf,
} from '../state/osStore';
import type { ScreenSaverConfig } from './ScreenSaverApp';
import { ToolchestEditorApp } from './ToolchestEditorApp';
import type { ToolchestEdit } from '../state/osState';
import { IconCatalogApp } from './IconCatalogApp';
import { GrOsviewApp } from './GrOsviewApp';
import { WintermApp } from './WintermApp';
import { IconSmithApp } from './IconSmithApp';
import { FsnApp } from './FsnApp';
import { FileManagerApp } from './FileManagerApp';
import { GlShowcaseApp } from './GlShowcaseApp';
import { SystemManagerApp } from './SystemManagerApp';
import { SoftwareManagerApp } from './SoftwareManagerApp';
import { InsightApp } from './InsightApp';
import { NetscapeApp } from './NetscapeApp';
import { JotApp } from './JotApp';
import { ScreenSaverApp } from './ScreenSaverApp';
import { ElectroPaintApp } from './ElectroPaintApp';
import { WavefrontExplorerApp } from './WavefrontExplorerApp';
import { IVcalcApp } from './IVcalcApp';
import { DirectorApp } from './DirectorApp';
import { AwModuleApp } from './AwModuleApp';
import { ReferenceGalleryApp } from './ReferenceGalleryApp';
import { FcheckApp } from './FcheckApp';

export type FocusMode = 'click' | 'followMouse';

/** Everything the desktop owns that an application may need. */
export interface AppRuntime {
  /** the window being rendered, for its id, desk and launch payload */
  win: WindowInstance;
  workstation: WorkstationProfile;
  colorScheme: SgiColorScheme;
  windows: WindowInstance[];
  vfs: VfsNode[];
  currentUser: string;
  focusMode: FocusMode;
  soundEnabled: boolean;
  saverConfig: ScreenSaverConfig;
  onLaunchApp: LaunchApp;
  onOpenNode: OpenNode;
  onCloseWindow: (id: string) => void;
  onUpdateTitle: (title: string) => void;
  onSaveFile: (path: string, content: string) => void;
  onSaveRender: (path: string, dataUrl: string, meta: string) => void;
  onSaveFtiToVfs: (filename: string, ftiCode: string) => void;
  onMoveToDumpster: (path: string) => void;
  onCreateFile: (dir: string, name: string, content: string) => void;
  onSelectWorkstation: (id: WorkstationProfileId) => void;
  onSelectColorScheme: (id: ColorSchemeId) => void;
  onChangeFocusMode: (mode: FocusMode) => void;
  onToggleSound: () => void;
  onChangeSaverConfig: (patch: Partial<ScreenSaverConfig>) => void;
  onBlankNow: (moduleId?: string) => void;
  toolchestEdits: Record<string, ToolchestEdit>;
  toolchestCustom: CustomToolchestEntry[];
  onEditToolchest: (key: string, edit: ToolchestEdit) => void;
  onAddToolchestEntry: (entry: CustomToolchestEntry) => void;
  onRemoveToolchestEntry: (id: string) => void;
  onResetToolchest: () => void;
}

/** The Toolchest drawers an application can appear in. */
export type ToolchestCategory =
  | 'Desktop'
  | 'Internet'
  | 'Find'
  | 'System'
  | 'Demos'
  | 'Help';

/** One entry of an application in a Toolchest drawer. `order` places it among
 *  the desktop actions that share the drawer. */
export interface ToolchestPlacement {
  category: ToolchestCategory;
  label: string;
  order: number;
  /** nest under this top-level label in the same drawer */
  submenu?: string;
  dividerAfter?: boolean;
  payload?: AppLaunchPayload;
}

/**
 * Stable identity for a Toolchest entry, derived from where it came from. It
 * never changes, so the Toolchest editor can keep an edit against an entry even
 * after the entry has been renamed.
 */
export function toolchestKey(
  appId: AppId,
  placement: { category: ToolchestCategory; label: string; submenu?: string }
): string {
  return `${appId}|${placement.category}|${placement.submenu ?? ''}|${placement.label}`;
}

/** A user's own Toolchest entry, added from the Toolchest editor. */
export interface CustomToolchestEntry {
  id: string;
  category: ToolchestCategory;
  submenu?: string;
  label: string;
  order: number;
  appId: AppId;
  payload?: AppLaunchPayload;
}

export interface AppRegistration {
  render: (rt: AppRuntime) => React.ReactNode;
  /** right-hand desktop icon column */
  desktop?: {
    id: string;
    label: string;
    iconId?: string;
    payload?: AppLaunchPayload;
    useMagicCarpet?: boolean;
    order: number;
  }[];
  /** buttons in the optional bottom-right quick launch bar */
  quickLaunch?: { glyph: string; label: string; payload?: AppLaunchPayload; order: number }[];
  /** entries in the right-click 4Dwm root window menu */
  contextMenu?: { label: string; payload?: AppLaunchPayload; order: number }[];
  /** entries in the Toolchest */
  toolchest?: ToolchestPlacement[];
}

export const APP_REGISTRY: Record<AppId, AppRegistration> = {
  winterm: {
    render: (rt) => (
      <WintermApp
        workstation={rt.workstation}
        vfs={rt.vfs}
        windows={rt.windows}
        initialCommand={payloadOf(rt.win, 'winterm')?.runCmd}
        onLaunchApp={rt.onLaunchApp}
      />
    ),
    contextMenu: [{ label: 'Open Unix Shell (xwsh)', order: 1 }],
    toolchest: [
      { category: 'Desktop', label: 'Open Unix Shell (xwsh)', order: 3 },
      { category: 'System', label: 'Hardware Inventory (hinv)', order: 4, payload: { runCmd: 'hinv -v' }, dividerAfter: true },
    ],
  },
  gr_osview: {
    render: (rt) => (
      <GrOsviewApp
        workstation={rt.workstation}
        colorScheme={rt.colorScheme}
        openWindowCount={rt.windows.filter((w) => !w.minimized).length}
      />
    ),
    toolchest: [
      { category: 'System', label: 'System Performance (gr_osview)', order: 2 },
    ],
  },
  icon_catalog: {
    render: (rt) => (
      <IconCatalogApp
        colorScheme={rt.colorScheme}
        onLaunchApp={rt.onLaunchApp}
        onUpdateTitle={rt.onUpdateTitle}
      />
    ),
    contextMenu: [{ label: 'Icon Catalog', order: 2 }],
    toolchest: [
      { category: 'Desktop', label: 'Icon Catalog', order: 4 },
      { category: 'Find', label: 'Icon Catalog (Applications & Tools)', order: 1 },
    ],
  },
  iconsmith: {
    render: (rt) => (
      <IconSmithApp
        colorScheme={rt.colorScheme}
        initialIconId={payloadOf(rt.win, 'iconsmith')?.iconId}
        onUpdateTitle={rt.onUpdateTitle}
        onSaveFtiToVfs={rt.onSaveFtiToVfs}
      />
    ),
    desktop: [{ id: 'iconsmith_desk', order: 9, label: 'IconSmith', payload: { iconId: 'buttonfly' }, useMagicCarpet: true }],
    contextMenu: [{ label: 'IconSmith (.FTI Vector Studio)', order: 3 }],
    toolchest: [
      { category: 'Find', label: 'Find an Icon (.fti Library)', order: 2 },
      { category: 'Demos', label: 'IconSmith (.FTI Vector Icon Editor)', order: 6, dividerAfter: true },
    ],
    quickLaunch: [{ glyph: '🎨', label: 'IconSmith (.FTI)', order: 1 }],
  },
  file_manager: {
    render: (rt) => (
      <FileManagerApp
        vfs={rt.vfs}
        colorScheme={rt.colorScheme}
        initialPath={payloadOf(rt.win, 'file_manager')?.path}
        onLaunchApp={rt.onLaunchApp}
        onOpenNode={rt.onOpenNode}
        onMoveToDumpster={rt.onMoveToDumpster}
        onCreateFile={rt.onCreateFile}
        onUpdateTitle={rt.onUpdateTitle}
      />
    ),
    desktop: [
      { id: 'guest_dir', order: 4, label: 'guest', iconId: 'folder', payload: { path: '/usr/people/guest' } },
      { id: 'dumpster', order: 13, label: 'dumpster', iconId: 'dumpster', payload: { path: '/dumpster' } },
    ],
    toolchest: [
      { category: 'Desktop', label: 'Home Directory (/usr/people/guest)', order: 1, submenu: 'Access Files', payload: { path: '/usr/people/guest' } },
      { category: 'Desktop', label: 'Icon Library (/usr/lib/filetype/iconlib)', order: 2, submenu: 'Access Files', payload: { path: '/usr/lib/filetype/iconlib' } },
      { category: 'Desktop', label: 'SGI Demos (/usr/demos)', order: 3, submenu: 'Access Files', payload: { path: '/usr/demos' } },
      { category: 'Find', label: 'Files & Directories (File Manager)', order: 3 },
    ],
  },
  fsn: {
    render: (rt) => (
      <FsnApp
        vfs={rt.vfs}
        colorScheme={rt.colorScheme}
        onLaunchApp={rt.onLaunchApp}
        onOpenNode={rt.onOpenNode}
        onUpdateTitle={rt.onUpdateTitle}
      />
    ),
    desktop: [{ id: 'fsn_desk', order: 10, label: 'fsn 3D', useMagicCarpet: true }],
    contextMenu: [{ label: '3D File System Navigator (fsn)', order: 4 }],
    toolchest: [
      { category: 'Desktop', label: '3D File System Navigator (fsn)', order: 4, submenu: 'Access Files' },
      { category: 'Find', label: '3D File System Navigator (fsn)', order: 4 },
      { category: 'Demos', label: 'fsn — 3D File System Navigator (1993)', order: 1 },
    ],
    quickLaunch: [{ glyph: '🦖', label: 'fsn 3D', order: 2 }],
  },
  gl_showcase: {
    render: (rt) => (
      <GlShowcaseApp
        workstation={rt.workstation}
        colorScheme={rt.colorScheme}
        initialMode={payloadOf(rt.win, 'gl_showcase')?.mode}
        onLaunchApp={rt.onLaunchApp}
      />
    ),
    desktop: [
      { id: 'camera', order: 1, label: 'camera', iconId: 'camera', payload: { mode: 'indycam' } },
      { id: 'o2cam_mic', order: 2, label: 'O2cam mic', iconId: 'o2cam_mic', payload: { mode: 'indycam' } },
      { id: 'showcase_desk', order: 11, label: 'showcase', payload: { mode: 'cube' }, useMagicCarpet: true },
    ],
    contextMenu: [{ label: 'SGI 3D OpenGL Showcase', order: 11, payload: { mode: 'cube' } }],
    toolchest: [
      { category: 'Demos', label: 'SGI 3D Cube & OpenGL Showcase', order: 2, payload: { mode: 'cube' } },
      { category: 'Demos', label: 'Buttonfly — 3D Flipping Polyhedra', order: 3, payload: { mode: 'buttonfly' } },
      { category: 'Demos', label: 'NURBS Torus Knot (Odyssey VPro)', order: 5, payload: { mode: 'torus' }, dividerAfter: true },
    ],
  },
  ivcalc: {
    render: () => <IVcalcApp />,
    contextMenu: [{ label: 'IVcalc (3D calculator)', order: 6 }],
    toolchest: [{ category: 'Demos', label: 'IVcalc — Inventor 3D calculator', order: 4 }],
  },
  system_manager: {
    render: (rt) => (
      <SystemManagerApp
        workstation={rt.workstation}
        colorScheme={rt.colorScheme}
        focusMode={rt.focusMode}
        soundEnabled={rt.soundEnabled}
        windows={rt.windows}
        initialTab={payloadOf(rt.win, 'system_manager')?.tab}
        onSelectWorkstation={rt.onSelectWorkstation}
        onSelectColorScheme={rt.onSelectColorScheme}
        onChangeFocusMode={rt.onChangeFocusMode}
        onToggleSound={rt.onToggleSound}
        onCloseWindow={rt.onCloseWindow}
      />
    ),
    desktop: [{ id: 'microphone', order: 3, label: 'microphone', iconId: 'microphone', payload: { tab: 'audio' } }],
    toolchest: [
      { category: 'System', label: 'System Manager (sysmgr)', order: 1, payload: { tab: 'hardware' } },
      { category: 'System', label: 'Switch SGI Workstation Hardware...', order: 5, payload: { tab: 'hardware' }, dividerAfter: true },
      { category: 'Desktop', label: 'Background / Desktop Pattern...', order: 7, submenu: 'Customize', payload: { tab: 'customize' } },
      { category: 'Desktop', label: 'Windows & Desktop Settings...', order: 8, submenu: 'Customize', payload: { tab: 'customize' } },
    ],
  },
  software_manager: {
    render: (rt) => <SoftwareManagerApp colorScheme={rt.colorScheme} />,
    desktop: [{ id: 'cdrom', order: 14, label: 'CDROM', iconId: 'cdrom' }],
    toolchest: [
      { category: 'System', label: 'Software Manager 4.1 (swmgr)', order: 3 },
    ],
  },
  screensaver: {
    render: (rt) => (
      <ScreenSaverApp
        colorScheme={rt.colorScheme}
        workstation={rt.workstation}
        config={rt.saverConfig}
        onChangeConfig={rt.onChangeSaverConfig}
        onBlankNow={rt.onBlankNow}
        onSaveFile={rt.onSaveFile}
        onLaunchApp={rt.onLaunchApp}
      />
    ),
    contextMenu: [{ label: 'Screen Saver Control Panel', order: 7 }],
    toolchest: [
      { category: 'Desktop', label: 'Screen Saver...', order: 6, submenu: 'Customize' },
      { category: 'Desktop', label: 'Run Screen Saver Now (screen_blanker)', order: 7 },
      { category: 'Demos', label: 'ElectroPaint — Run Full Screen Now', order: 8 },
      { category: 'Demos', label: 'Bounce / Hopalong Saver Modules', order: 9, dividerAfter: true },
    ],
  },
  electropaint: {
    render: (rt) => (
      <ElectroPaintApp
        colorScheme={rt.colorScheme}
        workstation={rt.workstation}
        vfs={rt.vfs}
        onBlankNow={rt.onBlankNow}
        onSaveFile={rt.onSaveFile}
      />
    ),
    desktop: [{ id: 'electropaint_desk', order: 5, label: 'ep', useMagicCarpet: true }],
    contextMenu: [{ label: 'ElectroPaint (dancing polygons)', order: 5 }],
    toolchest: [
      { category: 'Demos', label: 'ElectroPaint — Dancing Polygons Screen Saver', order: 7 },
    ],
    quickLaunch: [{ glyph: '🔺', label: 'ElectroPaint', order: 3 }],
  },
  explorer: {
    render: (rt) => (
      <WavefrontExplorerApp
        colorScheme={rt.colorScheme}
        initialMode={payloadOf(rt.win, 'explorer')?.mode}
        onSaveRender={rt.onSaveRender}
        onSaveFile={rt.onSaveFile}
        onLaunchApp={rt.onLaunchApp}
      />
    ),
    contextMenu: [{ label: 'Advanced Visualizer Model 4.2.1', order: 9 }],
    toolchest: [
      { category: 'Demos', label: 'Advanced Visualizer Model 4.2.1', order: 10 },
    ],
  },
  director: {
    render: (rt) => <DirectorApp onLaunchApp={rt.onLaunchApp} />,
    desktop: [{ id: 'explorer_desk', order: 6, label: 'director', iconId: 'explorer', useMagicCarpet: true }],
    contextMenu: [{ label: 'The Director', order: 8 }],
    quickLaunch: [{ glyph: '🎬', label: 'The Director', order: 4 }],
  },
  aw_module: {
    render: (rt) => (
      <AwModuleApp
        module={payloadOf(rt.win, 'aw_module')?.module ?? 'property'}
        colorScheme={rt.colorScheme}
        onLaunchApp={rt.onLaunchApp}
        onSaveRender={rt.onSaveRender}
      />
    ),
  },
  reference: {
    render: (rt) => (
      <ReferenceGalleryApp colorScheme={rt.colorScheme} onLaunchApp={rt.onLaunchApp} />
    ),
    desktop: [{ id: 'screenshots_desk', order: 8, label: 'screenshots', iconId: 'reference' }],
    contextMenu: [{ label: 'Real IRIX Screenshots', order: 10 }],
    toolchest: [
      { category: 'System', label: 'Real IRIX Screenshot Reference Gallery', order: 6 },
      { category: 'Help', label: 'Real IRIX Screenshots (compare the simulation)', order: 5 },
    ],
    quickLaunch: [{ glyph: '📷', label: 'IRIX Screenshots', order: 5 }],
  },
  fcheck: {
    render: (rt) => (
      <FcheckApp
        colorScheme={rt.colorScheme}
        vfs={rt.vfs}
        initialPath={payloadOf(rt.win, 'fcheck')?.path}
        onUpdateTitle={rt.onUpdateTitle}
        onLaunchApp={rt.onLaunchApp}
      />
    ),
    desktop: [{ id: 'fcheck_desk', order: 7, label: 'fcheck', iconId: 'reference', useMagicCarpet: true }],
    toolchest: [
      { category: 'Demos', label: 'fcheck — Image & Movie Sequence Viewer', order: 11 },
    ],
    quickLaunch: [{ glyph: '🎞', label: 'fcheck', order: 6 }],
  },
  insight: {
    render: (rt) => (
      <InsightApp
        colorScheme={rt.colorScheme}
        initialChapter={payloadOf(rt.win, 'insight')?.chapter}
        onLaunchApp={rt.onLaunchApp}
      />
    ),
    desktop: [{ id: 'insight_desk', order: 12, label: 'IRIX 6.5 Specs', payload: { chapter: 'specs' }, useMagicCarpet: true }],
    contextMenu: [
      { label: 'IRIX 6.5 Specifications (InSight)', order: 12, payload: { chapter: 'specs' } },
    ],
    toolchest: [
      { category: 'Help', label: 'IRIX 6.5 Specifications & Framework Guide', order: 1, payload: { chapter: 'specs' } },
      { category: 'Help', label: 'Web Framework Selection Analysis', order: 2, payload: { chapter: 'framework' } },
      { category: 'Help', label: 'IRIX Vector Icon (.fti / .ftr) Spec', order: 3, payload: { chapter: 'icons' } },
      { category: 'Help', label: '4Dwm & Indigo Magic UI Guidelines', order: 4, payload: { chapter: '4dwm' }, dividerAfter: true },
    ],
    quickLaunch: [{ glyph: '📘', label: 'IRIX 6.5 Specs', order: 7, payload: { chapter: 'specs' } }],
  },
  netscape: {
    render: (rt) => (
      <NetscapeApp
        colorScheme={rt.colorScheme}
        initialPage={payloadOf(rt.win, 'netscape')?.page}
        onLaunchApp={rt.onLaunchApp}
      />
    ),
    toolchest: [
      { category: 'Internet', label: 'Netscape Communicator 4.78', order: 1, payload: { page: 'siliconsurf' } },
      { category: 'Internet', label: 'SGI SiliconSurf Portal', order: 2, payload: { page: 'siliconsurf' } },
      { category: 'Internet', label: 'IRIX 6.5 Release Stream Notes', order: 3, payload: { page: 'irix65' } },
      { category: 'Internet', label: 'Nekoware & SGI Freeware Archive', order: 4, payload: { page: 'nekoware' } },
    ],
  },
  jot: {
    render: (rt) => (
      <JotApp
        vfs={rt.vfs}
        colorScheme={rt.colorScheme}
        initialPath={payloadOf(rt.win, 'jot')?.path}
        onSaveFile={rt.onSaveFile}
        onUpdateTitle={rt.onUpdateTitle}
      />
    ),
  },
  toolchest_editor: {
    render: (rt) => (
      <ToolchestEditorApp
        colorScheme={rt.colorScheme}
        edits={rt.toolchestEdits}
        custom={rt.toolchestCustom}
        onEdit={rt.onEditToolchest}
        onAdd={rt.onAddToolchestEntry}
        onRemove={rt.onRemoveToolchestEntry}
        onReset={rt.onResetToolchest}
      />
    ),
    toolchest: [
      { category: 'Desktop', label: 'Toolchest Editor...', order: 10 },
    ],
  },
};

/* ------------------------------------------------------------------ *
 * Derived surfaces. These read the registry so there is no second list
 * of applications to keep in step with it.
 * ------------------------------------------------------------------ */

export interface DesktopIcon {
  id: string;
  label: string;
  iconId: string;
  appId: AppId;
  payload?: AppLaunchPayload;
  useMagicCarpet: boolean;
}

export interface SurfaceEntry {
  appId: AppId;
  label: string;
  payload?: AppLaunchPayload;
}

type Entries = [AppId, AppRegistration][];
const registryEntries = () => Object.entries(APP_REGISTRY) as Entries;

const byOrder = <T extends { order: number }>(rows: T[]): T[] =>
  rows.slice().sort((a, b) => a.order - b.order);

/** The right-hand desktop icon column, in column order. */
export const DESKTOP_ICONS: DesktopIcon[] = byOrder(
  registryEntries().flatMap(([appId, app]) =>
    (app.desktop ?? []).map((d) => ({
      id: d.id,
      label: d.label,
      iconId: d.iconId ?? APP_WINDOW_DEFAULTS[appId].iconId,
      appId,
      payload: d.payload,
      useMagicCarpet: d.useMagicCarpet ?? false,
      order: d.order,
    }))
  )
);

/** Entries of the right-click 4Dwm root window menu. */
export const CONTEXT_MENU: SurfaceEntry[] = byOrder(
  registryEntries().flatMap(([appId, app]) =>
    (app.contextMenu ?? []).map((c) => ({
      appId,
      label: c.label,
      payload: c.payload,
      order: c.order,
    }))
  )
);

/** Buttons of the optional bottom-right quick launch bar. */
export const QUICK_LAUNCH: SurfaceEntry[] = byOrder(
  registryEntries().flatMap(([appId, app]) =>
    (app.quickLaunch ?? []).map((q) => ({
      appId,
      label: `${q.glyph} ${q.label}`,
      payload: q.payload,
      order: q.order,
    }))
  )
);
