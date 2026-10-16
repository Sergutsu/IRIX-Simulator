import { IRIX_ICON_LIBRARY } from '../icons/irixIconSet';
import { IRIX_REFERENCE_SCREENSHOTS } from '../reference/irixScreenshots';
import { EP_DEFAULT_SCRIPT } from '../screensaver/electropaint';

export type WorkstationProfileId = 'octane2' | 'o2' | 'indy' | 'onyx2';

export interface WorkstationProfile {
  id: WorkstationProfileId;
  name: string;
  codename: string;
  ipArch: string;
  cpuModel: string;
  cpuMHz: number;
  cpuCount: number;
  fpuModel: string;
  ramMB: number;
  gfxSubsystem: string;
  gfxTextureMB: number;
  audioSubsystem: string;
  osRelease: string;
  chassisColor: string;
  hinvLines: string[];
}

export const WORKSTATION_PROFILES: Record<WorkstationProfileId, WorkstationProfile> = {
  octane2: {
    id: 'octane2',
    name: 'Silicon Graphics Octane2',
    codename: 'Speedracer / Odyssey',
    ipArch: 'IP30',
    cpuModel: 'MIPS R12000 Processor Chip Revision: 3.5',
    cpuMHz: 400,
    cpuCount: 2,
    fpuModel: 'MIPS R12010 Floating Point Chip Revision: 0.0',
    ramMB: 2048,
    gfxSubsystem: 'ODYSSEY (VPro V12) 128MB SDRAM, Buzz ASIC',
    gfxTextureMB: 128,
    audioSubsystem: 'RAD PCI Audio Processor (Revision 1)',
    osRelease: 'IRIX64 6.5 6.5.22m',
    chassisColor: '#1f5e6b',
    hinvLines: [
      '2 400 MHZ IP30 Processors',
      'CPU: MIPS R12000 Processor Chip Revision: 3.5',
      'FPU: MIPS R12010 Floating Point Chip Revision: 0.0',
      'Main memory size: 2048 Mbytes',
      'Xbow ASIC: Revision 1.3 (8-port 1.6 GB/s non-blocking crossbar)',
      'Instruction cache size: 32 Kbytes',
      'Data cache size: 32 Kbytes',
      'Secondary unified instruction/data cache size: 2 Mbytes',
      'Integral SCSI controller 0: Version QL1040B (rev. 2), single ended',
      '  Disk drive: unit 1 on SCSI controller 0 (Seagate ST336704LC 36.4GB XFS)',
      '  CDROM: unit 4 on SCSI controller 0: Toshiba XM-6401TA',
      'Integral SCSI controller 1: Version QL1040B (rev. 2), single ended',
      'Integral Fast Ethernet: ef0, version 1, pci 2 (IOC3 10/100Base-TX)',
      'Graphics board: ODYSSEY (VPro V12, 128MB SDRAM, 48-bit RGBA TrueColor)',
      'Iris Audio Processor: version RAD revision 12.0, number 1',
    ],
  },
  o2: {
    id: 'o2',
    name: 'Silicon Graphics O2 (R12000)',
    codename: 'Moosehead / Unified Memory Architecture',
    ipArch: 'IP32',
    cpuModel: 'MIPS R12000 Processor Chip Revision: 2.3',
    cpuMHz: 300,
    cpuCount: 1,
    fpuModel: 'MIPS R12010 Floating Point Chip Revision: 2.3',
    ramMB: 1024,
    gfxSubsystem: 'CRM (Crime Rendering Engine + ICE Video Compression)',
    gfxTextureMB: 256,
    audioSubsystem: 'A3 Moosehead Audio Controller',
    osRelease: 'IRIX64 6.5 6.5.22m',
    chassisColor: '#376795',
    hinvLines: [
      '1 300 MHZ IP32 Processor',
      'CPU: MIPS R12000 Processor Chip Revision: 2.3',
      'FPU: MIPS R12010 Floating Point Chip Revision: 2.3',
      'Main memory size: 1024 Mbytes (Unified Memory Architecture)',
      'Instruction cache size: 32 Kbytes',
      'Data cache size: 32 Kbytes',
      'Secondary unified instruction/data cache size: 2 Mbytes',
      'CRM graphics installed: CRIME Rev 1.4 + MRE + ICE MPEG/JPEG ASIC',
      'O2Cam Digital Video Camera: MVP Video Capture Interface unit 0',
      'Integral SCSI controller 0: Version ADAPTEC 7880',
      '  Disk drive: unit 1 on SCSI controller 0 (18.2GB XFS)',
      '  CDROM: unit 4 on SCSI controller 0: Toshiba CD-ROM',
      'On-board Fast Ethernet: ec0, MACE 10/100Base-TX',
      'Iris Audio Processor: version A3 revision 1',
    ],
  },
  indy: {
    id: 'indy',
    name: 'Silicon Graphics Indy (R5000 XZ)',
    codename: 'Guinness',
    ipArch: 'IP24',
    cpuModel: 'MIPS R5000 Processor Chip Revision: 2.1',
    cpuMHz: 180,
    cpuCount: 1,
    fpuModel: 'MIPS R5000 Floating Point Coprocessor Revision: 1.0',
    ramMB: 256,
    gfxSubsystem: 'XZ 24-bit Z-Buffer (2x GE10 Geometry Engines)',
    gfxTextureMB: 16,
    audioSubsystem: 'HAL2 Iris Audio Processor (4-channel 48kHz)',
    osRelease: 'IRIX 6.5 6.5.22m',
    chassisColor: '#2d5aa0',
    hinvLines: [
      '1 180 MHZ IP22 Processor',
      'CPU: MIPS R5000 Processor Chip Revision: 2.1',
      'FPU: MIPS R5000 Floating Point Coprocessor Revision: 1.0',
      'Main memory size: 256 Mbytes',
      'Instruction cache size: 32 Kbytes',
      'Data cache size: 32 Kbytes',
      'Secondary unified instruction/data cache size: 512 Kbytes',
      'Graphics board: XZ (24-bit TrueColor, 24-bit Z-buffer, 2x GE10)',
      'Vino video: unit 0, revision 0, IndyCam connected',
      'Integral SCSI controller 0: Version WD33C93B, revision D',
      '  Disk drive: unit 1 on SCSI controller 0 (9.1GB XFS)',
      'Integral Ethernet: ec0, version 1',
      'Iris Audio Processor: version A2 revision 4.1.0',
    ],
  },
  onyx2: {
    id: 'onyx2',
    name: 'SGI Onyx2 InfiniteReality3',
    codename: 'Kona / SN0 ccNUMA',
    ipArch: 'IP27',
    cpuModel: 'MIPS R12000 Processor Chip Revision: 3.5',
    cpuMHz: 400,
    cpuCount: 4,
    fpuModel: 'MIPS R12010 Floating Point Chip Revision: 0.0',
    ramMB: 4096,
    gfxSubsystem: 'InfiniteReality3 (4x GE16, 4x RM9, 64MB TRAM)',
    gfxTextureMB: 64,
    audioSubsystem: 'RAD Digital Studio Audio + Dividux',
    osRelease: 'IRIX64 6.5 6.5.22f',
    chassisColor: '#362c54',
    hinvLines: [
      '4 400 MHZ IP27 Processors (Origin/Onyx2 ccNUMA NodeBoards)',
      'CPU: MIPS R12000 Processor Chip Revision: 3.5',
      'FPU: MIPS R12010 Floating Point Chip Revision: 0.0',
      'Main memory size: 4096 Mbytes (CrayLink Interconnect)',
      'Secondary unified instruction/data cache size: 4 Mbytes per CPU',
      'Graphics board: InfiniteReality3 (Kona, 4x Geometry Engine, 4x RM9 Raster Mgr)',
      'Integral Fibre Channel: qlfc0, QLogic ISP2200',
      '  Disk drive: CXFS Striped Volume /dev/xlv/dmedia0 (144GB XFS)',
      'Integral Gigabit Ethernet: eg0, Alteon Tigon II',
      'Iris Audio Processor: version RAD revision 12.0',
    ],
  },
};

