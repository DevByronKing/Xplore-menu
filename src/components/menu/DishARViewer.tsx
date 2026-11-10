'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box, Camera, Loader2, Move3d, Ruler } from 'lucide-react';
import type { ModelViewerElement } from '@/types/model-viewer';
import type { ProductPhysicalDimensionsCm } from '@/types/database';
import { cn } from '@/lib/utils';

const MODEL_VIEWER_CDN_URL =
  'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';

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
  className?: string;
}

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
  className,
}: DishARViewerProps) {
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [modelReady, setModelReady] = useState(false);
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
      // Only fire telemetry when user drags/rotates with finger or mouse
      if (customEvt.detail?.source && customEvt.detail.source !== 'user-interaction') {
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

  const handleTriggerAR = async () => {
    onActivateAR?.();
    const el = viewerRef.current;

    const isMobileDevice =
      typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (el && typeof el.activateAR === 'function' && (el.canActivateAR || isMobileDevice)) {
      try {
        await el.activateAR();
        return;
      } catch {
        // Fallback if device camera AR fails or is desktop
      }
    }

    onDesktopFallbackNeeded?.();
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Viewport 3D Interativa (h-72 w-full rounded-2xl bg-neutral-900/90) */}
      <div className="relative h-72 w-full rounded-2xl bg-neutral-900/90 border border-white/15 overflow-hidden select-none">
        {!scriptLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span>Carregando motor 3D / WebAR...</span>
          </div>
        )}

        {scriptLoaded && (
          <model-viewer
            ref={viewerRef}
            src={modelGlbUrl}
            ios-src={modelUsdzUrl || undefined}
            poster={posterUrl}
            alt={`Modelo 3D em escala real 1:1 de ${itemName}`}
            ar=""
            ar-modes="webxr scene-viewer quick-look"
            ar-scale={arScaleFixed ? 'fixed' : 'auto'}
            ar-placement="floor"
            camera-controls=""
            auto-rotate=""
            touch-action="pan-y"
            shadow-intensity="1.2"
            shadow-softness="0.85"
            exposure="1.05"
            camera-orbit="0deg 65deg 105%"
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
            }}
          />
        )}

        {/* Top-left scale & dimensions badge */}
        <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full bg-blue-600/90 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 backdrop-blur-md shadow">
            <Box className="w-3 h-3" />
            <span>Escala Real 1:1</span>
          </span>

          {dimensionsCm && (
            <span className="px-2.5 py-1 rounded-full bg-black/75 text-zinc-200 border border-white/15 text-[10px] font-medium flex items-center gap-1 backdrop-blur-md">
              <Ruler className="w-3 h-3 text-amber-400" />
              <span>
                {dimensionsCm.width} × {dimensionsCm.depth} × {dimensionsCm.height} cm
              </span>
            </span>
          )}
        </div>

        {/* Bottom visual hint: Arraste para girar em 360° */}
        <div className="pointer-events-none absolute bottom-3 inset-x-0 flex justify-center">
          <span className="px-3 py-1 rounded-full bg-black/70 border border-white/10 text-[11px] text-zinc-200 flex items-center gap-1.5 backdrop-blur-md">
            <Move3d className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {modelReady
                ? 'Arraste para girar em 360° • Pinça para zoom'
                : 'Preparando malha 3D...'}
            </span>
          </span>
        </div>
      </div>

      {/* CTA Principal de Alta Conversão */}
      {showBuiltInButton && (
        <button
          type="button"
          onClick={handleTriggerAR}
          className="bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-semibold py-3.5 rounded-xl w-full flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all text-sm"
        >
          <Camera className="w-4 h-4" />
          <span>Ver na sua mesa</span>
        </button>
      )}
    </div>
  );
}

export default DishARViewer;
