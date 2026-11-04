'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  ExternalLink,
  QrCode,
  RefreshCw,
  UtensilsCrossed,
} from 'lucide-react';
import {
  DEMO_CATEGORIES,
  DEMO_MENU_ITEMS,
  DEMO_RESTAURANT,
  DEMO_TOUCHPOINTS,
} from '@/data/mockMenuData';
import type {
  Category,
  MenuItem,
  NfcTouchpoint,
  TelemetryEventPayload,
} from '@/types/database';
import {
  CATALOG_UPDATED_EVENT,
  loadStoredCategories,
  loadStoredMenuItems,
  loadStoredTouchpoints,
  resetCatalogToDefault,
  saveStoredCategories,
  saveStoredMenuItems,
  saveStoredTouchpoints,
} from '@/lib/storage/menuCatalogStorage';
import { getLocalTelemetryHistory } from '@/lib/storage/offlinePersistence';
import { computeMenuEngineeringAnalytics } from '@/lib/analytics/menuEngineeringEngine';
import { BehavioralIntelligenceView } from '@/components/dashboard/BehavioralIntelligenceView';
import { MenuManagementView } from '@/components/dashboard/MenuManagementView';
import { NfcGeneratorView } from '@/components/dashboard/NfcGeneratorView';
import { cn } from '@/lib/utils';

type DashboardTab = 'intelligence' | 'catalog' | 'nfc';

export function DashboardClient() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('intelligence');
  const [items, setItems] = useState<MenuItem[]>(DEMO_MENU_ITEMS);
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
  const [touchpoints, setTouchpoints] =
    useState<NfcTouchpoint[]>(DEMO_TOUCHPOINTS);
  const [liveEvents, setLiveEvents] = useState<TelemetryEventPayload[]>([]);
  const [editItemIdRequest, setEditItemIdRequest] = useState<string | null>(
    null
  );

  const refreshData = () => {
    setItems(loadStoredMenuItems(DEMO_MENU_ITEMS));
    setCategories(loadStoredCategories(DEMO_CATEGORIES));
    setTouchpoints(loadStoredTouchpoints(DEMO_TOUCHPOINTS));
    setLiveEvents(getLocalTelemetryHistory());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener(CATALOG_UPDATED_EVENT, refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener(CATALOG_UPDATED_EVENT, refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  const { itemAnalytics, globalAvgDwellMs, totalTrackedSessions } = useMemo(
    () => computeMenuEngineeringAnalytics(items, categories, liveEvents),
    [items, categories, liveEvents]
  );

  const handleSaveItems = (updated: MenuItem[]) => {
    setItems(updated);
    saveStoredMenuItems(updated);
  };

  const handleSaveCategories = (updated: Category[]) => {
    setCategories(updated);
    saveStoredCategories(updated);
  };

  const handleSaveTouchpoints = (updated: NfcTouchpoint[]) => {
    setTouchpoints(updated);
    saveStoredTouchpoints(updated);
  };

  const handleResetDefaults = () => {
    const defaults = resetCatalogToDefault();
    setItems(defaults.items);
    setCategories(defaults.categories);
    setTouchpoints(defaults.touchpoints);
  };

  const handleEditItemFromIntelligence = (menuItemId: string) => {
    setEditItemIdRequest(menuItemId);
    setActiveTab('catalog');
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col">
      {/* CABEÇALHO LIMPO DO LOJISTA */}
      <header className="sticky top-0 z-40 bg-[#0F0F0F]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={DEMO_RESTAURANT.logo_url}
                alt={DEMO_RESTAURANT.name}
                className="h-10 w-10 rounded-full object-cover border border-white/15"
              />
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#A1A1AA]">
                  Painel do Estabelecimento
                </span>
                <h1 className="font-serif text-xl text-white">
                  {DEMO_RESTAURANT.name}
                </h1>
              </div>
            </div>

            <Link
              href={`/${DEMO_RESTAURANT.slug}?source=nfc&location=mesa_04`}
              className="md:hidden inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#0F0F0F] text-xs font-semibold"
            >
              <span>Ver Cardápio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Abas Simples em Português */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#161616] border border-white/[0.08] overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('intelligence')}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all',
                activeTab === 'intelligence'
                  ? 'bg-white text-[#0F0F0F]'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Resumo & Vendas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all',
                activeTab === 'catalog'
                  ? 'bg-white text-[#0F0F0F]'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Pratos & Preços ({items.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('nfc')}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all',
                activeTab === 'nfc'
                  ? 'bg-white text-[#0F0F0F]'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Mesas & QR Code ({touchpoints.length})</span>
            </button>
          </div>

          {/* Botões à Direita */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={refreshData}
              className="px-3.5 py-2 rounded-full bg-[#161616] hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 flex items-center gap-1.5"
              title="Atualizar dados das mesas"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Atualizar</span>
            </button>

            <Link
              href={`/${DEMO_RESTAURANT.slug}?source=nfc&location=mesa_04`}
              className="px-4 py-2 rounded-full bg-white text-[#0F0F0F] text-xs font-semibold flex items-center gap-1.5 hover:bg-zinc-200 transition-all"
            >
              <span>Ver Cardápio do Cliente</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'intelligence' && (
          <BehavioralIntelligenceView
            items={items}
            analytics={itemAnalytics}
            globalAvgDwellMs={globalAvgDwellMs}
            totalTrackedSessions={totalTrackedSessions}
            onEditItemRequest={handleEditItemFromIntelligence}
          />
        )}

        {activeTab === 'catalog' && (
          <MenuManagementView
            restaurantId={DEMO_RESTAURANT.id}
            items={items}
            categories={categories}
            initialEditItemId={editItemIdRequest}
            onClearEditRequest={() => setEditItemIdRequest(null)}
            onSaveItems={handleSaveItems}
            onSaveCategories={handleSaveCategories}
            onResetDefaults={handleResetDefaults}
          />
        )}

        {activeTab === 'nfc' && (
          <NfcGeneratorView
            restaurant={DEMO_RESTAURANT}
            touchpoints={touchpoints}
            onSaveTouchpoints={handleSaveTouchpoints}
          />
        )}
      </main>
    </div>
  );
}