export type ColorSchemeId =
  | 'indigo_magic'
  | 'rio_grande'
  | 'redwood'
  | 'gainsborough'
  | 'midnight_onyx';

export interface SgiColorScheme {
  id: ColorSchemeId;
  name: string;
  description: string;
  desktopBg: string;
  desktopPattern?: string;
  activeTitleBg: string;
  activeTitleText: string;
  inactiveTitleBg: string;
  inactiveTitleText: string;
  windowSurface: string;
  windowWell: string;
  mauveInput: string;
  canvasSlate: string;
}

export const SGI_COLOR_SCHEMES: Record<ColorSchemeId, SgiColorScheme> = {
  indigo_magic: {
    id: 'indigo_magic',
    name: 'Indigo Magic (Default 6.5)',
    description: 'Classic SGI Slate Blue desktop, warm khaki active titlebar, and dusty rose input fields.',
    desktopBg: '#4c7093',
    activeTitleBg: '#b8a87e',
    activeTitleText: '#000000',
    inactiveTitleBg: '#9e9e9e',
    inactiveTitleText: '#222222',
    windowSurface: '#c4c4c4',
    windowWell: '#b0b0b0',
    mauveInput: '#c8979b',
    canvasSlate: '#55799c',
  },
  rio_grande: {
    id: 'rio_grande',
    name: 'Rio Grande',
    description: 'Warm southwestern desert terracotta & sandstone Motif palette.',
    desktopBg: '#3d696d',
    activeTitleBg: '#c48f6b',
    activeTitleText: '#000000',
    inactiveTitleBg: '#a89f96',
    inactiveTitleText: '#262220',
    windowSurface: '#cbc3b8',
    windowWell: '#b7aea2',
    mauveInput: '#c99b8e',
    canvasSlate: '#4a767a',
  },
  redwood: {
    id: 'redwood',
    name: 'Redwood',
    description: 'Northern California forest green with bronze-gold window borders.',
    desktopBg: '#375e54',
    activeTitleBg: '#9eb078',
    activeTitleText: '#000000',
    inactiveTitleBg: '#969c96',
    inactiveTitleText: '#1e241e',
    windowSurface: '#c0c4be',
    windowWell: '#acb0aa',
    mauveInput: '#b8979b',
    canvasSlate: '#466e64',
  },
  gainsborough: {
    id: 'gainsborough',
    name: 'Gainsborough',
    description: 'Cool CAD workstation pewter & cobalt blue highlights.',
    desktopBg: '#425675',
    activeTitleBg: '#84a2c4',
    activeTitleText: '#000000',
    inactiveTitleBg: '#9ca2aa',
    inactiveTitleText: '#1f242b',
    windowSurface: '#c6c9ce',
    windowWell: '#b2b6bc',
    mauveInput: '#b89db2',
    canvasSlate: '#52688a',
  },
  midnight_onyx: {
    id: 'midnight_onyx',
    name: 'Midnight Onyx (InfiniteReality)',
    description: 'Deep visual effects suite dark slate for color-critical compositing.',
    desktopBg: '#273444',
    activeTitleBg: '#7a689c',
    activeTitleText: '#ffffff',
    inactiveTitleBg: '#6e727c',
    inactiveTitleText: '#e0e0e0',
    windowSurface: '#aeaeb6',
    windowWell: '#9898a2',
    mauveInput: '#b48a98',
    canvasSlate: '#394b61',
  },
};

