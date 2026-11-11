'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BellRing,
  Check,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Clock,
  DollarSign,
  ExternalLink,
  MessageCircle,
  Minus,
  Moon,
  Plus,
  Receipt,
  Search,
  Sparkles,
  Sun,
  Trash2,
  UserCheck,
  Users,
  Utensils,
} from 'lucide-react';
import {
  DEMO_CATEGORIES,
  DEMO_MENU_ITEMS,
  DEMO_RESTAURANT,
} from '@/data/mockMenuData';
import type {
  Category,
  MenuItem,
  OrderPaymentPreference,
  TableOrder,
  TableOrderStatus,
} from '@/types/database';
import {
  CATALOG_UPDATED_EVENT,
  loadStoredCategories,
  loadStoredMenuItems,
} from '@/lib/storage/menuCatalogStorage';
import {
  buildWhatsAppOrderUrl,
  closeTableOrders,
  fetchMergedTableOrders,
  getBroadcastChannelName,
  ORDERS_UPDATED_EVENT,
  PAYMENT_LABELS_PT,
  playKitchenOrderBell,
  submitNewTableOrder,
  updateTableOrderStatus,
} from '@/lib/storage/ordersStorage';
import { useTheme } from '@/context/ThemeContext';
import { cn, formatCurrencyBRL, generateUUID } from '@/lib/utils';

interface WaiterProfile {
  id: string;
  name: string;
  role: string;
  sector: string;
  avatarInitials: string;
  shiftGoalCents: number;
}

const WAITER_PROFILES: WaiterProfile[] = [
  {
    id: 'waiter-lucas',
    name: 'Lucas Almeida',
    role: 'Garçom Sênior',
    sector: 'Salão Principal (Mesas 01–06)',
    avatarInitials: 'LA',
    shiftGoalCents: 250000,
  },
  {
    id: 'waiter-camila',
    name: 'Camila Rocha',
    role: 'Atendimento & Sommelier de Cafés',
    sector: 'Jardim & Lounge (Mesas 07–12)',
    avatarInitials: 'CR',
    shiftGoalCents: 220000,
  },
  {
    id: 'waiter-diego',
    name: 'Diego Martins',
    role: 'Barista & Balcão',
    sector: 'Balcão & Vitrine',
    avatarInitials: 'DM',
    shiftGoalCents: 180000,
  },
];

const RESTAURANT_TABLES = [
  'Mesa 01',
  'Mesa 02',
  'Mesa 03',
  'Mesa 04',
  'Mesa 05',
  'Mesa 06',
  'Mesa 07',
  'Mesa 08',
  'Mesa 09',
  'Mesa 10',
  'Mesa 11',
  'Mesa 12',
  'Balcão 01',
];

const QUICK_KITCHEN_NOTES = [
  'Cortar ao meio',
  'Sem cebola',
  'Bem quente',
  'Leite de aveia (vegano)',
  'Servir junto com café',
  'Sem gelo',
];

interface DraftOrderItem {
  item: MenuItem;
  quantity: number;
  notes: string;
}

