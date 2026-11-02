'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Compass, LayoutDashboard, Sparkles, Wifi } from 'lucide-react';
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
import { LiveTelemetryHud } from '@/components/menu/LiveTelemetryHud';
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
  const router = useRouter();
  const pathname = usePathname();

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [touchpoints, setTouchpoints] =
    useState<NfcTouchpoint[]>(initialTouchpoints);

  const [activeCategorySlug, setActiveCategorySlug] = useState<string>(
    initialCategories[0]?.slug || 'destaques'
  );
  const [sourceParam, setSourceParam] = useState<string | null>(
    initialSourceParam ?? 'nfc'
  );
  const [locationParam, setLocationParam] = useState<string | null>(
    initialLocationParam ?? 'mesa_04'
  );

  // Sync with Admin Dashboard CRUD changes in real time
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

  // Map category ID -> category object
  const categoryById = useMemo(
    () => new Map(categories.map((cat) => [cat.id, cat])),
    [categories]
  );

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

  const handleSimulateTouchpointChange = (source: string, locationCode: string) => {
    setSourceParam(source);
    setLocationParam(locationCode);
    const params = new URLSearchParams();
    params.set('source', source);
    params.set('location', locationCode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <MenuSessionProvider
      restaurant={restaurant}
      touchpoints={touchpoints}
      initialSourceParam={sourceParam}
      initialLocationParam={locationParam}
    >
      <div className="min-h-screen bg-obsidian-950 text-white flex flex-col selection:bg-brand selection:text-obsidian-950">
        {/* Sticky Header & Horizontal Category Pills */}
        <SocialMenuHeader
          categories={categories}
          activeCategorySlug={activeCategorySlug}
          onSelectCategory={(slug) => {
            setActiveCategorySlug(slug);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          touchpoints={touchpoints}
          onSimulateTouchpointChange={handleSimulateTouchpointChange}
        />

        {/* Main Mobile-First Vertical Snap Feed Container */}
        <main className="flex-1 w-full max-w-md mx-auto px-3 sm:px-4 pt-3 pb-32 snap-y snap-mandatory">
          {/* Micro Banner: Wi-Fi, Interactive Tip & Link to Owner Dashboard */}
          <div className="mb-3 px-3.5 py-2 rounded-2xl bg-obsidian-900/90 border border-white/[0.06] flex items-center justify-between gap-2 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Dê 2 toques na foto/vídeo para curtir</span>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {restaurant.wifi_ssid && (
                <span
                  className="hidden sm:inline-flex items-center gap-1 text-[10px] text-zinc-500"
                  title={restaurant.wifi_ssid}
                >
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  Wi-Fi
                </span>
              )}
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-brand/20 text-zinc-300 hover:text-brand-light border border-white/10 text-[10px] font-semibold transition-colors"
              >
                <LayoutDashboard className="w-3 h-3" />
                <span>Admin</span>
              </Link>
            </div>
          </div>

          {/* Vertical Feed of Dishes */}
          {filteredItems.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <Compass className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-sm font-bold text-zinc-300">
                Nenhum item nesta categoria no momento.
              </p>
              <button
                type="button"
                onClick={() => setActiveCategorySlug('destaques')}
                className="px-4 py-2 rounded-full bg-brand text-obsidian-950 text-xs font-bold"
              >
                Ver Todos os Destaques
              </button>
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <SocialProductCard
                key={item.id}
                item={item}
                categoryName={categoryById.get(item.category_id)?.name}
                priorityLoad={idx < 2}
              />
            ))
          )}
        </main>

        {/* Live Behavioral Telemetry Inspector HUD */}
        <LiveTelemetryHud items={items} />

        {/* Saved Favorites / Quick Order Drawer */}
        <SelectionDrawer allItems={items} />
      </div>
    </MenuSessionProvider>
  );
}
