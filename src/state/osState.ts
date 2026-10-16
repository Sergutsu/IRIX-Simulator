/**
 * The whole simulator's state in one place: one reducer, one context, one
 * save file.
 *
 * Before this, eighteen separate useState hooks lived in App.tsx and every
 * consumer was wired by hand through twenty-odd props. Now the desktop is a
 * single value that can be persisted, restored and handed to anything that
 * needs it.
 */
import {
  APP_WINDOW_DEFAULTS,
  AppId,
  AppLaunchPayload,
  ColorSchemeId,
  DeskId,
  INITIAL_VFS_NODES,
  INITIAL_WINDOWS,
  VfsNode,
  WindowInstance,
  WorkstationProfileId,
} from './osStore';
import { clampWindow, placeWindow } from './screen';
import type { CustomToolchestEntry, DesktopIcon } from '../apps/registry';
import type { ScreenSaverConfig } from '../apps/ScreenSaverApp';

export interface OsState {
  workstationId: WorkstationProfileId;
  colorSchemeId: ColorSchemeId;
  activeDesk: DeskId;
  focusMode: 'click' | 'followMouse';
  soundEnabled: boolean;
  currentUser: string;
  modalMode: 'prom' | 'clogin' | null;
  windows: WindowInstance[];
  saverConfig: ScreenSaverConfig;
  blanked: boolean;
  blankLocked: boolean;
  activeWinId: string;
  vfs: VfsNode[];
  selectedDesktopIcon: string | null;
  launchingDesktopId: string | null;
  contextMenu: { x: number; y: number } | null;
  showQuickLaunchBar: boolean;
  /** where the user dragged each desktop icon, and the ones sent to the
   *  dumpster. Absent keys mean "still in its factory slot". */
  desktopIcons: Record<string, DesktopIconState>;
  /** the icon whose Properties dialog is open, if any */
  iconProperties: { icon: DesktopIconRef; at: { x: number; y: number } } | null;
  /** user edits to the Toolchest, keyed by toolchestKey() */
  toolchestEdits: Record<string, ToolchestEdit>;
  /** entries the user added in the Toolchest editor */
  toolchestCustom: CustomToolchestEntry[];
}

/** What the Toolchest editor can change about a built-in entry. */
export interface ToolchestEdit {
  label?: string;
  hidden?: boolean;
  deleted?: boolean;
  order?: number;
}

/** The parts of a desktop icon the Properties dialog needs. */
export type DesktopIconRef = DesktopIcon;

/** Per-icon desktop state. `pos` is in framebuffer pixels. */
export interface DesktopIconState {
  pos?: { x: number; y: number };
  hidden?: boolean;
}

export const initialOsState: OsState = {
  workstationId: 'octane2',
  colorSchemeId: 'indigo_magic',
  activeDesk: 'Main',
  focusMode: 'click',
  soundEnabled: true,
  currentUser: 'guest',
  modalMode: null,
  windows: INITIAL_WINDOWS,
  saverConfig: {
    enabled: true,
    moduleId: 'electropaint',
    idleSeconds: 300,
    lockScreen: false,
    cycleModules: false,
  },
  blanked: false,
  blankLocked: false,
  activeWinId: 'win_winterm',
  vfs: INITIAL_VFS_NODES,
  selectedDesktopIcon: null,
  launchingDesktopId: null,
  contextMenu: null,
  showQuickLaunchBar: false,
  desktopIcons: {},
  iconProperties: null,
  toolchestEdits: {},
  toolchestCustom: [],
};

