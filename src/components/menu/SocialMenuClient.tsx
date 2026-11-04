'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Compass } from 'lucide-react';
import type {
  Category,
  MenuItem,
  NfcTouchpoint,
  Restaurant,
} from '@/types/database';
import { MenuSessionProvider } from '@/context/MenuSessionContext';
import { useTheme } from '@/context/ThemeContext';
import { SocialMenuHeader } from '@/components/menu/SocialMenuHeader';
import { SocialProductCard } from '@/components/menu/SocialProductCard';
import { SelectionDrawer } from '@/components/menu/SelectionDrawer';
import { MenuEntrySplash } from '@/components/menu/MenuEntrySplash';
import {
  CATALOG_UPDATED_EVENT,
  loadStoredCategories,
  loadStoredMenuItems,
  loadStoredTouchpoints,
} from '@/lib/storage/menuCatalogStorage';
import { cn } from '@/lib/utils';

interface SocialMenuClientProps {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
  touchpoints: NfcTouchpoint[];
  initialSourceParam?: string | null;
  initialLocationParam?: string | null;
}

export function SocialMenuClient({
  restaurant,
  categories: initialCategories,
  items: initialItems,
  touchpoints: initialTouchpoints,
  initialSourceParam,
  initialLocationParam,
}: SocialMenuClientProps) {
  const { isLight } = useTheme();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [touchpoints, setTouchpoints] =
    useState<NfcTouchpoint[]>(initialTouchpoints);

  const [activeCategorySlug, setActiveCategorySlug] = useState<string>(
    initialCategories[0]?.slug || 'destaques'
  );

  // Sync with Admin Catalog changes silently in real time
  useEffect(() => {
    const syncFromStorage = () => {
      setCategories(
        loadStoredCategories(initialCategories).filter((c) => c.is_active)
      );
      setItems(loadStoredMenuItems(initialItems));
      setTouchpoints(loadStoredTouchpoints(initialTouchpoints));
    };

    syncFromStorage();
    window.addEventListener(CATALOG_UPDATED_EVENT, syncFromStorage);
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener(CATALOG_UPDATED_EVENT, syncFromStorage);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, [initialCategories, initialItems, initialTouchpoints]);

  // Filter items based on selected horizontal category pill
  const filteredItems = useMemo(() => {
    if (activeCategorySlug === 'destaques') {
      const featured = items.filter((item) => item.is_featured);
      const others = items.filter((item) => !item.is_featured);
      return [...featured, ...others];
    }
    const targetCategory = categories.find(
      (cat) => cat.slug === activeCategorySlug
    );
    if (!targetCategory) return items;
    return items.filter((item) => item.category_id === targetCategory.id);
  }, [activeCategorySlug, categories, items]);

  return (
    <MenuSessionProvider
      restaurant={restaurant}
      touchpoints={touchpoints}
      initialSourceParam={initialSourceParam ?? 'nfc'}
      initialLocationParam={initialLocationParam ?? 'mesa_04'}
    >
      {/* Impressive Editorial Entry Splash Screen */}
      <MenuEntrySplash restaurant={restaurant} />

      <div
        className={cn(
          'min-h-screen flex flex-col transition-colors duration-250',
          isLight
            ? 'bg-[#F6F4EF] text-[#141413] selection:bg-[#141413] selection:text-white'
            : 'bg-[#0F0F0F] text-white selection:bg-white selection:text-[#0F0F0F]'
        )}
      >
        {/* Sticky Header & Clean Horizontal Category Pills */}
        <SocialMenuHeader
          categories={categories}
          activeCategorySlug={activeCategorySlug}
          onSelectCategory={(slug) => {
            setActiveCategorySlug(slug);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Main Mobile-First Fluid Feed Container */}
        <main
          key={activeCategorySlug}
          className="flex-1 w-full max-w-md mx-auto px-4 pt-2 pb-28 animate-fadeIn"
        >
          {filteredItems.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <Compass
                className={cn(
                  'w-8 h-8 mx-auto',
                  isLight ? 'text-stone-400' : 'text-zinc-600'
                )}
              />
              <p
                className={cn(
                  'text-sm font-medium',
                  isLight ? 'text-stone-600' : 'text-zinc-300'
                )}
              >
                Nenhum item nesta categoria no momento.
              </p>
              <button
                type="button"
                onClick={() => setActiveCategorySlug('destaques')}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-semibold',
                  isLight
                    ? 'bg-[#141413] text-white'
                    : 'bg-white text-[#0F0F0F]'
                )}
              >
                Ver Destaques
              </button>
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <SocialProductCard
                key={item.id}
                item={item}
                priorityLoad={idx < 2}
              />
            ))
          )}
        </main>

        {/* Customer Favorites & Flexible Order Drawer */}
        <SelectionDrawer />
      </div>
    </MenuSessionProvider>
  );
}
