'use client';

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Eye,
  EyeOff,
  Flame,
  HelpCircle,
  Heart,
  Layers,
  MousePointerClick,
  Sparkles,
  TrendingDown,
  Video,
  Image as ImageIcon,
} from 'lucide-react';
import type { MenuEngineeringQuadrant } from '@/types/database';
import type { ExtendedItemAnalytics } from '@/lib/analytics/menuEngineeringEngine';
import { cn, formatCurrencyBRL, formatDurationSeconds } from '@/lib/utils';

interface BehavioralIntelligenceViewProps {
  analytics: ExtendedItemAnalytics[];
  globalAvgDwellMs: number;
  globalInteractionRate: number;
  totalTrackedSessions: number;
  totalHesitationEvents: number;
  liveEventsCount: number;
  onEditItemRequest: (menuItemId: string) => void;
}

const QUADRANT_META: Record<
  MenuEngineeringQuadrant,
  {
    title: string;
    subtitle: string;
    badgeClass: string;
    borderClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  star: {
    title: 'Estrelas (Stars)',
    subtitle: 'Alta Atenção (≥3.5s) + Alta Conversão',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    borderClass: 'border-emerald-500/30 bg-emerald-500/[0.03]',
    icon: Flame,
  },
  enigma: {
    title: 'Enigmas ("Quase Pediu")',
    subtitle: 'Alta Atenção no Vídeo + Alta Desistência',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    borderClass: 'border-amber-500/35 bg-amber-500/[0.04]',
    icon: HelpCircle,
  },
  invisible: {
    title: 'Invisíveis (< 1.5s)',
    subtitle: 'Scroll Rápido • Baixa Retenção Visual',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    borderClass: 'border-rose-500/30 bg-rose-500/[0.03]',
    icon: EyeOff,
  },
  workhorse: {
    title: 'Cavalos de Batalha',
    subtitle: 'Decisão Rápida (1.5s–3.5s) + Pedido Fiel',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    borderClass: 'border-sky-500/30 bg-sky-500/[0.03]',
    icon: Layers,
  },
};

