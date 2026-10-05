/**
 * Real IRIX reference screenshots.
 *
 * These are genuine captures (and one hardware/toolkit reference) of Silicon
 * Graphics IRIX 6.5 machines, kept on the virtual workstation in
 * /usr/people/guest/screenshots so the simulated desktop can be compared
 * against the real thing.  Each entry records where it came from so credit
 * stays with the people who took the captures.
 */

export interface IrixScreenshot {
  id: string;
  file: string;
  title: string;
  /** what this capture is useful for when tuning the simulator */
  shows: string[];
  source: string;
  credit: string;
  license: string;
  notes?: string;
}

export const IRIX_REFERENCE_SCREENSHOTS: IrixScreenshot[] = [
  {
    id: 'advanced_visualizer_model',
    file: 'alias-wavefront-advanced-visualizer-4.2.1.jpg',
    title: 'Alias|Wavefront Advanced Visualizer Model 4.2.1',
    shows: [
      'The Director shell: File, Applications, Utilities, Project Setup, Preferences, User Defined, Help',
      'Model 4.2.1 window: File / Edit / View / Display / Shapes / Create / Tools / Booleans / Textures / Properties / Database',
      'cam1 viewport in orange wireframe on a grey ground grid',
      'Translation, rotation and scale channels, Element Group picking, Save / Auto',
      'Footer: Model 4.2.1  ALIAS|WAVEFRONT, INC.',
    ],
    source: 'Photograph of a running Advanced Visualizer session',
    credit: 'User photograph of Alias|Wavefront Advanced Visualizer Model 4.2.1',
    license: 'Included as the visual reference the simulator modeler was restored from.',
    notes:
      'The photograph shows The Director and Model as two windows. The simulator launches them separately; Model is not drawn inside The Director.',
  },
  {
    id: 'ivcalc',
    file: 'ivcalc.png',
    title: 'IVcalc — Inventor 3D calculator',
    shows: [
      'Orange 3D keypad on a black Inventor viewer',
      'Display, AC CE % / and the number pad',
      'Examiner controls: Rotx, Roty, Zoom 45.0, Dolly',
      'Right-hand viewer icons for pick, view, home and perspective',
    ],
    source: 'Screenshot of the IRIX Inventor IVcalc demo',
    credit: 'User screenshot of IVcalc',
    license: 'Included as the visual reference the IVcalc window was restored from.',
    notes: 'Left drag rotates, middle drag zooms, and the keys calculate.',
  },
  {
    id: 'desktop_netscape',
    file: 'irix-65-desktop-netscape-audiopanel.png',
    title: 'IRIX 6.5 desktop with Audio Panel and Netscape (1024x768)',
    shows: [
      'Toolchest panel with the khaki active title bar and the 3D drawer glyphs',
      'Desks Overview (ov) workspace pager: Desk 1, Desk 2, Global',
      'Audio Panel: Analog In / Analog Out meters at 48 kHz, 44.1 kHz',
      'Netscape [SGI] window: menubar, toolbar, Location field, mauve text widgets',
      'Desktop icons (dumpster, CDROM) with the GIMP minimised as a 4Dwm square tile',
    ],
    source: 'https://en.wikipedia.org/wiki/IRIX_Interactive_Desktop',
    credit: 'SGI workstation owner capture, via Wikimedia Commons',
    license: 'Screenshot of IRIX 6.5, used here as a visual reference.',
  },
  {
    id: 'viewkit_widgets',
    file: 'viewkit-demo-widgets.png',
    title: 'SGI ViewKit widget demo (vktest 0.7.2)',
    shows: [
      'The application menu bar style used by ViewKit programs: Application, Edit, Lists, Busy, Dialogs, Preferences, Alignment, Help',
      'SgBusyPopup ("Wait a bit.") — the busy cursor popup used all over the SGI desktop',
      'SgCompletionField with its mauve completion text',
      'Preference dialogs with SgPrefToggleButton / SgPrefRadioButton (the diamond toggles)',
      'Teal stippled desktop pattern and the standard Motif grey window well',
      'OK / Apply / Cancel button row, and the "i" information dialog with its icon block',
    ],
    source: 'https://docs.maxxinteractive.com/books/misc/page/not-just-a-theme',
    credit: 'Maxx Interactive documentation gallery',
    license: 'SGI ViewKit demo capture, used as a visual reference.',
    notes:
      'This is the toolkit Alias|Wavefront built on, so it is the best guide for the ' +
      'Wavefront Explorer / Maya 1.0 window dressings in the simulator.',
  },
  {
    id: 'toolchest_customize',
    file: 'toolchest-desktop-customize-menu.png',
    title: 'Toolchest -> Desktop -> Customize cascading menus',
    shows: [
      'The real Toolchest item order: Desktop, Selected, Internet, Find, System, SOFTIMAGE Products, Help',
      'The Desktop menu: Access Files, Customize, Open Unix Shell, Open Terminal, Open Console, Empty Dumpster, Lock Screen, Log Out',
      'The Customize submenu: Windows, Desktop, Desktop Sounds, Control Audio, Input Device (?), Screen Saver, Environment Setup, Background, Color Scheme, Screen Saver, Mouse, Keyboard, Language, Set Hot Spot',
    ],
    source: 'http://toastytech.com/guis/irix.html',
    credit: 'Ian Chapman (capture), ToastyTech GUI Gallery',
    license: 'Used as a visual reference for the Toolchest menu structure.',
  },
  {
    id: 'desks_overview',
    file: 'irix-65-multiple-windows-desktops.webp',
    title: 'Multiple virtual desks, Icon Catalog and Mouse Settings',
    shows: [
      'Desks Overview showing Desk 2, Main and Global with their window miniatures',
      'Icon Catalog with Page / Application / Demos / Collaboration tabs and caption text',
      'Find an Icon / Search for Hosts dialog layouts',
      'Mouse Settings control panel: acceleration scale, thresholds and mouse mapping',
      'Desktop icon column: console, InSight, winterm, showcase, thumb, dumpster',
      'Teal stippled desktop background',
    ],
    source: 'http://yohanan.org/steve/projects/indigo-magic-desktop',
    credit: 'Steve Yohanan, Indigo Magic Desktop project',
    license: 'Academic capture of Indigo Magic, used as a visual reference.',
  },
  {
    id: '4dwm_netlist',
    file: 'irix-6529-desktop-netlist.jpg',
    title: 'IRIX 6.5.29 4Dwm desktop running NetList',
    shows: [
      '4Dwm window frames with the bevelled borders and italic Helvetica title',
      'Black NetList electronics schematic on the standard grey canvas',
      'A blue-maned creature wallpaper (a very SGI thing to do)',
      'Desktop icon in the bottom left and the SGI "winterm" tile bottom right',
      'gr_osview-style translucent meters with green/yellow LED bars',
    ],
    source: 'https://www.flickr.com/photos/k3mp0_1m463/1282347145',
    credit: 'th3_k3mp0_m4573r (Flickr) — IRIX 6.5.29 desktop screenshot',
    license: 'Photo of a personal workstation, used as a visual reference.',
  },
  {
    id: 'file_manager',
    file: 'irix-sudonull-desktop.png',
    title: 'Directory Viewer / File Manager with Content Viewer preview',
    shows: [
      'The mauve path bar with the "Selected" and "Arrange" buttons',
      'The thumbwheel roller down the side of the file window that scales the vector icons',
      'The lower Content Viewer pane previewing a file',
      'Desktop icons for camera, microphone, dumpster, CDROM and the home directory',
    ],
    source:
      'https://sudonull.com/post/107981-Rare-graphic-station-SGI-Indy-20-years-later-Part-three-IRIX-for-user',
    credit: 'Habrahabr / sudonull IRIX Indy review, part three',
    license: 'Used as a visual reference.',
  },
  {
    id: 'fsn',
    file: 'fsn-3d-file-system-navigator.png',
    title: 'fsn — the 3D File System Navigator (the Jurassic Park "UNIX system")',
    shows: [
      'The fsn menu bar: Session, Show, Display, Directory, File, Help',
      'Green/blue 3D ground plane with directory pedestals and the "USR" skyline text',
      'The selected directory pedestal highlighted red, icons as 3D billboards',
      'The age legend along the bottom: wks, 2 wks, 1 mo, 3 mo, 6 mo, 1 yr, > 1 yr',
    ],
    source: 'https://www.reddit.com/r/unixporn/comments/4u66kr/',
    credit: 'r/unixporn — fsn on IRIX 6.5.21f',
    license: 'Used as a visual reference for the simulator fsn window.',
  },
  {
    id: 'electropaint',
    file: 'electropaint-saver-torus-flock.png',
    title: 'ElectroPaint screen saver — the "dancing polygons"',
    shows: [
      'Flat-shaded, richly coloured quadrilaterals lit by a rotating light',
      'Deep black background — the saver cleared to black every frame',
      'The flock arranged into a ring / torus shell, exactly what the twst and arm sliders do',
    ],
    source: 'https://www.screensaversplanet.com/screensavers/electroportis-1434/',
    credit: 'ElectroPortis port of ElectroPaint (David A. Tristram, 1986)',
    license: 'ElectroPaint capture, used as a visual reference for the saver module.',
    notes: 'IRIX could also show moving geometry on the root window instead of a blanker.',
  },
  {
    id: 'app_icon_sizes',
    file: 'irix-desktop-appicon-example.jpg',
    title: 'SGI application icon at large size',
    shows: [
      'The bitmap badge drawn on top of the Magic Carpet executable background',
      'How the carpet pokes out behind the badge — the signature of every SGI executable icon',
    ],
    source: 'http://toastytech.com/guis/irix.html',
    credit: 'Ian Chapman (capture), ToastyTech GUI Gallery',
    license: 'Used as a visual reference for the .fti icon engine.',
  },
];
