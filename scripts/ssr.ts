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
import { INITIAL_VFS_NODES, SGI_COLOR_SCHEMES, WORKSTATION_PROFILES } from '../src/state/osStore';

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
]);

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

console.log(problems ? `\n${problems} PROBLEM(S)` : '\nall components rendered');
process.exit(problems ? 1 : 0);