export function BehavioralIntelligenceView({
  analytics,
  globalAvgDwellMs,
  globalInteractionRate,
  totalTrackedSessions,
  totalHesitationEvents,
  liveEventsCount,
  onEditItemRequest,
}: BehavioralIntelligenceViewProps) {
  const [selectedQuadrantFilter, setSelectedQuadrantFilter] = useState<
    MenuEngineeringQuadrant | 'all'
  >('all');

  // Sort by Avg Dwell Time descending for the Retention Ranking
  const sortedByDwell = [...analytics].sort(
    (a, b) => b.avgDwellTimeMs - a.avgDwellTimeMs
  );
  const maxDwellMs = Math.max(
    7000,
    ...sortedByDwell.map((item) => item.avgDwellTimeMs)
  );

  // Sort by Hesitation Score descending for the "Quase Pediu e Desistiu" Report
  const hesitationReportItems = [...analytics]
    .filter((item) => item.removalsCount > 0 || item.hesitationScore >= 20)
    .sort((a, b) => b.hesitationScore - a.hesitationScore);

  const filteredMatrixItems =
    selectedQuadrantFilter === 'all'
      ? analytics
      : analytics.filter((item) => item.quadrant === selectedQuadrantFilter);

  const quadrantCounts = {
    star: analytics.filter((i) => i.quadrant === 'star').length,
    enigma: analytics.filter((i) => i.quadrant === 'enigma').length,
    invisible: analytics.filter((i) => i.quadrant === 'invisible').length,
    workhorse: analytics.filter((i) => i.quadrant === 'workhorse').length,
  };

  return (
    <div className="space-y-8">
      {/* 1. TOP BEHAVIORAL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-obsidian-900 border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Sessões NFC / QR na Mesa</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {totalTrackedSessions.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              +18.4% sem.
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">
            {liveEventsCount > 0
              ? `Inclui ${liveEventsCount} eventos ao vivo desta sessão`
              : '78% acionado via Tag NFC nas mesas'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-obsidian-900 border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Dwell Time Médio por Prato</span>
            <Clock className="w-4 h-4 text-brand" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">
              {formatDurationSeconds(globalAvgDwellMs)}
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              Vídeos: 5.8s
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Medido via IntersectionObserver (&ge;70% viewport)
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-obsidian-900 border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Taxa de Engajamento Profundo</span>
            <MousePointerClick className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {globalInteractionRate}%
            </span>
            <span className="text-xs text-zinc-400">swipes, likes & sacola</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Clientes que interagem convertem 3.4x mais
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-obsidian-900 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span>Alertas &ldquo;Quase Pediu e Desistiu&rdquo;</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">
              {totalHesitationEvents}
            </span>
            <span className="text-xs font-semibold text-amber-300/80">
              em {quadrantCounts.enigma} pratos Enigma
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Adicionaram aos favoritos e removeram antes de pedir
          </p>
        </div>
      </div>

      {/* 2. AUTOMATIC MENU ENGINEERING MATRIX (4 QUADRANTS) */}
      <section className="p-6 rounded-3xl bg-obsidian-900 border border-white/10 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Engenharia de Cardápio Automatizada</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Matriz de Atenção Visual vs. Conversão Real
            </h2>
            <p className="text-xs text-zinc-400">
              Classificação automática baseada no tempo de retenção de tela (Dwell Time) e na hesitação da sacola.
            </p>
          </div>

          {/* Quadrant Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedQuadrantFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                selectedQuadrantFilter === 'all'
                  ? 'bg-white text-obsidian-950'
                  : 'bg-obsidian-800 text-zinc-300 hover:text-white'
              )}
            >
              Todos ({analytics.length})
            </button>
            {(['star', 'enigma', 'invisible', 'workhorse'] as const).map((q) => {
              const meta = QUADRANT_META[q];
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => setSelectedQuadrantFilter(q)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                    selectedQuadrantFilter === q
                      ? meta.badgeClass + ' ring-2 ring-white/20'
                      : 'bg-obsidian-950 border-white/10 text-zinc-400 hover:text-white'
                  )}
                >
                  {meta.title.split(' ')[0]} ({quadrantCounts[q]})
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Quadrant Summary Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(['star', 'enigma', 'workhorse', 'invisible'] as const).map((q) => {
            const meta = QUADRANT_META[q];
            const Icon = meta.icon;
            return (
              <div
                key={q}
                onClick={() =>
                  setSelectedQuadrantFilter(
                    selectedQuadrantFilter === q ? 'all' : q
                  )
                }
                className={cn(
                  'cursor-pointer p-4 rounded-2xl border transition-all',
                  meta.borderClass,
                  selectedQuadrantFilter === q && 'ring-2 ring-white/30'
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <Icon className="w-4 h-4" />
                    {meta.title}
                  </span>
                  <span className="text-sm font-black text-white px-2 py-0.5 rounded-lg bg-white/10">
                    {quadrantCounts[q]}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">{meta.subtitle}</p>
              </div>
            );
          })}
        </div>

        {/* Matrix Dishes Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {filteredMatrixItems.map((item) => {
            const meta = QUADRANT_META[item.quadrant];
            const Icon = meta.icon;
            return (
              <div
                key={item.menuItemId}
                className="p-4 rounded-2xl bg-obsidian-950 border border-white/[0.08] flex flex-col justify-between gap-3 hover:border-white/20 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        {item.categoryName} • {formatCurrencyBRL(item.priceCents)}
                      </span>
                      <h3 className="text-sm font-extrabold text-white mt-0.5">
                        {item.itemName}
                      </h3>
                    </div>

                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0',
                        meta.badgeClass
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {meta.title.split(' ')[0]}
                    </span>
                  </div>

                  {/* Metrics Strip */}
                  <div className="grid grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="p-2 rounded-xl bg-obsidian-900 border border-white/5">
                      <span className="text-zinc-500 block text-[10px]">
                        Dwell Time
                      </span>
                      <span className="font-mono font-bold text-white">
                        {formatDurationSeconds(item.avgDwellTimeMs)}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-obsidian-900 border border-white/5">
                      <span className="text-zinc-500 block text-[10px]">
                        Interação
                      </span>
                      <span className="font-mono font-bold text-sky-400">
                        {item.interactionRatePercent}%
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-obsidian-900 border border-white/5">
                      <span className="text-zinc-500 block text-[10px]">
                        Conversão
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        {item.conversionRatePercent}%
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-obsidian-900 border border-white/5">
                      <span className="text-zinc-500 block text-[10px]">
                        Desistência
                      </span>
                      <span
                        className={cn(
                          'font-mono font-bold',
                          item.abandonmentRatePercent >= 25
                            ? 'text-amber-400'
                            : 'text-zinc-300'
                        )}
                      >
                        {item.abandonmentRatePercent}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                    <strong className="text-white">Diagnóstico:</strong>{' '}
                    {item.diagnosticNote}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <p className="text-[11px] text-amber-300/90 leading-snug">
                    <strong>Ação sugerida:</strong> {item.recommendedAction}
                  </p>
                  <button
                    type="button"
                    onClick={() => onEditItemRequest(item.menuItemId)}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-brand/20 text-zinc-200 hover:text-brand-light text-[11px] font-semibold transition-colors"
                  >
                    <span>Otimizar</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. RANKING: DWELL TIME VS. INTERACTION RATE */}
      <section className="p-6 rounded-3xl bg-obsidian-900 border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-brand" />
              <span>
                Ranking de Retenção Visual (Dwell Time) vs. Taxa de Interação
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Comparativo direto do tempo médio que cada prato mantém o cliente parado na tela (&ge;70% da viewport).
            </p>
          </div>
          <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold self-start sm:self-auto">
            Vídeos geram +210% mais tempo de atenção
          </span>
        </div>

        <div className="space-y-3">
          {sortedByDwell.map((item, idx) => {
            const dwellPercent = Math.min(
              100,
              Math.round((item.avgDwellTimeMs / maxDwellMs) * 100)
            );
            const isFastScroll = item.avgDwellTimeMs < 1500;

            return (
              <div
                key={item.menuItemId}
                className="p-4 rounded-2xl bg-obsidian-950 border border-white/[0.07] space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-lg bg-obsidian-800 text-zinc-300 text-xs font-black flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {item.itemName}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold',
                        item.hasVideo
                          ? 'bg-brand/20 text-brand-light border border-brand/30'
                          : 'bg-white/5 text-zinc-400'
                      )}
                    >
                      {item.hasVideo ? (
                        <>
                          <Video className="w-3 h-3" />
                          <span>Vídeo Loop</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3 h-3" />
                          <span>Foto Estática</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-zinc-400">
                      <strong className="text-white">{item.uniqueViewers}</strong>{' '}
                      views
                    </span>
                    <span className="text-rose-400 flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-rose-500" />
                      {item.likesCount}
                    </span>
                    <span
                      className={cn(
                        'font-bold px-2 py-0.5 rounded-lg',
                        isFastScroll
                          ? 'bg-rose-500/15 text-rose-300'
                          : 'bg-emerald-500/15 text-emerald-300'
                      )}
                    >
                      {formatDurationSeconds(item.avgDwellTimeMs)} méd.
                    </span>
                  </div>
                </div>

                {/* Dual Progress Bars: Dwell Time vs Interaction Rate */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Tempo de Tela (Dwell Time)</span>
                      <span className="font-mono text-white">
                        {item.avgDwellTimeMs} ms
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-obsidian-800 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          isFastScroll
                            ? 'bg-rose-500'
                            : item.avgDwellTimeMs >= 4500
                            ? 'bg-gradient-to-r from-brand to-amber-400'
                            : 'bg-emerald-400'
                        )}
                        style={{ width: `${dwellPercent}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Taxa de Interação (Swipes / Likes / Sacola)</span>
                      <span className="font-mono text-sky-400">
                        {item.interactionRatePercent}% (Conv. {item.conversionRatePercent}
                        %)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-obsidian-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-400 transition-all duration-500"
                        style={{ width: `${item.interactionRatePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. REPORT: "QUASE PEDIU E DESISTIU" (CART HESITATION & ABANDONMENT) */}
      <section className="p-6 rounded-3xl bg-gradient-to-b from-amber-500/[0.07] to-obsidian-900 border border-amber-500/30 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              <TrendingDown className="w-4 h-4" />
              <span>Diagnóstico de Atrito de Conversão</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Relatório &ldquo;Quase Pediu e Desistiu&rdquo; (Cart Hesitation)
            </h2>
            <p className="text-xs text-zinc-300">
              Pratos que despertam desejo inicial (adicionados aos favoritos ou vistos &gt;3x), mas sofrem remoção antes do pedido.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-400">
                <th className="py-3 pr-4">Prato / Preço</th>
                <th className="py-3 px-3">Atenção Média</th>
                <th className="py-3 px-3">Adições à Sacola</th>
                <th className="py-3 px-3">Desistências (Remoções)</th>
                <th className="py-3 px-3">Consultas Alergênicos</th>
                <th className="py-3 pl-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {hesitationReportItems.slice(0, 6).map((item) => (
                <tr
                  key={item.menuItemId}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3.5 pr-4">
                    <div className="font-bold text-white">{item.itemName}</div>
                    <div className="text-[11px] text-amber-400 font-semibold">
                      {formatCurrencyBRL(item.priceCents)} • {item.categoryName}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-zinc-200">
                    {formatDurationSeconds(item.avgDwellTimeMs)}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-emerald-400 font-bold">
                    {item.additionsCount} adições
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold">
                      <span>{item.removalsCount} desistências</span>
                      <span>({item.abandonmentRatePercent}%)</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-zinc-300">
                    {item.allergenExpandsCount} cliques
                  </td>
                  <td className="py-3.5 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => onEditItemRequest(item.menuItemId)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-obsidian-950 font-bold text-[11px] hover:brightness-110 transition-all"
                    >
                      Editar Preço / Ficha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
