'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import type { Category } from '@/types/database';
import { useMenuSession } from '@/context/MenuSessionContext';
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
    <header className="sticky top-0 z-40 w-full bg-[#0F0F0F]/85 backdrop-blur-xl border-b border-white/[0.04]">
      <div className="max-w-md mx-auto">
        {/* Top Brand Row */}
        <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={handleLogoSecretTap}
              className="h-8 w-8 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/15 focus:outline-none"
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
              <h1 className="text-sm font-semibold tracking-tight text-white truncate">
                {restaurant.name}
              </h1>
              {sessionOrigin.locationCode !== 'acesso_direto' && (
                <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-[10px] font-medium text-zinc-400 shrink-0">
                  {sessionOrigin.locationLabel.split('•')[0]?.trim()}
                </span>
              )}
            </div>
          </div>

          {/* Right Action: Saved Favorites / Order Pill */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.12] hover:bg-white/[0.18] backdrop-blur-md border border-white/10 text-xs font-medium text-white transition-all active:scale-95 shrink-0"
            aria-label="Abrir meus favoritos e pedido"
          >
            <Heart
              className={cn(
                'w-3.5 h-3.5 transition-colors',
                savedCount > 0 ? 'fill-white text-white' : 'text-white/80'
              )}
            />
            <span>{savedCount > 0 ? savedCount : 'Salvos'}</span>
          </button>
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
                      ? 'bg-[#FFFFFF] text-[#0F0F0F] font-semibold shadow-sm scale-[1.02]'
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
