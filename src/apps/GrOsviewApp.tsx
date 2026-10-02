import React, { useEffect, useState } from 'react';
import { SgiColorScheme, WorkstationProfile } from '../state/osStore';

interface GrOsviewAppProps {
  workstation: WorkstationProfile;
  colorScheme: SgiColorScheme;
  openWindowCount: number;
}

interface CpuMetrics {
  user: number;
  sys: number;
  intr: number;
  gfxf: number;
  gfxc: number;
  idle: number;
}

/**
 * Pixel-faithful SGI IRIX 6.5 `gr_osview` Real-Time Graphical System Monitor
 * Matches the exact bar layout, colors, and digital readouts of /usr/sbin/gr_osview.
 */
export const GrOsviewApp: React.FC<GrOsviewAppProps> = ({
  workstation,
  openWindowCount,
}) => {
  const [stressMode, setStressMode] = useState<'normal' | 'cpu' | 'gfx' | 'xfs'>('normal');
  const [cpus, setCpus] = useState<CpuMetrics[]>([]);
  const [mem, setMem] = useState({
    kernel: 9,
    fsctl: 6,
    fsdirty: 2,
    fsclean: 16,
    free: 57,
    user: 10,
  });
  const [waitBar, setWaitBar] = useState({ io: 2, swap: 0.5, pio: 1.5 });
  const [sysAct, setSysAct] = useState({
    sycall: 18,
    switch: 6,
    fork: 1,
    exec: 1,
    iget: 3,
    totalK: 332.4,
  });
  const [gfxAct, setGfxAct] = useState({
    intr: 22,
    swch: 8,
    ioctl: 3,
    swap: 4,
    fiwt: 1,
    finwt: 2,
  });

  useEffect(() => {
    const updateTelemetry = () => {
      const baseLoad = Math.min(25, openWindowCount * 2.8);
      const nextCpus: CpuMetrics[] = Array.from({ length: workstation.cpuCount }).map(
        (_, i) => {
          const jitter = Math.random() * 6;
          let user = 4 + baseLoad * 0.5 + jitter + (i === 0 ? 3 : 0);
          let sys = 2 + Math.random() * 3.5;
          const intr = 0.8 + Math.random() * 1.5;
          let gfxf = 1.5 + Math.random() * 3;
          let gfxc = 1.0 + Math.random() * 2.5;

          if (stressMode === 'cpu') {
            user = 58 + Math.random() * 22;
            sys = 12 + Math.random() * 8;
          } else if (stressMode === 'gfx') {
            gfxf = 32 + Math.random() * 14;
            gfxc = 24 + Math.random() * 12;
            user = 18 + Math.random() * 8;
          } else if (stressMode === 'xfs') {
            sys = 28 + Math.random() * 14;
            user = 12 + Math.random() * 8;
          }

          const used = Math.min(96, user + sys + intr + gfxf + gfxc);
          const idle = Math.max(4, 100 - used);
          return { user, sys, intr, gfxf, gfxc, idle };
        }
      );
      setCpus(nextCpus);

      setMem({
        kernel: 9,
        fsctl: 6 + (stressMode === 'xfs' ? 5 : 0),
        fsdirty: stressMode === 'xfs' ? 14 + Math.random() * 6 : 2 + Math.random() * 2,
        fsclean: 15,
        free: stressMode === 'cpu' ? 38 : 54 - Math.min(15, openWindowCount),
        user: stressMode === 'cpu' ? 26 : 10 + Math.min(12, openWindowCount),
      });

      setWaitBar({
        io: stressMode === 'xfs' ? 34 + Math.random() * 18 : 1 + Math.random() * 2.5,
        swap: stressMode === 'cpu' ? 4 + Math.random() * 3 : 0.4,
        pio: stressMode === 'xfs' ? 14 + Math.random() * 8 : 0.8 + Math.random() * 1.5,
      });

      setSysAct({
        sycall:
          stressMode === 'cpu'
            ? 45 + Math.random() * 16
            : 16 + baseLoad * 0.4 + Math.random() * 6,
        switch: 6 + Math.random() * 4,
        fork: stressMode === 'cpu' ? 6 + Math.random() * 4 : 0.8,
        exec: stressMode === 'cpu' ? 4 + Math.random() * 3 : 0.6,
        iget: stressMode === 'xfs' ? 28 + Math.random() * 10 : 2 + Math.random() * 2,
        totalK:
          stressMode === 'cpu'
            ? 840 + Math.random() * 95
            : 310 + openWindowCount * 14 + Math.random() * 25,
      });

      setGfxAct({
        intr: stressMode === 'gfx' ? 44 + Math.random() * 14 : 22 + Math.random() * 6,
        swch: stressMode === 'gfx' ? 18 + Math.random() * 6 : 7 + Math.random() * 3,
        ioctl: stressMode === 'gfx' ? 12 + Math.random() * 5 : 2 + Math.random() * 2,
        swap: stressMode === 'gfx' ? 14 + Math.random() * 4 : 4 + Math.random() * 2,
        fiwt: stressMode === 'gfx' ? 5 : 0.5,
        finwt: stressMode === 'gfx' ? 4 : 1,
      });
    };

    updateTelemetry();
    const timer = setInterval(updateTelemetry, 240);
    return () => clearInterval(timer);
  }, [workstation.cpuCount, openWindowCount, stressMode]);

  const labelFont: React.CSSProperties = {
    fontFamily: "'Times New Roman', Georgia, serif",
    fontStyle: 'italic',
    fontWeight: 700,
    fontSize: '12px',
    marginBottom: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    lineHeight: 1.1,
  };

  return (
    <div
      style={{
        flex: 1,
        background: '#a8a8a8',
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflowY: 'auto',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {/* Per-CPU Usage Bars */}
        {cpus.map((c, idx) => (
          <div key={idx}>
            <div style={labelFont}>
              <span style={{ color: '#000' }}>CPU {idx} Usage:</span>
              <span style={{ color: '#0000ee' }}>user</span>
              <span style={{ color: '#dd0000' }}>sys</span>
              <span style={{ color: '#ffff00', textShadow: '0 0 1px #000' }}>intr</span>
              <span style={{ color: '#00ffff', textShadow: '0 0 1px #000' }}>gfxf</span>
              <span style={{ color: '#ee00ee' }}>gfxc</span>
              <span style={{ color: '#00dd00' }}>idle</span>
            </div>
            <div
              style={{
                height: '18px',
                background: '#999',
                border: '1px solid #000',
                display: 'flex',
                overflow: 'hidden',
              }}
            >
              <div style={{ width: `${c.user}%`, background: '#0000ee' }} />
              <div style={{ width: `${c.sys}%`, background: '#dd0000' }} />
              <div style={{ width: `${c.intr}%`, background: '#ffff00' }} />
              <div style={{ width: `${c.gfxf}%`, background: '#00ffff' }} />
              <div style={{ width: `${c.gfxc}%`, background: '#ee00ee' }} />
              <div style={{ flex: 1, background: '#00dd00' }} />
            </div>
          </div>
        ))}

        {/* Memory Bar + Right Digital Readouts */}
        <div>
          <div style={{ ...labelFont, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <span style={{ color: '#000' }}>Memory:</span>
              <span style={{ color: '#0000ee' }}>kernel</span>
              <span style={{ color: '#00ffff', textShadow: '0 0 1px #000' }}>fs ctl</span>
              <span style={{ color: '#dd0000' }}>fsdirty</span>
              <span style={{ color: '#ee00ee' }}>fsclean</span>
              <span style={{ color: '#00dd00' }}>free</span>
              <span style={{ color: '#0000ee' }}>user</span>
            </div>
            <span
              style={{
                background: '#000',
                color: '#fff',
                padding: '0 4px',
                fontSize: '10.5px',
              }}
            >
              {(workstation.ramMB * 1024).toLocaleString()}k
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'stretch', gap: '5px' }}>
            <div
              style={{
                flex: 1,
                height: '20px',
                background: '#999',
                border: '1px solid #000',
                display: 'flex',
                overflow: 'hidden',
              }}
            >
              <div style={{ width: `${mem.kernel}%`, background: '#0000ee' }} />
              <div style={{ width: `${mem.fsctl}%`, background: '#00ffff' }} />
              <div style={{ width: `${mem.fsdirty}%`, background: '#dd0000' }} />
              <div style={{ width: `${mem.fsclean}%`, background: '#ee00ee' }} />
              <div style={{ flex: 1, background: '#00dd00' }} />
              <div style={{ width: `${mem.user}%`, background: '#0000ee' }} />
            </div>
            <div
              style={{
                width: '48px',
                display: 'flex',
                flexDirection: 'column',
                fontSize: '10px',
                fontStyle: 'italic',
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              <div
                style={{
                  background: '#000',
                  color: '#ff3333',
                  textAlign: 'right',
                  padding: '1px 3px',
                }}
              >
                {Math.round(workstation.ramMB * 0.34)}M
              </div>
              <div
                style={{
                  background: '#fff',
                  color: '#0000aa',
                  textAlign: 'right',
                  padding: '1px 3px',
                }}
              >
                {Math.round(workstation.ramMB * (mem.free / 100))}M
              </div>
            </div>
          </div>
        </div>

        {/* CPU Wait Bar */}
        <div>
          <div style={labelFont}>
            <span style={{ color: '#000' }}>CPU Wait:</span>
            <span style={{ color: '#0000ee' }}>io</span>
            <span style={{ color: '#ffff00', textShadow: '0 0 1px #000' }}>swap</span>
            <span style={{ color: '#00ffff', textShadow: '0 0 1px #000' }}>pio</span>
          </div>
          <div
            style={{
              height: '18px',
              background: '#8e8e8e',
              border: '1px solid #000',
              display: 'flex',
              overflow: 'hidden',
            }}
          >
            <div style={{ width: `${waitBar.io}%`, background: '#0000ee' }} />
            <div style={{ width: `${waitBar.swap}%`, background: '#ffff00' }} />
            <div style={{ width: `${waitBar.pio}%`, background: '#00ffff' }} />
          </div>
        </div>

        {/* SysAct 0.2sec */}
        <div>
          <div style={{ ...labelFont, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <span style={{ color: '#000' }}>SysAct 0.2sec:</span>
              <span style={{ color: '#0000ee' }}>sycall</span>
              <span style={{ color: '#00ffff', textShadow: '0 0 1px #000' }}>switch</span>
              <span style={{ color: '#dd0000' }}>fork</span>
              <span style={{ color: '#ffff00', textShadow: '0 0 1px #000' }}>exec</span>
              <span style={{ color: '#ee00ee' }}>iget</span>
            </div>
            <span style={{ color: '#000' }}>1000</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div
              style={{
                flex: 1,
                height: '18px',
                background: '#8e8e8e',
                border: '1px solid #000',
                display: 'flex',
                overflow: 'hidden',
              }}
            >
              <div style={{ width: `${sysAct.sycall}%`, background: '#0000ee' }} />
              <div style={{ width: `${sysAct.switch}%`, background: '#00ffff' }} />
              <div style={{ width: `${sysAct.fork}%`, background: '#dd0000' }} />
              <div style={{ width: `${sysAct.exec}%`, background: '#ffff00' }} />
              <div style={{ width: `${sysAct.iget}%`, background: '#ee00ee' }} />
            </div>
            <div
              style={{
                width: '48px',
                background: '#000',
                color: '#ff3333',
                textAlign: 'right',
                fontSize: '10.5px',
                fontStyle: 'italic',
                fontWeight: 700,
                padding: '2px 3px',
              }}
            >
              {sysAct.totalK.toFixed(1)}k
            </div>
          </div>
        </div>

        {/* Gfx 0.2sec */}
        <div>
          <div style={{ ...labelFont, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <span style={{ color: '#000' }}>Gfx 0.2sec:</span>
              <span style={{ color: '#0000ee' }}>intr</span>
              <span style={{ color: '#00ffff', textShadow: '0 0 1px #000' }}>swch</span>
              <span style={{ color: '#dd0000' }}>ioctl</span>
              <span style={{ color: '#ffff00', textShadow: '0 0 1px #000' }}>swap</span>
              <span style={{ color: '#ee00ee' }}>fiwt</span>
              <span style={{ color: '#00dd00' }}>finwt</span>
            </div>
            <span style={{ color: '#000' }}>200</span>
          </div>
          <div
            style={{
              height: '18px',
              background: '#8e8e8e',
              border: '1px solid #000',
              display: 'flex',
              overflow: 'hidden',
            }}
          >
            <div style={{ width: `${gfxAct.intr}%`, background: '#0000ee' }} />
            <div style={{ width: `${gfxAct.swch}%`, background: '#00ffff' }} />
            <div style={{ width: `${gfxAct.ioctl}%`, background: '#dd0000' }} />
            <div style={{ width: `${gfxAct.swap}%`, background: '#ffff00' }} />
            <div style={{ width: `${gfxAct.fiwt}%`, background: '#ee00ee' }} />
            <div style={{ width: `${gfxAct.finwt}%`, background: '#00dd00' }} />
          </div>
        </div>
      </div>

      {/* Bottom Interactive Kernel Load Simulator Strip */}
      <div
        style={{
          marginTop: '6px',
          paddingTop: '4px',
          borderTop: '1px solid #777',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '4px',
          fontSize: '10.5px',
        }}
      >
        <span style={{ fontStyle: 'italic', fontWeight: 700, color: '#111' }}>
          {workstation.ipArch} ({workstation.cpuCount}x {workstation.cpuMHz}MHz):
        </span>
        <div style={{ display: 'flex', gap: '3px' }}>
          {(
            [
              { id: 'normal', label: 'Idle' },
              { id: 'cpu', label: 'MIPS Compile' },
              { id: 'gfx', label: 'GL Geometry' },
              { id: 'xfs', label: 'XFS I/O' },
            ] as const
          ).map((b) => (
            <button
              key={b.id}
              type="button"
              className="sgi-btn"
              onClick={() => setStressMode(b.id)}
              style={{
                padding: '1px 5px',
                fontSize: '10px',
                background: stressMode === b.id ? '#b8a87e' : undefined,
                fontWeight: stressMode === b.id ? 700 : 500,
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
