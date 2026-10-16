# SGI IRIX 6.5 OS Simulator (IRIX Interactive Desktop / Indigo Magic / 4Dwm)

An interactive web-based workstation operating system simulator recreating **Silicon Graphics (SGI) IRIX 6.5.22m** with the **IRIX Interactive Desktop** (formerly **Indigo Magic Desktop**), **4Dwm** window manager, **SGI Enhanced Motif (`SgiMode`)** widgets, and a genuine **`.fti` (File Type Icon) IRIS GL Vector Icon Engine**.

Full technical specifications, framework selection analysis, and `.fti` vector icon documentation are located in [`docs/IRIX_6.5_SPECIFICATIONS.md`](docs/IRIX_6.5_SPECIFICATIONS.md) and accessible inside the simulator via **SGI InSight Online Books**.

## Key Features

- **4Dwm (IRIS Extended Motif Window Manager)**:
  - Beveled resize borders with corner notch ticks, bold oblique (`Helvetica-BoldOblique`) title bars, window shading, and 4Dwm system menus.
  - Minimizes windows into draggable **68×70px 3D-beveled square desktop tiles** (`InSight`, `Console`, etc.).
  - Live **Desks Overview (`ov`)** virtual workspace pager (`Main`, `Desk 2`, `Desk 3`, `Global`).
  - Switchable SGI Color Schemes (`Indigo Magic`, `Rio Grande`, `Redwood`, `Gainsborough`, `Midnight Onyx`) and focus policies (`Click to Focus` vs `Focus Follows Mouse`).
- **Authentic SGI `.FTI` Isometric Vector Icon Engine & `IconSmith`**:
  - Parses and compiles real SGI `.fti` vector geometry (`color()`, `bgnoutlinepolygon()`, `vertex()`, `endoutlinepolygon()`, `bgnline()`) on a `100×100` coordinate grid using the 256-color SGI palette + dynamic `iconcolor`, `outlinecolor`, and `shadowcolor`.
  - Includes the layered `.ftr` **Magic Carpet** (`generic.exec.closed.fti` / `generic.exec.open.fti`) that turns **SGI Yellow** when selected and glows blue when launched.
  - Interactive **Motif Thumbwheel (`SgThumbWheel`)** in `Icon Catalog` and `File Manager` scales vector icons continuously in real time.
  - Built-in **IconSmith** vector editor to drag vertices on a 30° isometric grid, recolor paths, edit live `.fti` code, and export `.fti` or `.svg`.
- **17 Interactive IRIX 6.5 Applications**:
  1. **Toolchest** — Cascading desktop command menu with 3D drawer glyphs, authentic item order (`Desktop`, `Selected`, `Internet`, `WAVEFRONT Products`, `Find`, `System`, `SGI Demos`, `Help`).
  2. **Icon Catalog (`iconbook`)** — Tabbed binder with real-time thumbwheel vector icon scaling.
  3. **IconSmith (`iconsmith`)** — Interactive `.fti` vector icon editor & 27-icon SGI library.
  4. **`gr_osview`** — Real-time graphical multi-CPU, memory, system activity, and graphics pipeline monitor.
  5. **`fsn` (3D File System Navigator)** — The 1993 *Jurassic Park* ("It's a UNIX system!") 3D perspective XFS file browser with spotlight cones and radar overview.
  6. **Winterm (`xwsh`)** — IRIX 6.5 UNIX shell supporting `hinv -v`, `uname -aR`, `sgifetch`, `versions`, `df -k`, `ps -ef`, `ls`, `cd`, `cat`, `tag -q`, `ep`, `screens`, `explorer`, `fcheck`, and app launching.
  7. **Desktop File Manager (`fm`)** — Mauve path bar, thumbwheel vector zoom, and split Content Viewer pane that previews real images inline.
  8. **SGI 3D OpenGL & Buttonfly Showcase** — Interactive 3D SGI Cube, Buttonfly 3D flipping polyhedra, Odyssey NURBS Torus Knot, and IndyCam/O2cam live visualizer. **IVcalc** is the Inventor 3D calculator: left-drag tumbles it, middle-drag zooms, and the keys add, subtract, multiply and divide.
  9. **System Manager (`sysmgr`)** — Live hardware switching between **SGI Octane2 (`IP30`)**, **SGI O2 (`IP32`)**, **SGI Indy (`IP24`)**, and **SGI Onyx2 (`IP27`)**, plus Process Manager and Audio SoundScheme synthesizer.
  10. **Software Manager 4.1 (`swmgr`)** — Subsystem installer with 3D disk space cylinder pie chart.
  11. **SGI InSight Online Books (`insight`)** — Reader with 7 chapters: Web Framework Analysis, IRIX 6.5 Specifications, `.FTI` Icon Set, 4Dwm UI Guidelines, **Screen Savers / ElectroPaint**, **Wavefront Explorer**, and **Real IRIX Screenshots**.
  12. **Netscape Communicator 4.78 (`[SGI]`) & `jot` Text Editor**.
  13. **Screen Saver control panel (`screen_blanker`)** — `Toolchest → Desktop → Customize → Screen Saver`. Idle timeout, module list, live preview and screen locking, exactly as the real panel worked.
  14. **ElectroPaint (`ep -c`)** — *The* SGI screen saver, the famous **"dancing polygons"**, as an application with its Panel Library control panel (`whl`, `spn`, `flp`, `arm`, `wrst`, `twst`, `sz`, `zoom`, `spd`, `n`, `rat`, `rng` multi-sliders, each with the `R` reset button, the `X` wrap/bounce toggle and the little `sld` sub-slider) and its ASCII animation script, which can be dumped to `~/.ep_script` and read back.
  15. **The Director and Advanced Visualizer Model 4.2.1** — The Director is the Alias|Wavefront launcher (Model, Paint, Property, Dynamation, Kinemation, Preview, Composer, fcheck). Model is its own window: orange wireframe, primitives, picking, move / rotate / scale, deformers, booleans, and channel entry. `director` and `explorer` in a winterm start those two programs.
  16. **`fcheck`** — The SGI image and movie sequence viewer, for flipping through rendered frames and image files.
  17. **Real IRIX Screenshot Reference Gallery** — Genuine captures of IRIX 6.5 machines, shipped in `/usr/people/guest/screenshots`, each with its source, credit and a note on what it documents.

