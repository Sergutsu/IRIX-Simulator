import React, { useEffect, useRef, useState } from 'react';
import { AppId, VfsNode, WindowInstance, WorkstationProfile } from '../state/osStore';

interface WintermAppProps {
  workstation: WorkstationProfile;
  vfs: VfsNode[];
  windows: WindowInstance[];
  initialCommand?: string;
  onLaunchApp: (appId: AppId, payload?: Record<string, unknown>) => void;
}

interface TermEntry {
  id: number;
  type: 'cmd' | 'out';
  text: string;
}

export const WintermApp: React.FC<WintermAppProps> = ({
  workstation,
  vfs,
  windows,
  initialCommand,
  onLaunchApp,
}) => {
  const [cwd, setCwd] = useState('/usr/people/guest');
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([
    'hinv -v',
    'uname -aR',
    'versions',
    'df -k',
    'sgifetch',
  ]);
  const [histIdx, setHistIdx] = useState(-1);
  const [entries, setEntries] = useState<TermEntry[]>([
    {
      id: 1,
      type: 'out',
      text: `IRIX64 Release 6.5.22m (${workstation.ipArch}) silicon.sgi.com\nCopyright 1987-2003 Silicon Graphics, Inc. All Rights Reserved.\nType 'help' for available IRIX 6.5 commands, or try 'hinv', 'sgifetch', 'uname -aR', 'ep', 'screens', 'explorer'.`,
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ranInitialRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const executeCommand = (raw: string) => {
    const trimmed = raw.trim();
    const promptLine = `IRIS 6.5.22m silicon:${cwd} # ${trimmed}`;
    if (!trimmed) {
      setEntries((prev) => [...prev, { id: Date.now(), type: 'cmd', text: promptLine }]);
      return;
    }

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    let output = '';

    switch (cmd) {
      case 'help':
        output = [
          'SGI IRIX 6.5.22m (xwsh) Built-in & Workstation Commands:',
          '  hinv [-v]       Display SGI Hardware Inventory (CPU, Xbow, Graphics, SCSI)',
          '  uname [-aR]     Print IRIX kernel version, IP architecture & overlay stream',
          '  sgifetch        Display SGI ASCII 3D Cube & Workstation summary',
          '  versions        List installed IRIX 6.5 inst subsystems (eoe, 4Dwm, motif, xfs)',
          '  df [-k]         Report XFS 64-bit filesystem disk space usage',
          '  ps [-ef]        Report active IRIX kernel & X11/4Dwm desktop processes',
          '  ls [-la] [dir]  List directory contents in XFS virtual filesystem',
          '  cd <dir>        Change working directory',
          '  pwd             Print current working directory',
          '  cat <file>      Display file or .fti vector icon source',
          '  tag -q <file>   Query SGI File Typing Rule (.ftr) hexadecimal tag',
          '  iconsmith       Launch SGI IconSmith (.FTI Vector Icon Editor)',
          '  ep | electropaint  Launch ElectroPaint (the dancing polygons screen saver)',
          '  screen_blanker  Open the Screen Saver control panel (screen saver modules)',
          '  screens         List the installed screen saver modules',
          '  explorer        Launch WAVEFRONT EXPLORER 2.0 (the Maya predecessor)',
          '  screenshots     Open the real IRIX screenshot reference gallery',
          '  fcheck [file]   View images / rendered frame sequences (SGI RGB viewer)',
          '  fsn             Launch 3D File System Navigator (Jurassic Park UNIX visualizer)',
          '  gr_osview       Launch Graphical OS System Performance Monitor',
          '  showcase        Launch SGI 3D OpenGL & Buttonfly Showcase',
          '  sysmgr          Launch IRIX System Manager & Hardware Selector',
          '  swmgr           Launch IRIX Software Manager 4.1',
          '  insight         Open SGI InSight Online Books (IRIX 6.5 Specifications)',
          '  netscape        Launch Netscape Communicator 4.78 [SGI]',
          '  clear           Clear terminal scrollback',
        ].join('\n');
        break;

      case 'clear':
        setEntries([]);
        return;

      case 'hinv':
        output = workstation.hinvLines.join('\n');
        break;

      case 'uname':
        if (args.some((a) => a.includes('a') || a.includes('R'))) {
          output = `IRIX64 silicon 6.5 6.5.22m 11051731 ${workstation.ipArch} mipseb`;
        } else {
          output = 'IRIX64';
        }
        break;

      case 'sgifetch':
      case 'neofetch':
        output = [
          '       ..::::::::..          root@silicon.sgi.com',
          '    .::------------::.       --------------------',
          '   /:  /\\        /\\  :\\      OS: IRIX64 6.5 6.5.22m (' + workstation.ipArch + ')',
          '  /:  /  \\      /  \\  :\\     Host: ' + workstation.name + ' (' + workstation.codename + ')',
          ' /:  /    \\____/    \\  :\\    Kernel: 64-bit SVR4/BSD Monolithic (/unix)',
          ' |:  \\    /    \\    /  :|    CPU: ' + workstation.cpuCount + 'x ' + workstation.cpuMHz + ' MHz ' + workstation.cpuModel,
          ' |:   \\  /      \\  /   :|    FPU: ' + workstation.fpuModel,
          ' \\:    \\/________\\/    :/    GPU: ' + workstation.gfxSubsystem,
          '  \\:   /\\        /\\   :/     Memory: ' + Math.round(workstation.ramMB * 0.34) + ' MB / ' + workstation.ramMB + ' MB',
          '   \\: /  \\      /  \\ :/      WM: 4Dwm (IRIS Extended Motif Window Manager)',
          '    `::---\\----/---::\'       DE: IRIX Interactive Desktop (Indigo Magic)',
          '       `\'::::::::\'\'          FS: SGI XFS 64-bit Extent Journaling (/dev/root)',
        ].join('\n');
        break;

      case 'versions':
        output = [
          'I = Installed, R = Removed',
          '   Name                 Date      Description',
          'I  eoe                  11/12/03  IRIX Execution Only Environment, 6.5.22m',
          'I  eoe.sw.base          11/12/03  IRIX Base Execution Environment',
          'I  eoe.sw.xfs           11/12/03  XFS 64-bit Extent File System & XLV',
          'I  x_eoe.sw.Server      11/12/03  Xsgi X11R6 Window Server (Multi-Visual TrueColor)',
          'I  desktop_eoe.sw.4Dwm  11/12/03  4Dwm IRIS Extended Motif Window Manager',
          'I  desktop_eoe.sw.envm  11/12/03  IRIX Interactive Desktop / Indigo Magic Tools',
          'I  motif_eoe.sw.eoe     11/12/03  SGI Enhanced OSF/Motif 1.2.4 Runtime (SgiMode)',
          'I  gl_dev.sw.opengl     11/12/03  SGI OpenGL & IRIS GL 3D Graphics Libraries',
          'I  dmedia_eoe.sw.common 11/12/03  SGI Digital Media Audio/Video Execution Env',
          'I  insight_base.sw.eoe  11/12/03  SGI InSight Online Documentation Viewer',
        ].join('\n');
        break;

      case 'df':
        output = [
          'Filesystem             Type  kbytes     use     avail  %use Mounted on',
          '/dev/root              xfs  35651584 11408504 24243080  32%  /',
          '/dev/dsk/dks0d2s7      xfs  71303168 18538820 52764348  26%  /usr/demos',
          '/hw                    hwgfs       0        0        0   0%  /hw',
          'silicon:/CDROM         iso9660 650240  650240        0 100%  /CDROM',
        ].join('\n');
        break;

      case 'ps':
        output = [
          '    UID   PID  PPID  C    STIME TTY       TIME CMD',
          '   root     0     0  0 09:00:00 ?         0:02 sched',
          '   root     1     0  0 09:00:01 ?         0:04 /sbin/init',
          '   root   184     1  0 09:00:08 ?         0:11 /usr/sbin/syslogd',
          '   root   312     1  0 09:00:12 ?         0:19 /usr/etc/fam -t 6',
          '   root   420     1  2 09:00:15 ?         1:42 /usr/bin/X11/Xsgi :0 -bs -nobitscale -c -class TrueColor -depth 24',
          '   root   448   420  1 09:00:17 ?         0:38 /usr/bin/X11/4Dwm',
          '   root   452   420  0 09:00:18 ?         0:09 /usr/bin/X11/toolchest',
          '   root   456   420  0 09:00:18 ?         0:14 /usr/sbin/fm -d /usr/people/guest',
          '   root   460   420  0 09:00:19 ?         0:06 /usr/bin/X11/ov',
          ...windows.map(
            (w, idx) =>
              `   root  ${1100 + idx * 17}   448  1 09:02:10 pts/${idx}     0:08 /usr/sbin/${w.appId}`
          ),
        ].join('\n');
        break;

      case 'pwd':
        output = cwd;
        break;

      case 'cd': {
        const target = args[0] || '/usr/people/guest';
        const resolved =
          target === '~'
            ? '/usr/people/guest'
            : target === '..'
            ? cwd.split('/').slice(0, -1).join('/') || '/'
            : target.startsWith('/')
            ? target
            : `${cwd === '/' ? '' : cwd}/${target}`;
        setCwd(resolved);
        break;
      }

      case 'ls': {
        const dirArg = args.find((a) => !a.startsWith('-')) || cwd;
        const prefix = dirArg === '/' ? '/' : dirArg.replace(/\/$/, '');
        const children = vfs.filter((n) => {
          if (prefix === '/') {
            const segs = n.path.split('/').filter(Boolean);
            return segs.length === 1;
          }
          if (!n.path.startsWith(prefix + '/')) return false;
          const rest = n.path.slice(prefix.length + 1);
          return !rest.includes('/');
        });
        if (children.length === 0) {
          output = `total 0 (try 'ls /usr/people/guest' or 'ls /usr/lib/filetype/iconlib')`;
        } else if (args.some((a) => a.includes('l'))) {
          output =
            `total ${children.length}\n` +
            children
              .map(
                (c) =>
                  `${c.permissions}  1 ${c.owner.padEnd(6)} sys  ${String(c.size).padStart(
                    7
                  )} ${c.mtime} ${c.name}`
              )
              .join('\n');
        } else {
          output = children.map((c) => c.name).join('   ');
        }
        break;
      }

      case 'cat': {
        const fileArg = args[0];
        if (!fileArg) {
          output = 'Usage: cat <filename>';
          break;
        }
        const fullPath = fileArg.startsWith('/')
          ? fileArg
          : `${cwd === '/' ? '' : cwd}/${fileArg}`;
        const found =
          vfs.find((n) => n.path === fullPath || n.name === fileArg);
        if (!found) {
          output = `cat: cannot open ${fileArg}: No such file or directory`;
        } else {
          output = found.content || `[ELF N32 MSB mips-4 dynamic executable: ${found.path} (tag ${found.tagHex})]`;
        }
        break;
      }

      case 'tag': {
        const fileArg = args[args.length - 1];
        const found = vfs.find((n) => n.name === fileArg || n.path === fileArg);
        if (!found) {
          output = `Usage: tag -q <file> (e.g. tag -q buttonfly)`;
        } else {
          output = `${found.path}: SGI FTR Tag = ${found.tagHex} (${found.type.toUpperCase()})`;
        }
        break;
      }

      case 'iconsmith':
        onLaunchApp('iconsmith');
        output = 'Launching /usr/sbin/iconsmith (SGI .FTI Vector Icon Editor)...';
        break;

      case 'fsn':
        onLaunchApp('fsn');
        output = 'Launching /usr/demos/fsn (3D File System Navigator)...';
        break;

      case 'gr_osview':
      case 'osview':
        onLaunchApp('gr_osview');
        output = 'Launching /usr/sbin/gr_osview...';
        break;

      case 'showcase':
      case 'glcube':
      case 'buttonfly':
        onLaunchApp('gl_showcase', {
          mode: cmd === 'buttonfly' ? 'buttonfly' : 'cube',
        });
        output = `Launching SGI OpenGL Demo (${cmd})...`;
        break;

      case 'sysmgr':
        onLaunchApp('system_manager');
        output = 'Launching /usr/sbin/sysmgr...';
        break;

      case 'swmgr':
      case 'inst':
        onLaunchApp('software_manager');
        output = 'Launching /usr/sbin/swmgr (Software Manager 4.1)...';
        break;

      case 'insight':
        onLaunchApp('insight');
        output = 'Launching /usr/sbin/insight (SGI InSight Online Documentation)...';
        break;

      case 'netscape':
        onLaunchApp('netscape');
        output = 'Launching Netscape Communicator 4.78 [SGI]...';
        break;

      case 'jot':
      case 'nedit':
        onLaunchApp('jot');
        output = 'Launching /usr/sbin/jot...';
        break;

      case 'ep':
      case 'electropaint':
        onLaunchApp('electropaint');
        output = [
          'Launching /usr/sbin/ep -c (ElectroPaint, interactive)...',
          'ElectroPaint (TM) 1986 David A. Tristram.  The screen saver is the same',
          'program with the Panel Library control panel attached:',
          '   whl wheel   spn spin   flp flip   arm arm   wrst wrist   twst twist',
          '   sz size     zoom zoom  spd speed  n count   rat rate   rng range',
        ].join('\n');
        break;

      case 'screen_blanker':
      case 'screensaver':
      case 'screensavers':
        onLaunchApp('screensaver');
        output = 'Launching /usr/sbin/screen_blanker control panel (Toolchest > Desktop > Customize > Screen Saver)...';
        break;

      case 'hops':
      case 'hopalong':
      case 'spaceplants':
      case 'bounce':
        onLaunchApp('screensaver', { module: cmd });
        output = `Selecting the ${cmd} screen saver module in the Screen Saver panel...`;
        break;

      case 'explorer':
      case 'wavefront':
      case 'tav':
      case 'director':
        onLaunchApp('explorer');
        output = [
          'Launching /usr/local/wave/bin/director -- WAVEFRONT EXPLORER 2.0',
          'Alias|Wavefront, a Silicon Graphics company.  Modules: Model, Shade,',
          'Animate, Render.  The next generation system built on this code base',
          'and on PowerAnimator will be announced separately (it becomes Maya).',
        ].join('\n');
        break;

      case 'screens':
        output = [
          'Installed IRIX 6.5 screen saver modules (/usr/lib/screens):',
          '  electropaint   ElectroPaint (TM) - the dancing polygons (David A. Tristram)',
          '  spaceplants    Hopalong plane fractal, a.k.a. "space plants"',
          '  bounce         SGI demo: rubber ball on a checkerboard floor',
          '  blank          plain blanker used by the console lock',
          '',
          "Run 'screen_blanker' for the control panel, or 'ep' for the interactive version.",
        ].join('\n');
        break;

      case 'fcheck':
        onLaunchApp('fcheck');
        output = 'Launching /usr/bin/fcheck (SGI image & movie sequence viewer)...';
        break;

      case 'screenshots':
      case 'reference':
        onLaunchApp('reference');
        output = 'Opening the Real IRIX Screenshot Reference Gallery (/usr/people/guest/screenshots)...';
        break;

      default:
        output = `ksh: ${cmd}: not found (type 'help' for available IRIX 6.5 commands)`;
        break;
    }

    setHistory((prev) => [trimmed, ...prev]);
    setHistIdx(-1);
    setEntries((prev) => [
      ...prev,
      { id: Date.now(), type: 'cmd', text: promptLine },
      ...(output ? [{ id: Date.now() + 1, type: 'out' as const, text: output }] : []),
    ]);
  };

  useEffect(() => {
    if (initialCommand && !ranInitialRef.current) {
      ranInitialRef.current = true;
      executeCommand(initialCommand);
    }
  }, [initialCommand]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && histIdx + 1 < history.length) {
        const next = histIdx + 1;
        setHistIdx(next);
        setInput(history[next]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx > 0) {
        const next = histIdx - 1;
        setHistIdx(next);
        setInput(history[next]);
      } else {
        setHistIdx(-1);
        setInput('');
      }
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#101d2b', // Classic SGI xwsh deep slate-indigo terminal background
        color: '#e6f0fa',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '12.5px',
        overflow: 'hidden',
      }}
    >
      {/* Scrollable Terminal Output */}
      <div
        style={{
          flex: 1,
          padding: '8px 10px',
          overflowY: 'auto',
          lineHeight: 1.38,
          userSelect: 'text',
        }}
      >
        {entries.map((ent) => (
          <pre
            key={ent.id}
            style={{
              margin: '0 0 5px 0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'inherit',
              color: ent.type === 'cmd' ? '#ffe84a' : '#d8ecff',
              fontWeight: ent.type === 'cmd' ? 700 : 400,
            }}
          >
            {ent.text}
          </pre>
        ))}

        {/* Active Command Prompt Line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#64ff96', fontWeight: 700, flexShrink: 0 }}>
            IRIS 6.5.22m silicon:{cwd} #
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              fontWeight: 700,
            }}
          />
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Quick Command Chips Bar */}
      <div
        style={{
          background: '#b4b4b4',
          borderTop: '1px solid #222',
          padding: '3px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: '10.5px',
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontStyle: 'italic',
            fontWeight: 700,
            color: '#111',
            marginRight: '2px',
          }}
        >
          Quick Exec:
        </span>
        {[
          'hinv -v',
          'sgifetch',
          'uname -aR',
          'versions',
          'df -k',
          'ps -ef',
          'ls -la /usr/lib/filetype/iconlib',
          'cat /usr/lib/filetype/iconlib/buttonfly.fti',
        ].map((cmdStr) => (
          <button
            key={cmdStr}
            type="button"
            className="sgi-btn"
            style={{ padding: '1px 5px', fontSize: '10px' }}
            onClick={(e) => {
              e.stopPropagation();
              executeCommand(cmdStr);
            }}
          >
            {cmdStr.split(' ')[0]}
          </button>
        ))}
      </div>
    </div>
  );
};
