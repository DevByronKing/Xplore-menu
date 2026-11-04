'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  ChefHat,
  Clock,
  MessageCircle,
  Plus,
  Printer,
  Radio,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { TableOrder, TableOrderStatus } from '@/types/database';
import { DEMO_RESTAURANT } from '@/data/mockMenuData';
import {
  buildWhatsAppOrderUrl,
  fetchMergedTableOrders,
  getBroadcastChannelName,
  ORDERS_UPDATED_EVENT,
  PAYMENT_LABELS_PT,
  playKitchenOrderBell,
  submitNewTableOrder,
  updateTableOrderStatus,
} from '@/lib/storage/ordersStorage';
import { cn, formatCurrencyBRL, generateUUID } from '@/lib/utils';

export function LiveOrdersView() {
  const [orders, setOrders] = useState<TableOrder[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('5511999999999');
  const [lastRungOrderId, setLastRungOrderId] = useState<string | null>(null);

  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  const loadOrders = useCallback(
    async (triggerSoundOnNew = true) => {
      const merged = await fetchMergedTableOrders();
      setOrders(merged);

      if (!initialLoadDoneRef.current) {
        initialLoadDoneRef.current = true;
        merged.forEach((o) => knownOrderIdsRef.current.add(o.id));
        return;
      }

      // Check if any brand new order arrived
      let foundNewOrder: TableOrder | null = null;
      for (const ord of merged) {
        if (!knownOrderIdsRef.current.has(ord.id)) {
          knownOrderIdsRef.current.add(ord.id);
          if (ord.status === 'novo') {
            foundNewOrder = ord;
          }
        }
      }

      if (foundNewOrder && triggerSoundOnNew && soundEnabled) {
        setLastRungOrderId(foundNewOrder.id);
        playKitchenOrderBell();
      }
    },
    [soundEnabled]
  );

  useEffect(() => {
    void loadOrders(false);

    const interval = window.setInterval(() => {
      void loadOrders(true);
    }, 2500);

    const handleCustomEvent = () => {
      void loadOrders(true);
    };

    window.addEventListener(ORDERS_UPDATED_EVENT, handleCustomEvent);
    window.addEventListener('storage', handleCustomEvent);

    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel(getBroadcastChannelName());
        bc.onmessage = (ev) => {
          if (ev.data?.type === 'NEW_ORDER') {
            void loadOrders(true);
          } else {
            void loadOrders(false);
          }
        };
      } catch {
        // Ignore
      }
    }

    return () => {
      window.clearInterval(interval);
      window.removeEventListener(ORDERS_UPDATED_EVENT, handleCustomEvent);
      window.removeEventListener('storage', handleCustomEvent);
      bc?.close();
    };
  }, [loadOrders]);

  const handleStatusChange = async (
    orderId: string,
    nextStatus: TableOrderStatus
  ) => {
    await updateTableOrderStatus(orderId, nextStatus);
    await loadOrders(false);
  };

  const handleSimulateOrderArrival = async () => {
    const sampleTables = [
      { label: 'Mesa 04', code: 'mesa_04' },
      { label: 'Mesa 01', code: 'mesa_01' },
      { label: 'Mesa 08', code: 'mesa_08' },
    ];
    const picked =
      sampleTables[Math.floor(Math.random() * sampleTables.length)]!;

    const demoOrder: TableOrder = {
      id: `ord-${generateUUID().slice(0, 8)}`,
      orderNumber: Math.floor(105 + (Date.now() % 890)),
      restaurantId: DEMO_RESTAURANT.id,
      tableLabel: picked.label,
      locationCode: picked.code,
      source: 'nfc',
      items: [
        {
          itemId: 'item-focaccia-stracciatella-figo',
          name: 'Focaccia Stracciatella & Figo',
          quantity: 1,
          priceCents: 5890,
          notes: 'Caprichar no mel de laranjeira',
        },
        {
          itemId: 'item-espresso-tonic-yuzu',
          name: 'Yuzu & Siciliano Espresso Tonic',
          quantity: 1,
          priceCents: 2590,
        },
      ],
      totalCents: 8480,
      paymentPreference: 'tab_end',
      status: 'novo',
      createdAt: new Date().toISOString(),
    };

    knownOrderIdsRef.current.add(demoOrder.id);
    await submitNewTableOrder(demoOrder);
    if (soundEnabled) {
      playKitchenOrderBell();
    }
    setLastRungOrderId(demoOrder.id);
    await loadOrders(false);
  };

  const newOrders = orders.filter((o) => o.status === 'novo');
  const preparingOrders = orders.filter((o) => o.status === 'preparando');
  const deliveredOrders = orders.filter((o) => o.status === 'entregue');

  return (
    <div className="space-y-6">
      {/* BARRA DE CONTROLE DA COZINHA / CAIXA */}
      <div className="p-5 rounded-3xl bg-[#161616] border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Recebendo Pedidos das Mesas em Tempo Real
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Monitor de Pedidos na Cozinha & Garçom
          </h2>
          <p className="text-xs text-[#A1A1AA]">
            Quando o cliente envia o pedido na mesa, a campainha toca automaticamente nesta tela.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* WhatsApp do Caixa Config */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0F0F0F] border border-white/10 text-xs">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">WhatsApp Caixa:</span>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-28 bg-transparent text-white font-mono text-xs focus:outline-none"
              placeholder="5511999999999"
            />
          </div>

          {/* Botão Testar Campainha */}
          <button
            type="button"
            onClick={() => playKitchenOrderBell()}
            className="px-3.5 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold text-white flex items-center gap-1.5"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-400" />
            <span>Testar Som</span>
          </button>

          {/* Toggle Som Ativo */}
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playKitchenOrderBell();
            }}
            className={cn(
              'px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all',
              soundEnabled
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-white/[0.06] border-white/10 text-zinc-400'
            )}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Alerta Sonoro Ativo</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Som Silenciado</span>
              </>
            )}
          </button>

          {/* Botão Simular Pedido para Demonstração Comercial */}
          <button
            type="button"
            onClick={() => void handleSimulateOrderArrival()}
            className="px-4 py-2 rounded-full bg-white text-[#0F0F0F] font-semibold text-xs flex items-center gap-1.5 hover:bg-zinc-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Simular Pedido da Mesa</span>
          </button>
        </div>
      </div>

      {/* 3 COLUNAS DE PEDIDOS: NOVOS | PREPARANDO | ENTREGUES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* COLUNA 1: NOVOS PEDIDOS */}
        <div className="p-5 rounded-3xl bg-[#161616] border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Novos Pedidos da Mesa</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-[#0F0F0F] text-xs font-bold">
              {newOrders.length}
            </span>
          </div>

          {newOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Aguardando novos pedidos das mesas...
            </div>
          ) : (
            <div className="space-y-3">
              {newOrders.map((order) => (
                <div
                  key={order.id}
                  className={cn(
                    'p-4 rounded-2xl bg-[#0F0F0F] border space-y-3 transition-all',
                    lastRungOrderId === order.id
                      ? 'border-amber-400 ring-2 ring-amber-400/25'
                      : 'border-white/15'
                  )}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                        <Radio className="w-3 h-3" />
                        Pedido #{order.orderNumber}
                      </span>
                      <h4 className="font-serif text-xl text-white">
                        {order.tableLabel}
                      </h4>
                    </div>
                    <span className="text-xs text-[#A1A1AA] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Itens do Pedido */}
                  <div className="space-y-2 text-xs">
                    {order.items.map((it, idx) => (
                      <div key={`${it.itemId}-${idx}`}>
                        <div className="flex items-start justify-between text-white font-semibold">
                          <span>
                            <strong className="text-amber-400 mr-1.5">
                              {it.quantity}x
                            </strong>
                            {it.name}
                          </span>
                          <span>
                            {formatCurrencyBRL(it.priceCents * it.quantity)}
                          </span>
                        </div>
                        {it.notes && (
                          <p className="text-[11px] text-amber-300 mt-0.5 pl-4">
                            Obs: {it.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagamento & Total */}
                  <div className="pt-2 border-t border-white/10 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>Total</span>
                      <span>{formatCurrencyBRL(order.totalCents)}</span>
                    </div>
                    <p className="text-[11px] text-[#A1A1AA]">
                      Pagamento:{' '}
                      <strong className="text-zinc-200">
                        {PAYMENT_LABELS_PT[order.paymentPreference]}
                      </strong>
                      {order.cashChangeFor &&
                        ` (Troco p/ R$ ${order.cashChangeFor})`}
                    </p>
                  </div>

                  {/* Botões de Ação */}
                  <div className="pt-1 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void handleStatusChange(order.id, 'preparando')
                      }
                      className="w-full py-2.5 rounded-full bg-white text-[#0F0F0F] font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-200 transition-colors"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Aceitar & Enviar para Preparo</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={buildWhatsAppOrderUrl(order, whatsappNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-zinc-200 text-[11px] font-medium flex items-center justify-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUNA 2: EM PREPARO NA COZINHA */}
        <div className="p-5 rounded-3xl bg-[#161616] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-sky-400" />
              <span>Em Preparo na Cozinha</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold">
              {preparingOrders.length}
            </span>
          </div>

          {preparingOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Nenhum pedido em preparo no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {preparingOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-[#0F0F0F] border border-sky-500/30 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                        Preparando • #{order.orderNumber}
                      </span>
                      <h4 className="font-serif text-xl text-white">
                        {order.tableLabel}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-white">
                      {formatCurrencyBRL(order.totalCents)}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {order.items.map((it, idx) => (
                      <div key={`${it.itemId}-${idx}`} className="text-zinc-200">
                        <strong className="text-white">{it.quantity}x</strong>{' '}
                        {it.name}
                        {it.notes && (
                          <span className="block text-[11px] text-amber-300 pl-4">
                            Obs: {it.notes}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void handleStatusChange(order.id, 'entregue')
                    }
                    className="w-full py-2.5 rounded-full bg-emerald-500 text-[#0F0F0F] font-semibold text-xs flex items-center justify-center gap-1.5 hover:brightness-110"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pronto • Entregar na Mesa</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUNA 3: ENTREGUES NA MESA */}
        <div className="p-5 rounded-3xl bg-[#161616] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Entregues na Mesa</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
              {deliveredOrders.length}
            </span>
          </div>

          {deliveredOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Os pedidos entregues aparecerão aqui.
            </div>
          ) : (
            <div className="space-y-2.5">
              {deliveredOrders.slice(0, 8).map((order) => (
                <div
                  key={order.id}
                  className="p-3.5 rounded-2xl bg-[#0F0F0F]/70 border border-white/[0.06] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white">
                      {order.tableLabel} • #{order.orderNumber}
                    </div>
                    <div className="text-[11px] text-[#A1A1AA]">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                  </div>
                  <span className="font-semibold text-emerald-400 shrink-0 ml-2">
                    {formatCurrencyBRL(order.totalCents)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
