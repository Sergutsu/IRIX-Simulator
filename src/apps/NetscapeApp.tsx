import React, { useState, useEffect } from 'react';
import { LaunchApp, SgiColorScheme } from '../state/osStore';
import { IrixVectorIcon } from '../icons/irixIconSet';
import { irixAudio } from '../sound/irixAudio';

interface NetscapeAppProps {
  colorScheme: SgiColorScheme;
  initialPage?: 'siliconsurf' | 'irix65' | 'nekoware';
  onLaunchApp: LaunchApp;
}

export const NetscapeApp: React.FC<NetscapeAppProps> = ({
  colorScheme,
  initialPage = 'siliconsurf',
  onLaunchApp,
}) => {
  const [page, setPage] = useState<'siliconsurf' | 'irix65' | 'nekoware'>(initialPage);

  useEffect(() => {
    if (initialPage) setPage(initialPage);
  }, [initialPage]);

  const urlMap = {
    siliconsurf: 'http://www.sgi.com/SiliconSurf/index.html',
    irix65: 'http://techpubs.sgi.com/library/irix6.5/specs.html',
    nekoware: 'http://freeware.sgi.com/index.html',
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: colorScheme.windowSurface,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Motif Menu Bar */}
      <div className="sgi-menubar">
        <span className="sgi-menubar-item"><u>F</u>ile</span>
        <span className="sgi-menubar-item"><u>E</u>dit</span>
        <span className="sgi-menubar-item"><u>V</u>iew</span>
        <span className="sgi-menubar-item"><u>G</u>o</span>
        <span className="sgi-menubar-item"><u>C</u>ommunicator</span>
        <span className="sgi-menubar-item" style={{ marginLeft: 'auto' }}><u>H</u>elp</span>
      </div>

      {/* Netscape 4.78 SGI Motif Navigation Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          background: '#bebebe',
          borderBottom: '1px solid #555',
        }}
      >
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {[
            { label: '◄ Back', p: 'siliconsurf' as const },
            { label: '► Forward', p: 'irix65' as const },
            { label: '↻ Reload', p: page },
            { label: '⌂ SiliconSurf', p: 'siliconsurf' as const },
            { label: '⚙ IRIX 6.5 Docs', p: 'irix65' as const },
            { label: '📦 SGI Freeware', p: 'nekoware' as const },
          ].map((btn, i) => (
            <button
              key={i}
              type="button"
              className="sgi-btn"
              onClick={() => {
                irixAudio.playMenuClick();
                setPage(btn.p);
              }}
              style={{ padding: '3px 7px', fontSize: '10.5px', fontWeight: 700 }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* SGI-Branded Netscape 'N' Throbber Box */}
        <div
          style={{
            width: '34px',
            height: '32px',
            background: '#0d2644',
            border: '2px inset #777',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IrixVectorIcon iconId="netscape" size={28} useMagicCarpet={false} />
        </div>
      </div>

      {/* Location / URL Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 8px',
          background: '#c4c4c4',
          borderBottom: '2px solid #444',
          fontSize: '11px',
        }}
      >
        <span style={{ fontWeight: 700, fontStyle: 'italic' }}>Location:</span>
        <input
          type="text"
          readOnly
          value={urlMap[page]}
          style={{
            flex: 1,
            background: colorScheme.mauveInput,
            border: '2px inset #666',
            padding: '2px 6px',
            fontFamily: 'monospace',
            fontSize: '11.5px',
            fontWeight: 700,
          }}
        />
      </div>

      {/* HTML Document Viewport */}
      <div
        style={{
          flex: 1,
          background: '#ffffff',
          color: '#000000',
          overflowY: 'auto',
          padding: '16px 22px',
          fontFamily: 'Times, "Times New Roman", serif',
          userSelect: 'text',
        }}
      >
        {page === 'siliconsurf' && (
          <div>
            <div
              style={{
                background: 'linear-gradient(90deg, #0d2240 0%, #245c8a 100%)',
                color: '#fff',
                padding: '12px 16px',
                border: '2px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Helvetica, sans-serif' }}>
                  SILICON GRAPHICS® — SiliconSurf™
                </div>
                <div style={{ fontSize: '12px', color: '#88e8ff' }}>
                  What&apos;s New in Visual Computing • Mountain View, California • IRIX 6.5 Launch Portal
                </div>
              </div>
              <IrixVectorIcon iconId="siliconsurf" size={52} />
            </div>

            <h3 style={{ color: '#0d2240', borderBottom: '1px solid #999', paddingBottom: '4px' }}>
              Introducing IRIX® 6.5 & the IRIX Interactive Desktop™
            </h3>
            <p style={{ fontSize: '13.5px', lineHeight: 1.5 }}>
              Welcome to <b>SiliconSurf</b>. With the release of <b>IRIX 6.5</b>, Silicon Graphics
              unifies its entire line of 64-bit MIPS® RISC systems—from <b>Indy™</b> and{' '}
              <b>O2®</b> desktops to <b>Octane2™</b> visual workstations and <b>Onyx2® InfiniteReality™</b>{' '}
              supercomputers—under one scalable operating system.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                margin: '12px 0',
                fontFamily: 'Helvetica, sans-serif',
                fontSize: '12px',
              }}
            >
              <div style={{ background: '#eef4fa', border: '1px solid #88aacc', padding: '8px' }}>
                <b>🎨 IconSmith .FTI Studio</b>
                <p style={{ margin: '4px 0 8px 0' }}>
                  Inspect and edit resolution-independent SGI isometric vector icons.
                </p>
                <button
                  type="button"
                  className="sgi-btn"
                  onClick={() => onLaunchApp('iconsmith')}
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                >
                  Launch IconSmith
                </button>
              </div>
              <div style={{ background: '#eef4fa', border: '1px solid #88aacc', padding: '8px' }}>
                <b>🦖 fsn 3D File Navigator</b>
                <p style={{ margin: '4px 0 8px 0' }}>
                  Fly across your XFS 64-bit filesystem in real-time 3D perspective.
                </p>
                <button
                  type="button"
                  className="sgi-btn"
                  onClick={() => onLaunchApp('fsn')}
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                >
                  Launch fsn 3D
                </button>
              </div>
              <div style={{ background: '#eef4fa', border: '1px solid #88aacc', padding: '8px' }}>
                <b>📘 IRIX 6.5 Specifications</b>
                <p style={{ margin: '4px 0 8px 0' }}>
                  Read the complete OS architecture & web framework evaluation.
                </p>
                <button
                  type="button"
                  className="sgi-btn"
                  onClick={() => onLaunchApp('insight')}
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                >
                  Open InSight Books
                </button>
              </div>
            </div>
          </div>
        )}

        {page === 'irix65' && (
          <div>
            <h2 style={{ marginTop: 0, color: '#0d2240' }}>
              SGI TechPubs: IRIX 6.5.x Overlay Release Timeline (1998–2006)
            </h2>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px',
                fontFamily: 'Helvetica, sans-serif',
              }}
            >
              <thead>
                <tr style={{ background: '#1b3556', color: '#fff' }}>
                  <th style={{ padding: '5px', border: '1px solid #555' }}>Release</th>
                  <th style={{ padding: '5px', border: '1px solid #555' }}>Date</th>
                  <th style={{ padding: '5px', border: '1px solid #555' }}>Key Hardware & Kernel Additions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '5px', border: '1px solid #999', fontWeight: 700 }}>IRIX 6.5 (Base)</td>
                  <td style={{ padding: '5px', border: '1px solid #999' }}>June 1998</td>
                  <td style={{ padding: '5px', border: '1px solid #999' }}>Unified release for all R4000+ systems; Indigo Magic renamed to IRIX Interactive Desktop.</td>
                </tr>
                <tr style={{ background: '#f0f4f8' }}>
                  <td style={{ padding: '5px', border: '1px solid #999', fontWeight: 700 }}>IRIX 6.5.3 / 6.5.4</td>
                  <td style={{ padding: '5px', border: '1px solid #999' }}>Feb–May 1999</td>
                  <td style={{ padding: '5px', border: '1px solid #999' }}>Added MIPS R12000 CPU support, O2/Octane 270–300 MHz, HDTV XIO for Onyx2.</td>
                </tr>
                <tr>
                  <td style={{ padding: '5px', border: '1px solid #999', fontWeight: 700 }}>IRIX 6.5.8 / 6.5.11</td>
                  <td style={{ padding: '5px', border: '1px solid #999' }}>2000–2001</td>
                  <td style={{ padding: '5px', border: '1px solid #999' }}>SGI VPro V6/V8/V10/V12 Odyssey graphics for Octane2; InfiniteReality3; CXFS.</td>
                </tr>
                <tr style={{ background: '#f0f4f8' }}>
                  <td style={{ padding: '5px', border: '1px solid #999', fontWeight: 700 }}>IRIX 6.5.22</td>
                  <td style={{ padding: '5px', border: '1px solid #999' }}>Nov 2003</td>
                  <td style={{ padding: '5px', border: '1px solid #999' }}>Final release supporting Indy, Indigo2, O2, Challenge, and original Onyx.</td>
                </tr>
                <tr>
                  <td style={{ padding: '5px', border: '1px solid #999', fontWeight: 700 }}>IRIX 6.5.30</td>
                  <td style={{ padding: '5px', border: '1px solid #999' }}>Aug 2006</td>
                  <td style={{ padding: '5px', border: '1px solid #999' }}>Final release of SGI IRIX (Fuel, Tezro, Octane2, Origin 3000, Onyx 3000/4).</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {page === 'nekoware' && (
          <div>
            <h2 style={{ marginTop: 0, color: '#0d2240' }}>
              SGI Freeware & Nekoware MIPSpro N32 Archive
            </h2>
            <p style={{ fontSize: '13px' }}>
              Open-source packages compiled with SGI MIPSpro 7.4.4m (<code>-n32 -mips4 -O3</code>)
              and packaged with custom IconSmith <code>.fti</code> vector icons and <code>.ftr</code>{' '}
              file typing rules.
            </p>
            <ul>
              <li><b>fw_apache / fw_mozilla / fw_gimp</b> — Bundled with isometric SGI desktop icons.</li>
              <li><b>sgug-rse / nekoware</b> — Community software distributions for IRIX 6.5.22–6.5.30.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Netscape Bottom Status Bar */}
      <div
        style={{
          height: '20px',
          background: '#bebebe',
          borderTop: '1px solid #666',
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10.5px',
        }}
      >
        <span>🔓 Document: Done (Netscape Communicator 4.78 for Silicon Graphics IRIX 6.5)</span>
        <span>MIPS N32 ELF</span>
      </div>
    </div>
  );
};
