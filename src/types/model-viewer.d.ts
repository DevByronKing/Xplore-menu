import type React from 'react';

export interface ModelViewerElement extends HTMLElement {
  src?: string;
  iosSrc?: string;
  alt?: string;
  poster?: string;
  ar?: boolean;
  arModes?: string;
  arScale?: 'auto' | 'fixed';
  arPlacement?: 'floor' | 'wall';
  cameraControls?: boolean;
  autoRotate?: boolean;
  touchAction?: string;
  shadowIntensity?: string | number;
  shadowSoftness?: string | number;
  exposure?: string | number;
  environmentImage?: string;
  cameraOrbit?: string;
  fieldOfView?: string;
  canActivateAR?: boolean;
  activateAR: () => Promise<void>;
}

export interface ModelViewerJSXProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<ModelViewerElement>,
    ModelViewerElement
  > {
  src?: string;
  'ios-src'?: string;
  alt?: string;
  poster?: string;
  ar?: boolean | '';
  'ar-modes'?: string;
  'ar-scale'?: 'auto' | 'fixed';
  'ar-placement'?: 'floor' | 'wall';
  'camera-controls'?: boolean | '';
  'auto-rotate'?: boolean | '';
  'auto-rotate-delay'?: string | number;
  'rotation-per-second'?: string;
  'touch-action'?: string;
  'shadow-intensity'?: string | number;
  'shadow-softness'?: string | number;
  exposure?: string | number;
  'environment-image'?: string;
  'camera-orbit'?: string;
  'min-camera-orbit'?: string;
  'max-camera-orbit'?: string;
  'field-of-view'?: string;
  'interaction-prompt'?: 'auto' | 'none';
  loading?: 'auto' | 'lazy' | 'eager';
  reveal?: 'auto' | 'manual';
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerJSXProps;
    }
  }
}
