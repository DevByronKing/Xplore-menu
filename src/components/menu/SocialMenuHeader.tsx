'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Moon, Sun } from 'lucide-react';
import type { Category } from '@/types/database';
import { useMenuSession } from '@/context/MenuSessionContext';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

interface SocialMenuHeaderProps {
  categories: Category[];
  activeCategorySlug: string;
  onSelectCategory: (slug: string) => void;
}

export function SocialMenuHeader({
  categories,
  activeCategorySlug,
  onSelectCategory,
}: SocialMenuHeaderProps) {
  const router = useRouter();
  const {
    restaurant,
    sessionOrigin,
    totalSelectionCount,
    likedItemIds,
    setIsDrawerOpen,
  } = useMenuSession();
  const { isLight, toggleTheme } = useTheme();

  const savedCount = totalSelectionCount || likedItemIds.length;
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<number | null>(null);

  // Secret Owner Gesture: 3 quick taps on the restaurant logo opens /dashboard
  const handleLogoSecretTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) {
      window.clearTimeout(tapTimerRef.current);
    }
    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      router.push('/dashboard');
      return;
    }
    tapTimerRef.current = window.setTimeout(() => {
      tapCountRef.current = 0;
    }, 600);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full backdrop-blur-xl border-b transition-colors duration-200',
        isLight
          ? 'bg-[#F6F4EF]/90 border-black/[0.07]'
          : 'bg-[#0F0F0F]/85 border-white/[0.04]'
      )}
    >
      <div className="max-w-md mx-auto">
        {/* Top Brand Row */}
        <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={handleLogoSecretTap}
              className={cn(
                'h-8 w-8 rounded-full overflow-hidden shrink-0 border focus:outline-none',
                isLight
                  ? 'bg-black/5 border-black/15'
                  : 'bg-white/10 border-white/15'
              )}
              aria-label={restaurant.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="h-full w-full object-cover"
              />
            </button>
            <div className="min-w-0 flex items-center gap-2">
              <h1
                className={cn(
                  'text-sm font-semibold tracking-tight truncate',
                  isLight ? 'text-[#141413]' : 'text-white'
                )}
              >
                {restaurant.name}
              </h1>
              {sessionOrigin.locationCode !== 'acesso_direto' && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0',
                    isLight
                      ? 'bg-black/[0.06] text-stone-600'
                      : 'bg-white/[0.08] text-zinc-400'
                  )}
                >
                  {sessionOrigin.locationLabel.split('•')[0]?.trim()}
                </span>
              )}
            </div>
          </div>

          {/* Right Actions: Theme Mode Toggle + Saved Favorites Pill */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              title={isLight ? 'Mudar para Modo Escuro' : 'Mudar para Modo Claro'}
              aria-label={isLight ? 'Mudar para Modo Escuro' : 'Mudar para Modo Claro'}
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center border transition-all active:scale-95',
                isLight
                  ? 'bg-black/[0.06] hover:bg-black/[0.11] border-black/10 text-[#141413]'
                  : 'bg-white/[0.10] hover:bg-white/[0.16] border-white/10 text-white'
              )}
            >
              {isLight ? (
                <Moon className="w-3.5 h-3.5" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-300" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-medium transition-all active:scale-95',
                isLight
                  ? 'bg-black/[0.07] hover:bg-black/[0.12] border-black/10 text-[#141413]'
                  : 'bg-white/[0.12] hover:bg-white/[0.18] border-white/10 text-white'
              )}
              aria-label="Abrir meus favoritos e pedido"
            >
              <Heart
                className={cn(
                  'w-3.5 h-3.5 transition-colors',
                  savedCount > 0
                    ? isLight
                      ? 'fill-[#141413] text-[#141413]'
                      : 'fill-white text-white'
                    : isLight
                      ? 'text-[#141413]/75'
                      : 'text-white/80'
                )}
              />
              <span>{savedCount > 0 ? savedCount : 'Salvos'}</span>
            </button>
          </div>
        </div>

        {/* Horizontal Category Pills Bar */}
        <nav
          aria-label="Categorias do cardápio"
          className="px-4 pb-3 pt-0.5 overflow-x-auto no-scrollbar"
        >
          <div className="flex items-center gap-2 min-w-max">
            {categories.map((cat) => {
              const isActive = activeCategorySlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.slug)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs transition-all duration-300 ease-out shrink-0 select-none',
                    isActive
                      ? isLight
                        ? 'bg-[#141413] text-[#FFFFFF] font-semibold shadow-sm scale-[1.02]'
                        : 'bg-[#FFFFFF] text-[#0F0F0F] font-semibold shadow-sm scale-[1.02]'
                      : isLight
                        ? 'bg-black/[0.06] text-[#141413]/85 font-medium hover:bg-black/[0.11]'
                        : 'bg-white/[0.12] text-white/90 font-medium backdrop-blur-md hover:bg-white/[0.18]'
                  )}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
