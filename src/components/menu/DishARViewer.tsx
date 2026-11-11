'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Camera,
  Eye,
  Layers,
  Loader2,
  Move3d,
  RotateCw,
  Ruler,
} from 'lucide-react';
import type { ModelViewerElement } from '@/types/model-viewer';
import type { ProductPhysicalDimensionsCm } from '@/types/database';
import { cn } from '@/lib/utils';

const MODEL_VIEWER_CDN_URL =
  'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';

export type TableSurfacePreset = 'wood' | 'marble' | 'studio';
export type CameraAnglePreset = 'client45' | 'top90' | 'side1to1';

export interface DishARViewerProps {
  modelGlbUrl: string;
  modelUsdzUrl?: string | null;
  posterUrl?: string;
  itemName: string;
  arScaleFixed?: boolean;
  dimensionsCm?: ProductPhysicalDimensionsCm | null;
  onRotate3D?: () => void;
  onActivateAR?: () => void;
  onDesktopFallbackNeeded?: () => void;
  showBuiltInButton?: boolean;
  fillContainer?: boolean;
  className?: string;
}

const SURFACE_STYLES: Record<
  TableSurfacePreset,
  { label: string; bgClass: string; floorClass: string }
> = {
  wood: {
    label: 'Mesa Madeira',
    bgClass:
      'bg-[radial-gradient(circle_at_50%_38%,#3b2618_0%,#1c120c_65%,#0d0907_100%)]',
    floorClass:
      'bg-[radial-gradient(ellipse_at_center,rgba(180,115,62,0.34)_0%,rgba(68,40,20,0.15)_55%,transparent_80%)] border-amber-500/25',
  },
  marble: {
    label: 'Mármore Claro',
    bgClass:
      'bg-[radial-gradient(circle_at_50%_38%,#52525b_0%,#27272a_68%,#18181b_100%)]',
    floorClass:
      'bg-[radial-gradient(ellipse_at_center,rgba(244,244,245,0.28)_0%,rgba(161,161,170,0.12)_55%,transparent_80%)] border-white/25',
  },
  studio: {
    label: 'Estúdio 3D',
    bgClass:
      'bg-[radial-gradient(circle_at_50%_35%,#1e293b_0%,#0f172a_65%,#090d16_100%)]',
    floorClass:
      'bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.28)_0%,rgba(30,58,138,0.12)_55%,transparent_80%)] border-blue-400/25',
  },
};

const CAMERA_ORBITS: Record<
  CameraAnglePreset,
  { label: string; orbit: string }
> = {
  client45: { label: 'Visão Mesa 45°', orbit: '0deg 58deg 98%' },
  top90: { label: 'Topo 90°', orbit: '0deg 15deg 95%' },
  side1to1: { label: 'Altura 1:1', orbit: '25deg 78deg 100%' },
};