export type AppId =
  | 'winterm'
  | 'screensaver'
  | 'electropaint'
  | 'explorer'
  | 'director'
  | 'aw_module'
  | 'reference'
  | 'fcheck'
  | 'gr_osview'
  | 'icon_catalog'
  | 'iconsmith'
  | 'file_manager'
  | 'fsn'
  | 'gl_showcase'
  | 'ivcalc'
  | 'system_manager'
  | 'software_manager'
  | 'insight'
  | 'netscape'
  | 'jot'
  | 'toolchest_editor';

export type DeskId = 'Main' | 'Desk 2' | 'Desk 3' | 'Global';

/** 4Dwm default window geometry. Pure data, so it lives beside the AppId it
 *  describes rather than in the registry, which pulls in every application. */
export interface AppWindowDefaults {
  title: string;
  iconId: string;
  width: number;
  height: number;
}

export const APP_WINDOW_DEFAULTS: Record<AppId, AppWindowDefaults> = {
  winterm: { title: 'Winterm — root@silicon (/usr/people/guest)', iconId: 'winterm', width: 615, height: 330 },
  gr_osview: { title: 'gr_osview', iconId: 'gr_osview', width: 385, height: 330 },
  icon_catalog: { title: 'Icon Catalog: Applications (Page 1 of 6)', iconId: 'showcase', width: 535, height: 365 },
  iconsmith: { title: 'IconSmith — /usr/lib/filetype/iconlib/buttonfly.fti', iconId: 'iconsmith', width: 775, height: 525 },
  file_manager: { title: '/usr/people/guest', iconId: 'folder', width: 590, height: 455 },
  fsn: { title: 'fsn — a 3D File System Navigator (/usr/people/guest)', iconId: 'fsn', width: 760, height: 515 },
  gl_showcase: { title: 'SGI OpenGL & Buttonfly 3D Showcase (TrueColor 24-bit)', iconId: 'showcase', width: 585, height: 425 },
  ivcalc: { title: 'IVcalc', iconId: 'showcase', width: 720, height: 520 },
  system_manager: { title: 'System Manager — silicon.sgi.com', iconId: 'sysmgr', width: 635, height: 465 },
  software_manager: { title: 'Software Manager 4.1 — Manage Installed Software', iconId: 'swmgr', width: 620, height: 485 },
  screensaver: { title: 'Screen Saver — Desktop Customize Control Panel', iconId: 'screensaver', width: 700, height: 590 },
  electropaint: { title: 'ElectroPaint — ep -c (Interactive Dancing Polygons)', iconId: 'electropaint', width: 800, height: 500 },
  explorer: { title: 'Advanced Visualizer Model 4.2.1', iconId: 'explorer', width: 1080, height: 740 },
  director: { title: 'The Director — Alias|Wavefront', iconId: 'explorer', width: 640, height: 460 },
  aw_module: { title: 'Alias|Wavefront', iconId: 'explorer', width: 760, height: 520 },
  reference: { title: 'Real IRIX Screenshot Reference Gallery', iconId: 'reference', width: 860, height: 620 },
  fcheck: { title: 'fcheck — SGI image & movie sequence viewer', iconId: 'reference', width: 800, height: 560 },
  insight: { title: 'SGI InSight — IRIX 6.5 Specifications, Icon Set & Web Framework', iconId: 'insight', width: 745, height: 525 },
  netscape: { title: 'Netscape: SiliconSurf [SGI IRIX 6.5 Edition]', iconId: 'netscape', width: 685, height: 480 },
  jot: { title: 'jot — /usr/people/guest/readme.sgi', iconId: 'jot', width: 560, height: 410 },
  toolchest_editor: { title: 'Toolchest Editor — Customise the Toolchest Menu', iconId: 'toolchest_icon', width: 620, height: 520 },
};

