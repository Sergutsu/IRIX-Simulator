import React, { useState } from 'react';
import { AppId, SgiColorScheme } from '../state/osStore';
import { IRIX_ICON_LIBRARY, IrixIconDefinition, IrixVectorIcon } from '../icons/irixIconSet';
import { SgiThumbwheel } from '../components/SgiThumbwheel';
import { irixAudio } from '../sound/irixAudio';

interface IconCatalogAppProps {
  colorScheme: SgiColorScheme;
  onLaunchApp: (appId: AppId, payload?: Record<string, unknown>) => void;
  onUpdateTitle?: (title: string) => void;
}

type CatalogTab =
  | 'Applications'
  | 'Demos'
  | 'ControlPanels'
  | 'SystemTools'
  | 'WebTools'
  | 'All .FTI';

const ICON_TO_APP: Record<string, { appId: AppId; payload?: Record<string, unknown> }> = {
  winterm: { appId: 'winterm' },
  gr_osview: { appId: 'gr_osview' },
  fsn: { appId: 'fsn' },
  iconsmith: { appId: 'iconsmith' },
  netscape: { appId: 'netscape', payload: { page: 'siliconsurf' } },
  webmagic: { appId: 'netscape', payload: { page: 'irix65' } },
  siliconsurf: { appId: 'netscape', payload: { page: 'siliconsurf' } },
  showcase: { appId: 'gl_showcase', payload: { mode: 'cube' } },
  buttonfly: { appId: 'gl_showcase', payload: { mode: 'buttonfly' } },
  jot: { appId: 'jot' },
  sysmgr: { appId: 'system_manager', payload: { tab: 'hardware' } },
  swmgr: { appId: 'software_manager' },
  insight: { appId: 'insight', payload: { chapter: 'specs' } },
  apanel: { appId: 'system_manager', payload: { tab: 'audio' } },
  color_schemes: { appId: 'system_manager', payload: { tab: 'customize' } },
  xkill: { appId: 'system_manager', payload: { tab: 'processes' } },
  folder: { appId: 'file_manager', payload: { path: '/usr/people/guest' } },
  dumpster: { appId: 'file_manager', payload: { path: '/dumpster' } },
  camera: { appId: 'gl_showcase', payload: { mode: 'indycam' } },
  o2cam_mic: { appId: 'gl_showcase', payload: { mode: 'indycam' } },
  microphone: { appId: 'system_manager', payload: { tab: 'audio' } },
  cdrom: { appId: 'software_manager' },
  document: { appId: 'jot' },
  toolchest_icon: { appId: 'iconsmith', payload: { iconId: 'toolchest_icon' } },
};

