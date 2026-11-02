'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Compass, Sparkles, Wifi } from 'lucide-react';
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
  categories,
  items,
  touchpoints,
  initialSourceParam,
  initialLocationParam,
}: SocialMenuClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeCategorySlug, setActiveCategorySlug] = useState<string>(
    categories[0]?.slug || 'destaques'
  );
  const [sourceParam, setSourceParam] = useState<string | null>(
    initialSourceParam ?? 'nfc'
  );
  const [locationParam, setLocationParam] = useState<string | null>(
    initialLocationParam ?? 'mesa_04'
  );

  // Map category ID -> category object
  const categoryById = useMemo(
    () => new Map(categories.map((cat) => [cat.id, cat])),
    [categories]
  );

  // Filter items based on selected horizontal category pill
  const filteredItems = useMemo(() => {
    if (activeCategorySlug === 'destaques') {
      // Show featured items first, followed by remaining items so feed is rich
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
          {/* Micro Banner: Wi-Fi & Interactive Tip */}
          <div className="mb-3 px-3.5 py-2 rounded-2xl bg-obsidian-900/90 border border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Dê 2 toques no prato para curtir ou salve para pedir</span>
            </span>
            {restaurant.wifi_ssid && (
              <span
                className="hidden sm:inline-flex items-center gap-1 text-[10px] text-zinc-500 shrink-0"
                title={restaurant.wifi_ssid}
              >
                <Wifi className="w-3 h-3 text-emerald-400" />
                Wi-Fi
              </span>
            )}
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
