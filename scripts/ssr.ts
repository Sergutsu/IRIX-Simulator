/**
 * Server-side render smoke test.  There is no browser in the build sandbox, so
 * this renders the whole desktop and every new application through
 * react-dom/server, which catches anything that throws or produces empty output
 * while building the element tree.
 *
 *   ./node_modules/.bin/esbuild scripts/ssr.ts --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/ssr.cjs --loader:.css=text && node /tmp/ssr.cjs
 */
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from '../src/App';
import { ScreenSaverApp } from '../src/apps/ScreenSaverApp';
import { ElectroPaintApp } from '../src/apps/ElectroPaintApp';
import { WavefrontExplorerApp } from '../src/apps/WavefrontExplorerApp';
import { DirectorApp } from '../src/apps/DirectorApp';
import { AwModuleApp } from '../src/apps/AwModuleApp';
import { ReferenceGalleryApp } from '../src/apps/ReferenceGalleryApp';
import { FcheckApp } from '../src/apps/FcheckApp';
import { IVcalcApp } from '../src/apps/IVcalcApp';
import { ScreenBlanker } from '../src/components/ScreenBlanker';
import { DesktopIcons } from '../src/components/DesktopIcons';
import { APP_REGISTRY, CONTEXT_MENU, DESKTOP_ICONS, QUICK_LAUNCH } from '../src/apps/registry';
import type { AppRuntime } from '../src/apps/registry';
import type { AppId } from '../src/state/osStore';
import {
  INITIAL_VFS_NODES,
  INITIAL_WINDOWS,
  SGI_COLOR_SCHEMES,
  WORKSTATION_PROFILES,
} from '../src/state/osStore';

let problems = 0;
const check = (name: string, fn: () => string, mustContain: string[] = []) => {
  try {
    const html = fn();
    const missing = mustContain.filter((t) => !html.includes(t));
    if (missing.length) {
      problems++;
      console.error(`  FAIL ${name}: output is missing ${JSON.stringify(missing)}`);
    } else if (html.length < 200) {
      problems++;
      console.error(`  FAIL ${name}: suspiciously short output (${html.length} bytes)`);
    } else {
      console.log(`  ok   ${name} (${(html.length / 1024).toFixed(1)} kB of markup)`);
    }
  } catch (e) {
    problems++;
    console.error(`  FAIL ${name}: ${(e as Error).message}`);
  }
};

const scheme = SGI_COLOR_SCHEMES.indigo_magic;
const ws = WORKSTATION_PROFILES.octane2;
const noop = () => undefined;

console.log('Server-rendered application tree');
check('Desktop (App)', () => renderToStaticMarkup(React.createElement(App)), [
  'Toolchest',
  // the framebuffer wrapper that scales the desktop to the display
  'transform:scale(',
  'Desks Overview',
  // the Wavefront drawer, and not the old WAVEFRONT Products label
  'Wavefront',
]);

// Desktop icons honour the user's moves and removals
{
  const noop2 = () => undefined;
  const visible = renderToStaticMarkup(
    React.createElement(DesktopIcons, {
      colorScheme: SGI_COLOR_SCHEMES.indigo_magic,
      icons: DESKTOP_ICONS,
      state: { fsn_desk: { pos: { x: 300, y: 200 } }, cdrom: { hidden: true } },
      cellSize: 60,
      iconSize: 40,
      selectedId: null,
      launchingId: null,
      onSelect: noop2,
      onLaunch: noop2,
      onMove: noop2,
      onProperties: noop2,
    } as never)
  );
  const shown = (visible.match(/Double-click to open/g) || []).length;
  const bad: string[] = [];
  if (!visible.includes('left:300px') || !visible.includes('top:200px')) bad.push('a moved icon ignored its position');
  if (visible.includes('CDROM')) bad.push('an icon sent to the dumpster is still on the desktop');
  if (shown !== DESKTOP_ICONS.length - 1) bad.push(`expected ${DESKTOP_ICONS.length - 1} icons, rendered ${shown}`);
  if (bad.length) {
    problems++;
    console.error(`  FAIL desktop icons: ${bad.join('; ')}`);
  } else {
    console.log(`  ok   desktop icons (${shown} shown, 1 moved, 1 in the dumpster)`);
  }
}

check(
  'Screen Saver control panel',
  () =>
    renderToStaticMarkup(
      React.createElement(ScreenSaverApp, {
        colorScheme: scheme,
        workstation: ws,
        config: {
          enabled: true,
          moduleId: 'electropaint',
          idleSeconds: 300,
          lockScreen: false,
          cycleModules: false,
        },
        onChangeConfig: noop,
        onBlankNow: noop,
        onSaveFile: noop,
        onLaunchApp: noop,
      })
    ),
  ['ElectroPaint', 'Hopalong', 'Bounce', 'Blank Screen', '/usr/lib/screens/electropaint', 'Blank After']
);

check(
  'ElectroPaint ep -c',
  () =>
    renderToStaticMarkup(
      React.createElement(ElectroPaintApp, {
        colorScheme: scheme,
        workstation: ws,
        vfs: INITIAL_VFS_NODES,
        onBlankNow: noop,
        onSaveFile: noop,
      })
    ),
  ['ElectroPaint', 'David A. Tristram', 'whl', 'spn', 'flp', 'arm', 'wrst', 'twst', 'Dump Script']
);

