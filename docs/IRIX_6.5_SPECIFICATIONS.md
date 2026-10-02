# SGI IRIX 6.5 OS Simulator — Web Framework Selection, System Specifications & Vector Icon Architecture

## 1. Web Framework Evaluation & Selection for OS Simulation

Building an authentic workstation Operating System simulator—specifically **Silicon Graphics (SGI) IRIX 6.5** with the **IRIX Interactive Desktop** (formerly **Indigo Magic Desktop**) and **4Dwm**—places unique demands on a web stack:

1. **High-Frequency Window Management (`4Dwm`)**: Real-time window dragging, 8-direction Motif beveled border resizing, focus-follows-mouse vs. click-to-focus policies, window shading/minimizing into desktop icon tiles, and multi-workspace synchronization (`Desks Overview`).
2. **Resolution-Independent Vector Icon Rendering (`.fti` Format)**: Unlike Windows 95 or Classic Mac OS (which used fixed 16×16 or 32×32 bitmap icons), SGI IRIX introduced a procedural 2D isometric vector format (`*.fti` — *File Type Icon*) in 1993 using IRIS GL drawing commands (`bgnoutlinepolygon`, `vertex`, `endoutlinepolygon`, `bgnline`) over a `100×100` coordinate space. Icons dynamically re-color (`iconcolor`, `outlinecolor`, `shadowcolor`) based on selection/open state and scale continuously via Motif thumbwheel sliders.
3. **Real-Time 3D Graphics & Telemetry**: SGI workstations were built around hardware-accelerated IRIS GL / OpenGL (`fsn` 3D File System Navigator, `buttonfly`, 3D Showcase, and `gr_osview` real-time kernel telemetry).
4. **Shared Virtual Kernel & XFS Filesystem State**: Changes made in `Winterm` (`xwsh`), `File Manager` (`fm`), `IconSmith`, or `Process Manager` must immediately propagate across all open windows.

### Framework Comparison Matrix

| Criterion | **React 18 + TypeScript + Vite (Selected)** | Svelte / SvelteKit | Vue 3 + Vite | Vanilla JS / Web Components | Next.js (SSR) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Window Manager State (`4Dwm`)** | **Excellent** — Deterministic state transitions, multi-desk filtering, and clean portal/stacking contexts. | Very Good — Reactive stores, though complex cross-window AST/terminal state benefits from strict TS composition. | Very Good — Pinia + SFCs work well, slightly more boilerplate for inline SVG/FTI compilers. | Poor at scale — Manual DOM reconciliation becomes brittle across 12+ concurrent apps. | Suboptimal — SSR/RSC adds hydration overhead unneeded for a client-side OS kernel. |
| **Dynamic `.fti` Vector-to-SVG Pipeline** | **Best-in-class** — Native JSX `<svg>` tree generation directly from parsed `.fti` polygon ASTs with zero DOM serialization lag. | Good — Requires template loops over parsed polygon arrays. | Good — Template v-for over SVG nodes. | Verbose — Requires manual `createElementNS` calls for every polygon vertex edit in `IconSmith`. | Same as React, heavier build. |
| **Canvas / 3D (`fsn`, `glcube`, `gr_osview`)** | **Excellent** — Clean `useRef` + `requestAnimationFrame` lifecycle isolation per window instance. | Excellent | Very Good | Good | Good |
| **Type Safety for Virtual Kernel & XFS** | **First-class TypeScript** — Strict typing for Inodes, File Typing Rules (`.ftr`), Process Control Blocks (`PCB`), and SGI Hardware Inventory (`hinv`). | Good | Good | None by default | First-class TypeScript |
| **Boot Latency & Dev HMR** | **Instant (<150ms)** via Vite ESBuild/Rollup. | Instant | Instant | Instant | Slower |

### Architectural Verdict
**React 18 + TypeScript + Vite** paired with a **custom `.fti` IRIS GL Vector Compiler**, **HTML5 Canvas 3D engines (`fsn`, `glcube`, `gr_osview`)**, **Web Audio API Indigo Magic Sound Synthesizer**, and **authentic SGI Enhanced Motif (`SgiMode`) CSS** provides the optimal architecture.

---

## 2. SGI IRIX 6.5 Technical Specifications