/** Chapter of the SGI InSight online books. Lives here so the launch payloads
 *  can be typed without the store importing an application component. */
export type InsightChapter =
  | 'specs'
  | 'framework'
  | 'icons'
  | '4dwm'
  | 'savers'
  | 'wavefront'
  | 'screenshots';

/** An Alias|Wavefront product module, for the same reason. */
export type AwModuleId =
  | 'paint'
  | 'property'
  | 'dynamation'
  | 'kinemation'
  | 'preview'
  | 'composer';

/**
 * What each application accepts when it is launched. An application that takes
 * no arguments is typed `undefined`, so passing one is a compile error.
 *
 * This replaces the `Record<string, unknown>` payload that every launch site
 * used to cast its way through, which silently turned a typo into `undefined`.
 */
export interface AppPayloads {
  winterm: { runCmd?: string };
  screensaver: { module?: string };
  electropaint: undefined;
  explorer: { mode?: 'model' | 'shade' | 'animate' | 'render' };
  director: undefined;
  aw_module: { module?: AwModuleId; title?: string };
  reference: undefined;
  fcheck: { path?: string };
  gr_osview: undefined;
  icon_catalog: undefined;
  iconsmith: { iconId?: string };
  file_manager: { path?: string };
  fsn: undefined;
  gl_showcase: { mode?: 'cube' | 'buttonfly' | 'torus' | 'indycam' };
  ivcalc: undefined;
  system_manager: { tab?: 'hardware' | 'customize' | 'processes' | 'audio' };
  software_manager: undefined;
  insight: { chapter?: InsightChapter };
  netscape: { page?: 'siliconsurf' | 'irix65' | 'nekoware' };
  jot: { path?: string };
  toolchest_editor: undefined;
}

export type AppLaunchPayload = AppPayloads[AppId];

/** Launch an application with arguments checked against that application. */
export type LaunchApp = <A extends AppId>(appId: A, payload?: AppPayloads[A]) => void;

/** Launch whatever a filesystem node points at. The one place a dynamic
 *  AppId and an untyped node payload are allowed through. */
export type OpenNode = (node: VfsNode) => void;

/**
 * The payload of a window, narrowed to the application it belongs to. TypeScript
 * cannot correlate `win.appId === appId` with a generic union index, so this is
 * the single cast that replaces the dozen casts it used to sit in front of.
 */
export function payloadOf<A extends AppId>(win: WindowInstance, appId: A): AppPayloads[A] | undefined {
  return win.appId === appId ? (win.payload as AppPayloads[A]) : undefined;
}

export interface WindowInstance {
  id: string;
  appId: AppId;
  title: string;
  iconId: string;
  deskId: DeskId;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  shaded: boolean;
  minTileX: number;
  minTileY: number;
  payload?: AppLaunchPayload;
}

export interface VfsNode {
  path: string;
  name: string;
  type: 'dir' | 'file' | 'exec' | 'device';
  iconId: string;
  size: number;
  mtime: string;
  permissions: string;
  owner: string;
  tagHex: string;
  appId?: AppId;
  /** extra launch arguments, for example which Alias|Wavefront module to open */
  payload?: Record<string, unknown>;
  /** for real reference screenshots shipped in /usr/people/guest/screenshots */
  imageUrl?: string;
  content?: string;
}

/** The default ElectroPaint choreography script, as shipped in ~guest */
const ELECTROPAINT_SCRIPT_TEXT = EP_DEFAULT_SCRIPT;

const WAVEFRONT_README_TEXT = `WAVEFRONT EXPLORER 2.0 -- release notes
=========================================
Explorer is the modelling and animation module of the Wavefront product line,
the successor to The Advanced Visualizer (TAV) and the merged TDI Explore /
Wavefront code base.  It runs on Silicon Graphics IRIS workstations using
IRIS GL, and shares its scene format with Modeler, Property, Dynamation,
Kinemation, Preview and Composer.

NEW IN 2.0
----------
  o  Gestural (radial) menus: hold the right mouse button in the viewport and
     flick in the direction of the module you want.
  o  Shader-first asset organisation: assign a material to a hull by dropping
     the hull underneath the shader in the scene editor.
  o  Deformers as operators: bend, twist and taper without baking the hull.
  o  Interactive Photorealistic Rendering style feedback while a material is
     being tuned.
  o  Keyframes on rotation channels with 24 fps playback to the video deck.

NOTES
-----
Explorer's interface was designed for the three button SGI mouse:
  left   - tool / select in the viewport
  middle - camera tumble and dolly (hold and drag)
  right  - gestural menu

The next generation animation system built on PowerAnimator and Explorer will
be announced separately.  Scene files written here will load in it.
`;

