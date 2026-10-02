import React, { useMemo } from 'react';
import {
  FtiPath,
  GENERIC_EXEC_CLOSED_FTI,
  GENERIC_EXEC_OPEN_FTI,
  IconVisualState,
  parseFtiScript,
  resolveFtiColor,
} from './ftiEngine';

export interface IrixIconDefinition {
  id: string;
  name: string;
  filename: string;
  category: 'Desktop' | 'Applications' | 'Demos' | 'ControlPanels' | 'SystemTools' | 'WebTools';
  supertype: 'Executable' | 'Directory' | 'Device' | 'Document' | 'System';
  useMagicCarpet: boolean;
  tagHex: string;
  legend: string;
  ftiScript: string;
}

export const IRIX_ICON_LIBRARY: Record<string, IrixIconDefinition> = {
  // 1. SGI IndyCam / O2 Digital Camera (Desktop top-right icon)
  camera: {
    id: 'camera',
    name: 'camera',
    filename: 'indycam.fti',
    category: 'Desktop',
    supertype: 'Device',
    useMagicCarpet: false,
    tagHex: '0x00010210',
    legend: 'SGI IndyCam / O2 Digital Video Capture',
    ftiScript: `
# SGI IndyCam / Video Camera Isometric Icon (.fti)
color(shadowcolor);
bgnpolygon();
  vertex(26.00, 14.00);
  vertex(58.00, 4.00);
  vertex(84.00, 17.00);
  vertex(52.00, 27.00);
endpolygon();

# Base stand
color(-136);
bgnoutlinepolygon();
  vertex(34.00, 18.00);
  vertex(56.00, 10.00);
  vertex(74.00, 19.00);
  vertex(52.00, 27.00);
endoutlinepolygon(outlinecolor);

# Stem
color(-247);
bgnoutlinepolygon();
  vertex(48.00, 22.00);
  vertex(56.00, 22.00);
  vertex(56.00, 42.00);
  vertex(48.00, 42.00);
endoutlinepolygon(outlinecolor);

# Camera body left isometric face
color(iconcolor);
bgnoutlinepolygon();
  vertex(26.00, 46.00);
  vertex(54.00, 32.00);
  vertex(54.00, 68.00);
  vertex(26.00, 82.00);
endoutlinepolygon(outlinecolor);

# Camera body right isometric face
color(-255);
bgnoutlinepolygon();
  vertex(54.00, 32.00);
  vertex(78.00, 44.00);
  vertex(78.00, 80.00);
  vertex(54.00, 68.00);
endoutlinepolygon(outlinecolor);

# Camera body top isometric face
color(7);
bgnoutlinepolygon();
  vertex(26.00, 82.00);
  vertex(54.00, 68.00);
  vertex(78.00, 80.00);
  vertex(50.00, 94.00);
endoutlinepolygon(outlinecolor);

# Camera lens barrel
color(-128);
bgnoutlinepolygon();
  vertex(22.00, 56.00);
  vertex(38.00, 48.00);
  vertex(38.00, 68.00);
  vertex(22.00, 76.00);
endoutlinepolygon(outlinecolor);

# Lens glass reflection (cyan/blue)
color(-100);
bgnoutlinepolygon();
  vertex(25.00, 60.00);
  vertex(35.00, 55.00);
  vertex(35.00, 65.00);
  vertex(25.00, 70.00);
endoutlinepolygon(outlinecolor);

# Recording LED (green)
color(2);
bgnoutlinepolygon();
  vertex(44.00, 66.00);
  vertex(49.00, 63.50);
  vertex(49.00, 68.50);
  vertex(44.00, 71.00);
endoutlinepolygon(outlinecolor);
`,
  },

  // 2. O2cam mic (SGI O2 Desktop Camera & Dock)
  o2cam_mic: {
    id: 'o2cam_mic',
    name: 'O2cam mic',
    filename: 'o2cam.fti',
    category: 'Desktop',
    supertype: 'Device',
    useMagicCarpet: false,
    tagHex: '0x00010214',
    legend: 'Silicon Graphics O2Cam Digital Audio/Video Dock',
    ftiScript: `
# SGI O2cam mic isometric icon (.fti)
color(shadowcolor);
bgnpolygon();
  vertex(20.00, 16.00);
  vertex(55.00, 4.00);
  vertex(86.00, 18.00);
  vertex(51.00, 30.00);
endpolygon();

# Curved O2 dock base
color(-128);
bgnoutlinepolygon();
  vertex(18.00, 22.00);
  vertex(52.00, 10.00);
  vertex(82.00, 24.00);
  vertex(48.00, 36.00);
endoutlinepolygon(outlinecolor);

color(iconcolor);
bgnoutlinepolygon();
  vertex(22.00, 25.00);
  vertex(50.00, 15.00);
  vertex(74.00, 26.00);
  vertex(46.00, 36.00);
endoutlinepolygon(outlinecolor);

# Neck stalk
color(-136);
bgnoutlinepolygon();
  vertex(48.00, 30.00);
  vertex(55.00, 30.00);
  vertex(63.00, 64.00);
  vertex(55.00, 64.00);
endoutlinepolygon(outlinecolor);

# O2cam head pod
color(iconcolor);
bgnoutlinepolygon();
  vertex(42.00, 66.00);
  vertex(64.00, 58.00);
  vertex(74.00, 74.00);
  vertex(52.00, 84.00);
endoutlinepolygon(outlinecolor);

# Lens eye
color(-68);
bgnoutlinepolygon();
  vertex(46.00, 70.00);
  vertex(56.00, 66.00);
  vertex(58.00, 75.00);
  vertex(48.00, 79.00);
endoutlinepolygon(outlinecolor);
`,
  },

  // 3. Microphone (SGI Desktop Audio Input)
  microphone: {
    id: 'microphone',
    name: 'microphone',
    filename: 'microphone.fti',
    category: 'Desktop',
    supertype: 'Device',
    useMagicCarpet: false,
    tagHex: '0x00010220',
    legend: 'IRIX Digital Media Microphone Input',
    ftiScript: `
# SGI Isometric Studio Microphone (.fti)
color(shadowcolor);
bgnpolygon();
  vertex(28.00, 14.00);
  vertex(58.00, 5.00);
  vertex(84.00, 17.00);
  vertex(54.00, 26.00);
endpolygon();

# Desk stand base
color(-136);
bgnoutlinepolygon();
  vertex(30.00, 20.00);
  vertex(56.00, 10.00);
  vertex(78.00, 20.00);
  vertex(52.00, 30.00);
endoutlinepolygon(outlinecolor);

# Stand arm
color(iconcolor);
bgnoutlinepolygon();
  vertex(50.00, 22.00);
  vertex(56.00, 20.00);
  vertex(56.00, 52.00);
  vertex(50.00, 54.00);
endoutlinepolygon(outlinecolor);

# Tilted microphone body
color(iconcolor);
bgnoutlinepolygon();
  vertex(32.00, 68.00);
  vertex(58.00, 44.00);
  vertex(68.00, 54.00);
  vertex(42.00, 78.00);
endoutlinepolygon(outlinecolor);

# Microphone mesh capsule head
color(-247);
bgnoutlinepolygon();
  vertex(22.00, 78.00);
  vertex(34.00, 66.00);
  vertex(46.00, 78.00);
  vertex(34.00, 90.00);
endoutlinepolygon(outlinecolor);

color(-136);
bgnline();
  vertex(26.00, 82.00);
  vertex(38.00, 70.00);
endline();
`,
  },

  // 4. Folder / Directory (root or /usr/people/guest)
  folder: {
    id: 'folder',
    name: 'root',
    filename: 'generic.dir.closed.fti',
    category: 'Desktop',
    supertype: 'Directory',
    useMagicCarpet: false,
    tagHex: '0x00000001',
    legend: 'XFS Directory Folder',
    ftiScript: `
# SGI Isometric Directory Folder (.fti)
color(shadowcolor);
bgnpolygon();
  vertex(22.00, 14.00);
  vertex(78.00, 42.00);
  vertex(86.00, 36.00);
  vertex(30.00, 8.00);
endpolygon();

# Back folder leaf + tab
color(-251);
bgnoutlinepolygon();
  vertex(22.00, 18.00);
  vertex(22.00, 64.00);
  vertex(38.00, 72.00);
  vertex(42.00, 68.00);
  vertex(74.00, 84.00);
  vertex(74.00, 44.00);
endoutlinepolygon(outlinecolor);

# White paper sheet peeking inside folder
color(7);
bgnoutlinepolygon();
  vertex(26.00, 24.00);
  vertex(26.00, 58.00);
  vertex(70.00, 80.00);
  vertex(70.00, 46.00);
endoutlinepolygon(outlinecolor);

# Front folder leaf (painted with iconcolor so selection turns it yellow!)
color(iconcolor);
bgnoutlinepolygon();
  vertex(22.00, 18.00);
  vertex(28.00, 52.00);
  vertex(80.00, 78.00);
  vertex(74.00, 44.00);
endoutlinepolygon(outlinecolor);
`,
  },

  // 5. Dumpster (The iconic SGI IRIX Trash Dumpster!)
  dumpster: {
    id: 'dumpster',
    name: 'dumpster',
    filename: 'dumpster.fti',
    category: 'Desktop',
    supertype: 'Directory',
    useMagicCarpet: false,
    tagHex: '0x00000009',
    legend: 'IRIX Desktop Dumpster (/usr/people/guest/.dumpster)',
    ftiScript: `
# SGI Iconic Isometric Industrial Dumpster (.fti)
color(shadowcolor);
bgnpolygon();
  vertex(18.00, 18.00);
  vertex(52.00, 4.00);
  vertex(88.00, 22.00);
  vertex(54.00, 36.00);
endpolygon();

# Left front wall of dumpster
color(iconcolor);
bgnoutlinepolygon();
  vertex(20.00, 24.00);
  vertex(52.00, 10.00);
  vertex(56.00, 42.00);
  vertex(20.00, 58.00);
endoutlinepolygon(outlinecolor);

# Right side wall of dumpster
color(-255);
bgnoutlinepolygon();
  vertex(52.00, 10.00);
  vertex(84.00, 26.00);
  vertex(86.00, 56.00);
  vertex(56.00, 42.00);
endoutlinepolygon(outlinecolor);

# Inside dark cavity of dumpster
color(-136);
bgnoutlinepolygon();
  vertex(20.00, 58.00);
  vertex(56.00, 42.00);
  vertex(86.00, 56.00);
  vertex(50.00, 72.00);
endoutlinepolygon(outlinecolor);

# Flipped-up open dumpster lid
color(iconcolor);
bgnoutlinepolygon();
  vertex(18.00, 58.00);
  vertex(48.00, 72.00);
  vertex(36.00, 92.00);
  vertex(8.00, 78.00);
endoutlinepolygon(outlinecolor);

# Side reinforcement ribs
color(outlinecolor);
bgnline();
  vertex(62.00, 16.00);
  vertex(65.00, 45.00);
endline();
bgnline();
  vertex(73.00, 21.00);
  vertex(76.00, 50.00);
endline();
`,
  },

  // 6. CD-ROM Drive & Disc (Desktop icon)
  cdrom: {
    id: 'cdrom',
    name: 'CDROM',
    filename: 'cdrom.fti',
    category: 'Desktop',
    supertype: 'Device',
    useMagicCarpet: false,
    tagHex: '0x00010240',
    legend: 'SGI Toshiba SCSI-2 CD-ROM Drive (/CDROM)',
    ftiScript: `
# SGI Isometric CD-ROM Drive & Optical Disc (.fti)
color(shadowcolor);
bgnpolygon();
  vertex(14.00, 22.00);
  vertex(54.00, 4.00);
  vertex(92.00, 22.00);
  vertex(52.00, 40.00);
endpolygon();

# Drive chassis top
color(iconcolor);
bgnoutlinepolygon();
  vertex(14.00, 32.00);
  vertex(52.00, 14.00);
  vertex(88.00, 32.00);
  vertex(50.00, 50.00);
endoutlinepolygon(outlinecolor);

# Drive chassis front left bevel
color(-255);
bgnoutlinepolygon();
  vertex(14.00, 24.00);
  vertex(52.00, 6.00);
  vertex(52.00, 14.00);
  vertex(14.00, 32.00);
endoutlinepolygon(outlinecolor);

# Drive chassis front right bevel
color(-136);
bgnoutlinepolygon();
  vertex(52.00, 6.00);
  vertex(88.00, 24.00);
  vertex(88.00, 32.00);
  vertex(52.00, 14.00);
endoutlinepolygon(outlinecolor);

# Optical CD disc emerging on tray
color(7);
bgnoutlinepolygon();
  vertex(32.00, 30.00);
  vertex(52.00, 22.00);
  vertex(72.00, 30.00);
  vertex(78.00, 42.00);
  vertex(70.00, 54.00);
  vertex(50.00, 60.00);
  vertex(32.00, 52.00);
  vertex(26.00, 40.00);
endoutlinepolygon(outlinecolor);

# Rainbow cyan/blue reflection sector on CD
color(-102);
bgnpolygon();
  vertex(52.00, 41.00);
  vertex(68.00, 32.00);
  vertex(74.00, 42.00);
endpolygon();

# CD center hole
color(-136);
bgnoutlinepolygon();
  vertex(47.00, 40.00);
  vertex(52.00, 37.00);
  vertex(57.00, 40.00);
  vertex(52.00, 43.00);
endoutlinepolygon(outlinecolor);
`,
  },

  // 7. Winterm / xwsh (IRIX Unix Shell Console)
  winterm: {
    id: 'winterm',
    name: 'winterm',
    filename: 'winterm.fti',
    category: 'SystemTools',
    supertype: 'Executable',
    useMagicCarpet: true,
    tagHex: '0x00001001',
    legend: 'xwsh — IRIX Interactive UNIX Shell Terminal',
    ftiScript: `
# SGI Winterm (xwsh) CRT Monitor on Magic Carpet (.fti)
# CRT Monitor housing left/front (screen bezel)
color(iconcolor);
bgnoutlinepolygon();
  vertex(24.00, 38.00);
  vertex(58.00, 22.00);
  vertex(58.00, 66.00);
  vertex(24.00, 82.00);
endoutlinepolygon(outlinecolor);

# CRT Monitor side depth
color(-255);
bgnoutlinepolygon();
  vertex(58.00, 22.00);
  vertex(78.00, 34.00);
  vertex(78.00, 74.00);
  vertex(58.00, 66.00);
endoutlinepolygon(outlinecolor);

# CRT Monitor top
color(7);
bgnoutlinepolygon();
  vertex(24.00, 82.00);
  vertex(58.00, 66.00);
  vertex(78.00, 74.00);
  vertex(46.00, 90.00);
endoutlinepolygon(outlinecolor);

# Dark Teal/Blue CRT Glass Screen
color(-64);
bgnoutlinepolygon();
  vertex(28.00, 44.00);
  vertex(54.00, 31.00);
  vertex(54.00, 61.00);
  vertex(28.00, 74.00);
endoutlinepolygon(outlinecolor);

# Glowing green UNIX prompt ">_"
color(2);
bgnline();
  vertex(33.00, 63.00);
  vertex(41.00, 56.00);
  vertex(33.00, 53.00);
endline();
bgnline();
  vertex(43.00, 51.00);
  vertex(50.00, 47.00);
endline();
`,
  },

  // 8. gr_osview (Real-Time Graphical OS System Monitor)
  gr_osview: {
    id: 'gr_osview',
    name: 'gr_osview',
    filename: 'gr_osview.fti',
    category: 'SystemTools',
    supertype: 'Executable',
    useMagicCarpet: true,
    tagHex: '0x00001025',
    legend: 'gr_osview — Graphical System Performance Monitor',
    ftiScript: `
# SGI gr_osview Multi-Bar Telemetry Badge (.fti)
color(-128);
bgnoutlinepolygon();
  vertex(24.00, 34.00);
  vertex(76.00, 34.00);
  vertex(76.00, 86.00);
  vertex(24.00, 86.00);
endoutlinepolygon(outlinecolor);

# Bar 1: CPU 0 (Red sys + Blue user + Green idle)
color(1);
bgnpolygon();
  vertex(28.00, 74.00);
  vertex(38.00, 74.00);
  vertex(38.00, 81.00);
  vertex(28.00, 81.00);
endpolygon();
color(4);
bgnpolygon();
  vertex(38.00, 74.00);
  vertex(52.00, 74.00);
  vertex(52.00, 81.00);
  vertex(38.00, 81.00);
endpolygon();
color(2);
bgnpolygon();
  vertex(52.00, 74.00);
  vertex(72.00, 74.00);
  vertex(72.00, 81.00);
  vertex(52.00, 81.00);
endpolygon();

# Bar 2: CPU 1
color(4);
bgnpolygon();
  vertex(28.00, 63.00);
  vertex(44.00, 63.00);
  vertex(44.00, 70.00);
  vertex(28.00, 70.00);
endpolygon();
color(2);
bgnpolygon();
  vertex(44.00, 63.00);
  vertex(72.00, 63.00);
  vertex(72.00, 70.00);
  vertex(44.00, 70.00);
endpolygon();

# Bar 3: Memory (Blue + Cyan + Magenta + Green)
color(6);
bgnpolygon();
  vertex(28.00, 52.00);
  vertex(40.00, 52.00);
  vertex(40.00, 59.00);
  vertex(28.00, 59.00);
endpolygon();
color(5);
bgnpolygon();
  vertex(40.00, 52.00);
  vertex(56.00, 52.00);
  vertex(56.00, 59.00);
  vertex(40.00, 59.00);
endpolygon();
color(2);
bgnpolygon();
  vertex(56.00, 52.00);
  vertex(72.00, 52.00);
  vertex(72.00, 59.00);
  vertex(56.00, 59.00);
endpolygon();

# Bar 4: Gfx pipeline
color(4);
bgnpolygon();
  vertex(28.00, 40.00);
  vertex(54.00, 40.00);
  vertex(54.00, 47.00);
  vertex(28.00, 47.00);
endpolygon();
color(3);
bgnpolygon();
  vertex(54.00, 40.00);
  vertex(66.00, 40.00);
  vertex(66.00, 47.00);
  vertex(54.00, 47.00);
endpolygon();
`,
  },

  // 9. fsn (3D File System Navigator — Jurassic Park "It's a UNIX system!")
  fsn: {
    id: 'fsn',
    name: 'fsn',
    filename: 'fsn.fti',
    category: 'Demos',
    supertype: 'Executable',
    useMagicCarpet: true,
    tagHex: '0x00009042',
    legend: 'fsn — SGI 3D File System Navigator (IRIS GL)',
    ftiScript: `
# SGI fsn 3D File System Navigator Badge (.fti)
# Green 3D horizon ground plane
color(-32);
bgnoutlinepolygon();
  vertex(16.00, 34.00);
  vertex(50.00, 20.00);
  vertex(84.00, 34.00);
  vertex(50.00, 48.00);
endoutlinepolygon(outlinecolor);

# 3D Directory Pedestal 1 (Left)
color(-193);
bgnoutlinepolygon();
  vertex(22.00, 38.00);
  vertex(36.00, 32.00);
  vertex(36.00, 48.00);
  vertex(22.00, 54.00);
endoutlinepolygon(outlinecolor);

# 3D Directory Pedestal 2 (Right)
color(-193);
bgnoutlinepolygon();
  vertex(62.00, 38.00);
  vertex(76.00, 32.00);
  vertex(76.00, 48.00);
  vertex(62.00, 54.00);
endoutlinepolygon(outlinecolor);

# 3D Center Pedestal (Highlighted)
color(-81);
bgnoutlinepolygon();
  vertex(40.00, 32.00);
  vertex(60.00, 32.00);
  vertex(60.00, 52.00);
  vertex(40.00, 52.00);
endoutlinepolygon(outlinecolor);

# Yellow/White Spotlight Cone from Sky
color(-115);
bgnoutlinepolygon();
  vertex(46.00, 92.00);
  vertex(54.00, 92.00);
  vertex(64.00, 48.00);
  vertex(36.00, 48.00);
endoutlinepolygon(-51);
`,
  },

  // 10. IconSmith (Interactive .fti Vector Icon Editor)
  iconsmith: {
    id: 'iconsmith',
    name: 'IconSmith',
    filename: 'iconsmith.fti',
    category: 'Applications',
    supertype: 'Executable',
    useMagicCarpet: true,
    tagHex: '0x00001088',
    legend: 'IconSmith — SGI Interactive .FTI Vector Icon Editor',
    ftiScript: `
# SGI IconSmith Isometric Drafting & Polygon Studio Badge (.fti)
# Isometric grid board
color(-198);
bgnoutlinepolygon();
  vertex(22.00, 42.00);
  vertex(52.00, 26.00);
  vertex(80.00, 42.00);
  vertex(50.00, 58.00);
endoutlinepolygon(outlinecolor);

# Isometric 3D Star/Cube being drafted
color(-51);
bgnoutlinepolygon();
  vertex(36.00, 62.00);
  vertex(52.00, 54.00);
  vertex(68.00, 62.00);
  vertex(52.00, 70.00);
endoutlinepolygon(outlinecolor);

color(-17);
bgnoutlinepolygon();
  vertex(36.00, 44.00);
  vertex(52.00, 36.00);
  vertex(52.00, 54.00);
  vertex(36.00, 62.00);
endoutlinepolygon(outlinecolor);

color(-68);
bgnoutlinepolygon();
  vertex(52.00, 36.00);
  vertex(68.00, 44.00);
  vertex(68.00, 62.00);
  vertex(52.00, 54.00);
endoutlinepolygon(outlinecolor);

# Drafting pen nib touching top vertex
color(7);
bgnoutlinepolygon();
  vertex(52.00, 70.00);
  vertex(68.00, 92.00);
  vertex(76.00, 86.00);
endoutlinepolygon(outlinecolor);
`,
  },

  // 11. Netscape Navigator (SGI Branded Cube 'N' on Magic Carpet — matching i-5.webp!)
  netscape: {
    id: 'netscape',
    name: 'netscape',
    filename: 'netscape.fti',
    category: 'WebTools',
    supertype: 'Executable',
    useMagicCarpet: true,
    tagHex: '0x00004010',
    legend: 'Netscape Communicator 4.78 (SGI IRIX Edition)',
    ftiScript: `
# SGI Netscape Isometric 3D Teal Cube with 'N' (.fti)
# Black shadow ring on carpet
color(0);
bgnoutlinepolygon();
  vertex(26.00, 36.00);
  vertex(50.00, 24.00);
  vertex(74.00, 36.00);
  vertex(50.00, 48.00);
endoutlinepolygon(outlinecolor);

# Left teal face of cube
color(-134);
bgnoutlinepolygon();
  vertex(28.00, 42.00);
  vertex(50.00, 30.00);
  vertex(50.00, 74.00);
  vertex(28.00, 84.00);
endoutlinepolygon(outlinecolor);

# Right darker teal face of cube
color(-96);
bgnoutlinepolygon();
  vertex(50.00, 30.00);
  vertex(72.00, 42.00);
  vertex(72.00, 84.00);
  vertex(50.00, 74.00);
endoutlinepolygon(outlinecolor);

# White 'N' spanning the 3D cube
color(7);
bgnoutlinepolygon();
  vertex(34.00, 44.00);
  vertex(40.00, 44.00);
  vertex(40.00, 68.00);
  vertex(58.00, 42.00);
  vertex(64.00, 42.00);
  vertex(64.00, 76.00);
  vertex(58.00, 76.00);
  vertex(58.00, 52.00);
  vertex(40.00, 76.00);
  vertex(34.00, 76.00);
endoutlinepolygon(outlinecolor);
`,
  },

  // 12. SGI Showcase / 3D OpenGL Demo (Top Hat & 3D Primitives — matching i-3.webp!)
  showcase: {
    id: 'showcase',
    name: 'showcase',
    filename: 'showcase.fti',
    category: 'Demos',
    supertype: 'Executable',
    useMagicCarpet: true,
    tagHex: '0x00001040',
    legend: 'SGI Showcase & OpenGL 3D Graphics Suite',
    ftiScript: `
# SGI Showcase Magician Hat & 3D Geometry (.fti)
# Hat brim
color(0);
bgnoutlinepolygon();
  vertex(22.00, 44.00);
  vertex(50.00, 32.00);
  vertex(78.00, 44.00);
  vertex(50.00, 56.00);
endoutlinepolygon(outlinecolor);

# Hat cylinder
color(-128);
bgnoutlinepolygon();
  vertex(34.00, 44.00);
  vertex(66.00, 44.00);
  vertex(62.00, 76.00);
  vertex(38.00, 76.00);
endoutlinepolygon(outlinecolor);

# Red ribbon on hat
color(1);
bgnoutlinepolygon();
  vertex(34.00, 46.00);
  vertex(66.00, 46.00);
  vertex(65.00, 53.00);
  vertex(35.00, 53.00);
endoutlinepolygon(outlinecolor);

# Floating 3D Cyan/Yellow shapes emerging from hat
color(6);
bgnoutlinepolygon();
  vertex(26.00, 72.00);
  vertex(38.00, 66.00);
  vertex(38.00, 82.00);
  vertex(26.00, 88.00);
endoutlinepolygon(outlinecolor);

color(3);
bgnoutlinepolygon();
  vertex(54.00, 74.00);
  vertex(74.00, 74.00);
  vertex(64.00, 92.00);
endoutlinepolygon(outlinecolor);
`,
  },

  // 13. Real genapp.fti from g000001/irix-icons (Buttonfly / 3D Isometric Cubes)
  buttonfly: {
    id: 'buttonfly',
    name: 'buttonfly',
    filename: 'buttonfly.fti',
    category: 'Demos',
    supertype: 'Executable',
    useMagicCarpet: true,
    tagHex: '0x00009084',
    legend: 'Buttonfly — SGI 3D Flipping Polyhedral Launcher',
    ftiScript: `
# Authentic SGI Isometric 3D Cube Cluster (genapp.fti / buttonfly.fti)
# Path_0
color(-51);
bgnoutlinepolygon();
  vertex(47.80, 89.00);
  vertex(72.80, 76.50);
  vertex(47.80, 64.00);
  vertex(22.80, 76.50);
endoutlinepolygon(outlinecolor);

# Path_1
color(-225);
bgnoutlinepolygon();
  vertex(95.00, 22.50);
  vertex(95.00, 47.50);
  vertex(70.00, 35.00);
  vertex(70.00, 10.00);
endoutlinepolygon(outlinecolor);

# Path_2
color(-196);
bgnoutlinepolygon();
  vertex(30.00, 65.00);
  vertex(55.00, 52.50);
  vertex(30.00, 40.00);
  vertex(5.00, 52.50);
endoutlinepolygon(outlinecolor);

# Path_3
color(-244);
bgnoutlinepolygon();
  vertex(5.00, 27.50);
  vertex(5.00, 52.50);
  vertex(30.00, 40.00);
  vertex(30.00, 15.00);
endoutlinepolygon(outlinecolor);

# Path_4
color(-212);
bgnoutlinepolygon();
  vertex(55.00, 27.50);
  vertex(55.00, 52.50);
  vertex(30.00, 40.00);
  vertex(30.00, 15.00);
endoutlinepolygon(outlinecolor);

# Path_6
color(-129);
bgnoutlinepolygon();
  vertex(70.00, 60.00);
  vertex(95.00, 47.50);
  vertex(70.00, 35.00);
  vertex(45.00, 47.50);
endoutlinepolygon(outlinecolor);

# Path_7
color(-193);
bgnoutlinepolygon();
  vertex(45.00, 22.50);
  vertex(45.00, 47.50);
  vertex(70.00, 35.00);
  vertex(70.00, 10.00);
endoutlinepolygon(outlinecolor);

# Path_8
color(-243);
bgnoutlinepolygon();
  vertex(22.80, 51.50);
  vertex(22.80, 76.50);
  vertex(47.80, 64.00);
  vertex(47.80, 39.00);
endoutlinepolygon(outlinecolor);

# Path_9
color(-211);
bgnoutlinepolygon();
  vertex(72.80, 51.50);
  vertex(72.80, 76.50);
  vertex(47.80, 64.00);
  vertex(47.80, 39.00);
endoutlinepolygon(outlinecolor);
`,
  },

  // 14. Jot / NEdit (Isometric Notepad + Pen — matching i-3.webp!)
  jot: {
    id: 'jot',
    name: 'jot',
    filename: 'jot.fti',
    category: 'Applications',
    supertype: 'Executable',
    useMagicCarpet: true,
    tagHex: '0x00001050',
    legend: 'jot — SGI IRIX Text & Source Code Editor',
    ftiScript: `
# SGI jot Isometric Spiral Notepad & Pen (.fti)
# Yellow/White Notepad block
color(7);
bgnoutlinepolygon();
  vertex(28.00, 34.00);
  vertex(58.00, 26.00);
  vertex(66.00, 72.00);
  vertex(36.00, 80.00);
endoutlinepolygon(outlinecolor);

# Text lines on pad
color(-136);
bgnline();
  vertex(35.00, 66.00);
  vertex(56.00, 60.00);
endline();
bgnline();
  vertex(34.00, 56.00);
  vertex(55.00, 50.00);
endline();
bgnline();
  vertex(33.00, 46.00);
  vertex(50.00, 41.00);
endline();

# Isometric Fountain Pen writing on pad
color(-128);
bgnoutlinepolygon();
  vertex(48.00, 46.00);
  vertex(78.00, 78.00);
  vertex(84.00, 72.00);
  vertex(54.00, 40.00);
endoutlinepolygon(outlinecolor);

# Gold nib
color(-51);
bgnoutlinepolygon();
  vertex(42.00, 38.00);
  vertex(48.00, 46.00);
  vertex(54.00, 40.00);
endoutlinepolygon(outlinecolor);
`,
  },

  // 15. System Manager (sysmgr — SGI Workstation Chassis + Setup Gears)
  sysmgr: {
    id: 'sysmgr',
    name: 'System Manager',
    filename: 'sysmgr.fti',
    category: 'ControlPanels',
    supertype: 'Executable',
    useMagicCarpet: true,
    tagHex: '0x00002001',
    legend: 'sysmgr — IRIX System Manager & Hardware Configuration',
    ftiScript: `
# SGI Octane/Indigo2 Workstation Tower + Control Gear (.fti)
# Teal/Blue Octane chassis left face
color(-134);
bgnoutlinepolygon();
  vertex(24.00, 32.00);
  vertex(48.00, 20.00);
  vertex(48.00, 76.00);
  vertex(24.00, 88.00);
endoutlinepolygon(outlinecolor);

# Chassis right face
color(-96);
bgnoutlinepolygon();
  vertex(48.00, 20.00);
  vertex(72.00, 32.00);
  vertex(72.00, 88.00);
  vertex(48.00, 76.00);
endoutlinepolygon(outlinecolor);

# Chassis top face
color(-102);
bgnoutlinepolygon();
  vertex(24.00, 88.00);
  vertex(48.00, 76.00);
  vertex(72.00, 88.00);
  vertex(48.00, 98.00);
endoutlinepolygon(outlinecolor);

# Front light bar & badge
color(1);
bgnpolygon();
  vertex(30.00, 72.00);
  vertex(44.00, 65.00);
  vertex(44.00, 69.00);
  vertex(30.00, 76.00);
endpolygon();

# Gold/Yellow control wrench/dial overlay
color(-51);
bgnoutlinepolygon();
  vertex(52.00, 42.00);
  vertex(66.00, 34.00);
  vertex(80.00, 42.00);
  vertex(80.00, 58.00);
  vertex(66.00, 66.00);
  vertex(52.00, 58.00);
endoutlinepolygon(outlinecolor);
`,
  },

  // 16. Software Manager (swmgr / inst — Package Box + CD-ROM)
  swmgr: {
    id: 'swmgr',
    name: 'Software Manager',
    filename: 'swmgr.fti',
    category: 'SystemTools',
    supertype: 'Executable',
    useMagicCarpet: true,
    tagHex: '0x00002010',
    legend: 'swmgr — IRIX Software Installation & Subsystems Manager',
    ftiScript: `
# SGI Software Manager 4.1 Isometric Package Box & CD (.fti)
# Isometric Software Box Left
color(-196);
bgnoutlinepolygon();
  vertex(22.00, 36.00);
  vertex(46.00, 24.00);
  vertex(46.00, 68.00);
  vertex(22.00, 80.00);
endoutlinepolygon(outlinecolor);

# Isometric Software Box Right
color(-244);
bgnoutlinepolygon();
  vertex(46.00, 24.00);
  vertex(68.00, 36.00);
  vertex(68.00, 80.00);
  vertex(46.00, 68.00);
endoutlinepolygon(outlinecolor);

# Box Top
color(-116);
bgnoutlinepolygon();
  vertex(22.00, 80.00);
  vertex(46.00, 68.00);
  vertex(68.00, 80.00);
  vertex(44.00, 92.00);
endoutlinepolygon(outlinecolor);

# Golden Installation CD in front
color(-51);
bgnoutlinepolygon();
  vertex(46.00, 34.00);
  vertex(64.00, 26.00);
  vertex(80.00, 34.00);
  vertex(80.00, 52.00);
  vertex(64.00, 60.00);
  vertex(46.00, 52.00);
endoutlinepolygon(outlinecolor);
`,
  },

  // 17. SGI InSight Online Books (insight — Architectural 3D Book Tower)
  insight: {
    id: 'insight',
    name: 'InSight',
    filename: 'insight.fti',
    category: 'Applications',
    supertype: 'Executable',
    useMagicCarpet: true,
    tagHex: '0x00003001',
    legend: 'InSight — SGI Online Documentation & IRIX 6.5 Specifications',
    ftiScript: `
# SGI InSight Online Books Library Icon (.fti)
# Open Book Left Page
color(7);
bgnoutlinepolygon();
  vertex(18.00, 42.00);
  vertex(48.00, 30.00);
  vertex(48.00, 74.00);
  vertex(18.00, 86.00);
endoutlinepolygon(outlinecolor);

# Open Book Right Page
color(-247);
bgnoutlinepolygon();
  vertex(48.00, 30.00);
  vertex(78.00, 42.00);
  vertex(78.00, 86.00);
  vertex(48.00, 74.00);
endoutlinepolygon(outlinecolor);

# Glowing Blue "i" Emblem on Book
color(-68);
bgnoutlinepolygon();
  vertex(58.00, 44.00);
  vertex(66.00, 48.00);
  vertex(66.00, 66.00);
  vertex(58.00, 62.00);
endoutlinepolygon(outlinecolor);

color(-51);
bgnoutlinepolygon();
  vertex(58.00, 70.00);
  vertex(66.00, 74.00);
  vertex(66.00, 80.00);
  vertex(58.00, 76.00);
endoutlinepolygon(outlinecolor);
`,
  },

  // 18. Authentic toolchest.open.fti from g000001/irix-icons
  toolchest_icon: {
    id: 'toolchest_icon',
    name: 'toolchest',
    filename: 'toolchest.open.fti',
    category: 'SystemTools',
    supertype: 'Executable',
    useMagicCarpet: true,
    tagHex: '0x00001002',
    legend: 'Toolchest — IRIX Interactive Desktop Menu Launcher',
    ftiScript: `
# Authentic SGI toolchest.open.fti
color(-255);
bgnoutlinepolygon();
  vertex(72.60, 86.50);
  vertex(72.60, 36.50);
  vertex(37.60, 19.00);
  vertex(37.60, 69.00);
endoutlinepolygon(shadowcolor);

color(-251);
bgnoutlinepolygon();
  vertex(37.84, 70.12);
  vertex(72.84, 87.62);
  vertex(72.84, 97.62);
  vertex(37.84, 80.12);
endoutlinepolygon(shadowcolor);

color(-255);
bgnoutlinepolygon();
  vertex(74.00, 87.00);
  vertex(74.00, 38.00);
  vertex(39.00, 20.50);
  vertex(39.05, 69.72);
endoutlinepolygon(shadowcolor);

color(-251);
bgnoutlinepolygon();
  vertex(39.00, 71.50);
  vertex(74.00, 89.00);
  vertex(74.00, 97.00);
  vertex(39.00, 79.50);
endoutlinepolygon(shadowcolor);

color(-255);
bgnoutlinepolygon();
  vertex(99.00, 87.50);
  vertex(99.00, 37.50);
  vertex(70.74, 23.26);
  vertex(70.74, 73.26);
endoutlinepolygon(shadowcolor);

color(-136);
bgnline();
  vertex(40.00, 58.00);
  vertex(74.00, 74.88);
endline();
bgnline();
  vertex(40.00, 46.00);
  vertex(74.00, 62.97);
endline();
bgnline();
  vertex(40.00, 34.00);
  vertex(74.00, 51.20);
endline();
`,
  },

  // 19. Authentic gqmpeg.open.fti (Audio Panel / Media Player)
  apanel: {
    id: 'apanel',
    name: 'Audio Panel',
    filename: 'gqmpeg.open.fti',
    category: 'ControlPanels',
    supertype: 'Executable',
    useMagicCarpet: true,
    tagHex: '0x00002040',
    legend: 'apanel — SGI Digital Audio & SoundScheme Synthesizer',
    ftiScript: `
# Authentic SGI Musical Note & Audio Waveforms (gqmpeg.open.fti)
color(0);
bgnpolygon();
  vertex(44.51, 30.33);
  vertex(46.44, 33.22);
  vertex(46.56, 77.28);
  vertex(44.44, 76.22);
endpolygon();

bgnpolygon();
  vertex(76.37, 49.57);
  vertex(78.44, 52.32);
  vertex(78.44, 93.22);
  vertex(76.32, 92.16);
endpolygon();

bgnpolygon();
  vertex(45.00, 76.50);
  vertex(78.44, 93.22);
  vertex(78.44, 86.12);
  vertex(44.44, 68.32);
endpolygon();

color(iconcolor);
bgnoutlinepolygon();
  vertex(69.00, 61.50);
  vertex(72.00, 60.00);
  vertex(75.00, 55.50);
  vertex(75.00, 46.50);
  vertex(72.00, 39.00);
  vertex(69.00, 37.50);
  vertex(66.00, 39.00);
  vertex(63.00, 46.50);
  vertex(63.00, 52.50);
  vertex(66.00, 60.00);
endoutlinepolygon(outlinecolor);

color(iconcolor);
bgnoutlinepolygon();
  vertex(36.00, 42.00);
  vertex(39.00, 40.50);
  vertex(42.00, 36.00);
  vertex(42.00, 27.00);
  vertex(39.00, 19.50);
  vertex(36.00, 18.00);
  vertex(33.00, 19.50);
  vertex(30.00, 27.00);
  vertex(30.00, 33.00);
  vertex(33.00, 40.50);
endoutlinepolygon(outlinecolor);
`,
  },

  // 20. Authentic gtksee.open.fti (Color Schemes / Image Viewer)
  color_schemes: {
    id: 'color_schemes',
    name: 'Color Schemes',
    filename: 'gtksee.open.fti',
    category: 'ControlPanels',
    supertype: 'Executable',
    useMagicCarpet: true,
    tagHex: '0x00002055',
    legend: '4Dwm Color Schemes & Desktop Background Customizer',
    ftiScript: `
# Authentic SGI Eye & RGB Cube Badge (gtksee.open.fti)
color(-243);
bgnoutlinepolygon();
  vertex(36.00, 45.00);
  vertex(45.00, 49.50);
  vertex(69.00, 52.50);
  vertex(75.00, 34.50);
  vertex(64.08, 23.04);
  vertex(45.00, 16.50);
  vertex(27.00, 16.50);
  vertex(21.00, 25.50);
  vertex(21.00, 34.50);
endoutlinepolygon(outlinecolor);

color(-136);
bgnoutlinepolygon();
  vertex(38.57, 33.05);
  vertex(38.57, 36.05);
  vertex(39.00, 43.50);
  vertex(41.57, 46.55);
  vertex(53.57, 43.55);
  vertex(56.57, 36.05);
  vertex(56.57, 27.05);
  vertex(48.00, 27.00);
  vertex(42.00, 30.00);
endoutlinepolygon(outlinecolor);

color(-242);
bgnoutlinepolygon();
  vertex(44.52, 73.59);
  vertex(60.84, 66.42);
  vertex(44.88, 58.44);
  vertex(28.76, 66.50);
endoutlinepolygon(-119);

color(-100);
bgnoutlinepolygon();
  vertex(45.00, 39.74);
  vertex(45.00, 58.50);
  vertex(60.84, 66.42);
  vertex(59.88, 47.94);
endoutlinepolygon(-119);

color(-81);
bgnoutlinepolygon();
  vertex(29.88, 47.94);
  vertex(45.00, 39.74);
  vertex(44.88, 58.44);
  vertex(28.76, 66.50);
endoutlinepolygon(-119);
`,
  },

  // 21. Authentic xkill.fti (Process Manager / Kill Utility)
  xkill: {
    id: 'xkill',
    name: 'xkill',
    filename: 'xkill.fti',
    category: 'SystemTools',
    supertype: 'Executable',
    useMagicCarpet: true,
    tagHex: '0x00001099',
    legend: 'xkill / Process Manager — Terminate X11 Clients & Processes',
    ftiScript: `
# Authentic SGI xkill.fti Skull & Crossbones Badge
color(-119);
bgnoutlinepolygon();
  vertex(80.00, 60.00);
  vertex(61.98, 53.91);
  vertex(53.60, 44.00);
  vertex(22.20, 32.00);
  vertex(18.40, 43.00);
  vertex(17.40, 50.00);
  vertex(11.80, 62.40);
  vertex(12.60, 75.20);
  vertex(25.00, 87.50);
  vertex(57.60, 98.20);
  vertex(79.20, 97.80);
endoutlinepolygon(outlinecolor);

color(0);
bgnoutlinepolygon();
  vertex(15.00, 57.50);
  vertex(20.00, 65.00);
  vertex(25.80, 60.60);
  vertex(26.80, 45.80);
  vertex(20.00, 45.00);
endoutlinepolygon(outlinecolor);

bgnoutlinepolygon();
  vertex(30.00, 72.40);
  vertex(35.00, 52.50);
  vertex(41.00, 48.20);
  vertex(55.00, 57.50);
  vertex(54.20, 70.60);
  vertex(42.60, 77.20);
endoutlinepolygon(outlinecolor);
`,
  },

  // 22. WebMagic (Globe + Star + Crescent on Magic Carpet — matching i-5.webp!)
  webmagic: {
    id: 'webmagic',
    name: 'webmagic',
    filename: 'webmagic.fti',
    category: 'WebTools',
    supertype: 'Executable',
    useMagicCarpet: true,
    tagHex: '0x00004012',
    legend: 'SGI WebMagic / Cosmo Create HTML Authoring',
    ftiScript: `
# SGI WebMagic Globe + Star + Moon (.fti)
# Blue Earth Globe
color(-100);
bgnoutlinepolygon();
  vertex(34.00, 48.00);
  vertex(48.00, 38.00);
  vertex(64.00, 48.00);
  vertex(68.00, 64.00);
  vertex(56.00, 78.00);
  vertex(40.00, 76.00);
  vertex(30.00, 62.00);
endoutlinepolygon(outlinecolor);

# Green Continents
color(-146);
bgnpolygon();
  vertex(40.00, 54.00);
  vertex(52.00, 48.00);
  vertex(58.00, 62.00);
  vertex(44.00, 68.00);
endpolygon();

# Gold Star on Left
color(-51);
bgnoutlinepolygon();
  vertex(20.00, 66.00);
  vertex(28.00, 68.00);
  vertex(32.00, 78.00);
  vertex(36.00, 68.00);
  vertex(44.00, 66.00);
  vertex(36.00, 60.00);
  vertex(32.00, 50.00);
  vertex(28.00, 60.00);
endoutlinepolygon(outlinecolor);

# Green Crescent on Right
color(2);
bgnoutlinepolygon();
  vertex(60.00, 82.00);
  vertex(74.00, 78.00);
  vertex(78.00, 64.00);
  vertex(68.00, 70.00);
endoutlinepolygon(outlinecolor);
`,
  },

  // 23. SiliconSurf (Globe on Spring Coil — matching i-5.webp!)
  siliconsurf: {
    id: 'siliconsurf',
    name: 'SiliconSurf',
    filename: 'siliconsurf.fti',
    category: 'WebTools',
    supertype: 'Executable',
    useMagicCarpet: false,
    tagHex: '0x00004018',
    legend: 'SiliconSurf — Official SGI World Wide Web Portal',
    ftiScript: `
# SGI SiliconSurf Spring Coil + Globe (.fti)
color(shadowcolor);
bgnpolygon();
  vertex(28.00, 14.00);
  vertex(50.00, 6.00);
  vertex(72.00, 14.00);
  vertex(50.00, 22.00);
endpolygon();

# Isometric Spring Rings
color(outlinecolor);
bgnclosedline();
  vertex(28.00, 22.00);
  vertex(50.00, 14.00);
  vertex(72.00, 22.00);
  vertex(50.00, 30.00);
endclosedline();

bgnclosedline();
  vertex(26.00, 34.00);
  vertex(50.00, 26.00);
  vertex(74.00, 34.00);
  vertex(50.00, 42.00);
endclosedline();

color(iconcolor);
bgnoutlinepolygon();
  vertex(24.00, 46.00);
  vertex(50.00, 36.00);
  vertex(76.00, 46.00);
  vertex(50.00, 56.00);
endoutlinepolygon(outlinecolor);

# Globe at top
color(-100);
bgnoutlinepolygon();
  vertex(44.00, 64.00);
  vertex(56.00, 58.00);
  vertex(68.00, 66.00);
  vertex(66.00, 80.00);
  vertex(52.00, 86.00);
  vertex(42.00, 76.00);
endoutlinepolygon(outlinecolor);
`,
  },

  // 24. Document / Text File (readme / specifications)
  document: {
    id: 'document',
    name: 'document',
    filename: 'generic.doc.fti',
    category: 'Desktop',
    supertype: 'Document',
    useMagicCarpet: false,
    tagHex: '0x00000100',
    legend: 'ASCII Text / Markdown Specification Document',
    ftiScript: `
# SGI Isometric Stacked Document Pages (.fti)
color(shadowcolor);
bgnpolygon();
  vertex(28.00, 12.00);
  vertex(68.00, 30.00);
  vertex(74.00, 24.00);
  vertex(34.00, 6.00);
endpolygon();

# Back page stack
color(-247);
bgnoutlinepolygon();
  vertex(32.00, 18.00);
  vertex(68.00, 34.00);
  vertex(68.00, 84.00);
  vertex(32.00, 68.00);
endoutlinepolygon(outlinecolor);

# Front document sheet (uses iconcolor so selecting turns it SGI yellow!)
color(iconcolor);
bgnoutlinepolygon();
  vertex(26.00, 14.00);
  vertex(62.00, 30.00);
  vertex(62.00, 80.00);
  vertex(26.00, 64.00);
endoutlinepolygon(outlinecolor);

# Ruled text lines on isometric page
color(-136);
bgnline();
  vertex(32.00, 58.00);
  vertex(56.00, 69.00);
endline();
bgnline();
  vertex(32.00, 48.00);
  vertex(56.00, 59.00);
endline();
bgnline();
  vertex(32.00, 38.00);
  vertex(56.00, 49.00);
endline();
bgnline();
  vertex(32.00, 28.00);
  vertex(50.00, 36.00);
endline();
`,
  },
};

