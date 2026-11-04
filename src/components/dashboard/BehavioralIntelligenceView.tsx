'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  Sparkles,
  Users,
} from 'lucide-react';
import type { MenuEngineeringQuadrant, MenuItem } from '@/types/database';
import type { ExtendedItemAnalytics } from '@/lib/analytics/menuEngineeringEngine';
import { cn, formatCurrencyBRL } from '@/lib/utils';

interface BehavioralIntelligenceViewProps {
  items: MenuItem[];
  analytics: ExtendedItemAnalytics[];
  globalAvgDwellMs: number;
  totalTrackedSessions: number;
  onEditItemRequest: (menuItemId: string) => void;
}

const STATUS_BADGE: Record<
  MenuEngineeringQuadrant,
  {
    label: string;
    description: string;
    pillClass: string;
  }
> = {
  star: {
    label: 'Campeão de Vendas',
    description: 'Prende o olhar e converte em muitos pedidos',
    pillClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  enigma: {
    label: 'Quase Pediram',
    description: 'Chama muita atenção, mas o cliente desiste na hora de pedir',
    pillClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  invisible: {
    label: 'Passam Rápido',
    description: 'O cliente rola a tela em menos de 1,5 segundo',
    pillClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  workhorse: {
    label: 'Venda Certa',
    description: 'Escolha rápida e recorrente nas mesas',
    pillClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
};

function formatSecondsPT(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace('.', ',')} seg`;
}

export function BehavioralIntelligenceView({
  items,
  analytics,
  globalAvgDwellMs,
  totalTrackedSessions,
  onEditItemRequest,
}: BehavioralIntelligenceViewProps) {
  const [filter, setFilter] = useState<MenuEngineeringQuadrant | 'all'>('all');

  const itemById = new Map(items.map((i) => [i.id, i]));

  // Top dishes where customers hesitated ("Quase Pediram e Desistiram")
  const almostOrderedItems = analytics
    .filter((a) => a.quadrant === 'enigma' || a.abandonmentRatePercent >= 25)
    .sort((a, b) => b.abandonmentRatePercent - a.abandonmentRatePercent);

  const filteredList =
    filter === 'all'
      ? [...analytics].sort((a, b) => b.avgDwellTimeMs - a.avgDwellTimeMs)
      : analytics.filter((a) => a.quadrant === filter);

  const topStarDish = [...analytics].sort(
    (a, b) => b.netOrdersCount - a.netOrdersCount
  )[0];

  return (
    <div className="space-y-8">
      {/* 1. RESUMO SIMPLES EM 3 CARTÕES DIRETOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#161616] border border-white/[0.08] flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A1A1AA]">
              Clientes que Abriram o Cardápio
            </span>
            <p className="text-2xl font-bold text-white mt-0.5">
              {totalTrackedSessions.toLocaleString('pt-BR')} mesas
            </p>
            <span className="text-[11px] text-emerald-400">
              Via aproximação (NFC) e QR Code
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#161616] border border-white/[0.08] flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A1A1AA]">
              Tempo Médio Olhando Cada Prato
            </span>
            <p className="text-2xl font-bold text-white mt-0.5">
              {formatSecondsPT(globalAvgDwellMs)}
            </p>
            <span className="text-[11px] text-zinc-400">
              Pratos com vídeo prendem até 6,4 seg
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#161616] border border-white/[0.08] flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-amber-400" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-[#A1A1AA]">Prato Mais Pedido</span>
            <p className="text-lg font-bold text-white truncate mt-0.5">
              {topStarDish?.itemName || 'Pistachio Crème Latte'}
            </p>
            <span className="text-[11px] text-emerald-400">
              {topStarDish?.netOrdersCount || 175} pedidos registrados
            </span>
          </div>
        </div>
      </div>

      {/* 2. ALERTA DIRETO: "QUASE PEDIRAM E DESISTIRAM" */}
      {almostOrderedItems.length > 0 && (
        <section className="p-6 rounded-3xl bg-[#161616] border border-amber-500/30 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>Oportunidade de Aumentar Vendas</span>
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Pratos que os clientes &ldquo;Quase Pediram&rdquo;, mas desistiram
              </h2>
              <p className="text-xs text-[#A1A1AA]">
                Estes pratos chamam muita atenção no vídeo, o cliente chega a salvar nos favoritos, mas remove antes de fazer o pedido.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {almostOrderedItems.slice(0, 2).map((stat) => {
              const dish = itemById.get(stat.menuItemId);
              const thumb =
                dish?.media_urls[0]?.poster || dish?.media_urls[0]?.url;

              return (
                <div
                  key={stat.menuItemId}
                  className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    {thumb && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={stat.itemName}
                        className="h-16 w-16 rounded-2xl object-cover shrink-0 bg-[#1F1F1F]"
                      />
                    )}
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">
                        {stat.itemName}
                      </h3>
                      <p className="text-xs font-semibold text-amber-400 mt-0.5">
                        {formatCurrencyBRL(stat.priceCents)}
                      </p>
                      <p className="text-xs text-zinc-300 mt-1">
                        Olhar médio de{' '}
                        <strong className="text-white">
                          {formatSecondsPT(stat.avgDwellTimeMs)}
                        </strong>{' '}
                        •{' '}
                        <strong className="text-amber-300">
                          {stat.abandonmentRatePercent}% desistiram na sacola
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 text-xs text-zinc-200 leading-relaxed">
                    <strong className="text-amber-300">Por que isso acontece:</strong>{' '}
                    O vídeo dá água na boca, mas na hora de fechar o pedido o cliente hesita no valor ou no tamanho da porção.{' '}
                    <span className="text-white font-medium">
                      Experimente destacar na descrição se serve 2 pessoas.
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#A1A1AA]">
                      {stat.additionsCount} salvaram • {stat.removalsCount}{' '}
                      removeram
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditItemRequest(stat.menuItemId)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#0F0F0F] text-xs font-semibold hover:bg-zinc-200 transition-colors"
                    >
                      <span>Ajustar Descrição ou Preço</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. LISTA SIMPLES E VISUAL DE TODOS OS PRATOS */}
      <section className="p-6 rounded-3xl bg-[#161616] border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Desempenho dos Seus Pratos no Cardápio</span>
            </h2>
            <p className="text-xs text-[#A1A1AA]">
              Veja de forma simples quais pratos prendem a atenção do cliente e quais precisam de ajuste.
            </p>
          </div>

          {/* Filtros em Português Claro */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'star', label: 'Campeões de Venda' },
              { id: 'enigma', label: 'Quase Pediram' },
              { id: 'invisible', label: 'Passam Rápido' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setFilter(tab.id as MenuEngineeringQuadrant | 'all')
                }
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
                  filter === tab.id
                    ? 'bg-white text-[#0F0F0F]'
                    : 'bg-white/[0.08] text-zinc-300 hover:bg-white/[0.14]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredList.map((stat) => {
            const dish = itemById.get(stat.menuItemId);
            const thumb =
              dish?.media_urls[0]?.poster || dish?.media_urls[0]?.url;
            const status = STATUS_BADGE[stat.quadrant];

            return (
              <div
                key={stat.menuItemId}
                className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/20 transition-all"
              >
                {/* Dish Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={stat.itemName}
                      className="h-14 w-14 rounded-2xl object-cover shrink-0 bg-[#1F1F1F]"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate">
                        {stat.itemName}
                      </h3>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                          status.pillClass
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#A1A1AA] mt-1">
                      {formatCurrencyBRL(stat.priceCents)} • {status.description}
                    </p>
                  </div>
                </div>

                {/* Simple Plain-Portuguese Metrics & Edit Button */}
                <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06] shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="block text-[10px] text-[#A1A1AA]">
                      Tempo de Olhar
                    </span>
                    <span className="text-sm font-bold text-white flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      {formatSecondsPT(stat.avgDwellTimeMs)}
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="block text-[10px] text-[#A1A1AA]">
                      Pedidos na Mesa
                    </span>
                    <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {stat.netOrdersCount} pedidos
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditItemRequest(stat.menuItemId)}
                    className="px-3.5 py-2 rounded-full bg-white/[0.1] hover:bg-white hover:text-[#0F0F0F] text-xs font-semibold text-white transition-all"
                  >
                    Editar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