export const IconCatalogApp: React.FC<IconCatalogAppProps> = ({
  colorScheme,
  onLaunchApp,
  onUpdateTitle,
}) => {
  const [activeTab, setActiveTab] = useState<CatalogTab>('Applications');
  const [iconScale, setIconScale] = useState<number>(62);
  const [selectedId, setSelectedId] = useState<string>('iconsmith');
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  const tabs: CatalogTab[] = [
    'Applications',
    'Demos',
    'ControlPanels',
    'SystemTools',
    'WebTools',
    'All .FTI',
  ];

  const allIcons = Object.values(IRIX_ICON_LIBRARY);
  const filteredIcons: IrixIconDefinition[] =
    activeTab === 'All .FTI'
      ? allIcons
      : activeTab === 'Applications'
      ? allIcons.filter(
          (ic) =>
            ic.category === 'Applications' ||
            ['iconsmith', 'jot', 'insight', 'showcase', 'netscape', 'winterm'].includes(ic.id)
        )
      : allIcons.filter((ic) => ic.category === activeTab);

  const selectedIconDef = IRIX_ICON_LIBRARY[selectedId] || filteredIcons[0];

  const handleLaunchIcon = (iconDef: IrixIconDefinition) => {
    irixAudio.playAppLaunch();
    setLaunchingId(iconDef.id);
    setTimeout(() => {
      setLaunchingId(null);
      const target = ICON_TO_APP[iconDef.id];
      if (target) {
        onLaunchApp(target.appId, target.payload);
      } else {
        onLaunchApp('iconsmith', { iconId: iconDef.id });
      }
    }, 180);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: colorScheme.windowSurface,
        userSelect: 'none',
      }}
    >
      {/* SGI Motif Menu Bar */}
      <div className="sgi-menubar">
        <span
          className="sgi-menubar-item"
          onClick={() => {
            const nextIdx = (tabs.indexOf(activeTab) + 1) % tabs.length;
            setActiveTab(tabs[nextIdx]);
          }}
        >
          <u>P</u>age
        </span>
        <span
          className="sgi-menubar-item"
          onClick={() => selectedIconDef && handleLaunchIcon(selectedIconDef)}
        >
          <u>S</u>elected
        </span>
        <span className="sgi-menubar-item">
          <u>A</u>rrange
        </span>
        <span
          className="sgi-menubar-item"
          onClick={() =>
            onLaunchApp('iconsmith', { iconId: selectedIconDef?.id || 'showcase' })
          }
        >
          <u>V</u>iew .FTI Source
        </span>
        <span
          className="sgi-menubar-item"
          style={{ marginLeft: 'auto' }}
          onClick={() => onLaunchApp('insight', { chapter: 'icons' })}
        >
          <u>H</u>elp
        </span>
      </div>

      {/* Main Content Row: Left Thumbwheel Strip + Center Slate Vector Canvas */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, padding: '4px 4px 0 4px', gap: '4px' }}>
        {/* Left Motif Control Column (View buttons + Thumbwheel Scaler) */}
        <div
          style={{
            width: '26px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            paddingTop: '2px',
          }}
        >
          {/* Miniature view mode buttons matching i-5.webp */}
          <button
            type="button"
            className="sgi-btn"
            title="Isometric Vector Icon View"
            onClick={() => setIconScale(62)}
            style={{ width: '22px', height: '20px', padding: 0, fontSize: '10px' }}
          >
            ❖
          </button>
          <button
            type="button"
            className="sgi-btn"
            title="Large Vector Preview (96px)"
            onClick={() => setIconScale(96)}
            style={{ width: '22px', height: '20px', padding: 0, fontSize: '10px' }}
          >
            ▣
          </button>
          <button
            type="button"
            className="sgi-btn"
            title="Edit Selected Icon in IconSmith"
            onClick={() =>
              onLaunchApp('iconsmith', { iconId: selectedIconDef?.id || 'showcase' })
            }
            style={{ width: '22px', height: '20px', padding: 0, fontSize: '10px' }}
          >
            ✎
          </button>

          <div style={{ marginTop: '4px' }}>
            <SgiThumbwheel
              value={iconScale}
              min={36}
              max={116}
              defaultValue={62}
              onChange={setIconScale}
            />
          </div>

          <div
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: '#222',
              marginTop: '2px',
            }}
          >
            {iconScale}p
          </div>
        </div>

        {/* Center Recessed Slate-Blue Vector Icon Canvas */}
        <div
          style={{
            flex: 1,
            background: colorScheme.canvasSlate,
            borderTop: '2px solid #2c3e50',
            borderLeft: '2px solid #2c3e50',
            borderRight: '2px solid #efefef',
            borderBottom: '2px solid #efefef',
            padding: '14px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(88, iconScale + 32)}px, 1fr))`,
            alignContent: 'start',
            gap: '14px 10px',
          }}
        >
          {filteredIcons.map((iconDef) => {
            const isSelected = selectedId === iconDef.id;
            const isOpening = launchingId === iconDef.id;
            const state = isOpening ? 'opened' : isSelected ? 'selected' : 'normal';

            return (
              <div
                key={iconDef.id}
                onClick={() => {
                  irixAudio.playIconSelect();
                  setSelectedId(iconDef.id);
                }}
                onDoubleClick={() => handleLaunchIcon(iconDef)}
                title={`${iconDef.legend}\nFile: /usr/lib/filetype/iconlib/${iconDef.filename}\nDouble-click to launch`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <IrixVectorIcon
                  iconId={iconDef.id}
                  state={state}
                  size={iconScale}
                />
                <span
                  style={{
                    marginTop: '4px',
                    fontSize: '11.5px',
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#ffe84a' : '#000000',
                    background: isSelected ? 'rgba(0,0,0,0.35)' : 'transparent',
                    padding: '1px 5px',
                    borderRadius: '1px',
                    textShadow: isSelected
                      ? '0 1px 1px #000'
                      : '0 1px 0 rgba(255,255,255,0.25)',
                    textAlign: 'center',
                  }}
                >
                  {iconDef.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Icon Legend & Quick Action Strip */}
      {selectedIconDef && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '3px 8px',
            fontSize: '11px',
            color: '#111',
            background: colorScheme.windowWell,
            borderTop: '1px solid #888',
            margin: '3px 4px 0 4px',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <b>{selectedIconDef.filename}</b> ({selectedIconDef.tagHex}) — {selectedIconDef.legend}
          </span>
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <button
              type="button"
              className="sgi-btn"
              style={{ padding: '1px 7px', fontSize: '10.5px' }}
              onClick={() => handleLaunchIcon(selectedIconDef)}
            >
              Launch
            </button>
            <button
              type="button"
              className="sgi-btn"
              style={{ padding: '1px 7px', fontSize: '10.5px' }}
              onClick={() =>
                onLaunchApp('iconsmith', { iconId: selectedIconDef.id })
              }
            >
              Edit .FTI in IconSmith
            </button>
          </div>
        </div>
      )}

      {/* Authentic Angled Folder Binder Tabs at Bottom (matching i-5.webp!) */}
      <div
        style={{
          height: '28px',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '0 8px 3px 8px',
          gap: '2px',
          background: colorScheme.windowSurface,
        }}
      >
        {tabs.map((tab, idx) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                irixAudio.playMenuClick();
                setActiveTab(tab);
                onUpdateTitle?.(
                  `Icon Catalog: ${tab} (Page ${idx + 1} of ${tabs.length})`
                );
              }}
              style={{
                flex: 1,
                height: active ? '23px' : '20px',
                background: active ? '#d8d8d8' : '#969696',
                border: '1px solid #111',
                borderTop: active ? 'none' : '1px solid #333',
                boxShadow: active
                  ? 'inset 1px -1px 0 #fff, 0 1px 2px rgba(0,0,0,0.3)'
                  : 'inset 1px 1px 0 rgba(255,255,255,0.35)',
                clipPath:
                  'polygon(0% 0%, 100% 0%, calc(100% - 7px) 100%, 7px 100%)',
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: 700,
                fontSize: '11px',
                color: '#000',
                cursor: 'pointer',
                padding: '0 6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
};
