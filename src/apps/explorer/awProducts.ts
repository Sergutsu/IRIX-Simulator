/**
 * Alias|Wavefront products The Director launches.
 * Each one is its own 4Dwm window. The Director does not host their UI.
 */
import type { AppLaunchPayload, AppId, AwModuleId } from '../../state/osStore';

export type { AwModuleId };

export interface AwProduct {
  id: string;
  label: string;
  blurb: string;
  appId: AppId;
  payload?: AppLaunchPayload;
}

export const AW_PRODUCTS: AwProduct[] = [
  {
    id: 'model',
    label: 'Model',
    blurb: 'Advanced Visualizer Model 4.2.1 — create, pick, move, deform',
    appId: 'explorer',
  },
  {
    id: 'paint',
    label: 'Paint',
    blurb: '2D image paint for texture plates',
    appId: 'aw_module',
    payload: { module: 'paint', title: 'Paint — Alias|Wavefront' },
  },
  {
    id: 'property',
    label: 'Property',
    blurb: 'Materials and colour on the open model',
    appId: 'aw_module',
    payload: { module: 'property', title: 'Property — Alias|Wavefront' },
  },
  {
    id: 'dynamation',
    label: 'Dynamation',
    blurb: 'Particle fountain',
    appId: 'aw_module',
    payload: { module: 'dynamation', title: 'Dynamation — Alias|Wavefront' },
  },
  {
    id: 'kinemation',
    label: 'Kinemation',
    blurb: 'Rotation keys on the open model',
    appId: 'aw_module',
    payload: { module: 'kinemation', title: 'Kinemation — Alias|Wavefront' },
  },
  {
    id: 'preview',
    label: 'Preview',
    blurb: 'Shade and write a frame of the open model',
    appId: 'aw_module',
    payload: { module: 'preview', title: 'Preview — Alias|Wavefront' },
  },
  {
    id: 'composer',
    label: 'Composer',
    blurb: 'Grade the last Preview frame over a background',
    appId: 'aw_module',
    payload: { module: 'composer', title: 'Composer — Alias|Wavefront' },
  },
  {
    id: 'fcheck',
    label: 'fcheck',
    blurb: 'Flip through rendered frames',
    appId: 'fcheck',
  },
];

export function isAwModuleId(value: string): value is AwModuleId {
  return AW_PRODUCTS.some((p) => {
    const payload = p.payload;
    return !!payload && typeof payload === 'object' && 'module' in payload && payload.module === value;
  });
}