export type OsAction =
  | { type: 'setWorkstation'; id: WorkstationProfileId }
  | { type: 'setColorScheme'; id: ColorSchemeId }
  | { type: 'setDesk'; desk: DeskId }
  | { type: 'setFocusMode'; mode: 'click' | 'followMouse' }
  | { type: 'toggleSound' }
  | { type: 'setUser'; user: string }
  | { type: 'setModal'; mode: 'prom' | 'clogin' | null }
  | { type: 'launch'; appId: AppId; payload?: AppLaunchPayload }
  | { type: 'focusWindow'; id: string }
  | { type: 'closeWindow'; id: string }
  | { type: 'minimizeWindow'; id: string }
  | { type: 'restoreWindow'; id: string }
  | { type: 'toggleMaximize'; id: string }
  | { type: 'toggleShade'; id: string }
  | { type: 'moveResizeWindow'; id: string; patch: Partial<Pick<WindowInstance, 'x' | 'y' | 'width' | 'height'>> }
  | { type: 'moveTile'; id: string; x: number; y: number }
  | { type: 'changeWindowDesk'; id: string; desk: DeskId }
  | { type: 'setWindowTitle'; id: string; title: string }
  | { type: 'saveFile'; path: string; content: string }
  | { type: 'saveRender'; path: string; dataUrl: string; meta: string }
  | { type: 'saveFti'; filename: string; ftiCode: string }
  | { type: 'createFile'; dir: string; name: string; content: string }
  | { type: 'moveToDumpster'; path: string }
  | { type: 'emptyDumpster' }
  | { type: 'setSaverConfig'; patch: Partial<ScreenSaverConfig> }
  | { type: 'blankNow'; moduleId?: string }
  | { type: 'wake' }
  | { type: 'selectDesktopIcon'; id: string | null }
  | { type: 'setLaunchingIcon'; id: string | null }
  | { type: 'setContextMenu'; at: { x: number; y: number } | null }
  | { type: 'toggleQuickLaunchBar' }
  | { type: 'moveDesktopIcon'; id: string; x: number; y: number }
  | { type: 'deleteDesktopIcon'; id: string; name: string }
  | { type: 'restoreDesktopIcons' }
  | { type: 'iconProperties'; icon: DesktopIconRef | null; at?: { x: number; y: number } }
  | { type: 'editToolchest'; key: string; edit: ToolchestEdit }
  | { type: 'addToolchestEntry'; entry: CustomToolchestEntry }
  | { type: 'removeToolchestEntry'; id: string }
  | { type: 'resetToolchest' }
  | { type: 'clampWindows' }
  | { type: 'hydrate'; state: OsState };

/** Read one string field off any launch payload, without casting the union. */
export function strArg(payload: AppLaunchPayload | undefined, key: string): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}

const moduleArg = (payload: AppLaunchPayload | undefined) => strArg(payload, 'module') ?? '';

function normalizeSaverModule(requested: string): string {
  if (requested === 'bounce') return 'bounce';
  if (requested === 'hops' || requested === 'hopalong' || requested === 'spaceplants') return 'hopalong';
  if (requested === 'blank') return 'blank';
  return 'electropaint';
}

const topZ = (windows: WindowInstance[]) =>
  windows.reduce((m, w) => Math.max(m, w.zIndex), 10);