export const INITIAL_VFS_NODES: VfsNode[] = [
  // Root directories
  {
    path: '/usr',
    name: 'usr',
    type: 'dir',
    iconId: 'folder',
    size: 4096,
    mtime: 'Oct 02 09:00',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    tagHex: '0x00000001',
  },
  {
    path: '/usr/people',
    name: 'people',
    type: 'dir',
    iconId: 'folder',
    size: 4096,
    mtime: 'Oct 02 09:00',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    tagHex: '0x00000001',
  },
  {
    path: '/usr/people/guest',
    name: 'guest',
    type: 'dir',
    iconId: 'folder',
    size: 4096,
    mtime: 'Oct 02 09:15',
    permissions: 'drwxr-xr-x',
    owner: 'guest',
    tagHex: '0x00000001',
  },
  {
    path: '/usr/demos',
    name: 'demos',
    type: 'dir',
    iconId: 'folder',
    size: 4096,
    mtime: 'Oct 02 09:00',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    tagHex: '0x00000001',
  },
  {
    path: '/usr/sbin',
    name: 'sbin',
    type: 'dir',
    iconId: 'folder',
    size: 4096,
    mtime: 'Oct 02 09:00',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    tagHex: '0x00000001',
  },
  {
    path: '/usr/lib/filetype/iconlib',
    name: 'iconlib',
    type: 'dir',
    iconId: 'folder',
    size: 8192,
    mtime: 'Oct 02 09:10',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    tagHex: '0x00000001',
  },
  {
    path: '/dumpster',
    name: 'dumpster',
    type: 'dir',
    iconId: 'dumpster',
    size: 512,
    mtime: 'Oct 02 09:00',
    permissions: 'drwxrwxrwt',
    owner: 'guest',
    tagHex: '0x00000009',
  },

  // Files inside /usr/people/guest (User Home Directory)
  {
    path: '/usr/people/guest/readme.sgi',
    name: 'readme.sgi',
    type: 'file',
    iconId: 'document',
    size: 2480,
    mtime: 'Oct 02 09:20',
    permissions: '-rw-r--r--',
    owner: 'guest',
    tagHex: '0x00000100',
    appId: 'jot',
    content: `Welcome to Silicon Graphics IRIX 6.5.22m (IRIX Interactive Desktop / Indigo Magic)!
===================================================================================
Host:       silicon.sgi.com (SGI Octane2 Dual 400MHz MIPS R12000, VPro V12 Odyssey)
Window Mgr: 4Dwm (The IRIS Extended Motif Window Manager)
Filesystem: SGI XFS 64-bit Extent Journaling Filesystem (/dev/root)

QUICK GUIDE TO THIS WORKSTATION:
--------------------------------
1. TOOLCHEST (Top-Left Menu):
   Click Desktop, Selected, Internet, Find, System, Demos, or Help to launch any tool.

2. VECTOR ICONS (.FTI) & THUMBWHEEL SCALING:
   Open "Icon Catalog" or "File Manager" and drag the vertical THUMBWHEEL on the left
   edge of the window to scale SGI's isometric vector icons smoothly in real time!
   Single-click an executable icon to see its "Magic Carpet" turn SGI Yellow.

3. ICONSMITH (.FTI VECTOR STUDIO):
   Launch "IconSmith" to inspect, edit, or draw authentic SGI .fti IRIS GL vector icons
   using the 256-color SGI palette + dynamic iconcolor/outlinecolor/shadowcolor!

4. 3D FILE SYSTEM NAVIGATOR (fsn):
   Launch "fsn" to fly across a 3D perspective landscape of this XFS filesystem
   (famous from the 1993 film Jurassic Park: "It's a UNIX system! I know this!").

5. GRAPHICAL OS TELEMETRY (gr_osview) & WINTERM (xwsh):
   Run 'hinv', 'uname -a', 'versions', 'ps -ef', 'df -k', or 'sgifetch' in Winterm!
`,
  },
  {
    path: '/usr/people/guest/IRIX_6.5_SPECIFICATIONS.md',
    name: 'IRIX_6.5_SPECIFICATIONS.md',
    type: 'file',
    iconId: 'insight',
    size: 14820,
    mtime: 'Oct 02 09:25',
    permissions: '-rw-r--r--',
    owner: 'root',
    tagHex: '0x00003001',
    appId: 'insight',
    content: `Open in SGI InSight Online Books or Jot to read the complete IRIX 6.5 Technical Specifications, Hardware Architecture, and Web Framework Selection Analysis.`,
  },
  {
    path: '/usr/people/guest/myShowcase3D',
    name: 'myShowcase3D',
    type: 'exec',
    iconId: 'showcase',
    size: 65536,
    mtime: 'Oct 01 18:12',
    permissions: '-rwxr-xr-x',
    owner: 'guest',
    tagHex: '0x00001040',
    appId: 'gl_showcase',
  },
  {
    path: '/usr/people/guest/IconSmith',
    name: 'IconSmith',
    type: 'exec',
    iconId: 'iconsmith',
    size: 98304,
    mtime: 'Oct 01 14:40',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x00001088',
    appId: 'iconsmith',
  },
  {
    path: '/usr/people/guest/fsn',
    name: 'fsn',
    type: 'exec',
    iconId: 'fsn',
    size: 142800,
    mtime: 'Sep 29 11:05',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x00009042',
    appId: 'fsn',
  },
  {
    path: '/usr/people/guest/4Dwmrc',
    name: '.4Dwmrc',
    type: 'file',
    iconId: 'document',
    size: 1240,
    mtime: 'Sep 28 16:30',
    permissions: '-rw-r--r--',
    owner: 'guest',
    tagHex: '0x00000100',
    appId: 'jot',
    content: `# SGI 4Dwm Window Manager Resource Configuration (~/.4Dwmrc)
*SG_useSchemes:             all
*SG_autoSave:               True
*keyboardFocusPolicy:       explicit
*iconPlacement:             bottom right
*clientDecoration:          all
*toolchest.clientDecoration: title -border
*toolchest.clientFunctions:  -resize -minimize -maximize
*TitleFont:                 -adobe-helvetica-bold-o-normal--14-100-100-100-p-82-iso8859-1
`,
  },

  // Executables in /usr/demos
  {
    path: '/usr/demos/buttonfly',
    name: 'buttonfly',
    type: 'exec',
    iconId: 'buttonfly',
    size: 112400,
    mtime: 'Jun 15 1998',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x00009084',
    appId: 'gl_showcase',
  },
  {
    path: '/usr/demos/fsn',
    name: 'fsn',
    type: 'exec',
    iconId: 'fsn',
    size: 142800,
    mtime: 'Jun 15 1998',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x00009042',
    appId: 'fsn',
  },
  {
    path: '/usr/demos/showcase',
    name: 'showcase',
    type: 'exec',
    iconId: 'showcase',
    size: 204800,
    mtime: 'Jun 15 1998',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x00001040',
    appId: 'gl_showcase',
  },

  // System utilities in /usr/sbin
  {
    path: '/usr/sbin/xwsh',
    name: 'xwsh',
    type: 'exec',
    iconId: 'winterm',
    size: 88400,
    mtime: 'Jun 15 1998',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x00001001',
    appId: 'winterm',
  },
  {
    path: '/usr/sbin/gr_osview',
    name: 'gr_osview',
    type: 'exec',
    iconId: 'gr_osview',
    size: 76200,
    mtime: 'Jun 15 1998',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x00001025',
    appId: 'gr_osview',
  },
  {
    path: '/usr/sbin/sysmgr',
    name: 'sysmgr',
    type: 'exec',
    iconId: 'sysmgr',
    size: 128400,
    mtime: 'Jun 15 1998',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x00002001',
    appId: 'system_manager',
  },
  {
    path: '/usr/sbin/swmgr',
    name: 'swmgr',
    type: 'exec',
    iconId: 'swmgr',
    size: 164000,
    mtime: 'Jun 15 1998',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x00002010',
    appId: 'software_manager',
  },
  {
    path: '/usr/sbin/iconsmith',
    name: 'iconsmith',
    type: 'exec',
    iconId: 'iconsmith',
    size: 98304,
    mtime: 'Jun 15 1998',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x00001088',
    appId: 'iconsmith',
  },
  {
    path: '/usr/sbin/netscape',
    name: 'netscape',
    type: 'exec',
    iconId: 'netscape',
    size: 4194304,
    mtime: 'Nov 12 2003',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x00004010',
    appId: 'netscape',
  },

  // Screen saver modules — screen_blanker picked one of these up on idle
  {
    path: '/usr/lib/screens',
    name: 'screens',
    type: 'dir',
    iconId: 'folder',
    size: 512,
    mtime: 'Jun 15 1998',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    tagHex: '0x00000001',
  },
  {
    path: '/usr/lib/screens/electropaint',
    name: 'electropaint',
    type: 'exec',
    iconId: 'electropaint',
    size: 96256,
    mtime: 'Jun 15 1998',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x000090A0',
    appId: 'electropaint',
  },
  {
    path: '/usr/lib/screens/spaceplants',
    name: 'spaceplants',
    type: 'exec',
    iconId: 'screensaver',
    size: 41984,
    mtime: 'Jun 15 1998',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x000090A1',
    appId: 'screensaver',
  },
  {
    path: '/usr/lib/screens/bounce',
    name: 'bounce',
    type: 'exec',
    iconId: 'showcase',
    size: 73728,
    mtime: 'Jun 15 1998',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x000090A2',
    appId: 'screensaver',
  },
  {
    path: '/usr/sbin/screen_blanker',
    name: 'screen_blanker',
    type: 'exec',
    iconId: 'screensaver',
    size: 32768,
    mtime: 'Jun 15 1998',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x00008030',
    appId: 'screensaver',
  },
  {
    path: '/usr/demos',
    name: 'demos',
    type: 'dir',
    iconId: 'folder',
    size: 512,
    mtime: 'Jun 15 1998',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    tagHex: '0x00000001',
  },
  {
    path: '/usr/demos/Inventor',
    name: 'Inventor',
    type: 'dir',
    iconId: 'folder',
    size: 512,
    mtime: 'Jun 15 1998',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    tagHex: '0x00000001',
  },
  {
    path: '/usr/demos/Inventor/ivcalc',
    name: 'ivcalc',
    type: 'exec',
    iconId: 'showcase',
    size: 184320,
    mtime: 'Jun 15 1998',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x000090B0',
    appId: 'ivcalc',
  },
  {
    path: '/usr/sbin/ep',
    name: 'ep',
    type: 'exec',
    iconId: 'electropaint',
    size: 96256,
    mtime: 'Jun 15 1998',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x000090A0',
    appId: 'electropaint',
  },
  {
    path: '/usr/people/guest/.ep_script',
    name: '.ep_script',
    type: 'file',
    iconId: 'document',
    size: 2140,
    mtime: 'Sep 30 22:14',
    permissions: '-rw-r--r--',
    owner: 'guest',
    tagHex: '0x00000100',
    appId: 'jot',
    content: ELECTROPAINT_SCRIPT_TEXT,
  },

  {
    path: '/usr/sbin/toolchest',
    name: 'toolchest',
    type: 'exec',
    iconId: 'toolchest_icon',
    size: 118784,
    mtime: 'Jun 15 1998',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x00001010',
    appId: 'toolchest_editor',
  },

  // Wavefront / Alias|Wavefront product tree (the Maya predecessor)
  {
    path: '/usr/local',
    name: 'local',
    type: 'dir',
    iconId: 'folder',
    size: 512,
    mtime: 'Jun 15 1998',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    tagHex: '0x00000001',
  },
  {
    path: '/usr/local/wave',
    name: 'wave',
    type: 'dir',
    iconId: 'folder',
    size: 4096,
    mtime: 'Mar 12 1996',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    tagHex: '0x00000001',
  },
  {
    path: '/usr/local/wave/explorer',
    name: 'explorer',
    type: 'exec',
    iconId: 'explorer',
    size: 6291456,
    mtime: 'Mar 12 1996',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x0000A100',
    appId: 'explorer',
  },
  {
    path: '/usr/local/wave/bin/director',
    name: 'director',
    type: 'exec',
    iconId: 'explorer',
    size: 3145728,
    mtime: 'Mar 12 1996',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x0000A100',
    appId: 'director',
  },
  {
    path: '/usr/local/wave/Modeler',
    name: 'Modeler',
    type: 'exec',
    iconId: 'explorer',
    size: 2097152,
    mtime: 'Mar 12 1996',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x0000A100',
    appId: 'explorer',
  },
  {
    path: '/usr/local/wave/Property',
    name: 'Property',
    type: 'exec',
    iconId: 'explorer',
    size: 1048576,
    mtime: 'Mar 12 1996',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x0000A101',
    appId: 'aw_module',
    payload: { module: 'property', title: 'Property — Alias|Wavefront' },
  },
  {
    path: '/usr/local/wave/Paint',
    name: 'Paint',
    type: 'exec',
    iconId: 'explorer',
    size: 1048576,
    mtime: 'Mar 12 1996',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x0000A102',
    appId: 'aw_module',
    payload: { module: 'paint', title: 'Paint — Alias|Wavefront' },
  },
  {
    path: '/usr/local/wave/Dynamation',
    name: 'Dynamation',
    type: 'exec',
    iconId: 'explorer',
    size: 1048576,
    mtime: 'Mar 12 1996',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x0000A103',
    appId: 'aw_module',
    payload: { module: 'dynamation', title: 'Dynamation — Alias|Wavefront' },
  },
  {
    path: '/usr/local/wave/Kinemation',
    name: 'Kinemation',
    type: 'exec',
    iconId: 'explorer',
    size: 1048576,
    mtime: 'Mar 12 1996',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x0000A104',
    appId: 'aw_module',
    payload: { module: 'kinemation', title: 'Kinemation — Alias|Wavefront' },
  },
  {
    path: '/usr/local/wave/Preview',
    name: 'Preview',
    type: 'exec',
    iconId: 'explorer',
    size: 1048576,
    mtime: 'Mar 12 1996',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x0000A105',
    appId: 'aw_module',
    payload: { module: 'preview', title: 'Preview — Alias|Wavefront' },
  },
  {
    path: '/usr/local/wave/Composer',
    name: 'Composer',
    type: 'exec',
    iconId: 'explorer',
    size: 1048576,
    mtime: 'Mar 12 1996',
    permissions: '-rwxr-xr-x',
    owner: 'root',
    tagHex: '0x0000A106',
    appId: 'aw_module',
    payload: { module: 'composer', title: 'Composer — Alias|Wavefront' },
  },
  {
    path: '/usr/local/wave/WAVEFRONT_Explorer_README',
    name: 'WAVEFRONT_Explorer_README',
    type: 'file',
    iconId: 'document',
    size: 3120,
    mtime: 'Mar 12 1996',
    permissions: '-rw-r--r--',
    owner: 'root',
    tagHex: '0x00000100',
    appId: 'jot',
    content: WAVEFRONT_README_TEXT,
  },
  {
    path: '/usr/local/wave/data/explorer_scene.obj',
    name: 'explorer_scene.obj',
    type: 'file',
    iconId: 'document',
    size: 5120,
    mtime: 'Mar 12 1996',
    permissions: '-rw-r--r--',
    owner: 'guest',
    tagHex: '0x00000100',
    appId: 'explorer',
    content: `# Wavefront OBJ geometry — the scene opened by the Explorer module
# (Wavefront's polygon format, the same .obj the industry still uses)
v  0.000000  1.200000  0.000000
v -0.550000  0.000000  0.550000
...
# The Explorer scene graph is stored separately as a .wff directory of
# hull / patch / shader / camera references.  Edit the model here, then
# save back through the Object -> Save menu.`,
  },
  {
    path: '/usr/people/guest/renders',
    name: 'renders',
    type: 'dir',
    iconId: 'folder',
    size: 512,
    mtime: 'Oct 03 18:22',
    permissions: 'drwxr-xr-x',
    owner: 'guest',
    tagHex: '0x00000001',
  },

  // Real IRIX reference screenshots (the captures this simulator was tuned against)
  {
    path: '/usr/people/guest/screenshots',
    name: 'screenshots',
    type: 'dir',
    iconId: 'folder',
    size: 8192,
    mtime: 'Oct 03 20:00',
    permissions: 'drwxr-xr-x',
    owner: 'guest',
    tagHex: '0x00000001',
  },
  ...IRIX_REFERENCE_SCREENSHOTS.map((shot) => ({
    path: `/usr/people/guest/screenshots/${shot.file}`,
    name: shot.file,
    type: 'file' as const,
    iconId: 'reference',
    size: 48000,
    mtime: 'Oct 03 20:00',
    permissions: '-rw-r--r--',
    owner: 'guest',
    tagHex: '0x00020002',
    appId: 'reference' as AppId,
    imageUrl: `/screenshots/${shot.file}`,
    content: `${shot.title}\n\nSource:  ${shot.source}\nCredit:  ${shot.credit}\nLicence: ${shot.license}\n\nEvidence for:\n${shot.shows
      .map((l) => `  - ${l}`)
      .join('\n')}`,
  })),

  // Populate /usr/lib/filetype/iconlib with actual .fti files from our library!
  ...Object.values(IRIX_ICON_LIBRARY).map((iconDef) => ({
    path: `/usr/lib/filetype/iconlib/${iconDef.filename}`,
    name: iconDef.filename,
    type: 'file' as const,
    iconId: iconDef.id,
    size: iconDef.ftiScript.length,
    mtime: 'Jun 15 1998',
    permissions: '-rw-r--r--',
    owner: 'root',
    tagHex: iconDef.tagHex,
    appId: 'iconsmith' as AppId,
    content: iconDef.ftiScript.trim(),
  })),
];

