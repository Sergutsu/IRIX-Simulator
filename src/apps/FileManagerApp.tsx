import React, { useState } from 'react';
import { AppId, SgiColorScheme, VfsNode } from '../state/osStore';
import { IrixVectorIcon } from '../icons/irixIconSet';
import { SgiThumbwheel } from '../components/SgiThumbwheel';
import { irixAudio } from '../sound/irixAudio';
import { parseFtiScript } from '../icons/ftiEngine';

interface FileManagerAppProps {
  vfs: VfsNode[];
  colorScheme: SgiColorScheme;
  initialPath?: string;
  onLaunchApp: (appId: AppId, payload?: Record<string, unknown>) => void;
  onMoveToDumpster: (path: string) => void;
  onCreateFile: (dir: string, name: string, content: string) => void;
  onUpdateTitle?: (title: string) => void;
}

export const FileManagerApp: React.FC<FileManagerAppProps> = ({
  vfs,
  colorScheme,
  initialPath = '/usr/people/guest',
  onLaunchApp,
  onMoveToDumpster,
  onCreateFile,
  onUpdateTitle,
}) => {
  const [currentDir, setCurrentDir] = useState<string>(initialPath);
  const [iconScale, setIconScale] = useState<number>(56);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [showContentViewer, setShowContentViewer] = useState<boolean>(true);

  const items = vfs.filter((n) => {
    if (currentDir === '/') {
      return n.path.split('/').filter(Boolean).length === 1;
    }
    if (!n.path.startsWith(currentDir + '/')) return false;
    const rest = n.path.slice(currentDir.length + 1);
    return !rest.includes('/');
  });

  const selectedNode =
    items.find((i) => i.path === selectedPath) || items[0] || null;

  const navigateTo = (dir: string) => {
    irixAudio.playMenuClick();
    setCurrentDir(dir);
    setSelectedPath(null);
    onUpdateTitle?.(dir);
  };

  const handleOpenNode = (node: VfsNode) => {
    if (node.type === 'dir') {
      navigateTo(node.path);
      return;
    }
    irixAudio.playAppLaunch();
    if (node.name.endsWith('.fti')) {
      onLaunchApp('iconsmith', { iconId: node.iconId });
    } else if (node.appId) {
      onLaunchApp(node.appId, { ...(node.payload ?? {}), path: node.path });
    } else {
      onLaunchApp('jot', { path: node.path });
    }
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
      {/* SGI Motif Menu Bar */}
      <div className="sgi-menubar">
        <span
          className="sgi-menubar-item"
          onClick={() => selectedNode && handleOpenNode(selectedNode)}
        >
          <u>S</u>elected
        </span>
        <span className="sgi-menubar-item">
          <u>A</u>rrange
        </span>
        <span
          className="sgi-menubar-item"
          onClick={() => setShowContentViewer((v) => !v)}
        >
          <u>V</u>iew ({showContentViewer ? 'Hide' : 'Show'} Content Viewer)
        </span>
        <span
          className="sgi-menubar-item"
          onClick={() => {
            const fname = `note_${Math.floor(Math.random() * 90 + 10)}.txt`;
            onCreateFile(
              currentDir,
              fname,
              `# Created in SGI File Manager (${currentDir}/${fname})\nIRIX 6.5 XFS File Alteration Monitor (fam) notified.\n`
            );
          }}
        >
          +<u>N</u>ew File
        </span>
        <span
          className="sgi-menubar-item"
          style={{ marginLeft: 'auto' }}
          onClick={() => onLaunchApp('fsn')}
        >
          <u>3</u>D View (fsn)
        </span>
      </div>

      {/* Iconic SGI Folder Shelf + Mauve Path Input Bar (matching i-3.webp!) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 8px',
          background: colorScheme.windowSurface,
          borderBottom: '1px solid #666',
        }}
      >
        <button
          type="button"
          className="sgi-btn"
          title="Up to Parent Directory"
          onClick={() => {
            if (currentDir === '/') return;
            const parent = currentDir.split('/').slice(0, -1).join('/') || '/';
            navigateTo(parent);
          }}
          style={{ padding: '2px 5px', display: 'flex', alignItems: 'center', gap: '3px' }}
        >
          <IrixVectorIcon iconId="folder" size={22} useMagicCarpet={false} />
          <span style={{ fontSize: '10px', fontWeight: 700 }}>↑</span>
        </button>

        <input
          type="text"
          value={currentDir}
          onChange={(e) => setCurrentDir(e.target.value)}
          style={{
            flex: 1,
            background: colorScheme.mauveInput,
            border: '2px inset #777',
            padding: '3px 7px',
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: '12px',
            color: '#000',
          }}
        />

        {/* Quick Directory Bookmarks */}
        {[
          { label: 'guest', path: '/usr/people/guest' },
          { label: 'iconlib (.fti)', path: '/usr/lib/filetype/iconlib' },
          { label: 'demos', path: '/usr/demos' },
          { label: 'sbin', path: '/usr/sbin' },
          { label: 'dumpster', path: '/dumpster' },
        ].map((bm) => (
          <button
            key={bm.path}
            type="button"
            className="sgi-btn"
            onClick={() => navigateTo(bm.path)}
            style={{
              padding: '2px 6px',
              fontSize: '10.5px',
              background: currentDir === bm.path ? '#b8a87e' : undefined,
              fontWeight: currentDir === bm.path ? 700 : 500,
            }}
          >
            {bm.label}
          </button>
        ))}
      </div>

      {/* Main Directory View + Left Thumbwheel Column */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, padding: '4px', gap: '4px' }}>
        {/* Left Thumbwheel Strip */}
        <div
          style={{
            width: '26px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <SgiThumbwheel
            value={iconScale}
            min={34}
            max={108}
            defaultValue={56}
            onChange={setIconScale}
          />
          <span style={{ fontSize: '9px', fontWeight: 700 }}>{iconScale}p</span>
        </div>

        {/* Right Split Pane: Upper Icon Canvas + Lower Content Viewer Pane */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            minWidth: 0,
          }}
        >
          {/* Upper Directory Icon Canvas */}
          <div
            style={{
              flex: 1,
              background: colorScheme.canvasSlate,
              borderTop: '2px solid #2c3e50',
              borderLeft: '2px solid #2c3e50',
              borderRight: '2px solid #efefef',
              borderBottom: '2px solid #efefef',
              padding: '12px',
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(86, iconScale + 30)}px, 1fr))`,
              alignContent: 'start',
              gap: '12px 8px',
            }}
          >
            {items.map((node) => {
              const isSelected = selectedNode?.path === node.path;
              const customPaths =
                node.name.endsWith('.fti') && node.content
                  ? parseFtiScript(node.content)
                  : undefined;

              return (
                <div
                  key={node.path}
                  onClick={() => {
                    irixAudio.playIconSelect();
                    setSelectedPath(node.path);
                  }}
                  onDoubleClick={() => handleOpenNode(node)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <IrixVectorIcon
                    iconId={node.iconId}
                    customPaths={customPaths}
                    useMagicCarpet={node.type === 'exec'}
                    state={isSelected ? 'selected' : 'normal'}
                    size={iconScale}
                  />
                  {node.imageUrl && (
                    /* image files get a real thumbnail, exactly as the IRIX Content Viewer did */
                    <img
                      src={node.imageUrl}
                      alt={node.name}
                      title={node.name}
                      style={{
                        marginTop: '-4px',
                        maxWidth: `${iconScale + 26}px`,
                        maxHeight: `${Math.round(iconScale * 0.78)}px`,
                        border: '1px solid #223',
                        background: '#000',
                      }}
                    />
                  )}
                  <span
                    style={{
                      marginTop: '4px',
                      fontSize: '11px',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#ffe84a' : '#000',
                      background: isSelected ? 'rgba(0,0,0,0.38)' : 'transparent',
                      padding: '1px 4px',
                      textAlign: 'center',
                      wordBreak: 'break-all',
                    }}
                  >
                    {node.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Lower Content Viewer Pane (matching Directory Viewer screenshot!) */}
          {showContentViewer && selectedNode && (
            <div
              style={{
                height: '124px',
                background: '#486c8f',
                borderTop: '2px solid #222',
                borderLeft: '2px solid #222',
                borderRight: '2px solid #eee',
                borderBottom: '2px solid #eee',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                color: '#fff',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '88px',
                }}
              >
                <IrixVectorIcon
                  iconId={selectedNode.iconId}
                  customPaths={
                    selectedNode.name.endsWith('.fti') && selectedNode.content
                      ? parseFtiScript(selectedNode.content)
                      : undefined
                  }
                  useMagicCarpet={selectedNode.type === 'exec'}
                  state="normal"
                  size={64}
                />
                <span style={{ fontSize: '10.5px', fontWeight: 700, marginTop: '2px' }}>
                  {selectedNode.name}
                </span>
              </div>

              <div
                style={{
                  flex: 1,
                  height: '100%',
                  background: 'rgba(12, 24, 38, 0.72)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  padding: '6px 8px',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '10.5px',
                  color: '#d8f0ff',
                }}
              >
                <div style={{ color: '#ffe84a', fontWeight: 700, marginBottom: '3px' }}>
                  Content Viewer: {selectedNode.path} ({selectedNode.permissions},{' '}
                  {selectedNode.size}B, tag {selectedNode.tagHex})
                </div>
                {selectedNode.imageUrl ? (
                  /* 4Dwm Content Viewer previews images inline — IRIX did this in 1993,
                     years before any other desktop bothered. */
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <img
                      src={selectedNode.imageUrl}
                      alt={selectedNode.name}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '78px',
                        border: '1px solid rgba(255,255,255,0.4)',
                        background: '#000',
                      }}
                    />
                  </div>
                ) : (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {selectedNode.content ||
                      `SGI IRIX 6.5 ELF N32 MSB Executable (${selectedNode.path})\nDouble-click to launch via 4Dwm File Typing Rules (.ftr).`}
                  </pre>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  type="button"
                  className="sgi-btn"
                  onClick={() => handleOpenNode(selectedNode)}
                  style={{ padding: '3px 8px', fontSize: '10.5px', fontWeight: 700 }}
                >
                  Open
                </button>
                <button
                  type="button"
                  className="sgi-btn"
                  onClick={() =>
                    onLaunchApp('iconsmith', { iconId: selectedNode.iconId })
                  }
                  style={{ padding: '3px 8px', fontSize: '10.5px' }}
                >
                  IconSmith
                </button>
                {selectedNode.path !== '/dumpster' && (
                  <button
                    type="button"
                    className="sgi-btn"
                    onClick={() => {
                      irixAudio.playDumpsterCrunch();
                      onMoveToDumpster(selectedNode.path);
                    }}
                    style={{ padding: '3px 8px', fontSize: '10.5px' }}
                  >
                    → Dumpster
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
