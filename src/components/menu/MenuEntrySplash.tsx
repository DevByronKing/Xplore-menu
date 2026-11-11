'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Utensils, Wifi, Box } from 'lucide-react';
import type { Restaurant } from '@/types/database';
import { cn } from '@/lib/utils';

interface MenuEntrySplashProps {
  restaurant: Restaurant;
  tableCode?: string;
}

const BRAND_LOADING_DURATION_MS = 5000; // 5 segundos completos para exibir a marca do estabelecimento

export function MenuEntrySplash({
  restaurant,
  tableCode,
}: MenuEntrySplashProps) {
  const [stage, setStage] = useState<'visible' | 'fading' | 'hidden'>('visible');
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const startTime = performance.now();

    const interval = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(
        100,
        Math.round((elapsed / BRAND_LOADING_DURATION_MS) * 100)
      );
      setProgress(pct);
    }, 50);

    const fadeTimer = window.setTimeout(() => {
      setProgress(100);
      setStage('fading');
    }, BRAND_LOADING_DURATION_MS);

    const hideTimer = window.setTimeout(() => {
      setStage('hidden');
    }, BRAND_LOADING_DURATION_MS + 650);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (stage === 'hidden') return null;

  const formattedTable = tableCode
    ? tableCode.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : 'Experiência na Mesa';

  const statusStepText =
    progress < 30
      ? 'Conectando à cozinha e preparando experiências visuais...'
      : progress < 65
        ? 'Carregando fotos editoriais e vídeos de preparo...'
        : progress < 92
          ? 'Calibrando protótipos 3D em escala real (1:1)...'
          : 'Tudo pronto! Bem-vindo à nossa mesa.';

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-between px-6 py-10 bg-[#0F0F0F] text-white select-none transition-all duration-700 ease-out',
        stage === 'fading'
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      )}
    >
      {/* Brilho sutil de fundo com a identidade da marca */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl opacity-25 transition-transform duration-1000"
        style={{
          background: `radial-gradient(circle, ${restaurant.theme_color || '#f59e0b'} 0%, transparent 70%)`,
        }}
      />

      {/* Topo: Identificação da Mesa Conectada */}
      <div className="relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-200">
          {formattedTable} • Conectado
        </span>
      </div>

      {/* Centro: Marca do Estabelecimento em Destaque */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
        {/* Moldura Circular Animada da Marca */}
        <div className="relative mb-6">
          <div className="absolute -inset-3 rounded-full border border-amber-400/30 animate-ping opacity-30" />
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-amber-500/40 via-white/20 to-blue-500/40 blur-sm" />
          <div className="relative h-28 w-28 rounded-full p-1 bg-gradient-to-tr from-amber-400/60 via-white/30 to-white/10 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="h-full w-full rounded-full object-cover border-2 border-[#0F0F0F]"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-amber-400 text-[#0F0F0F] flex items-center justify-center shadow-lg">
            <Utensils className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-400 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bem-vindo ao</span>
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl text-white tracking-tight leading-tight mb-2.5">
          {restaurant.name}
        </h1>

        <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed max-w-[290px] mb-6">
          {restaurant.tagline}
        </p>

        {/* Destaques da Experiência do Estabelecimento */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-7">
          <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[10px] font-medium text-zinc-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>1. Fotos & 2. Vídeos</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-[10px] font-medium text-blue-300 flex items-center gap-1">
            <Box className="w-3 h-3 text-blue-400" />
            <span>3. Protótipo 3D / AR</span>
          </span>
          {restaurant.wifi_ssid && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-medium text-emerald-300 flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>Wi-Fi Cortesia</span>
            </span>
          )}
        </div>

        {/* Barra de Carregamento de 5 Segundos da Marca */}
        <div className="w-64 space-y-2">
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-white to-blue-400 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
            <span className="truncate max-w-[205px]">{statusStepText}</span>
            <span className="font-mono text-white font-semibold">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Rodapé com opção discreta de entrar imediatamente */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setStage('hidden')}
          className="text-[11px] font-medium text-zinc-400 hover:text-white underline underline-offset-4 transition-colors"
        >
          Entrar no cardápio agora
        </button>
      </div>
    </div>
  );
}
