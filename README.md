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
- **12 Interactive IRIX 6.5 Applications**:
  1. **Toolchest** — Top-left cascading desktop command menu with 3D drawer glyphs.
  2. **Icon Catalog (`iconbook`)** — Tabbed binder with real-time thumbwheel vector icon scaling.
  3. **IconSmith (`iconsmith`)** — Interactive `.fti` vector icon editor & 24-icon SGI library.
  4. **`gr_osview`** — Real-time graphical multi-CPU, memory, system activity, and graphics pipeline monitor.
  5. **`fsn` (3D File System Navigator)** — The 1993 *Jurassic Park* ("It's a UNIX system!") 3D perspective XFS file browser with spotlight cones and radar overview.
  6. **Winterm (`xwsh`)** — IRIX 6.5 UNIX shell supporting `hinv -v`, `uname -aR`, `sgifetch`, `versions`, `df -k`, `ps -ef`, `ls`, `cd`, `cat`, `tag -q`, and app launching.
  7. **Desktop File Manager (`fm`)** — Mauve path bar, thumbwheel vector zoom, and split Content Viewer pane.
  8. **SGI 3D OpenGL & Buttonfly Showcase** — Interactive 3D SGI Cube, Buttonfly 3D flipping polyhedra, Odyssey NURBS Torus Knot, and IndyCam/O2cam live visualizer.
  9. **System Manager (`sysmgr`)** — Live hardware switching between **SGI Octane2 (`IP30`)**, **SGI O2 (`IP32`)**, **SGI Indy (`IP24`)**, and **SGI Onyx2 (`IP27`)**, plus Process Manager and Audio SoundScheme synthesizer.
  10. **Software Manager 4.1 (`swmgr`)** — Subsystem installer with 3D disk space cylinder pie chart.
  11. **SGI InSight Online Books (`insight`)** — Built-in reader for the IRIX 6.5 Specifications, Web Framework Analysis, and `.FTI` Icon Set guide.
  12. **Netscape Communicator 4.78 (`[SGI]`) & `jot` Text Editor**.

## Running Locally

```bash
npm install
npm run dev
```