export interface IrixVectorIconProps {
  iconId?: string;
  customPaths?: FtiPath[];
  useMagicCarpet?: boolean;
  state?: IconVisualState;
  size?: number;
  className?: string;
}

const parsedCache = new Map<string, FtiPath[]>();

function getCachedPaths(key: string, script: string): FtiPath[] {
  if (!parsedCache.has(key)) {
    parsedCache.set(key, parseFtiScript(script));
  }
  return parsedCache.get(key)!;
}

export const IrixVectorIcon: React.FC<IrixVectorIconProps> = ({
  iconId = 'showcase',
  customPaths,
  useMagicCarpet,
  state = 'normal',
  size = 56,
  className = '',
}) => {
  const def = IRIX_ICON_LIBRARY[iconId] || IRIX_ICON_LIBRARY.showcase;
  const shouldUseCarpet =
    useMagicCarpet !== undefined ? useMagicCarpet : def.useMagicCarpet;

  const carpetPaths = useMemo(() => {
    if (!shouldUseCarpet) return [];
    const script =
      state === 'opened' ? GENERIC_EXEC_OPEN_FTI : GENERIC_EXEC_CLOSED_FTI;
    return getCachedPaths(`carpet_${state}`, script);
  }, [shouldUseCarpet, state]);

  const badgePaths = useMemo(() => {
    if (customPaths) return customPaths;
    return getCachedPaths(`icon_${def.id}`, def.ftiScript);
  }, [customPaths, def]);

  const allPaths = useMemo(
    () => [...carpetPaths, ...badgePaths],
    [carpetPaths, badgePaths]
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{
        overflow: 'visible',
        filter:
          state === 'opened'
            ? 'drop-shadow(0 0 4px rgba(120, 210, 255, 0.7))'
            : undefined,
      }}
    >
      {allPaths.map((p, i) => {
        const points = p.vertices
          .map((v) => `${v.x.toFixed(2)},${(100 - v.y).toFixed(2)}`)
          .join(' ');
        const fill = resolveFtiColor(p.fillColor, state);
        const stroke = resolveFtiColor(p.strokeColor ?? 'outlinecolor', state);

        if (p.type === 'polygon') {
          return (
            <polygon
              key={`${p.id}_${i}`}
              points={points}
              fill={fill}
              stroke="none"
            />
          );
        }
        if (p.type === 'outlinepolygon') {
          return (
            <polygon
              key={`${p.id}_${i}`}
              points={points}
              fill={fill}
              stroke={stroke}
              strokeWidth={1.35}
              strokeLinejoin="round"
            />
          );
        }
        if (p.type === 'closedline') {
          return (
            <polygon
              key={`${p.id}_${i}`}
              points={points}
              fill="none"
              stroke={fill}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          );
        }
        return (
          <polyline
            key={`${p.id}_${i}`}
            points={points}
            fill="none"
            stroke={fill}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
};
