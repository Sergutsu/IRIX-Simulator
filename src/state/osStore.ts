import { IRIX_ICON_LIBRARY } from '../icons/irixIconSet';

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
  | 'gr_osview'
  | 'icon_catalog'
  | 'iconsmith'
  | 'file_manager'
  | 'fsn'
  | 'gl_showcase'
  | 'system_manager'
  | 'software_manager'
  | 'insight'
  | 'netscape'
  | 'jot';

export type DeskId = 'Main' | 'Desk 2' | 'Desk 3' | 'Global';

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
  payload?: Record<string, unknown>;
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
  content?: string;
}

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
