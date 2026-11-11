'use client';

import React from 'react';
import {
  Flame,
  Croissant,
  Sparkles,
  Coffee,
  GlassWater,
  Gift,
  Heart,
  Moon,
  Sun,
  Utensils,
} from 'lucide-react';
import type { Category, Restaurant } from '@/types/database';
import { useMenuSession } from '@/context/MenuSessionContext';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

interface SocialMenuHeaderProps {
  restaurant: Restaurant;
  categories: Category[];
  activeCategorySlug: string;
  onSelectCategory: (slug: string) => void;
  onOpenDrawer: () => void;
  onOpenWifiModal: () => void;
  onOpenGrowthClubModal?: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Flame,
  Croissant,
  Sparkles,
  Coffee,
  GlassWater,
  Utensils,
};

export function SocialMenuHeader({
  restaurant,
  categories,
  activeCategorySlug,
  onSelectCategory,
  onOpenDrawer,
  onOpenGrowthClubModal,
}: SocialMenuHeaderProps) {
  const { totalSelectionCount, likedItemIds } = useMenuSession();
  const { isLight, toggleTheme } = useTheme();
  const badgeCount = totalSelectionCount || likedItemIds.length;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 backdrop-blur-xl border-b transition-colors',
        isLight
          ? 'bg-[#F6F4EF]/95 border-zinc-300/80 text-zinc-900'
          : 'bg-[#0F0F0F]/90 border-white/[0.06] text-white'
      )}
    >
      <div className="max-w-[480px] mx-auto px-4 pt-3 pb-2.5">
        {/* Linha Superior: Identidade do Restaurante + Clube VIP + Tema + Pedido */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-9 w-9 rounded-full overflow-hidden border border-white/20 shrink-0 shadow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1
                  className={cn(
                    'font-serif text-base tracking-tight truncate',
                    isLight ? 'text-zinc-900 font-bold' : 'text-white'
                  )}
                >
                  {restaurant.name}
                </h1>
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full shrink-0 bg-emerald-400"
                  title="Cozinha aberta"
                />
              </div>
              <p
                className={cn(
                  'text-[11px] truncate',
                  isLight ? 'text-zinc-600' : 'text-[#A1A1AA]'
                )}
              >
                {restaurant.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Botão Clube VIP & Avaliação (Alto Contraste no Modo Claro e Escuro) */}
            {onOpenGrowthClubModal && (
              <button
                type="button"
                onClick={onOpenGrowthClubModal}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 shadow-sm',
                  isLight
                    ? 'bg-amber-400 hover:bg-amber-500 text-[#0F0F0F] border border-amber-500/60'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300'
                )}
                title="Clube de Benefícios & Avaliação"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Clube VIP</span>
              </button>
            )}

            {/* Alternador Modo Claro / Modo Escuro */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                isLight ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'
              }
              title={isLight ? 'Mudar para Modo Escuro' : 'Mudar para Modo Claro'}
              className={cn(
                'flex items-center justify-center h-8 w-8 rounded-full border transition-all active:scale-95',
                isLight
                  ? 'bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-100'
                  : 'bg-white/[0.1] border-white/10 text-white hover:bg-white/[0.18]'
              )}
            >
              {isLight ? (
                <Moon className="w-3.5 h-3.5" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {/* Botão de Seleção / Pedido */}
            <button
              type="button"
              onClick={onOpenDrawer}
              aria-label="Ver itens salvos e pedido"
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all active:scale-95',
                badgeCount > 0
                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-md keep-white'
                  : isLight
                    ? 'bg-white border-zinc-300 text-zinc-900'
                    : 'bg-white/[0.12] border-white/10 text-white'
              )}
            >
              <Heart
                className={cn(
                  'w-3.5 h-3.5 transition-colors',
                  badgeCount > 0 ? 'fill-white text-white' : ''
                )}
              />
              <span>{badgeCount > 0 ? `Pedido (${badgeCount})` : 'Salvos'}</span>
            </button>
          </div>
        </div>

        {/* Pílulas Horizontais de Categorias */}
        <nav
          aria-label="Categorias do cardápio"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5"
        >
          {categories.map((cat) => {
            const IconComponent = ICON_MAP[cat.icon_name || 'Utensils'] || Utensils;
            const isActive = activeCategorySlug === cat.slug;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all duration-200 shrink-0',
                  isActive
                    ? isLight
                      ? 'bg-[#141413] text-white font-semibold shadow-sm keep-white'
                      : 'bg-[#FFFFFF] text-[#0F0F0F] font-semibold shadow-sm'
                    : isLight
                      ? 'bg-white text-zinc-700 hover:text-zinc-950 border border-zinc-300/80'
                      : 'bg-white/[0.12] text-white/85 hover:text-white backdrop-blur-md'
                )}
              >
                <IconComponent
                  className={cn(
                    'w-3.5 h-3.5',
                    isActive
                      ? isLight
                        ? 'text-amber-400'
                        : 'text-[#0F0F0F]'
                      : isLight
                        ? 'text-zinc-500'
                        : 'text-[#A1A1AA]'
                  )}
                />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