- **IRIX Screen Savers** (`screen_blanker` modules, in `/usr/lib/screens`):
  - `electropaint` — the dancing polygons (David A. Tristram, 1986).
  - `spaceplants` — Hopalong plane fractal, the "space plants".
  - `bounce` — the classic SGI demo of a lit rubber ball on a checkerboard floor.
  - `blank` — the plain blanker used by the console lock.
  - Idle blanking is live: leave the desktop alone and the saver takes the screen; move the mouse (or press a key) to come back, or set the panel to lock the console and it asks for the password first.

- **Display scaling**: the desktop is a workstation framebuffer laid out in virtual pixels and scaled
  as a whole to whatever display it is shown on, so windows and the Toolchest always fit (1:1 above
  1024x700, proportional below). The old always-on bottom quick-launch bar is gone; the same apps are
  on the desktop right-click menu, and **Toolchest -> Desktop -> Quick Launch Bar** brings the bar back.
- **Authentic look details tuned against real captures**: 4Dwm's dithered/stippled root window, the khaki Toolchest title bar, mauve Motif text fields (`#c8979b`), the `SgBusyPopup` "Wait a bit." busy dialog, SGI's italic Helvetica Bold Oblique titling, black IRIS GL viewports, and the `Set Key` / `Apply` / `Reset` button rows from ViewKit.

## Reference Screenshots

Real IRIX captures live in [`public/screenshots/`](public/screenshots) and on the
virtual workstation in `/usr/people/guest/screenshots`. Each file keeps its source and
credit next to it in [`src/reference/irixScreenshots.ts`](src/reference/irixScreenshots.ts),
and the gallery lists what every capture is evidence for.

## Development Scripts

```bash
# engine checks (ElectroPaint, saver modules, Explorer, IVcalc) plus a
# server-side render of the desktop and every application in the registry
npm test

# render PNG previews of the saver and renderer without a browser
node_modules/.bin/esbuild scripts/renderPreview.ts --bundle --platform=node --format=cjs \
  --outfile=/tmp/preview.cjs && node /tmp/preview.cjs /tmp/irix-preview
```

`npm test` also runs on CI, so a broken application fails the deploy.

## Architecture

| Where | What |
| --- | --- |
| `src/apps/registry.tsx` | Every application: its `render`, its Toolchest entries, its desktop icon, its root-menu and quick-launch entries. The desktop surfaces are derived from this one map. |
| `src/state/osStore.ts` | Types and static data: `AppId`, the typed launch payloads, 4Dwm window defaults, the XFS seed filesystem. |
| `src/state/osState.ts` | The whole simulator state as one reducer, plus save/restore to `localStorage`. |
| `src/state/screen.ts` | Framebuffer scaling and window clamping. |
| `src/apps/`, `src/components/` | The applications, and the 4Dwm shell around them. |

Applications are plain `props -> JSX`; they never import each other. What they
share is the XFS filesystem and one launch function, passed in by the registry.

## Adding an application

1. Add the id to `AppId` in `src/state/osStore.ts`, plus its entry in
   `APP_WINDOW_DEFAULTS` and its launch payload in `AppPayloads`.
2. Add its icon to `src/icons/irixIconSet.tsx`.
3. Write the component in `src/apps/`, giving it a `colorScheme` prop and an
   `onLaunchApp: LaunchApp`.
4. Add one entry to `APP_REGISTRY` with `render` and whatever Toolchest,
   desktop, root-menu or quick-launch placements it should have.

Nothing else needs to change. `npm test` renders the new entry and checks the
derived desktop surfaces, so a broken application fails CI.

Launch arguments are typed per application, so `onLaunchApp('gl_showcase',
{ mode: 'cuibe' })` is a compile error rather than a window that silently opens
on the wrong view.

## Desktop icons

Drag an icon anywhere on the root window. Right-click it for **Properties**:
what it launches and with what arguments, its XFS details, and a **Send to
Dumpster** button. Deleted icons land in `/dumpster` and leave the desktop;
**Restore Desktop Icons** in the root menu puts them all back.

## Toolchest

**Toolchest → Desktop → Toolchest Editor** (also `/usr/sbin/toolchest`) renames,
reorders, hides and deletes any Toolchest entry, and adds your own that launch
any registered application. **Restore Defaults** undoes all of it. Edits are
part of the saved session.

## ElectroPaint

Shapes are **quads** by default, the flock goes up to 256, and the helix is
taller and winds further. The control values follow the script rather than the
dice: two runs differ in their shapes and colours but not in how the sliders
behave, so the show plays the same way every time. Grabbing a control still pins
it where you put it.

## Your session is saved

The desktop is written to `localStorage` (debounced), so windows, desks, colour
scheme, hardware profile, screen saver settings and files you saved in Jot or
IconSmith survive a reload. Clear the site data to boot a fresh IRIX desktop.

## Running Locally

```bash
npm install
npm run dev
```
