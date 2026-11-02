'use client';

import React from 'react';
import {
  Activity,
  AlertCircle,
  Clock,
  RefreshCw,
  Send,
  X,
} from 'lucide-react';
import type { MenuItem } from '@/types/database';
import { useMenuSession } from '@/context/MenuSessionContext';
import { formatDurationSeconds } from '@/lib/utils';

interface LiveTelemetryHudProps {
  items: MenuItem[];
}

export function LiveTelemetryHud({ items }: LiveTelemetryHudProps) {
  const {
    sessionOrigin,
    isTelemetryHudOpen,
    setIsTelemetryHudOpen,
    dwellTimeByItem,
    viewCountByItem,
    hesitationItems,
    recentSessionEvents,
    pendingBatchCount,
    flushTelemetryNow,
  } = useMenuSession();

  if (!isTelemetryHudOpen) return null;

  const itemNameMap = new Map(items.map((i) => [i.id, i.name]));

  return (
    <div className="fixed bottom-20 inset-x-0 z-40 px-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto rounded-2xl bg-obsidian-950/95 border border-brand/40 shadow-2xl backdrop-blur-xl p-3.5 text-xs space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-white flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-brand" />
              Motor de Telemetria Comportamental
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void flushTelemetryNow()}
              className="px-2 py-1 rounded-lg bg-brand/20 hover:bg-brand/30 text-brand-light font-semibold text-[10px] flex items-center gap-1"
              title="Forçar envio do lote agora"
            >
              <Send className="w-3 h-3" />
              <span>Flush ({pendingBatchCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setIsTelemetryHudOpen(false)}
              className="p-1 rounded-lg bg-white/5 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Origin & Session Info */}
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div className="p-2 rounded-xl bg-obsidian-900 border border-white/5">
            <span className="text-zinc-500 block">Origem NFC/QR</span>
            <span className="font-mono font-bold text-emerald-400">
              {sessionOrigin.source.toUpperCase()} • {sessionOrigin.locationCode}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-obsidian-900 border border-white/5">
            <span className="text-zinc-500 block">Rede / Device</span>
            <span className="font-mono font-bold text-zinc-200">
              {sessionOrigin.deviceType} ({sessionOrigin.connectionType})
            </span>
          </div>
          <div className="p-2 rounded-xl bg-obsidian-900 border border-white/5">
            <span className="text-zinc-500 block">Hesitações</span>
            <span className="font-mono font-bold text-amber-400">
              {hesitationItems.length} detectadas
            </span>
          </div>
        </div>

        {/* Top Dwell Times */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-brand" />
            Dwell Time Acumulado (IntersectionObserver &ge; 70%)
          </p>
          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
            {Object.entries(dwellTimeByItem).length === 0 ? (
              <p className="text-[11px] text-zinc-500 italic">
                Role o feed para medir o tempo de atenção por prato...
              </p>
            ) : (
              Object.entries(dwellTimeByItem)
                .sort((a, b) => b[1] - a[1])
                .map(([itemId, ms]) => (
                  <div
                    key={itemId}
                    className="flex items-center justify-between py-1 px-2 rounded-lg bg-obsidian-900/90 text-[11px]"
                  >
                    <span className="text-zinc-200 truncate max-w-[190px]">
                      {itemNameMap.get(itemId) || itemId}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-zinc-500">
                        {viewCountByItem[itemId] || 1}x views
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {formatDurationSeconds(ms)}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Live Stream of Latest Events */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-amber-400" />
            Fila de Eventos Recentes (Batch 5s + LocalStorage)
          </p>
          <div className="space-y-1 max-h-24 overflow-y-auto font-mono text-[10px]">
            {recentSessionEvents.slice(0, 6).map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between px-2 py-1 rounded bg-black/50 text-zinc-300"
              >
                <span className="text-amber-300 font-semibold">{ev.event_type}</span>
                <span className="truncate max-w-[130px] text-zinc-400">
                  {ev.menu_item_id
                    ? itemNameMap.get(ev.menu_item_id)?.slice(0, 18)
                    : ev.metadata.location}
                </span>
                <span className="text-emerald-400">
                  {ev.duration_ms ? `${ev.duration_ms}ms` : 'instant'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {hesitationItems.length > 0 && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px]">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Alerta &ldquo;Quase Pediu e Desistiu&rdquo;:</strong> item removido da sacola ou visualizado &gt;3x sem conversão.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
