'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
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

  const {
    itemAnalytics,
    globalAvgDwellMs,
    globalInteractionRate,
    totalTrackedSessions,
    totalHesitationEvents,
  } = useMemo(
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
    <div className="min-h-screen bg-obsidian-950 text-white flex flex-col">
      {/* TOP ADMIN NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-obsidian-950/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Tenant Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={DEMO_RESTAURANT.logo_url}
                alt={DEMO_RESTAURANT.name}
                className="h-10 w-10 rounded-xl object-cover ring-2 ring-brand/50"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand">
                    Xplore Menu • Painel do Restaurante
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Telemetria Ativa
                  </span>
                </div>
                <h1 className="text-base font-black text-white">
                  {DEMO_RESTAURANT.name}
                </h1>
              </div>
            </div>

            <Link
              href={`/${DEMO_RESTAURANT.slug}?source=nfc&location=mesa_04`}
              className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand text-obsidian-950 text-xs font-extrabold"
            >
              <span>Ver Cardápio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-obsidian-900 border border-white/[0.08] overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('intelligence')}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all',
                activeTab === 'intelligence'
                  ? 'bg-gradient-to-r from-brand to-amber-500 text-obsidian-950 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Inteligência & Engenharia</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all',
                activeTab === 'catalog'
                  ? 'bg-gradient-to-r from-brand to-amber-500 text-obsidian-950 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Gestão de Cardápio ({items.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('nfc')}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all',
                activeTab === 'nfc'
                  ? 'bg-gradient-to-r from-brand to-amber-500 text-obsidian-950 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <QrCode className="w-4 h-4" />
              <span>Gerador NFC / QR ({touchpoints.length})</span>
            </button>
          </div>

          {/* Right Actions: Refresh Live Telemetry + Open Social Menu */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={refreshData}
              className="px-3 py-2 rounded-xl bg-obsidian-900 hover:bg-obsidian-800 border border-white/10 text-xs font-semibold text-zinc-300 flex items-center gap-1.5"
              title="Sincronizar últimos eventos de telemetria"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sync ({liveEvents.length} eventos locais)</span>
            </button>

            <Link
              href={`/${DEMO_RESTAURANT.slug}?source=nfc&location=mesa_04`}
              className="px-4 py-2 rounded-xl bg-obsidian-800 hover:bg-brand hover:text-obsidian-950 border border-brand/40 text-xs font-bold text-brand-light flex items-center gap-1.5 transition-all"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Abrir Cardápio Social</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'intelligence' && (
          <BehavioralIntelligenceView
            analytics={itemAnalytics}
            globalAvgDwellMs={globalAvgDwellMs}
            globalInteractionRate={globalInteractionRate}
            totalTrackedSessions={totalTrackedSessions}
            totalHesitationEvents={totalHesitationEvents}
            liveEventsCount={liveEvents.length}
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
