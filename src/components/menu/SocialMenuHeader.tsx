'use client';

import React, { useState } from 'react';
import {
  Activity,
  Check,
  ChevronDown,
  Coffee,
  Croissant,
  Flame,
  GlassWater,
  QrCode,
  Radio,
  Sparkles,
  Utensils,
  Wifi,
} from 'lucide-react';
import type { Category, NfcTouchpoint } from '@/types/database';
import { useMenuSession } from '@/context/MenuSessionContext';
import { cn } from '@/lib/utils';

interface SocialMenuHeaderProps {
  categories: Category[];
  activeCategorySlug: string;
  onSelectCategory: (slug: string) => void;
  touchpoints: NfcTouchpoint[];
  onSimulateTouchpointChange?: (source: string, locationCode: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Flame,
  Croissant,
  Sparkles,
  Coffee,
  GlassWater,
};

export function SocialMenuHeader({
  categories,
  activeCategorySlug,
  onSelectCategory,
  touchpoints,
  onSimulateTouchpointChange,
}: SocialMenuHeaderProps) {
  const {
    restaurant,
    sessionOrigin,
    isTelemetryHudOpen,
    setIsTelemetryHudOpen,
    pendingBatchCount,
  } = useMenuSession();

  const [isTouchpointMenuOpen, setIsTouchpointMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-obsidian-950/85 backdrop-blur-xl border-b border-white/[0.08] transition-all">
      {/* Top Restaurant Bar + NFC Table Context */}
      <div className="max-w-md mx-auto px-4 pt-3 pb-2.5 flex items-center justify-between gap-2">
        {/* Restaurant Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-brand/60 shrink-0 bg-obsidian-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="h-full w-full object-cover"
              loading="eager"
            />
            <span
              className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-obsidian-950"
              title="Cardápio ao vivo"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-white truncate">
                {restaurant.name}
              </h1>
            </div>
            <p className="text-[11px] text-zinc-400 truncate">
              {restaurant.tagline}
            </p>
          </div>
        </div>

        {/* Right Controls: NFC Badge + Telemetry HUD Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* NFC / QR Origin Pill (Clickable to simulate scanning other NFC tags) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTouchpointMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium transition-colors"
              title="Origem rastreada via NFC/QR Code. Clique para simular outra mesa."
            >
              {sessionOrigin.source === 'qrcode' ? (
                <QrCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
              )}
              <span className="max-w-[92px] truncate">{sessionOrigin.locationLabel}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {isTouchpointMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsTouchpointMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-obsidian-900 border border-white/15 shadow-2xl p-2 z-50 text-xs">
                  <div className="px-2.5 py-1.5 border-b border-white/10 mb-1">
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-brand" />
                      Simulador de Tag NFC / QR
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Teste a captura automática de query params na URL:
                    </p>
                  </div>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {touchpoints.map((tp) => {
                      const isCurrent =
                        sessionOrigin.locationCode.toLowerCase() ===
                        tp.code.toLowerCase();
                      return (
                        <button
                          key={tp.id}
                          type="button"
                          onClick={() => {
                            onSimulateTouchpointChange?.(tp.source_type, tp.code);
                            setIsTouchpointMenuOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors',
                            isCurrent
                              ? 'bg-brand/20 text-brand-light border border-brand/30'
                              : 'hover:bg-white/5 text-zinc-300'
                          )}
                        >
                          <div>
                            <div className="font-medium text-white">{tp.label}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              ?source={tp.source_type}&location={tp.code}
                            </div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-brand" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Behavioral Telemetry Live Monitor Button */}
          <button
            type="button"
            onClick={() => setIsTelemetryHudOpen(!isTelemetryHudOpen)}
            className={cn(
              'relative flex items-center justify-center h-8 w-8 rounded-full border transition-all',
              isTelemetryHudOpen
                ? 'bg-brand text-white border-brand shadow-lg shadow-brand/30'
                : 'bg-obsidian-800/90 text-zinc-300 border-white/10 hover:text-white'
            )}
            title="Inspecionar Telemetria Comportamental em Tempo Real"
            aria-label="Telemetria em Tempo Real"
          >
            <Activity className="w-4 h-4" />
            {pendingBatchCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-amber-500 text-obsidian-950 text-[9px] font-bold flex items-center justify-center">
                {pendingBatchCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Horizontal Category Pills Bar (Slidable) */}
      <nav
        aria-label="Categorias do cardápio"
        className="max-w-md mx-auto px-4 pb-2.5 overflow-x-auto no-scrollbar"
      >
        <div className="flex items-center gap-2 min-w-max">
          {categories.map((cat) => {
            const isActive = activeCategorySlug === cat.slug;
            const IconComponent =
              (cat.icon_name && CATEGORY_ICONS[cat.icon_name]) || Utensils;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className={cn(
                  'group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shrink-0 select-none',
                  isActive
                    ? 'bg-gradient-to-r from-brand to-amber-500 text-obsidian-950 shadow-md shadow-brand/25 scale-[1.02]'
                    : 'bg-obsidian-800/90 text-zinc-300 border border-white/[0.07] hover:bg-obsidian-700 hover:text-white'
                )}
              >
                <IconComponent
                  className={cn(
                    'w-3.5 h-3.5 transition-transform group-hover:scale-110',
                    isActive ? 'text-obsidian-950' : 'text-brand-light'
                  )}
                />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
