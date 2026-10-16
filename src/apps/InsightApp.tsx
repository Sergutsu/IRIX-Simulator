import React, { useState, useEffect } from 'react';
import { InsightChapter, LaunchApp, SgiColorScheme } from '../state/osStore';
import { IrixVectorIcon, IRIX_ICON_LIBRARY } from '../icons/irixIconSet';
import { irixAudio } from '../sound/irixAudio';

export type { InsightChapter };

interface InsightAppProps {
  colorScheme: SgiColorScheme;
  initialChapter?: InsightChapter;
  onLaunchApp: LaunchApp;
}

export const InsightApp: React.FC<InsightAppProps> = ({
  colorScheme,
  initialChapter = 'specs',
  onLaunchApp,
}) => {
  const [chapter, setChapter] = useState<InsightChapter>(initialChapter);

  useEffect(() => {
    if (initialChapter) setChapter(initialChapter);
  }, [initialChapter]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: colorScheme.windowSurface,
        overflow: 'hidden',
        userSelect: 'text',
      }}
    >
      {/* SGI InSight Banner */}
      <div
        style={{
          background: 'linear-gradient(90deg, #1b3556 0%, #385e88 65%, #1b3556 100%)',
          color: '#fff',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid #111',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IrixVectorIcon iconId="insight" size={38} useMagicCarpet={false} />
          <div>
            <div style={{ fontWeight: 700, fontStyle: 'italic', fontSize: '14px' }}>
              Silicon Graphics InSight™ Online Library
            </div>
            <div style={{ fontSize: '10.5px', color: '#cfe6ff' }}>
              Document 007-2167-006 • IRIX® 6.5 Technical Specifications, Icon Set & Simulator Architecture
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {(
            [
              { id: 'framework', label: '1. Web Framework' },
              { id: 'specs', label: '2. IRIX 6.5 Specs' },
              { id: 'icons', label: '3. .FTI Icon Set' },
              { id: '4dwm', label: '4. 4Dwm & Motif UI' },
              { id: 'savers', label: '5. Screen Savers / ElectroPaint' },
              { id: 'wavefront', label: '6. Wavefront Explorer' },
              { id: 'screenshots', label: '7. Real IRIX Screenshots' },
            ] as const
          ).map((ch) => (
            <button
              key={ch.id}
              type="button"
              className="sgi-btn"
              onClick={() => {
                irixAudio.playMenuClick();
                setChapter(ch.id);
              }}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                background: chapter === ch.id ? '#ffe84a' : undefined,
                fontWeight: chapter === ch.id ? 700 : 500,
              }}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Reader Body */}
      <div
        style={{
          flex: 1,
          background: '#f4f2ec',
          color: '#141414',
          padding: '16px 22px',
          overflowY: 'auto',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '13px',
          lineHeight: 1.55,
        }}
      >
        {chapter === 'framework' && (
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: '#1b3556', fontStyle: 'italic' }}>
              Chapter 1: Selecting the Best Web Framework for an OS Simulation Project
            </h2>
            <p style={{ marginTop: 0 }}>
              Simulating a workstation operating system like <b>Silicon Graphics IRIX 6.5</b>{' '}
              requires concurrent window management (<code>4Dwm</code>), procedural vector icon
              compilation (<code>.fti</code> IRIS GL polygons), real-time 3D rendering (
              <code>fsn</code>, <code>buttonfly</code>, <code>glcube</code>), and a shared
              virtual kernel & XFS filesystem.
            </p>

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                margin: '12px 0',
              }}
            >
              <thead>
                <tr style={{ background: '#2b4769', color: '#fff' }}>
                  <th style={{ padding: '6px', border: '1px solid #444', textAlign: 'left' }}>
                    Criterion
                  </th>
                  <th style={{ padding: '6px', border: '1px solid #444', textAlign: 'left' }}>
                    React 18 + TypeScript + Vite (Selected)
                  </th>
                  <th style={{ padding: '6px', border: '1px solid #444', textAlign: 'left' }}>
                    Svelte / Vue 3
                  </th>
                  <th style={{ padding: '6px', border: '1px solid #444', textAlign: 'left' }}>
                    Vanilla JS / Next.js SSR
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#e8e4d8' }}>
                  <td style={{ padding: '6px', border: '1px solid #999', fontWeight: 700 }}>
                    4Dwm Window Manager
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #999' }}>
                    <b>Optimal:</b> Deterministic z-index stacking, multi-desk filtering (
                    <code>Desks Overview</code>), and desktop minimized tiles.
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #999' }}>
                    Good reactive stores, slightly less ergonomic for recursive menu/SVG trees.
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #999' }}>
                    Vanilla DOM becomes brittle; SSR adds unneeded hydration overhead.
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', border: '1px solid #999', fontWeight: 700 }}>
                    .FTI Vector Icon Engine
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #999' }}>
                    <b>Best-in-Class:</b> Direct JSX <code>&lt;svg&gt;</code> rendering from
                    parsed <code>.fti</code> polygon ASTs with live thumbwheel scaling.
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #999' }}>
                    Good template rendering.
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #999' }}>
                    Verbose manual <code>createElementNS</code> manipulation.
                  </td>
                </tr>
                <tr style={{ background: '#e8e4d8' }}>
                  <td style={{ padding: '6px', border: '1px solid #999', fontWeight: 700 }}>
                    3D Canvas & Audio
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #999' }}>
                    Clean <code>useRef</code> + <code>requestAnimationFrame</code> lifecycle
                    isolation for <code>fsn</code>, <code>gr_osview</code>, and Web Audio.
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #999' }}>Very good.</td>
                  <td style={{ padding: '6px', border: '1px solid #999' }}>Manual cleanup.</td>
                </tr>
              </tbody>
            </table>

            <div
              style={{
                background: '#dfe8f2',
                borderLeft: '4px solid #1b3556',
                padding: '8px 12px',
                fontSize: '12px',
              }}
            >
              <b>Architectural Decision:</b> <b>React 18 + TypeScript + Vite</b> + custom{' '}
              <b>SGI .FTI Vector Compiler</b> + <b>HTML5 Canvas 3D</b> + <b>Web Audio API</b>{' '}
              delivers zero-latency boot, strict type safety across the virtual kernel/XFS
              filesystem, and native declarative SVG rendering for SGI&apos;s resolution-independent
              vector desktop.
            </div>
          </div>
        )}

        {chapter === 'specs' && (
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: '#1b3556', fontStyle: 'italic' }}>
              Chapter 2: Silicon Graphics IRIX 6.5 Technical Specifications
            </h2>
            <ul style={{ paddingLeft: '20px', margin: '6px 0' }}>
              <li>
                <b>Operating System Lineage:</b> UNIX System V Release 4 (SVR4) with 4.3BSD and
                POSIX.1/XPG4 extensions, developed by Silicon Graphics, Inc. (SGI).
              </li>
              <li>
                <b>Release History:</b> <b>IRIX 6.5</b> debuted in <b>June 1998</b> as SGI&apos;s
                unified all-platform OS (superseding 6.2, 6.3 O2, and 6.4 Octane/Onyx2). Updated
                via parallel <b>Maintenance (6.5.xm)</b> and <b>Feature (6.5.xf)</b> overlay
                streams through <b>6.5.22</b> (Nov 2003) and <b>6.5.30</b> (Aug 2006).
              </li>
              <li>
                <b>Kernel & MIPS64 Architecture:</b> 64-bit preemptive monolithic multiprocessor
                kernel (<code>/unix</code>) with <b>Cellular IRIX</b> ccNUMA scalability. Supports
                Big-Endian <b>MIPS III / MIPS IV</b> processors (<b>R4000, R4400, R4600, R5000,
                R8000, R10000, R12000, R14000, R16000</b>) and three simultaneous ABIs:{' '}
                <code>O32</code> (32-bit), <code>N32</code> (64-bit registers with 32-bit
                pointers), and <code>N64</code> (full 64-bit address space).
              </li>
              <li>
                <b>SGI XFS 64-Bit File System:</b> Extent-based journaling filesystem supporting
                volumes up to <b>8 Exbibytes (2^63 - 1 bytes)</b>, B+ tree directories/extents,
                allocation groups, XLV volume striping, CXFS clustered storage, and kernel{' '}
                <code>imon</code> / <code>fam</code> (File Alteration Monitor).
              </li>
              <li>
                <b>Graphics & Xsgi Window System:</b> <code>Xsgi</code> X11R6 server with{' '}
                <b>Simultaneous Multiple Visuals</b> (allowing 8-bit Pseudocolor Motif overlays and
                24/30/48-bit RGBA Double-Buffered OpenGL windows concurrently without colormap
                flashing).
              </li>
            </ul>

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                className="sgi-btn"
                onClick={() => onLaunchApp('system_manager', { tab: 'hardware' })}
                style={{ padding: '4px 10px', fontSize: '11.5px', fontWeight: 700 }}
              >
                Open Hardware Profiles (Octane2 / O2 / Indy / Onyx2)
              </button>
              <button
                type="button"
                className="sgi-btn"
                onClick={() => onLaunchApp('winterm', { runCmd: 'hinv -v' })}
                style={{ padding: '4px 10px', fontSize: '11.5px' }}
              >
                Run `hinv -v` in Winterm
              </button>
            </div>
          </div>
        )}

        {chapter === 'icons' && (
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: '#1b3556', fontStyle: 'italic' }}>
              Chapter 3: SGI IRIX Vector Icon Set (.FTI & .FTR Architecture)
            </h2>
            <p style={{ marginTop: 0 }}>
              Five years before W3C SVG (1998), SGI debuted a procedural 2D isometric vector icon
              system with the Indigo Magic Desktop (1993). Every icon is stored as an ASCII{' '}
              <b>.fti (File Type Icon)</b> script containing IRIS GL drawing primitives on a{' '}
              <code>100.0 × 100.0</code> coordinate grid:
            </p>
            <pre
              style={{
                background: '#18222e',
                color: '#88f0b8',
                padding: '8px 12px',
                fontSize: '11.5px',
                fontFamily: 'monospace',
              }}
            >{`# Example SGI IconSmith .FTI Primitives
color(iconcolor);          # Dynamic state color (White -> SGI Yellow on select!)
bgnoutlinepolygon();       # Filled polygon with outline stroke
  vertex(22.80, 76.50);
  vertex(47.80, 89.00);
  vertex(72.80, 76.50);
  vertex(47.80, 64.00);
endoutlinepolygon(outlinecolor);`}</pre>

            <p style={{ margin: '8px 0' }}>
              <b>Complete Built-in IRIX .FTI Vector Icon Gallery ({Object.keys(IRIX_ICON_LIBRARY).length} Icons):</b>{' '}
              Click any icon below to inspect and edit its vertices live in <b>IconSmith</b>!
            </p>
            <div
              style={{
                background: '#55799c',
                border: '2px inset #333',
                padding: '10px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
                gap: '10px',
              }}
            >
              {Object.values(IRIX_ICON_LIBRARY).map((ic) => (
                <div
                  key={ic.id}
                  onClick={() => onLaunchApp('iconsmith', { iconId: ic.id })}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <IrixVectorIcon iconId={ic.id} size={46} />
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#fff',
                      fontFamily: 'Helvetica, sans-serif',
                      marginTop: '2px',
                      textAlign: 'center',
                    }}
                  >
                    {ic.filename}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {chapter === 'savers' && (
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: '#1b3556', fontStyle: 'italic' }}>
              Chapter 5: Screen Savers, screen_blanker and ElectroPaint
            </h2>
            <p>
              After the configured idle period the IRIX desktop handed the display to{' '}
              <code>screen_blanker</code>, which ran one of the installed screen saver modules.
              Modules are ordinary IRIS GL programs shown by display name under{' '}
              <b>Toolchest &rarr; Desktop &rarr; Customize &rarr; Screen Saver</b>; that menu is why
              third party saver packages such as the famous <i>HayeSavers</i> could simply be dropped
              onto a machine and picked up.
            </p>
            <table style={{ borderCollapse: 'collapse', fontSize: '12px', margin: '6px 0' }}>
              <tbody>
                {[
                  ['Module', 'File', 'What it does'],
                  ['ElectroPaint', '/usr/lib/screens/electropaint', 'The famous one: triangles and squares that wheel, spin, flip and fold in an endless colour-shifting pattern.'],
                  ['Hopalong', '/usr/lib/screens/spaceplants', 'Plane fractal point orbits ("space plants"), grown one point at a time from a 1986 Scientific American article.'],
                  ['Bounce', '/usr/lib/screens/bounce', 'One of the classic SGI demos: a lit rubber ball squashing across a checkerboard floor.'],
                  ['Blank', '/usr/lib/screens/blank', 'Plain blanker, used by the console lock and the monitor power saving mode.'],
                ].map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        style={{
                          border: '1px solid #b9b4a6',
                          padding: '3px 7px',
                          background: i === 0 ? '#e6e1d3' : undefined,
                          fontWeight: i === 0 ? 700 : undefined,
                          fontFamily: j === 1 ? 'monospace' : undefined,
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 style={{ color: '#1b3556', fontStyle: 'italic', margin: '10px 0 4px' }}>
              ElectroPaint (TM), 1986, David A. Tristram
            </h3>
            <p>
              ElectroPaint shipped in two flavours: the screen saver, and an interactive version
              launched as <code>ep -c</code> which attached a Panel Library control panel. The
              artwork is a flock of flat-shaded, alpha blended polys; the choreography comes from an
              ASCII animation script (<code>actset:</code>, <code>duration:</code>,{' '}
              <code>variance:</code>, <code>seqloop:</code>) which IRIX 6.5 shipped as a default that
              could be dumped and read back. Without the script the saver sits still.
            </p>
            <p>
              Every slider is a Panel Library <i>multi-slider</i> widget: an <b>R</b> reset button, an{' '}
              <b>X</b> toggle between <i>wrap</i> and <i>bounce</i>, the main trough, and a little{' '}
              <b>sld</b> sub-slider underneath that animates the main value:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>
              <li>
                <code>whl</code> wheel &middot; <code>spn</code> spin &middot; <code>flp</code>{' '}
                flip &middot; <code>arm</code> arm &middot; <code>wrst</code> wrist &middot;{' '}
                <code>twst</code> twist &mdash; the six types of rotation
              </li>
              <li>
                <code>sz</code> size &middot; <code>zoom</code> camera push &middot;{' '}
                <code>spd</code> speed
              </li>
              <li>
                <code>n</code> maximum visible triangles &middot; <code>rat</code> colour change rate
                &middot; <code>rng</code> colormap range
              </li>
            </ul>
            <p style={{ fontSize: '12px' }}>
              Later IRIS GT versions added lighting, alpha blending and RGB mode; the first versions
              were colormapped. In this simulator both the screen saver and <code>ep -c</code> run the
              same engine, so the flock you see in the panel preview is the flock that fills the
              screen when the display blanks.
            </p>
          </div>
        )}

        {chapter === 'wavefront' && (
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: '#1b3556', fontStyle: 'italic' }}>
              Chapter 6: Wavefront Explorer &mdash; the Maya predecessor
            </h2>
            <p>
              Wavefront Technologies shipped <b>The Advanced Visualizer</b> (TAV), a modular suite of
              small IRIS GL programs: <i>Model</i>, <i>Paint</i>, <i>Property</i>,{' '}
              <i>Dynamation</i>, <i>Kinemation</i>, <i>Preview</i>, <i>Composer</i> and{' '}
              <i>fcheck</i>. In 1993 Silicon Graphics bought Thomson Digital Images and folded their{' '}
              <i>Explore</i> package into the line; in February 1995 SGI bought both Alias and
              Wavefront and created <b>Alias|Wavefront</b>. The next generation animation system that
              grew out of PowerAnimator and Wavefront Explorer was announced as <b>Maya</b> in 1998.
            </p>
            <p>Interface ideas that travelled from Explore into Maya, and that this window reproduces:</p>
            <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>
              <li>
                <b>Gestural (radial) menus</b> &mdash; hold the right mouse button in the viewport and
                flick toward the module you want. The late Maya <i>marking menus</i> are the same idea.
              </li>
              <li>
                <b>Shader-first asset organisation</b> &mdash; you assign a material by dropping
                geometry underneath the shader rather than the shader onto the geometry. This inverted
                hierarchy reappeared in Maya&rsquo;s Hypershade.
              </li>
              <li>
                <b>Deformers as operators</b> &mdash; bend, twist and taper are applied over the hull
                instead of being baked into the vertices.
              </li>
              <li>
                <b>IPR-style interactive shading</b> and 24 fps video playback of a keyframed
                timeline.
              </li>
            </ul>
            <table style={{ borderCollapse: 'collapse', fontSize: '12px', margin: '6px 0' }}>
              <tbody>
                {[
                  ['Wavefront module', 'Explorer 2.0 equivalent'],
                  ['Modeler / director (TAV)', 'Model tool: primitives, deformers, scene object list'],
                  ['Property / IPR', 'Shade tool: materials, diffuse, specular, shine, transparency'],
                  ['Kinemation', 'Animate tool: rotation channels, keyframes, 24 fps timeline'],
                  ['Preview / Display', 'Render tool: resolution, quality, frame output to XFS'],
                ].map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        style={{
                          border: '1px solid #b9b4a6',
                          padding: '3px 7px',
                          background: i === 0 ? '#e6e1d3' : undefined,
                          fontWeight: i === 0 ? 700 : undefined,
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: '12px' }}>
              The <i>Piston Assembly</i> in the primitive menu is there because Wavefront&rsquo;s own
              SGI demo reel modelled a machined piston in the Advanced Visualizer to show off
              Colour, Property and the modeler&rsquo;s hull operations.
            </p>
          </div>
        )}

        {chapter === 'screenshots' && (
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: '#1b3556', fontStyle: 'italic' }}>
              Chapter 7: Real IRIX Screenshots shipped with this simulator
            </h2>
            <p>
              Genuine captures of IRIX 6.5 machines are installed in{' '}
              <code>/usr/people/guest/screenshots</code> on this workstation and can be opened from the
              File Manager Content Viewer, from the <b>Real IRIX Screenshot Reference Gallery</b> (or
              with the <code>screenshots</code> command in Winterm). They record the details this
              simulation was tuned against:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>
              <li>
                Toolchest title bar colour, row height and the 3D drawer cascade glyphs, plus the real
                <i> Desktop &rarr; Customize</i> menu order including <i>Screen Saver</i>,{' '}
                <i>Environment Setup</i> and <i>Set Hot Spot</i>.
              </li>
              <li>
                Desks Overview (<code>ov</code>) with Desk/Main/Global panes, and the teal stippled
                desktop pattern used by several colour schemes.
              </li>
              <li>
                ViewKit widget dressings &mdash; the menu bar order (Application, Edit, Lists, Busy,
                Dialogs, Preferences&hellip;), the <i>SgBusyPopup</i> &ldquo;Wait a bit.&rdquo; dialog,
                mauve completion fields and diamond preference toggles. This is the toolkit
                Alias|Wavefront built on.
              </li>
              <li>
                The file window: mauve path bar, the thumbwheel roller that scales vector icons
                continuously, and the lower Content Viewer pane previewing images &mdash; which IRIX
                did in 1993.
              </li>
              <li>
                <code>fsn</code>, the 3D File System Navigator, with its green ground plane,
                directory pedestals, spotlight and age legend.
              </li>
              <li>
                ElectroPaint itself, mid-flock, showing flat-shaded saturated polys on black.
              </li>
            </ul>
            <p style={{ fontSize: '12px' }}>
              Each capture keeps its source and credit with it &mdash; open one in the gallery to see
              where it came from.
            </p>
          </div>
        )}

        {chapter === '4dwm' && (
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: '#1b3556', fontStyle: 'italic' }}>
              Chapter 4: 4Dwm & IRIX Interactive Desktop (Indigo Magic) UI Guidelines
            </h2>
            <ul style={{ paddingLeft: '20px', margin: '6px 0' }}>
              <li>
                <b>4Dwm (The IRIS Extended Motif Window Manager):</b> Provides beveled resize
                borders with corner notch marks, bold oblique (italic) window headers, window
                shading, multi-workspace management via <b>Desks Overview</b> (<code>ov</code>),
                and minimizes windows into <b>square 3D-beveled desktop tiles</b>.
              </li>
              <li>
                <b>SGI Enhanced Motif (SgiMode):</b> Adds 1px black outer outlines for crisp contrast,
                dusty mauve/rose (<code>#c8979b</code>) text entry fields, and rotary{' '}
                <b>Thumbwheel (SgThumbWheel)</b> sliders for continuous zooming.
              </li>
              <li>
                <b>Toolchest:</b> Persistent top-left vertical menu bar with 3D drawer cascade
                glyphs providing system-wide access to <code>Desktop</code>, <code>Selected</code>,{' '}
                <code>Internet</code>, <code>Find</code>, <code>System</code>, <code>Demos</code>,
                and <code>Help</code>.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
