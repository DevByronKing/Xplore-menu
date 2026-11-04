'use client';

import React, { useEffect, useState } from 'react';
import { Radio, Sparkles } from 'lucide-react';
import type { Restaurant } from '@/types/database';
import { useMenuSession } from '@/context/MenuSessionContext';
import { cn } from '@/lib/utils';

interface MenuEntrySplashProps {
  restaurant: Restaurant;
}

export function MenuEntrySplash({ restaurant }: MenuEntrySplashProps) {
  const { sessionOrigin } = useMenuSession();
  const [phase, setPhase] = useState<'entering' | 'ready' | 'exiting' | 'unmounted'>(
    'entering'
  );
  const [progress, setProgress] = useState(12);

  const tableLabel =
    sessionOrigin.locationCode !== 'acesso_direto'
      ? sessionOrigin.locationLabel
      : 'Experiência na Mesa';

  useEffect(() => {
    const t1 = window.setTimeout(() => setProgress(58), 250);
    const t2 = window.setTimeout(() => {
      setProgress(100);
      setPhase('ready');
    }, 1150);
    const t3 = window.setTimeout(() => {
      setPhase('exiting');
    }, 1850);
    const t4 = window.setTimeout(() => {
      setPhase('unmounted');
    }, 2450);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, []);

  if (phase === 'unmounted') return null;

  const handleSkip = () => {
    setPhase('exiting');
    window.setTimeout(() => setPhase('unmounted'), 500);
  };

  return (
    <div
      onClick={handleSkip}
      role="status"
      aria-label="Carregando cardápio interativo"
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-between px-6 py-12 bg-[#0F0F0F] text-white select-none cursor-pointer overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
        phase === 'exiting'
          ? 'opacity-0 -translate-y-6 scale-[1.03] pointer-events-none'
          : 'opacity-100 translate-y-0 scale-100'
      )}
    >
      {/* Ambient Editorial Radial Glows */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-amber-500/[0.08] blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 w-[360px] h-[360px] rounded-full bg-white/[0.05] blur-[100px]" />

      {/* Top Subtle NFC / Table Recognition Pill */}
      <div
        className={cn(
          'relative z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md text-[10px] uppercase tracking-[0.2em] text-zinc-300 transition-all duration-700',
          phase === 'entering'
            ? 'opacity-0 -translate-y-2'
            : 'opacity-100 translate-y-0'
        )}
      >
        <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
        <span>{tableLabel}</span>
      </div>

      {/* Center Stage: Animated SVG Halo + Emblem + Serif Title */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-xs mx-auto">
        {/* Concentric NFC Ripple Rings */}
        <div className="relative flex items-center justify-center mb-7">
          <span className="absolute h-32 w-32 rounded-full border border-white/[0.06] animate-ping [animation-duration:2.4s]" />
          <span className="absolute h-28 w-28 rounded-full border border-white/[0.1]" />

          {/* Animated SVG Progress Ring */}
          <svg
            className="w-24 h-24 -rotate-90 transform"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1.5"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={289}
              strokeDashoffset={289 - (289 * progress) / 100}
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Restaurant Logo inside the Halo */}
          <div className="absolute h-16 w-16 rounded-full overflow-hidden bg-[#161616] border border-white/15 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="h-full w-full object-cover scale-105 transition-transform duration-1000"
            />
          </div>
        </div>

        {/* Editorial Subtitle */}
        <span className="text-[10px] uppercase tracking-[0.28em] text-[#A1A1AA] mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-200/80" />
          <span>Menu Gastronômico Interativo</span>
        </span>

        {/* Restaurant Name in Editorial Serif */}
        <h1 className="font-serif text-3xl sm:text-4xl text-white font-normal tracking-tight leading-tight">
          {restaurant.name}
        </h1>

        {/* Craft Tagline */}
        <p className="mt-2.5 text-xs text-[#A1A1AA] leading-relaxed max-w-[260px]">
          {restaurant.tagline}
        </p>
      </div>

      {/* Bottom Progress Line & Status */}
      <div className="relative z-10 w-full max-w-[220px] mx-auto space-y-2.5 text-center">
        <div className="h-[2px] w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          {phase === 'entering'
            ? 'Preparando fornada & vídeos...'
            : 'Bem-vindo • Toque para explorar'}
        </p>
      </div>
    </div>
  );
}
