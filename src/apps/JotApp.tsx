import React, { useState, useEffect } from 'react';
import { SgiColorScheme, VfsNode } from '../state/osStore';
import { irixAudio } from '../sound/irixAudio';

interface JotAppProps {
  vfs: VfsNode[];
  colorScheme: SgiColorScheme;
  initialPath?: string;
  onSaveFile: (path: string, content: string) => void;
  onUpdateTitle?: (title: string) => void;
}

export const JotApp: React.FC<JotAppProps> = ({
  vfs,
  colorScheme,
  initialPath = '/usr/people/guest/readme.sgi',
  onSaveFile,
  onUpdateTitle,
}) => {
  const editableFiles = vfs.filter((n) => n.type === 'file');
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [text, setText] = useState<string>('');
  const [status, setStatus] = useState<string>('Ready');

  useEffect(() => {
    const found =
      vfs.find((n) => n.path === currentPath) || editableFiles[0];
    if (found) {
      setCurrentPath(found.path);
      setText(found.content || '');
      onUpdateTitle?.(`jot — ${found.path}`);
    }
  }, [initialPath]);

  const handleSelectFile = (path: string) => {
    irixAudio.playMenuClick();
    const found = vfs.find((n) => n.path === path);
    if (found) {
      setCurrentPath(found.path);
      setText(found.content || '');
      onUpdateTitle?.(`jot — ${found.path}`);
      setStatus(`Loaded ${found.path} (${found.size} bytes)`);
    }
  };

  const handleSave = () => {
    irixAudio.playMenuClick();
    onSaveFile(currentPath, text);
    setStatus(`Saved ${currentPath} (${text.length} bytes) to XFS filesystem.`);
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: colorScheme.windowSurface,
        overflow: 'hidden',
      }}
    >
      {/* SGI Motif Menu Bar */}
      <div className="sgi-menubar">
        <span className="sgi-menubar-item" onClick={handleSave}>
          <u>F</u>ile (Save)
        </span>
        <span className="sgi-menubar-item">
          <u>E</u>dit
        </span>
        <span className="sgi-menubar-item">
          <u>S</u>earch
        </span>
        <span className="sgi-menubar-item" style={{ marginLeft: 'auto' }}>
          <u>H</u>elp
        </span>
      </div>

      {/* File Selector & Mauve Path Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          background: colorScheme.windowWell,
          borderBottom: '1px solid #555',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, fontStyle: 'italic' }}>File:</span>
        <select
          value={currentPath}
          onChange={(e) => handleSelectFile(e.target.value)}
          style={{
            flex: 1,
            background: colorScheme.mauveInput,
            border: '2px inset #666',
            padding: '2px 6px',
            fontFamily: 'monospace',
            fontSize: '11.5px',
            fontWeight: 700,
          }}
        >
          {editableFiles.map((f) => (
            <option key={f.path} value={f.path}>
              {f.path}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="sgi-btn"
          onClick={handleSave}
          style={{ padding: '2px 10px', fontSize: '11px', fontWeight: 700 }}
        >
          Save
        </button>
      </div>

      {/* Text Editor Area */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        style={{
          flex: 1,
          background: '#ebe7de',
          color: '#111111',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '12.5px',
          lineHeight: 1.4,
          padding: '10px',
          border: '2px inset #666',
          margin: '4px',
          resize: 'none',
          outline: 'none',
        }}
      />

      {/* Status Bar */}
      <div
        style={{
          height: '20px',
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10.5px',
          background: colorScheme.windowWell,
          borderTop: '1px solid #777',
        }}
      >
        <span>{status}</span>
        <span>Lines: {text.split('\n').length} | Chars: {text.length}</span>
      </div>
    </div>
  );
};