export function DishARViewer({
  modelGlbUrl,
  modelUsdzUrl,
  posterUrl,
  itemName,
  arScaleFixed = true,
  dimensionsCm,
  onRotate3D,
  onActivateAR,
  onDesktopFallbackNeeded,
  showBuiltInButton = true,
  fillContainer = false,
  className,
}: DishARViewerProps) {
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [surface, setSurface] = useState<TableSurfacePreset>('wood');
  const [cameraAngle, setCameraAngle] = useState<CameraAnglePreset>('client45');
  const [autoRotate, setAutoRotate] = useState(true);
  const lastRotateEventTsRef = useRef<number>(0);

  // Inject @google/model-viewer web component script once on client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.customElements?.get('model-viewer')) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${MODEL_VIEWER_CDN_URL}"]`
    ) as HTMLScriptElement | null;

    if (existingScript) {
      const handleLoad = () => setScriptLoaded(true);
      existingScript.addEventListener('load', handleLoad);
      if (window.customElements?.get('model-viewer')) {
        setScriptLoaded(true);
      }
      return () => existingScript.removeEventListener('load', handleLoad);
    }

    const script = document.createElement('script');
    script.type = 'module';
    script.src = MODEL_VIEWER_CDN_URL;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Attach native <model-viewer> telemetry listeners (camera-change & ar-status)
  useEffect(() => {
    const el = viewerRef.current;
    if (!el || !scriptLoaded) return;

    const handleLoad = () => {
      setModelReady(true);
    };

    const handleCameraChange = (event: Event) => {
      const customEvt = event as CustomEvent<{ source?: string }>;
      if (
        customEvt.detail?.source &&
        customEvt.detail.source !== 'user-interaction'
      ) {
        return;
      }
      const now = Date.now();
      if (now - lastRotateEventTsRef.current > 2500) {
        lastRotateEventTsRef.current = now;
        onRotate3D?.();
      }
    };

    const handleArStatus = (event: Event) => {
      const customEvt = event as CustomEvent<{ status?: string }>;
      if (customEvt.detail?.status === 'session-started') {
        onActivateAR?.();
      }
    };

    el.addEventListener('load', handleLoad);
    el.addEventListener('camera-change', handleCameraChange);
    el.addEventListener('ar-status', handleArStatus);

    return () => {
      el.removeEventListener('load', handleLoad);
      el.removeEventListener('camera-change', handleCameraChange);
      el.removeEventListener('ar-status', handleArStatus);
    };
  }, [scriptLoaded, onRotate3D, onActivateAR]);

  const handleTriggerAR = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onActivateAR?.();
    const el = viewerRef.current;

    const isMobileDevice =
      typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (
      el &&
      typeof el.activateAR === 'function' &&
      (el.canActivateAR || isMobileDevice)
    ) {
      try {
        await el.activateAR();
        return;
      } catch {
        // Fallback if device camera AR fails or is desktop
      }
    }

    onDesktopFallbackNeeded?.();
  };

  const activeOrbit = CAMERA_ORBITS[cameraAngle].orbit;
  const activeSurface = SURFACE_STYLES[surface];

  return (
    <div
      className={cn(
        fillContainer ? 'h-full w-full flex flex-col' : 'space-y-3',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Viewport 3D Interativa com Simulador de Superfície de Mesa */}
      <div
        className={cn(
          'relative w-full overflow-hidden select-none transition-colors duration-500',
          fillContainer
            ? 'flex-1 h-full'
            : 'h-72 rounded-2xl border border-white/15',
          activeSurface.bgClass
        )}
      >
        {/* Anel de Projeção de Mesa 3D (Escala 1:1) */}
        <div
          className={cn(
            'pointer-events-none absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 w-60 h-28 rounded-[100%] border border-dashed transition-all duration-500',
            activeSurface.floorClass
          )}
        />

        {!scriptLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-300 text-xs z-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span>Carregando protótipo 3D interativo...</span>
          </div>
        )}

        {scriptLoaded && (
          <model-viewer
            ref={viewerRef}
            src={modelGlbUrl}
            ios-src={modelUsdzUrl || undefined}
            poster={posterUrl}
            alt={`Protótipo 3D em escala real 1:1 de ${itemName}`}
            ar=""
            ar-modes="webxr scene-viewer quick-look"
            ar-scale={arScaleFixed ? 'fixed' : 'auto'}
            ar-placement="floor"
            camera-controls=""
            auto-rotate={autoRotate ? '' : undefined}
            rotation-per-second="24deg"
            touch-action="pan-y"
            shadow-intensity="1.35"
            shadow-softness="0.75"
            exposure="1.1"
            camera-orbit={activeOrbit}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
            }}
          />
        )}

        {/* Selos Superiores de Escala 1:1 & Dimensões Físicas */}
        <div
          className={cn(
            'pointer-events-none absolute left-3 right-3 flex flex-wrap items-center justify-between gap-1.5 z-10',
            fillContainer ? 'top-14' : 'top-3'
          )}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full bg-blue-600/95 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 backdrop-blur-md shadow">
              <Box className="w-3 h-3" />
              <span>Protótipo 3D • 1:1</span>
            </span>

            {dimensionsCm && (
              <span className="px-2.5 py-1 rounded-full bg-black/75 text-zinc-100 border border-white/15 text-[10px] font-medium flex items-center gap-1 backdrop-blur-md">
                <Ruler className="w-3 h-3 text-amber-400" />
                <span>
                  {dimensionsCm.width} × {dimensionsCm.depth} ×{' '}
                  {dimensionsCm.height} cm
                </span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAutoRotate((prev) => !prev);
            }}
            className={cn(
              'pointer-events-auto px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 border backdrop-blur-md transition-all',
              autoRotate
                ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                : 'bg-black/70 border-white/15 text-zinc-300'
            )}
          >
            <RotateCw
              className={cn('w-3 h-3', autoRotate && 'animate-spin')}
              style={{ animationDuration: '6s' }}
            />
            <span>{autoRotate ? 'Giro 360° Ativo' : 'Giro Pausado'}</span>
          </button>
        </div>

        {/* Barra Interativa de Ângulo e Superfície da Mesa */}
        <div
          className={cn(
            'absolute inset-x-3 flex flex-col gap-1.5 z-20',
            fillContainer ? 'bottom-48' : 'bottom-3'
          )}
        >
          {/* Seletor de Ângulo + Superfície */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 bg-black/75 border border-white/15 rounded-2xl p-1.5 backdrop-blur-xl">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-blue-400 ml-1.5 hidden sm:inline" />
              {(Object.keys(CAMERA_ORBITS) as CameraAnglePreset[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCameraAngle(key);
                    onRotate3D?.();
                  }}
                  className={cn(
                    'px-2 py-1 rounded-xl text-[10px] font-semibold transition-all',
                    cameraAngle === key
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-zinc-300 hover:bg-white/10'
                  )}
                >
                  {CAMERA_ORBITS[key].label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400 ml-1 hidden sm:inline" />
              {(Object.keys(SURFACE_STYLES) as TableSurfacePreset[]).map(
                (key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSurface(key);
                    }}
                    className={cn(
                      'px-2 py-1 rounded-xl text-[10px] font-medium transition-all',
                      surface === key
                        ? 'bg-white text-black font-semibold'
                        : 'text-zinc-300 hover:bg-white/10'
                    )}
                  >
                    {SURFACE_STYLES[key].label}
                  </button>
                )
              )}
            </div>
          </div>

          {!fillContainer && (
            <div className="pointer-events-none flex justify-center">
              <span className="px-3 py-0.5 rounded-full bg-black/65 text-[10px] text-zinc-200 flex items-center gap-1">
                <Move3d className="w-3 h-3 text-blue-400" />
                <span>
                  {modelReady
                    ? 'Arraste com o dedo para girar o prato em 360° • Pinça para zoom'
                    : 'Renderizando texturas culinárias 3D...'}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CTA Principal de Projeção AR na Mesa Real */}
      {showBuiltInButton && !fillContainer && (
        <button
          type="button"
          onClick={handleTriggerAR}
          className="bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-semibold py-3.5 rounded-xl w-full flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all text-sm"
        >
          <Camera className="w-4 h-4" />
          <span>Projetar na sua mesa real (Câmera AR 1:1)</span>
        </button>
      )}
    </div>
  );
}

export default DishARViewer;