export function osReducer(state: OsState, action: OsAction): OsState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    // keep every window inside the framebuffer after the display changes size
    case 'clampWindows':
      return {
        ...state,
        windows: state.windows.map((w) => ({
          ...w,
          ...clampWindow(w.x, w.y, w.width, w.height),
        })),
      };

    case 'setWorkstation':
      return { ...state, workstationId: action.id };
    case 'setColorScheme':
      return { ...state, colorSchemeId: action.id };
    case 'setDesk':
      return { ...state, activeDesk: action.desk };
    case 'setFocusMode':
      return { ...state, focusMode: action.mode };
    case 'toggleSound':
      return { ...state, soundEnabled: !state.soundEnabled };
    case 'setUser':
      return { ...state, currentUser: action.user };
    case 'setModal':
      return { ...state, modalMode: action.mode };

    case 'focusWindow':
      return {
        ...state,
        activeWinId: action.id,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, zIndex: topZ(state.windows) + 1 } : w
        ),
      };

    case 'launch': {
      // `screens bounce` / `hops` / `ep` from xwsh preselect a saver module
      let saverConfig = state.saverConfig;
      if (action.appId === 'screensaver') {
        const requested = moduleArg(action.payload);
        if (requested) saverConfig = { ...saverConfig, moduleId: normalizeSaverModule(requested) };
      }

      const maxZ = topZ(state.windows);
      // one instance per app on the active desk, except the Alias|Wavefront
      // modules, which are one window each
      const existing = state.windows.find((w) => {
        if (w.appId !== action.appId) return false;
        if (w.deskId !== state.activeDesk && w.deskId !== 'Global') return false;
        if (action.appId === 'aw_module') {
          return moduleArg(w.payload) === moduleArg(action.payload);
        }
        return true;
      });

      if (existing) {
        return {
          ...state,
          saverConfig,
          activeWinId: existing.id,
          windows: state.windows.map((w) =>
            w.id === existing.id
              ? {
                  ...w,
                  minimized: false,
                  shaded: false,
                  zIndex: maxZ + 1,
                  payload: action.payload ? { ...w.payload, ...action.payload } : w.payload,
                }
              : w
          ),
        };
      }

      const def = APP_WINDOW_DEFAULTS[action.appId];
      const offset = (state.windows.length % 6) * 24;
      const at = placeWindow(def.width, def.height, offset);
      const win: WindowInstance = {
        id: `win_${action.appId}_${Date.now()}`,
        appId: action.appId,
        title:
          action.appId === 'aw_module'
            ? strArg(action.payload, 'title') ?? def.title
            : def.title,
        iconId: def.iconId,
        deskId: state.activeDesk,
        x: at.x,
        y: at.y,
        width: def.width,
        height: def.height,
        zIndex: maxZ + 1,
        minimized: false,
        maximized: false,
        shaded: false,
        minTileX: 145 + ((state.windows.length * 78) % 460),
        minTileY: 10,
        payload: action.payload,
      };
      return { ...state, saverConfig, activeWinId: win.id, windows: [...state.windows, win] };
    }

    case 'closeWindow':
      return { ...state, windows: state.windows.filter((w) => w.id !== action.id) };
    case 'minimizeWindow':
      return {
        ...state,
        windows: state.windows.map((w) => (w.id === action.id ? { ...w, minimized: true } : w)),
      };
    case 'restoreWindow':
      return {
        ...state,
        activeWinId: action.id,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, minimized: false, zIndex: topZ(state.windows) + 1 } : w
        ),
      };
    case 'toggleMaximize':
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, maximized: !w.maximized } : w
        ),
      };
    case 'toggleShade':
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, shaded: !w.shaded } : w
        ),
      };
    case 'moveResizeWindow':
      return {
        ...state,
        windows: state.windows.map((w) => (w.id === action.id ? { ...w, ...action.patch } : w)),
      };
    case 'moveTile':
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, minTileX: action.x, minTileY: action.y } : w
        ),
      };
    case 'changeWindowDesk':
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, deskId: action.desk } : w
        ),
      };
    case 'setWindowTitle':
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, title: action.title } : w
        ),
      };

    case 'saveFile':
      return {
        ...state,
        vfs: state.vfs.map((n) =>
          n.path === action.path
            ? { ...n, content: action.content, size: action.content.length, mtime: 'Oct 02 Now' }
            : n
        ),
      };

    case 'saveRender': {
      // a render written by the Wavefront Explorer lands in XFS as an image
      // node, so the File Manager Content Viewer can show it
      const node: VfsNode = {
        path: action.path,
        name: action.path.split('/').pop() || 'render.rgb',
        type: 'file',
        iconId: 'reference',
        size: Math.round(action.dataUrl.length * 0.75),
        mtime: 'Oct 03 Now',
        permissions: '-rw-r--r--',
        owner: state.currentUser,
        tagHex: '0x00020001',
        appId: 'reference',
        imageUrl: action.dataUrl,
        content: action.meta,
      };
      const exists = state.vfs.some((n) => n.path === action.path);
      return {
        ...state,
        vfs: exists
          ? state.vfs.map((n) => (n.path === action.path ? node : n))
          : [...state.vfs, node],
      };
    }

    case 'saveFti': {
      const targetPath = `/usr/lib/filetype/iconlib/${action.filename}`;
      const exists = state.vfs.some((n) => n.path === targetPath);
      return {
        ...state,
        vfs: exists
          ? state.vfs.map((n) =>
              n.path === targetPath
                ? {
                    ...n,
                    content: action.ftiCode,
                    size: action.ftiCode.length,
                    mtime: 'Oct 02 Now',
                  }
                : n
            )
          : [
              ...state.vfs,
              {
                path: targetPath,
                name: action.filename,
                type: 'file',
                iconId: 'iconsmith',
                size: action.ftiCode.length,
                mtime: 'Oct 02 Now',
                permissions: '-rw-r--r--',
                owner: state.currentUser,
                tagHex: '0x00001088',
                appId: 'iconsmith',
                content: action.ftiCode,
              },
            ],
      };
    }

    case 'createFile': {
      const cleanDir = action.dir === '/' ? '' : action.dir.replace(/\/$/, '');
      return {
        ...state,
        vfs: [
          ...state.vfs,
          {
            path: `${cleanDir}/${action.name}`,
            name: action.name,
            type: 'file',
            iconId: 'document',
            size: action.content.length,
            mtime: 'Oct 02 Now',
            permissions: '-rw-r--r--',
            owner: state.currentUser,
            tagHex: '0x00000100',
            appId: 'jot',
            content: action.content,
          },
        ],
      };
    }

    case 'moveToDumpster':
      return {
        ...state,
        vfs: state.vfs.map((n) =>
          n.path === action.path ? { ...n, path: `/dumpster/${n.name}` } : n
        ),
      };
    case 'emptyDumpster':
      return { ...state, vfs: state.vfs.filter((n) => !n.path.startsWith('/dumpster/')) };

    case 'setSaverConfig':
      return { ...state, saverConfig: { ...state.saverConfig, ...action.patch } };

    case 'blankNow':
      return {
        ...state,
        saverConfig: action.moduleId
          ? { ...state.saverConfig, moduleId: action.moduleId }
          : state.saverConfig,
        blanked: true,
        blankLocked: false,
      };

    case 'wake':
      return { ...state, blanked: false, blankLocked: false };

    case 'selectDesktopIcon':
      return { ...state, selectedDesktopIcon: action.id };
    case 'setLaunchingIcon':
      return { ...state, launchingDesktopId: action.id };
    case 'setContextMenu':
      return { ...state, contextMenu: action.at };
    case 'toggleQuickLaunchBar':
      return { ...state, showQuickLaunchBar: !state.showQuickLaunchBar };

    case 'moveDesktopIcon':
      return {
        ...state,
        desktopIcons: {
          ...state.desktopIcons,
          [action.id]: { ...state.desktopIcons[action.id], pos: { x: action.x, y: action.y } },
        },
      };

    case 'deleteDesktopIcon': {
      const wasHidden = state.desktopIcons[action.id]?.hidden;
      // the icon lands in the dumpster as a real node, the way 4Dwm did it
      const inDumpster = state.vfs.some((n) => n.path === `/dumpster/${action.name}`);
      return {
        ...state,
        desktopIcons: { ...state.desktopIcons, [action.id]: { ...state.desktopIcons[action.id], hidden: true } },
        vfs: wasHidden || inDumpster
          ? state.vfs
          : [
              ...state.vfs,
              {
                path: `/dumpster/${action.name}`,
                name: action.name,
                type: 'file' as const,
                iconId: 'dumpster',
                size: 0,
                mtime: 'Oct 02 Now',
                permissions: '-rw-r--r--',
                owner: state.currentUser,
                tagHex: '0x00000100',
                content: `Desktop icon "${action.name}", removed from the root window.`,
              },
            ],
      };
    }

    case 'editToolchest':
      return {
        ...state,
        toolchestEdits: {
          ...state.toolchestEdits,
          [action.key]: { ...state.toolchestEdits[action.key], ...action.edit },
        },
      };

    case 'addToolchestEntry':
      return { ...state, toolchestCustom: [...state.toolchestCustom, action.entry] };

    case 'removeToolchestEntry':
      return { ...state, toolchestCustom: state.toolchestCustom.filter((e) => e.id !== action.id) };

    case 'resetToolchest':
      return { ...state, toolchestEdits: {}, toolchestCustom: [] };

    case 'iconProperties':
      return {
        ...state,
        iconProperties: action.icon
          ? { icon: action.icon, at: action.at ?? { x: 80, y: 120 } }
          : null,
      };

    case 'restoreDesktopIcons':
      return {
        ...state,
        desktopIcons: {},
        vfs: state.vfs.filter(
          (n) =>
            !(n.path.startsWith('/dumpster/') &&
              (n.content ?? '').includes('removed from the root window'))
        ),
      };

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ *
 * Persistence. The desktop survives a reload: windows, desks, colours,
 * hardware and the filesystem all come back.
 * ------------------------------------------------------------------ */

