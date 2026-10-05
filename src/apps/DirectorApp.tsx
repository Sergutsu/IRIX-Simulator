/**
 * The Director — Alias|Wavefront's launcher.
 *
 * It starts the product suite (Model, Paint, Property, Dynamation, Kinemation,
 * Preview, Composer, fcheck). Each product is its own 4Dwm window. This window
 * does not contain the modeler.
 */
import React, { useState } from 'react';
import type { AppId } from '../state/osStore';
import { AW_PRODUCTS } from './explorer/awProducts';

interface DirectorAppProps {
  onLaunchApp: (appId: AppId, payload?: Record<string, unknown>) => void;
}

const MENUS = ['File', 'Applications', 'Utilities', 'Project Setup', 'Preferences', 'User Defined', 'Help'] as const;

export const DirectorApp: React.FC<DirectorAppProps> = ({ onLaunchApp }) => {
  const [menu, setMenu] = useState<string | null>(null);
  const [project, setProject] = useState('winged_kit');
  const [note, setNote] = useState('Select an application. Each one opens in its own window.');

  const launch = (id: string) => {
    const product = AW_PRODUCTS.find((p) => p.id === id);
    if (!product) return;
    onLaunchApp(product.appId, product.payload);
    setNote(`Launched ${product.label}.`);
    setMenu(null);
  };

  const menuItems = (name: string): { label: string; action: () => void }[] => {
    if (name === 'File') {
      return [
        { label: 'New Project', action: () => { setProject('untitled'); setNote('New project untitled.'); } },
        { label: 'Open Project…', action: () => { setProject('winged_kit'); setNote('Opened /usr/people/guest/wave/winged_kit'); } },
        { label: 'Save Project', action: () => setNote(`Saved project ${project}.`) },
        { label: 'Exit', action: () => setNote('Close this window from 4Dwm. Open models stay up.') },
      ];
    }
    if (name === 'Applications') {
      return AW_PRODUCTS.map((p) => ({ label: p.label, action: () => launch(p.id) }));
    }
    if (name === 'Utilities') {
      return [
        { label: 'fcheck', action: () => launch('fcheck') },
        { label: 'Open /usr/local/wave', action: () => onLaunchApp('file_manager', { path: '/usr/local/wave' }) },
      ];
    }
    if (name === 'Project Setup') {
      return [
        { label: `Directory  /usr/people/guest/wave/${project}`, action: () => setNote(`Project directory /usr/people/guest/wave/${project}`) },
        { label: 'Units: centimeters', action: () => setNote('Units set to centimeters.') },
      ];
    }
    if (name === 'Preferences') {
      return [
        { label: 'Save models as .mod / .obj', action: () => setNote('Model writes OBJ to /usr/local/wave/data/explorer_scene.obj') },
      ];
    }
    if (name === 'Help') {
      return [
        {
          label: 'About The Director',
          action: () =>
            setNote('The Director launches Alias|Wavefront applications. Model is Advanced Visualizer Model 4.2.1.'),
        },
      ];
    }
    return [{ label: 'No user commands', action: () => setNote('User Defined: no plugins loaded.') }];
  };

  return (
    <div
      onClick={() => menu && setMenu(null)}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#c8c8c8',
        color: '#111',
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: '12px',
        minHeight: 0,
      }}
    >
      <div style={{ display: 'flex', gap: '2px', padding: '2px 4px', background: '#d4d4d4', borderBottom: '1px solid #888', flexShrink: 0 }}>
        {MENUS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenu(menu === name ? null : name);
            }}
            style={{
              border: '1px solid transparent',
              background: menu === name ? '#fff' : 'transparent',
              fontFamily: 'inherit',
              fontSize: '12px',
              padding: '1px 8px',
              cursor: 'pointer',
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {menu && (
          <div
            style={{
              position: 'absolute',
              zIndex: 5,
              left: Math.max(0, MENUS.indexOf(menu as (typeof MENUS)[number])) * 92,
              top: 0,
              minWidth: '220px',
              background: '#d8d8d8',
              border: '1px solid #111',
              boxShadow: '2px 2px 0 #555',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {menuItems(menu).map((item) => (
              <div
                key={item.label}
                onClick={item.action}
                style={{ padding: '3px 12px', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#b7dde2')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {item.label}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '8px 12px 2px', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, letterSpacing: '0.04em' }}>The Director</div>
        <div style={{ letterSpacing: '0.14em', fontSize: '11px' }}>ALIAS|WAVEFRONT</div>
        <div>
          Project{' '}
          <input
            value={project}
            onChange={(e) => setProject(e.target.value.replace(/[^\w.-]/g, '') || 'untitled')}
            style={{
              background: '#c8979b',
              border: '1px solid #111',
              fontFamily: 'monospace',
              fontSize: '12px',
              width: '140px',
            }}
          />
          <span style={{ marginLeft: '8px', color: '#333' }}>/usr/people/guest/wave/{project}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '6px 10px 8px' }}>
        {AW_PRODUCTS.map((product) => (
          <div
            key={product.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 4px',
              borderBottom: '1px solid #b0b0b0',
            }}
          >
            <button
              type="button"
              onClick={() => launch(product.id)}
              style={{
                width: '110px',
                textAlign: 'left',
                background: '#dcdcdc',
                borderTop: '1px solid #fff',
                borderLeft: '1px solid #fff',
                borderRight: '1px solid #555',
                borderBottom: '1px solid #555',
                fontFamily: 'inherit',
                fontSize: '12px',
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              {product.label}
            </button>
            <span>{product.blurb}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '3px 10px',
          borderTop: '1px solid #888',
          background: '#d0d0d0',
          fontSize: '11px',
          flexShrink: 0,
        }}
      >
        {note}
      </div>
    </div>
  );
};