### 2.1 Overview & Release History
* **Operating System**: SGI **IRIX 6.5** (UNIX System V Release 4.2 / SVR4 with 4.3BSD and POSIX/XPG4 extensions).
* **Initial 6.5 Release**: **June 1998** (the unified "all-platform" IRIX release superseding IRIX 6.2, 6.3 for O2, and 6.4 for Octane/Origin/Onyx2).
* **Release Stream Model**: Starting with 6.5.1, SGI split updates into two parallel quarterly overlay streams:
  * **Maintenance Stream (`6.5.xm`)**: Stability and bugfixes for production environments.
  * **Feature Stream (`6.5.xf`)**: New hardware enablement (R12000/R14000/R16000 CPUs, VPro Odyssey graphics, CXFS, XFS enhancements).
  * **Milestone Releases**: **IRIX 6.5.22** (November 2003 — final release supporting Indy, Indigo2, O2 R5000, Challenge, Onyx) and **IRIX 6.5.30** (August 16, 2006 — final release of IRIX).

### 2.2 Kernel & Processor Architecture
* **Kernel Type**: 64-bit preemptive, monolithic multiprocessor UNIX kernel (`/unix`) with **Cellular IRIX** modularization for ccNUMA scalability up to 512–1024 processors on SGI Origin 2000/3000.
* **Instruction Set Architecture**: **MIPS64** (Big-Endian `mipseb`).
* **Supported MIPS Microprocessors**:
  * **MIPS R4000 / R4400** (100–250 MHz) & **R4600 / R5000** (100–300 MHz) — 64-bit MIPS III (Indy, Indigo2, O2).
  * **MIPS R8000** (75–90 MHz) — Superscalar floating-point chipset (Power Indigo2, Power Challenge).
  * **MIPS R10000** (150–250 MHz), **R12000** (270–400 MHz), **R14000** (500–600 MHz), **R16000** (700–1000 MHz) — 4-way superscalar out-of-order MIPS IV RISC processors (O2, Octane/Octane2, Onyx2/3000, Fuel, Tezro, Origin).
* **Application Binary Interfaces (ABIs)**:
  * **O32**: Legacy 32-bit MIPS I/II ABI (`ilp32`).
  * **N32**: High-performance 32-bit pointers with 64-bit registers and 64-bit hardware floating-point (`MIPS III/IV`, ELF32).
  * **N64**: Full 64-bit address space and 64-bit pointers (`lp64`, ELF64).

### 2.3 Supported SGI Workstation Hardware Profiles (Simulated in OS)
1. **SGI Octane2 (`IP30`)**:
   * **CPU**: Dual 400 MHz MIPS R12000 (SC) with R12010 FPU, 32 KB I-Cache, 32 KB D-Cache, 2 MB L2 Cache per CPU.
   * **System Interconnect**: Non-blocking 8-port **Crossbow (`Xbow`)** ASIC crossbar switch (1.6 GB/s per port) + **HEART** memory/system controller.
   * **Graphics**: **SGI VPro V12 (`Odyssey`)** — 128 MB dedicated SDRAM, hardware geometry engine + Buzz raster ASIC, 1280×1024 @ 75Hz 24/30/48-bit RGBA TrueColor.
2. **SGI O2 (`IP32`)**:
   * **CPU**: 300 MHz MIPS R12000 / 180 MHz MIPS R5000.
   * **Architecture**: **UMA (Unified Memory Architecture)** with **CRM** (Crime Rendering & Memory Engine), **MRE** (Memory Rendering Engine), and **ICE** (Image Compression Engine for hardware JPEG/MPEG).
   * **Peripherals**: Built-in **O2cam** digital video camera & stereo microphone on desktop dock.
3. **SGI Indy (`IP22` / `IP24`)**:
   * **CPU**: 175 MHz MIPS R4400SC or 180 MHz R5000.
   * **Graphics**: 24-bit **XL24** or **XZ** graphics subsystem + **Vino** video capture ASIC + **IndyCam**.
4. **SGI Onyx2 InfiniteReality3 (`IP27`)**:
   * **CPU**: Quad 400 MHz MIPS R12000 on ccNUMA CrayLink interconnect.
   * **Graphics**: **InfiniteReality3** (4 Geometry Engines, 4 Raster Managers, 64 MB Texture Memory).

### 2.4 Storage & XFS File System
* **Primary File System**: **SGI XFS** (introduced in IRIX 5.3, default in IRIX 6.5):
  * 64-bit extent-based journaling filesystem supporting up to **8 Exbibytes ($2^{63}-1$ bytes)** volume size.
  * Allocation groups for parallel I/O, B+ trees for directories and extents, delayed allocation, and real-time guaranteed-rate I/O subvolumes (`rtdev`) for uncompressed HD video streaming.
* **File Alteration Monitor (`fam` & `imon`)**: Kernel inode monitor (`/dev/imon`) notifying the Desktop File Manager (`fm`) in real time when files are created, modified, or deleted.