check(
  'Wavefront Explorer',
  () =>
    renderToStaticMarkup(
      React.createElement(WavefrontExplorerApp, {
        colorScheme: scheme,
        onSaveRender: noop,
        onLaunchApp: noop,
      })
    ),
  ['Advanced Visualizer Model 4.2.1', 'cam1', 'ALIAS|WAVEFRONT', 'XTRAN', 'Element Group']
);

check(
  'The Director',
  () => renderToStaticMarkup(React.createElement(DirectorApp, { onLaunchApp: noop })),
  ['The Director', 'Model', 'Paint', 'Dynamation', 'Kinemation', 'Composer', 'fcheck']
);

check(
  'Property module',
  () =>
    renderToStaticMarkup(
      React.createElement(AwModuleApp, {
        module: 'property',
        colorScheme: scheme,
        onLaunchApp: noop,
        onSaveRender: noop,
      })
    ),
  ['Property', 'Polished Chrome', 'Open Model']
);

check(
  'IVcalc',
  () => renderToStaticMarkup(React.createElement(IVcalcApp)),
  ['Rotx', 'Roty', 'Zoom', 'Dolly', '45.0']
);

check(
  'Reference screenshot gallery',
  () => renderToStaticMarkup(React.createElement(ReferenceGalleryApp, { colorScheme: scheme, onLaunchApp: noop })),
  ['/screenshots/', 'Advanced Visualizer', 'ElectroPaint']
);

check(
  'screen_blanker overlay',
  () =>
    renderToStaticMarkup(
      React.createElement(ScreenBlanker, {
        moduleId: 'electropaint',
        cycleModules: false,
        locked: false,
        workstationName: ws.name,
        osRelease: ws.osRelease,
        currentUser: 'guest',
        onExit: noop,
      })
    ),
  ['IRIX 6.5 Screen Saver', 'ElectroPaint']
);

check(
  'screen_blanker overlay (locked console)',
  () =>
    renderToStaticMarkup(
      React.createElement(ScreenBlanker, {
        moduleId: 'bounce',
        cycleModules: true,
        locked: true,
        workstationName: ws.name,
        osRelease: ws.osRelease,
        currentUser: 'guest',
        onExit: noop,
      })
    ),
  ['Screen Locked', 'Password:', 'Unlock']
);

check(
  'fcheck image viewer',
  () =>
    renderToStaticMarkup(
      React.createElement(FcheckApp, {
        colorScheme: scheme,
        vfs: INITIAL_VFS_NODES,
        initialPath: undefined,
        onUpdateTitle: noop,
        onLaunchApp: noop,
      })
    ),
  ['fcheck', 'images', 'Play']
);

/**
 * Sweep every entry in the application registry.  The checks above render a few
 * applications with hand-picked props; this one guarantees that *every* app the
 * registry knows about builds without throwing, so adding an entry to
 * src/apps/registry.tsx is covered the moment it lands.
 */
const runtime = {
  win: { ...INITIAL_WINDOWS[0], payload: {} },
  workstation: ws,
  colorScheme: scheme,
  windows: INITIAL_WINDOWS,
  vfs: INITIAL_VFS_NODES,
  currentUser: 'guest',
  focusMode: 'click',
  soundEnabled: true,
  saverConfig: {
    enabled: true,
    moduleId: 'electropaint',
    idleSeconds: 300,
    lockScreen: false,
    cycleModules: false,
  },
  onLaunchApp: noop,
  onCloseWindow: noop,
  onUpdateTitle: noop,
  onSaveFile: noop,
  onSaveRender: noop,
  onSaveFtiToVfs: noop,
  onMoveToDumpster: noop,
  onCreateFile: noop,
  onSelectWorkstation: noop,
  onSelectColorScheme: noop,
  onChangeFocusMode: noop,
  onToggleSound: noop,
  onChangeSaverConfig: noop,
  onBlankNow: noop,
  toolchestEdits: {},
  toolchestCustom: [],
  onEditToolchest: noop,
  onAddToolchestEntry: noop,
  onRemoveToolchestEntry: noop,
  onResetToolchest: noop,
} as unknown as AppRuntime;

console.log('\nEvery application registry entry');
for (const id of Object.keys(APP_REGISTRY) as AppId[]) {
  check(`registry: ${id}`, () =>
    renderToStaticMarkup(React.createElement(React.Fragment, null, APP_REGISTRY[id].render(runtime)))
  );
}

/**
 * The desktop surfaces are derived from the registry, so a mistake there is
 * invisible until someone opens the desktop. Check the shapes here.
 */
const ids = Object.keys(APP_REGISTRY) as AppId[];
const known = new Set<string>(ids);
const surfaces: [string, { appId: string; label: string }[]][] = [
  ['desktop icons', DESKTOP_ICONS],
  ['root menu', CONTEXT_MENU],
  ['quick launch', QUICK_LAUNCH],
];

console.log('\nDesktop surfaces derived from the registry');
for (const [name, rows] of surfaces) {
  if (!rows.length) {
    problems++;
    console.error(`  FAIL ${name}: nothing rendered`);
    continue;
  }
  const unknown = rows.filter((r) => !known.has(r.appId));
  const blank = rows.filter((r) => !r.label);
  if (unknown.length || blank.length) {
    problems++;
    console.error(`  FAIL ${name}: ${unknown.length} unknown app id(s), ${blank.length} blank label(s)`);
  } else {
    console.log(`  ok   ${name} (${rows.length} entries, all app ids known)`);
  }
}

console.log(problems ? `\n${problems} PROBLEM(S)` : '\nall components rendered');
process.exit(problems ? 1 : 0);