const SAVE_KEY = 'irix65.osstate.v1';

/** Never restored: a reload should not leave the screen blanked or locked. */
const TRANSIENT: (keyof OsState)[] = [
  'blanked',
  'blankLocked',
  'modalMode',
  'contextMenu',
  'launchingDesktopId',
  'iconProperties',
];

export function loadOsState(): OsState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return initialOsState;
    const saved = JSON.parse(raw) as Partial<OsState>;
    if (!Array.isArray(saved.windows) || !Array.isArray(saved.vfs)) return initialOsState;
    return { ...initialOsState, ...saved, blanked: false, blankLocked: false, modalMode: null, contextMenu: null };
  } catch {
    // a corrupt or unreadable save is not worth failing the boot over
    return initialOsState;
  }
}

export function saveOsState(state: OsState): void {
  const row: Record<string, unknown> = { ...state };
  for (const key of TRANSIENT) delete row[key];
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(row));
  } catch {
    // Renders are kept as data URLs and can overflow the quota. Drop them and
    // try once more so the desktop still persists instead of throwing.
    try {
      row.vfs = (row.vfs as VfsNode[]).map((n) =>
        n.imageUrl?.startsWith('data:') ? { ...n, imageUrl: undefined } : n
      );
      localStorage.setItem(SAVE_KEY, JSON.stringify(row));
    } catch {
      // out of room: the desktop keeps working, it just will not survive a reload
    }
  }
}