### 2.5 Graphics, Windowing & IRIX Interactive Desktop (`Indigo Magic`)
* **X Server**: **Xsgi** (X11R6 implementation supporting Simultaneous Multiple Visuals — allowing 8-bit Pseudocolor Motif menus, 12-bit overlay planes, and 24/30-bit Double-Buffered OpenGL windows simultaneously without colormap flashing).
* **Widget Toolkit**: **SGI Enhanced Motif (`SgiMode`)** & **ViewKit**:
  * Distinct from standard OSF/Motif: features sharper 1px black outer outlines, chiseled 3D bevels, **italic Bold Helvetica (`Helvetica-BoldOblique`)** typography on window headers, menus, and labels, **dusty mauve/rose (`#c8979b`)** text-input fields, and **thumbwheel (`SgThumbWheel`)** rotary sliders.
* **Window Manager**: **4Dwm** (*The IRIS Extended Motif Window Manager*):
  * Manages multiple virtual workspaces (**Desks**) via `Desks Overview` (`ov`).
  * Minimizes active windows into square 3D-beveled desktop tiles (`68×68px`) showing a miniature icon and title.
* **Primary Desktop Components**:
  * **Toolchest (`toolchest`)**: Persistent top-left cascading command menu (`Desktop`, `Selected`, `Internet`, `Find`, `System`, `Demos`, `Help`).
  * **Desktop File Manager (`fm`)**: Displays the user's home directory, desktop icons, folder shelf, thumbwheel icon scaler, Content Viewer pane, and `/dumpster`.
  * **Icon Catalog (`iconbook`)**: Tabbed binder of installed applications, demos, control panels, and web tools.
  * **System Manager (`sysmgr`)**, **Software Manager (`swmgr`)**, and **Graphical OS View (`gr_osview`)**.

---

## 3. IRIX Vector Icon Set Specification (`.fti` & `.ftr`)

Five years before the W3C SVG specification (1998), SGI created a resolution-independent vector icon system for the Indigo Magic Desktop (1993).

### 3.1 The `.fti` (File Type Icon) Geometry Language
* **Coordinate Space**: `0.0` to `100.0` on both X and Y axes (`(0,0)` is bottom-left in IRIS GL coordinates; reflected in screen space as `(x, 100 - y)`).
* **Projection**: Isometric 30° projection (`Δy / Δx ≈ 0.5`, i.e., 2:1 pixel ratio along isometric axes) so icons look like miniature 3D architectural models sitting on the desktop.
* **Drawing Primitives** (matching IRIS GL syntax):
  * `color(index);` — Sets current pen/fill color (`0..15` base palette, `-16..-255` extended dithered palette, or symbolic constants `iconcolor`, `outlinecolor`, `shadowcolor`).
  * `bgnpolygon(); ... vertex(x, y); ... endpolygon();` — Filled unoutlined polygon.
  * `bgnoutlinepolygon(); ... vertex(x, y); ... endoutlinepolygon(colorIndex);` — Filled polygon outlined with `colorIndex`.
  * `bgnline(); ... vertex(x, y); ... endline();` — Open polyline stroke.
  * `bgnclosedline(); ... vertex(x, y); ... endclosedline();` — Closed polyline stroke.
* **Dynamic State Colors**:
  * `iconcolor`: Automatically changed by the IRIX Desktop based on the icon's interaction state:
    * **Normal (Unselected)**: Neutral silver-white (`#dcdcdc`)
    * **Selected (Single-Clicked)**: Luminous SGI Yellow (`#ffe84a`)
    * **Opened / Launching**: SGI Electric Cyan/Blue (`#78c4ff`)
    * **Located / Drop Target**: Highlight Gold (`#ffd060`)
  * `outlinecolor`: Typically black (`#000000`) or dark charcoal (`#1a1a1a`).
  * `shadowcolor`: Translucent/dark slate drop-shadow (`#283848`).

### 3.2 Layered Composition via `.ftr` (File Typing Rules)
In IRIX (`/usr/lib/filetype/`), an application icon is rarely a single file. Instead, `.ftr` rules layer a **base plate** (`generic.exec.closed.fti` or `generic.exec.open.fti` — the famous isometric "Magic Carpet" sheet of paper) underneath the application's specific **badge** `.fti`:

```ftr
TYPE ShowcaseApp
    MATCH       tag == 0x00001040;
    LEGEND      SGI Showcase 3D Presentation Tool
    SUPERTYPE   Executable
    CMD OPEN    $LEADER $REST
    ICON {
        if (opened) {
            include("../iconlib/generic.exec.open.fti");
        } else {
            include("../iconlib/generic.exec.closed.fti");
        }
        include("iconlib/showcase.fti");
    }
```

In this simulator, both the **layered `.ftr` Magic Carpet composition** and a complete **`.fti` IRIS GL Parser + Interactive `IconSmith` Vector Editor** are implemented in `src/icons/ftiEngine.ts` and `src/icons/irixIconSet.ts`.