export const INITIAL_WINDOWS: WindowInstance[] = [
  {
    id: 'win_icon_catalog',
    appId: 'icon_catalog',
    title: 'Icon Catalog: Applications (Page 1 of 6)',
    iconId: 'showcase',
    deskId: 'Main',
    x: 158,
    y: 26,
    width: 530,
    height: 360,
    zIndex: 12,
    minimized: false,
    maximized: false,
    shaded: false,
    minTileX: 145,
    minTileY: 12,
  },
  {
    id: 'win_gr_osview',
    appId: 'gr_osview',
    title: 'gr_osview',
    iconId: 'gr_osview',
    deskId: 'Main',
    x: 702,
    y: 26,
    width: 380,
    height: 325,
    zIndex: 11,
    minimized: false,
    maximized: false,
    shaded: false,
    minTileX: 222,
    minTileY: 12,
  },
  {
    id: 'win_winterm',
    appId: 'winterm',
    title: 'Winterm — root@silicon (/usr/people/guest)',
    iconId: 'winterm',
    deskId: 'Main',
    x: 240,
    y: 400,
    width: 610,
    height: 315,
    zIndex: 13,
    minimized: false,
    maximized: false,
    shaded: false,
    minTileX: 299,
    minTileY: 12,
  },
  {
    id: 'win_insight_min',
    appId: 'insight',
    title: 'InSight: IRIX 6.5 Specifications & Architecture',
    iconId: 'insight',
    deskId: 'Main',
    x: 190,
    y: 60,
    width: 720,
    height: 520,
    zIndex: 9,
    minimized: true, // Starts as an authentic minimized 4Dwm square desktop tile next to Toolchest!
    maximized: false,
    shaded: false,
    minTileX: 145,
    minTileY: 10,
  },
  // Desk 2 (Development & Vector Icon Studio)
  {
    id: 'win_iconsmith_d2',
    appId: 'iconsmith',
    title: 'IconSmith — /usr/lib/filetype/iconlib/buttonfly.fti',
    iconId: 'iconsmith',
    deskId: 'Desk 2',
    x: 170,
    y: 35,
    width: 760,
    height: 540,
    zIndex: 10,
    minimized: false,
    maximized: false,
    shaded: false,
    minTileX: 222,
    minTileY: 10,
  },
  // Desk 3 (3D Graphics & File System Navigator)
  {
    id: 'win_fsn_d3',
    appId: 'fsn',
    title: 'fsn — a 3D File System Navigator (/usr/people/guest)',
    iconId: 'fsn',
    deskId: 'Desk 3',
    x: 165,
    y: 30,
    width: 780,
    height: 540,
    zIndex: 10,
    minimized: false,
    maximized: false,
    shaded: false,
    minTileX: 299,
    minTileY: 10,
  },
];
