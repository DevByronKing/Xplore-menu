'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Wifi,
  Copy,
  Check,
  X,
  Box,
  LayoutDashboard,
  ClipboardList,
  BellRing,
} from 'lucide-react';
import type {
  Category,
  MenuItem,
  NfcTouchpoint,
  Restaurant,
} from '@/types/database';
import {
  MenuSessionProvider,
  useMenuSession,
} from '@/context/MenuSessionContext';
import { SocialMenuHeader } from './SocialMenuHeader';
import { SocialProductCard } from './SocialProductCard';
import { SelectionDrawer } from './SelectionDrawer';
import { MenuEntrySplash } from './MenuEntrySplash';
import { GrowthClubModal } from './GrowthClubModal';
import {
  CATALOG_UPDATED_EVENT,
  loadStoredCategories,
  loadStoredMenuItems,
} from '@/lib/storage/menuCatalogStorage';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

interface SocialMenuClientProps {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
  touchpoints: NfcTouchpoint[];
  initialSourceParam?: string | null;
  initialLocationParam?: string | null;
}

function SocialMenuInner({
  restaurant,
  categories,
  items,
  initialLocationParam,
}: Omit<SocialMenuClientProps, 'touchpoints' | 'initialSourceParam'>) {
  const { setIsDrawerOpen, trackEvent } = useMenuSession();
  const { isLight } = useTheme();

  const [catalogItems, setCatalogItems] = useState<MenuItem[]>(items);
  const [catalogCategories, setCatalogCategories] =
    useState<Category[]>(categories);
  const [activeCategorySlug, setActiveCategorySlug] =
    useState<string>('destaques');
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [isGrowthClubOpen, setIsGrowthClubOpen] = useState(false);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const feedContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncCatalog = () => {
      setCatalogItems(loadStoredMenuItems(items));
      setCatalogCategories(loadStoredCategories(categories));
    };
    syncCatalog();
    window.addEventListener(CATALOG_UPDATED_EVENT, syncCatalog);
    window.addEventListener('storage', syncCatalog);
    return () => {
      window.removeEventListener(CATALOG_UPDATED_EVENT, syncCatalog);
      window.removeEventListener('storage', syncCatalog);
    };
  }, [items, categories]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of catalogCategories) {
      map.set(cat.id, cat.name);
    }
    return map;
  }, [catalogCategories]);

  const filteredItems = useMemo(() => {
    const available = catalogItems.filter((item) => item.is_available);
    if (activeCategorySlug === 'destaques') {
      return [...available].sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return a.sort_order - b.sort_order;
      });
    }

    const selectedCategory = catalogCategories.find(
      (c) => c.slug === activeCategorySlug
    );
    if (!selectedCategory) return available;

    return available
      .filter((item) => item.category_id === selectedCategory.id)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [catalogItems, catalogCategories, activeCategorySlug]);

  const handleSelectCategory = (slug: string) => {
    if (slug === activeCategorySlug) return;
    setActiveCategorySlug(slug);
    const cat = catalogCategories.find((c) => c.slug === slug);
    trackEvent('session_context', null, null, {
      category_slug: slug,
      category_name: cat?.name || slug,
    });

    if (feedContainerRef.current) {
      feedContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCopyWifi = () => {
    if (!restaurant.wifi_password) return;
    navigator.clipboard?.writeText(restaurant.wifi_password);
    setCopiedWifi(true);
    setTimeout(() => setCopiedWifi(false), 2000);
  };

  return (
    <div
      className={cn(
        'h-[100dvh] flex flex-col overflow-hidden transition-colors',
        isLight ? 'bg-[#F6F4EF] text-[#141413]' : 'bg-[#0F0F0F] text-white'
      )}
    >
      {/* Tela de Carregamento de 5 Segundos para Destacar a Marca */}
      <MenuEntrySplash
        restaurant={restaurant}
        tableCode={initialLocationParam || undefined}
      />

      <SocialMenuHeader
        restaurant={restaurant}
        categories={catalogCategories}
        activeCategorySlug={activeCategorySlug}
        onSelectCategory={handleSelectCategory}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenWifiModal={() => setIsWifiModalOpen(true)}
        onOpenGrowthClubModal={() => setIsGrowthClubOpen(true)}
      />

      {/* Feed Social Vertical com Rolagem Fluida */}
      <main
        ref={feedContainerRef}
        className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth overscroll-y-contain no-scrollbar"
      >
        <div className="max-w-[460px] mx-auto px-3 pb-28">
          {/* Barra Guia Limpa do Cliente (Sem botão Admin exposto para o cliente!) */}
          <div
            className={cn(
              'my-2 px-3.5 py-2 rounded-2xl border flex items-center justify-between gap-2 text-xs',
              isLight
                ? 'bg-white border-zinc-200/90 text-zinc-700 shadow-sm'
                : 'bg-white/[0.04] border-white/[0.08] text-[#A1A1AA]'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Box className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate text-[11px] font-medium">
                Ordem: <strong>1. Foto</strong> • <strong>2. Vídeo</strong> •{' '}
                <strong>3. 3D/AR</strong>
              </span>
            </div>

            {restaurant.wifi_ssid && (
              <button
                type="button"
                onClick={() => setIsWifiModalOpen(true)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-colors',
                  isLight
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                )}
              >
                <Wifi className="w-3 h-3" />
                <span>Wi-Fi da Mesa</span>
              </button>
            )}
          </div>

          {/* Lista de Cards do Cardápio */}
          {filteredItems.map((item, index) => (
            <SocialProductCard
              key={item.id}
              item={item}
              categoryName={categoryMap.get(item.category_id)}
              priority={index === 0}
            />
          ))}
        </div>
      </main>

      {/* Gaveta de Pedido da Mesa */}
      <SelectionDrawer />

      {/* Modal Wi-Fi da Casa (+ Atalhos Discretos de Demonstração para Equipe) */}
      {isWifiModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
          onClick={() => setIsWifiModalOpen(false)}
        >
          <div
            className={cn(
              'w-full max-w-xs rounded-3xl border p-6 shadow-2xl',
              isLight
                ? 'bg-white border-zinc-200 text-zinc-900'
                : 'bg-[#161616] border-white/15 text-white'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-emerald-500" />
                <h3 className="font-serif text-lg">Wi-Fi para Clientes</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWifiModalOpen(false)}
                className="h-8 w-8 rounded-full bg-zinc-500/10 flex items-center justify-center text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div
                className={cn(
                  'p-3 rounded-2xl border',
                  isLight
                    ? 'bg-zinc-50 border-zinc-200'
                    : 'bg-white/[0.04] border-white/[0.06]'
                )}
              >
                <span className="text-[11px] uppercase tracking-wider text-[#A1A1AA] block">
                  Rede (SSID)
                </span>
                <span className="font-medium">{restaurant.wifi_ssid}</span>
              </div>

              <div
                className={cn(
                  'p-3 rounded-2xl border flex items-center justify-between',
                  isLight
                    ? 'bg-zinc-50 border-zinc-200'
                    : 'bg-white/[0.04] border-white/[0.06]'
                )}
              >
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#A1A1AA] block">
                    Senha
                  </span>
                  <span className="font-mono font-medium">
                    {restaurant.wifi_password}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyWifi}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 keep-white"
                >
                  {copiedWifi ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiada</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Atalhos Internos de Equipe (Garçom, Cozinha, Painel) */}
            <div className="mt-5 pt-4 border-t border-zinc-500/15 space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#A1A1AA] block">
                Ambientes da Equipe (Demonstração)
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-semibold">
                <a
                  href="/garcom"
                  className={cn(
                    'py-2 px-2 rounded-xl border flex flex-col items-center gap-1 text-center transition-colors',
                    isLight
                      ? 'bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
                      : 'bg-white/[0.05] border-white/10 text-zinc-200 hover:bg-white/10'
                  )}
                >
                  <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Garçom</span>
                </a>
                <a
                  href="/pedidos"
                  className={cn(
                    'py-2 px-2 rounded-xl border flex flex-col items-center gap-1 text-center transition-colors',
                    isLight
                      ? 'bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
                      : 'bg-white/[0.05] border-white/10 text-zinc-200 hover:bg-white/10'
                  )}
                >
                  <BellRing className="w-3.5 h-3.5 text-amber-500" />
                  <span>Cozinha</span>
                </a>
                <a
                  href="/dashboard"
                  className={cn(
                    'py-2 px-2 rounded-xl border flex flex-col items-center gap-1 text-center transition-colors',
                    isLight
                      ? 'bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
                      : 'bg-white/[0.05] border-white/10 text-zinc-200 hover:bg-white/10'
                  )}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-blue-500" />
                  <span>Gestor</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Clube de Descontos & Avaliação */}
      <GrowthClubModal
        restaurant={restaurant}
        isOpen={isGrowthClubOpen}
        onClose={() => setIsGrowthClubOpen(false)}
      />
    </div>
  );
}

export function SocialMenuClient(props: SocialMenuClientProps) {
  return (
    <MenuSessionProvider
      restaurant={props.restaurant}
      touchpoints={props.touchpoints}
      initialSourceParam={props.initialSourceParam}
      initialLocationParam={props.initialLocationParam}
    >
      <SocialMenuInner
        restaurant={props.restaurant}
        categories={props.categories}
        items={props.items}
        initialLocationParam={props.initialLocationParam}
      />
    </MenuSessionProvider>
  );
}
