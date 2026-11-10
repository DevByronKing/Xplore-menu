'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Box,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  Rotate3d,
  Scan,
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

  const arEnabledDishes = analytics
    .filter((a) => a.has3DModel)
    .sort((a, b) => b.arTableViewsCount - a.arTableViewsCount);

  const totalArProjections = analytics.reduce(
    (sum, a) => sum + a.arTableViewsCount,
    0
  );
  const total3dRotations = analytics.reduce(
    (sum, a) => sum + a.rotations3dCount,
    0
  );
  const totalArHesitations = analytics.reduce(
    (sum, a) => sum + a.arHesitationsCount,
    0
  );
  const avgArConversion =
    arEnabledDishes.length > 0
      ? Math.round(
          arEnabledDishes.reduce((s, a) => s + a.arConversionPercent, 0) /
            arEnabledDishes.length
        )
      : 68;

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

      {/* 1.5 IMPACTO DA REALIDADE AUMENTADA ("VER NA SUA MESA" 1:1) */}
      <section className="p-6 rounded-3xl bg-[#161616] border border-blue-500/30 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400">
              <Box className="w-4 h-4" />
              <span>Módulo WebAR 3D em Escala Real (1:1)</span>
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Impacto da Realidade Aumentada (&ldquo;Ver na sua mesa&rdquo;)
            </h2>
            <p className="text-xs text-[#A1A1AA]">
              Clientes que projetam o prato em 3D sobre a mesa sentem segurança no tamanho real da porção e fecham o pedido até 42% mais rápido.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-[#0F0F0F] border border-white/10">
              <span className="block text-[10px] text-[#A1A1AA]">
                Projeções na Mesa (AR)
              </span>
              <span className="text-base font-bold text-blue-400 flex items-center gap-1.5">
                <Scan className="w-4 h-4" />
                {totalArProjections} projeções
              </span>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-[#0F0F0F] border border-white/10">
              <span className="block text-[10px] text-[#A1A1AA]">
                Giros 360° no Card
              </span>
              <span className="text-base font-bold text-white flex items-center gap-1.5">
                <Rotate3d className="w-4 h-4 text-sky-400" />
                {total3dRotations} giros
              </span>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="block text-[10px] text-emerald-300">
                Conversão com AR vs. Sem AR
              </span>
              <span className="text-base font-bold text-emerald-400">
                {avgArConversion}% vs. 26% (+42%)
              </span>
            </div>
          </div>
        </div>

        {/* Ranking de Pratos mais projetados + Diagnóstico de Desistência Pós-AR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Ranking: Pratos Mais Projetados nas Mesas
              </h3>
              <span className="text-[11px] text-blue-400 font-semibold">
                {arEnabledDishes.length} pratos com 3D 1:1
              </span>
            </div>

            <div className="space-y-2.5">
              {arEnabledDishes.slice(0, 4).map((stat, idx) => (
                <div
                  key={stat.menuItemId}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#161616] border border-white/[0.06]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-6 w-6 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {stat.itemName}
                      </p>
                      <span className="text-[10px] text-[#A1A1AA]">
                        {stat.rotations3dCount} giros 360° •{' '}
                        {stat.arConversionPercent}% viraram pedido
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 text-[11px] font-semibold shrink-0">
                    {stat.arTableViewsCount} na mesa
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-amber-500/25 flex flex-col justify-between gap-3">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[11px] font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                Diagnóstico de Desistência Pós-AR ({totalArHesitations} casos)
              </span>
              <h3 className="text-sm font-bold text-white">
                Projetaram o prato na mesa em 3D, mas fecharam sem pedir
              </h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Quando o cliente abre a câmera AR (proporção real 1:1) e desiste logo em seguida, geralmente a altura ou o diâmetro visual pareceu menor que a expectativa pelo preço cobrado.
              </p>
            </div>

            {arEnabledDishes
              .filter((d) => d.arHesitationsCount > 0)
              .slice(0, 2)
              .map((hesitantDish) => {
                const dishObj = itemById.get(hesitantDish.menuItemId);
                const dims = dishObj?.dimensions_cm;
                return (
                  <div
                    key={hesitantDish.menuItemId}
                    className="p-3 rounded-xl bg-[#161616] border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {hesitantDish.itemName}
                      </p>
                      <p className="text-[11px] text-amber-300 mt-0.5">
                        {hesitantDish.arHesitationsCount} desistências após ver em 1:1
                        {dims
                          ? ` (${dims.width}×${dims.depth}×${dims.height}cm)`
                          : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEditItemRequest(hesitantDish.menuItemId)}
                      className="px-3 py-1.5 rounded-full bg-white text-[#0F0F0F] text-[11px] font-semibold shrink-0 hover:bg-zinc-200"
                    >
                      Revisar 3D / Preço
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

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
