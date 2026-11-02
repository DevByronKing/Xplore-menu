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
import { SocialMenuHeader } from '@/components/menu/SocialMenuHeader';
import { SocialProductCard } from '@/components/menu/SocialProductCard';
import { SelectionDrawer } from '@/components/menu/SelectionDrawer';
import {
  CATALOG_UPDATED_EVENT,
  loadStoredCategories,
  loadStoredMenuItems,
  loadStoredTouchpoints,
} from '@/lib/storage/menuCatalogStorage';

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
      <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col selection:bg-white selection:text-[#0F0F0F]">
        {/* Sticky Header & Clean Horizontal Category Pills */}
        <SocialMenuHeader
          categories={categories}
          activeCategorySlug={activeCategorySlug}
          onSelectCategory={(slug) => {
            setActiveCategorySlug(slug);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Main Mobile-First Vertical Snap Feed Container */}
        <main className="flex-1 w-full max-w-md mx-auto px-4 pt-2 pb-28 snap-y snap-mandatory">
          {filteredItems.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <Compass className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-medium text-zinc-300">
                Nenhum item nesta categoria no momento.
              </p>
              <button
                type="button"
                onClick={() => setActiveCategorySlug('destaques')}
                className="px-4 py-2 rounded-full bg-white text-[#0F0F0F] text-xs font-semibold"
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