export function WaiterTerminalClient() {
  const { isLight, toggleTheme } = useTheme();

  const [activeWaiter, setActiveWaiter] = useState<WaiterProfile>(
    () =>
      WAITER_PROFILES[0] ?? {
        id: 'waiter-lucas',
        name: 'Lucas Almeida',
        role: 'Garçom Sênior',
        sector: 'Salão Principal',
        avatarInitials: 'LA',
        shiftGoalCents: 250000,
      }
  );
  const [selectedTable, setSelectedTable] = useState<string>('Mesa 04');
  const [activeView, setActiveView] = useState<'annotate' | 'tab'>('annotate');

  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEMO_MENU_ITEMS);
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
  const [orders, setOrders] = useState<TableOrder[]>([]);

  // Order annotation state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [draftItems, setDraftItems] = useState<DraftOrderItem[]>([]);
  const [paymentPreference, setPaymentPreference] =
    useState<OrderPaymentPreference>('tab_end');
  const [orderSentBanner, setOrderSentBanner] = useState<string | null>(null);

  // Table bill splitter & service fee state
  const [includeServiceFee, setIncludeServiceFee] = useState(true);
  const [splitPeopleCount, setSplitPeopleCount] = useState<number>(2);
  const [tableClosedBanner, setTableClosedBanner] = useState<string | null>(
    null
  );

  const refreshAll = async () => {
    setMenuItems(loadStoredMenuItems(DEMO_MENU_ITEMS));
    setCategories(loadStoredCategories(DEMO_CATEGORIES));
    const mergedOrders = await fetchMergedTableOrders();
    setOrders(mergedOrders);
  };

  useEffect(() => {
    void refreshAll();
    const handleSync = () => void refreshAll();

    window.addEventListener(CATALOG_UPDATED_EVENT, handleSync);
    window.addEventListener(ORDERS_UPDATED_EVENT, handleSync);
    window.addEventListener('storage', handleSync);

    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel(getBroadcastChannelName());
      bc.onmessage = () => void refreshAll();
    }

    const interval = window.setInterval(handleSync, 3500);
    return () => {
      window.removeEventListener(CATALOG_UPDATED_EVENT, handleSync);
      window.removeEventListener(ORDERS_UPDATED_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
      bc?.close();
      window.clearInterval(interval);
    };
  }, []);

  // Group orders by table
  const ordersByTable = useMemo(() => {
    const map = new Map<string, TableOrder[]>();
    for (const table of RESTAURANT_TABLES) {
      map.set(table, []);
    }
    for (const order of orders) {
      const normalized = order.tableLabel.split('•')[0]?.trim() || 'Mesa 04';
      const list = map.get(normalized) || [];
      list.push(order);
      map.set(normalized, list);
    }
    return map;
  }, [orders]);

  const selectedTableOrders = useMemo(
    () => ordersByTable.get(selectedTable) || [],
    [ordersByTable, selectedTable]
  );

  // Calculate waiter shift performance metrics
  const waiterMetrics = useMemo(() => {
    let activeTablesCount = 0;
    ordersByTable.forEach((list) => {
      if (list.length > 0) activeTablesCount += 1;
    });

    const totalRevenueCents = orders.reduce((acc, o) => acc + o.totalCents, 0);
    const serviceCommissionCents = Math.round(totalRevenueCents * 0.1);
    const readyToServeCount = orders.filter(
      (o) => o.status === 'preparando' || o.status === 'novo'
    ).length;

    return {
      activeTablesCount,
      totalOrdersCount: orders.length,
      totalRevenueCents,
      serviceCommissionCents,
      readyToServeCount,
    };
  }, [orders, ordersByTable]);

  // Filter catalog items for fast waiter annotation
  const filteredCatalog = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.is_available) return false;
      if (categoryFilter !== 'all' && item.category_id !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [menuItems, categoryFilter, searchQuery]);

  // Draft Order Manipulation
  const handleAddDraftItem = (item: MenuItem) => {
    setDraftItems((prev) => {
      const existing = prev.find((d) => d.item.id === item.id);
      if (existing) {
        return prev.map((d) =>
          d.item.id === item.id ? { ...d, quantity: d.quantity + 1 } : d
        );
      }
      return [...prev, { item, quantity: 1, notes: '' }];
    });
  };

  const handleDecreaseDraftItem = (itemId: string) => {
    setDraftItems((prev) =>
      prev
        .map((d) =>
          d.item.id === itemId ? { ...d, quantity: d.quantity - 1 } : d
        )
        .filter((d) => d.quantity > 0)
    );
  };

  const handleUpdateDraftNote = (itemId: string, notes: string) => {
    setDraftItems((prev) =>
      prev.map((d) => (d.item.id === itemId ? { ...d, notes } : d))
    );
  };

  const handleAppendQuickNote = (itemId: string, chip: string) => {
    setDraftItems((prev) =>
      prev.map((d) => {
        if (d.item.id !== itemId) return d;
        const current = d.notes.trim();
        if (current.toLowerCase().includes(chip.toLowerCase())) return d;
        return {
          ...d,
          notes: current ? `${current}, ${chip}` : chip,
        };
      })
    );
  };

  const draftTotalCents = useMemo(
    () =>
      draftItems.reduce(
        (acc, entry) => acc + entry.item.price_cents * entry.quantity,
        0
      ),
    [draftItems]
  );

  const handleSubmitWaiterOrder = async () => {
    if (draftItems.length === 0) return;

    const newOrder: TableOrder = {
      id: `ord-garcom-${generateUUID().slice(0, 8)}`,
      orderNumber: Math.floor(200 + (Date.now() % 790)),
      restaurantId: DEMO_RESTAURANT.id,
      tableLabel: selectedTable,
      locationCode: selectedTable.toLowerCase().replace(/\s+/g, '_'),
      source: 'link',
      waiterName: activeWaiter.name,
      items: draftItems.map((d) => ({
        itemId: d.item.id,
        name: d.item.name,
        quantity: d.quantity,
        priceCents: d.item.price_cents,
        notes: d.notes.trim()
          ? `${d.notes.trim()} (Garçom: ${activeWaiter.name.split(' ')[0]})`
          : `Anotado por ${activeWaiter.name.split(' ')[0]}`,
      })),
      totalCents: draftTotalCents,
      paymentPreference,
      status: 'novo',
      createdAt: new Date().toISOString(),
    };

    await submitNewTableOrder(newOrder);
    playKitchenOrderBell();
    setDraftItems([]);
    setOrderSentBanner(
      `Pedido #${newOrder.orderNumber} enviado para a cozinha (${selectedTable})!`
    );
    void refreshAll();
    setTimeout(() => setOrderSentBanner(null), 4000);
  };

  // Selected Table Tab Totals & Bill Splitting
  const tableTabSummary = useMemo(() => {
    const subtotalCents = selectedTableOrders.reduce(
      (acc, o) => acc + o.totalCents,
      0
    );
    const serviceFeeCents = includeServiceFee
      ? Math.round(subtotalCents * 0.1)
      : 0;
    const grandTotalCents = subtotalCents + serviceFeeCents;
    const perPersonCents = Math.round(
      grandTotalCents / Math.max(1, splitPeopleCount)
    );

    return {
      subtotalCents,
      serviceFeeCents,
      grandTotalCents,
      perPersonCents,
    };
  }, [selectedTableOrders, includeServiceFee, splitPeopleCount]);

  const handleAdvanceStatus = async (
    orderId: string,
    nextStatus: TableOrderStatus
  ) => {
    await updateTableOrderStatus(orderId, nextStatus);
    void refreshAll();
  };

  const handleCloseAndFreeTable = async () => {
    if (selectedTableOrders.length === 0) return;
    await closeTableOrders(selectedTable);
    setTableClosedBanner(
      `Comanda da ${selectedTable} encerrada com sucesso! Mesa liberada.`
    );
    void refreshAll();
    setTimeout(() => setTableClosedBanner(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col theme-adaptive">
      {/* CABEÇALHO DO TERMINAL DO GARÇOM */}
      <header className="sticky top-0 z-40 bg-[#0F0F0F]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
                {activeWaiter.avatarInitials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                    Terminal do Garçom • Comanda Rápida
                  </span>
                </div>
                <h1 className="font-serif text-lg sm:text-xl text-white">
                  {activeWaiter.name} • {DEMO_RESTAURANT.name}
                </h1>
              </div>
            </div>

            <div className="flex lg:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-full bg-white/[0.08] border border-white/10 text-white"
              >
                {isLight ? (
                  <Moon className="w-3.5 h-3.5" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                )}
              </button>
              <Link
                href="/pedidos"
                className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold flex items-center gap-1"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Cozinha</span>
              </Link>
            </div>
          </div>

          {/* Seletor de Perfil de Garçom */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {WAITER_PROFILES.map((profile) => {
              const isCurrent = profile.id === activeWaiter.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setActiveWaiter(profile)}
                  className={cn(
                    'px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shrink-0 transition-all border',
                    isCurrent
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg keep-white'
                      : 'bg-[#161616] text-zinc-300 border-white/10 hover:text-white'
                  )}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{profile.name}</span>
                </button>
              );
            })}
          </div>

          {/* Navegação Rápida Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="px-3 py-2 rounded-full bg-[#161616] border border-white/10 text-xs font-medium text-zinc-300 flex items-center gap-1.5"
            >
              {isLight ? (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  <span>Modo Escuro</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modo Claro</span>
                </>
              )}
            </button>

            <Link
              href="/pedidos"
              className="px-3.5 py-2 rounded-full bg-amber-500/15 border border-amber-400/30 text-xs font-semibold text-amber-300 flex items-center gap-1.5"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Monitor da Cozinha</span>
            </Link>

            <Link
              href="/dashboard"
              className="px-3.5 py-2 rounded-full bg-[#161616] border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5"
            >
              <span>Painel Gestor</span>
            </Link>

            <Link
              href={`/${DEMO_RESTAURANT.slug}?source=nfc&location=mesa_04`}
              className="px-4 py-2 rounded-full bg-white text-[#0F0F0F] text-xs font-semibold flex items-center gap-1.5"
            >
              <span>Cardápio Cliente</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* RESUMO DO TURNO DO GARÇOM */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#161616] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#A1A1AA] block">
                Mesas Ocupadas
              </span>
              <span className="text-2xl font-bold text-white mt-0.5 block">
                {waiterMetrics.activeTablesCount} / {RESTAURANT_TABLES.length}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#161616] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#A1A1AA] block">
                Prontos p/ Servir
              </span>
              <span className="text-2xl font-bold text-emerald-400 mt-0.5 block">
                {waiterMetrics.readyToServeCount} pedido(s)
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <BellRing className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#161616] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#A1A1AA] block">
                Vendas nas Mesas
              </span>
              <span className="text-2xl font-bold text-white mt-0.5 block">
                {formatCurrencyBRL(waiterMetrics.totalRevenueCents)}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#161616] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#A1A1AA] block">
                Sua Comissão (10%)
              </span>
              <span className="text-2xl font-bold text-emerald-400 mt-0.5 block">
                {formatCurrencyBRL(waiterMetrics.serviceCommissionCents)}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* MAPA DE MESAS EM TEMPO REAL */}
        <section className="p-4 sm:p-5 rounded-3xl bg-[#161616] border border-white/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-400" />
                <span>Mapa de Mesas • Toque na mesa para anotar ou fechar conta</span>
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#A1A1AA]">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-zinc-500" /> Livre
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Novo Pedido
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Pronto p/ Servir
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-400" /> Ocupada
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
            {RESTAURANT_TABLES.map((table) => {
              const tOrders = ordersByTable.get(table) || [];
              const isSelected = selectedTable === table;
              const hasReady = tOrders.some((o) => o.status === 'preparando');
              const hasNew = tOrders.some((o) => o.status === 'novo');
              const totalCents = tOrders.reduce(
                (acc, o) => acc + o.totalCents,
                0
              );

              return (
                <button
                  key={table}
                  type="button"
                  onClick={() => setSelectedTable(table)}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[78px]',
                    isSelected
                      ? 'ring-2 ring-amber-400 bg-amber-500/15 border-amber-400'
                      : hasReady
                        ? 'bg-emerald-500/15 border-emerald-400/50'
                        : hasNew
                          ? 'bg-amber-500/10 border-amber-400/40'
                          : tOrders.length > 0
                            ? 'bg-blue-500/10 border-blue-400/30'
                            : 'bg-[#0F0F0F] border-white/10 hover:border-white/25'
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white truncate">
                      {table}
                    </span>
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full shrink-0',
                        hasReady
                          ? 'bg-emerald-400 animate-ping'
                          : hasNew
                            ? 'bg-amber-400 animate-pulse'
                            : tOrders.length > 0
                              ? 'bg-blue-400'
                              : 'bg-zinc-600'
                      )}
                    />
                  </div>

                  {tOrders.length > 0 ? (
                    <div className="mt-2">
                      <span className="text-[10px] text-zinc-300 block">
                        {tOrders.length} ped.
                      </span>
                      <span className="text-xs font-bold text-amber-400">
                        {formatCurrencyBRL(totalCents)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-500 mt-2 block">
                      Mesa Livre
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* BANNERS DE CONFIRMAÇÃO */}
        {orderSentBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-sm font-bold flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{orderSentBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('tab')}
              className="px-3 py-1 rounded-xl bg-emerald-500 text-white text-xs font-bold keep-white"
            >
              Ver Comanda da Mesa →
            </button>
          </div>
        )}

        {tableClosedBanner && (
          <div className="p-4 rounded-2xl bg-blue-500/20 border border-blue-400 text-blue-200 text-sm font-bold flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
            <span>{tableClosedBanner}</span>
          </div>
        )}

        {/* ALTERNADOR DE FUNÇÃO DA MESA SELECIONADA: ANOTAR PEDIDO vs FECHAR CONTA */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold block">
              Operação na Mesa Selecionada
            </span>
            <h3 className="font-serif text-2xl text-white">
              {selectedTable} •{' '}
              {selectedTableOrders.length > 0
                ? `${selectedTableOrders.length} pedido(s) na comanda`
                : 'Comanda Vazia'}
            </h3>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#161616] border border-white/10">
            <button
              type="button"
              onClick={() => setActiveView('annotate')}
              className={cn(
                'px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all',
                activeView === 'annotate'
                  ? 'bg-white text-[#0F0F0F] shadow'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <ClipboardList className="w-4 h-4" />
              <span>1. Anotar Pedido na Mesa</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('tab')}
              className={cn(
                'px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all',
                activeView === 'tab'
                  ? 'bg-white text-[#0F0F0F] shadow'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <Receipt className="w-4 h-4" />
              <span>
                2. Comanda & Dividir Conta ({selectedTableOrders.length})
              </span>
            </button>
          </div>
        </div>

        {/* MODO 1: ANOTAR PEDIDO RÁPIDO PARA A MESA */}
        {activeView === 'annotate' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Catálogo Rápido de Pratos (7 colunas) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Busca e Filtro por Categoria */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar prato ou bebida pelo nome..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#161616] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-semibold shrink-0 border transition-all',
                      categoryFilter === 'all'
                        ? 'bg-amber-400 text-[#0F0F0F] border-amber-400 font-bold'
                        : 'bg-[#161616] text-zinc-300 border-white/10'
                    )}
                  >
                    Todos
                  </button>
                  {categories
                    .filter((c) => c.slug !== 'destaques')
                    .map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryFilter(cat.id)}
                        className={cn(
                          'px-3 py-2 rounded-xl text-xs font-semibold shrink-0 border transition-all',
                          categoryFilter === cat.id
                            ? 'bg-amber-400 text-[#0F0F0F] border-amber-400 font-bold'
                            : 'bg-[#161616] text-zinc-300 border-white/10'
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                </div>
              </div>

              {/* Grade de Pratos para Lançamento 1-Toque */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCatalog.map((item) => {
                  const inDraft = draftItems.find((d) => d.item.id === item.id);
                  const thumb =
                    item.media_urls.find((m) => m.type === 'image')?.url ||
                    item.media_urls[0]?.poster ||
                    item.media_urls[0]?.url;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all',
                        inDraft
                          ? 'bg-emerald-500/10 border-emerald-400/50'
                          : 'bg-[#161616] border-white/10 hover:border-white/25'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumb}
                          alt={item.name}
                          className="h-14 w-14 rounded-xl object-cover shrink-0 border border-white/10"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {item.name}
                          </h4>
                          <span className="text-xs font-bold text-amber-400 block mt-0.5">
                            {formatCurrencyBRL(item.price_cents)}
                          </span>
                          {item.prep_time_minutes && (
                            <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {item.prep_time_minutes} min
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddDraftItem(item)}
                        className="h-10 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs flex items-center gap-1 shrink-0 shadow keep-white active:scale-95 transition-transform"
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          {inDraft ? `Add (${inDraft.quantity})` : 'Anotar'}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bloco de Anotação da Mesa (5 colunas) */}
            <div className="lg:col-span-5">
              <div className="p-5 rounded-3xl bg-[#161616] border border-white/15 space-y-4 sticky top-24">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
                      Bloco de Pedido • {activeWaiter.name}
                    </span>
                    <h4 className="font-serif text-xl text-white">
                      Lançar para {selectedTable}
                    </h4>
                  </div>
                  {draftItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDraftItems([])}
                      className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpar</span>
                    </button>
                  )}
                </div>

                {draftItems.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <ClipboardList className="w-8 h-8 text-zinc-500 mx-auto" />
                    <p className="text-xs font-medium text-zinc-300">
                      Toque em &ldquo;Anotar&rdquo; nos pratos ao lado para
                      montar o pedido da {selectedTable}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {draftItems.map(({ item, quantity, notes }) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate">
                              {quantity}x {item.name}
                            </span>
                            <span className="text-[11px] text-amber-400 font-semibold">
                              {formatCurrencyBRL(item.price_cents * quantity)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDecreaseDraftItem(item.id)}
                              className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center text-white"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold w-5 text-center">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddDraftItem(item)}
                              className="h-7 w-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center keep-white"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Atalhos Rápidos de Observação para a Cozinha */}
                        <div className="flex flex-wrap gap-1">
                          {QUICK_KITCHEN_NOTES.map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() =>
                                handleAppendQuickNote(item.id, chip)
                              }
                              className="px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[10px] text-zinc-300"
                            >
                              + {chip}
                            </button>
                          ))}
                        </div>

                        <input
                          type="text"
                          value={notes}
                          onChange={(e) =>
                            handleUpdateDraftNote(item.id, e.target.value)
                          }
                          placeholder="Observação da cozinha (ex: ponto, alergia, dividir)..."
                          className="w-full px-3 py-1.5 rounded-xl bg-[#161616] border border-white/10 text-[11px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Preferência de Pagamento e Botão Enviar para Cozinha */}
                {draftItems.length > 0 && (
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Total do Lançamento</span>
                      <span className="text-lg font-bold text-white">
                        {formatCurrencyBRL(draftTotalCents)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {(
                        [
                          ['tab_end', 'Comanda da Mesa'],
                          ['card_machine', 'Levar Maquininha'],
                          ['cash', 'Dinheiro'],
                          ['pix_now', 'Pix na Mesa'],
                        ] as [OrderPaymentPreference, string][]
                      ).map(([pref, label]) => (
                        <button
                          key={pref}
                          type="button"
                          onClick={() => setPaymentPreference(pref)}
                          className={cn(
                            'py-2 px-2.5 rounded-xl border font-semibold text-left truncate',
                            paymentPreference === pref
                              ? 'bg-amber-400 text-[#0F0F0F] border-amber-400 font-bold'
                              : 'bg-[#0F0F0F] text-zinc-300 border-white/10'
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmitWaiterOrder}
                      className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 keep-white active:scale-[0.99]"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Disparar Pedido para a Cozinha ({selectedTable})</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODO 2: COMANDA DA MESA, DIVISÃO DE CONTA & FECHAMENTO */}
        {activeView === 'tab' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Lista de Pedidos da Mesa (7 colunas) */}
            <div className="lg:col-span-7 space-y-3">
              {selectedTableOrders.length === 0 ? (
                <div className="p-10 rounded-3xl bg-[#161616] border border-white/10 text-center space-y-3">
                  <Receipt className="w-8 h-8 text-zinc-500 mx-auto" />
                  <h4 className="font-serif text-xl text-white">
                    Nenhum pedido aberto na {selectedTable}
                  </h4>
                  <p className="text-xs text-[#A1A1AA]">
                    Use a aba &ldquo;1. Anotar Pedido na Mesa&rdquo; para lançar
                    itens ou aguarde o cliente pedir pelo QR Code / NFC.
                  </p>
                </div>
              ) : (
                selectedTableOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-[#161616] border border-white/10 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                      <div>
                        <span className="text-xs font-bold text-white">
                          Pedido #{order.orderNumber} • {order.tableLabel}
                        </span>
                        <span className="text-[11px] text-zinc-400 block">
                          {order.waiterName
                            ? `Anotado por ${order.waiterName}`
                            : 'Pedido pelo Celular do Cliente (QR/NFC)'}{' '}
                          • {PAYMENT_LABELS_PT[order.paymentPreference]}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {order.status !== 'entregue' ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleAdvanceStatus(order.id, 'entregue')
                            }
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 keep-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Marcar Entregue na Mesa</span>
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                            ✓ Servido na Mesa
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {order.items.map((it, idx) => (
                        <div
                          key={`${order.id}-${idx}`}
                          className="flex items-start justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white">
                              {it.quantity}x {it.name}
                            </span>
                            {it.notes && (
                              <span className="block text-[11px] text-amber-300">
                                Obs: {it.notes}
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-zinc-200">
                            {formatCurrencyBRL(it.priceCents * it.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                      <a
                        href={buildWhatsAppOrderUrl(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Enviar via WhatsApp</span>
                      </a>
                      <span className="font-bold text-sm text-white">
                        Subtotal: {formatCurrencyBRL(order.totalCents)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculadora de Fechamento de Conta & Divisão por Pessoa (5 colunas) */}
            <div className="lg:col-span-5">
              <div className="p-5 rounded-3xl bg-[#161616] border border-white/15 space-y-4 sticky top-24">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                    Fechamento de Comanda
                  </span>
                  <h4 className="font-serif text-xl text-white">
                    Resumo da Conta • {selectedTable}
                  </h4>
                </div>

                <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span>Consumo dos Pedidos</span>
                    <span className="font-semibold text-white">
                      {formatCurrencyBRL(tableTabSummary.subtotalCents)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeServiceFee}
                        onChange={(e) => setIncludeServiceFee(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      <span>Taxa de Serviço do Garçom (10%)</span>
                    </label>
                    <span className="font-semibold text-emerald-400">
                      + {formatCurrencyBRL(tableTabSummary.serviceFeeCents)}
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-base font-bold text-white">
                    <span>Total da Mesa</span>
                    <span className="text-amber-400 text-lg">
                      {formatCurrencyBRL(tableTabSummary.grandTotalCents)}
                    </span>
                  </div>
                </div>

                {/* Divisão de Conta por Número de Pessoas */}
                <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>Dividir conta entre:</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSplitPeopleCount(num)}
                          className={cn(
                            'h-7 w-7 rounded-lg text-xs font-bold transition-all',
                            splitPeopleCount === num
                              ? 'bg-blue-600 text-white keep-white'
                              : 'bg-white/10 text-zinc-300'
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-xs text-zinc-400">
                      Valor por pessoa ({splitPeopleCount}x):
                    </span>
                    <span className="text-base font-bold text-emerald-400">
                      {formatCurrencyBRL(tableTabSummary.perPersonCents)} / pessoa
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={selectedTableOrders.length === 0}
                  onClick={handleCloseAndFreeTable}
                  className={cn(
                    'w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all',
                    selectedTableOrders.length > 0
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg keep-white active:scale-[0.99]'
                      : 'bg-white/10 text-zinc-500 cursor-not-allowed'
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Receber Pagamento & Liberar {selectedTable}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
