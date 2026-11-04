'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Copy,
  ExternalLink,
  Plus,
  QrCode,
  Radio,
  Smartphone,
  Trash2,
  Wifi,
} from 'lucide-react';
import type {
  NfcTouchpoint,
  Restaurant,
  TouchpointSourceType,
} from '@/types/database';
import { cn, generateUUID } from '@/lib/utils';

interface NfcGeneratorViewProps {
  restaurant: Restaurant;
  touchpoints: NfcTouchpoint[];
  onSaveTouchpoints: (updated: NfcTouchpoint[]) => void;
}

function buildDeterministicMatrix(seedText: string): boolean[][] {
  const size = 15;
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isBorder = r === 0 || r === 4 || c === 0 || c === 4;
        const isCenter = r === 2 && c === 2;
        if (grid[r0 + r]) {
          grid[r0 + r]![c0 + c] = isBorder || isCenter;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 5);
  drawFinder(size - 5, 0);

  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 6 && c < 6;
      const inTopRight = r < 6 && c >= size - 6;
      const inBottomLeft = r >= size - 6 && c < 6;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      grid[r]![c] = Math.abs(hash) % 10 < 5;
    }
  }

  return grid;
}

export function NfcGeneratorView({
  restaurant,
  touchpoints,
  onSaveTouchpoints,
}: NfcGeneratorViewProps) {
  const [labelInput, setLabelInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [sourceType, setSourceType] = useState<TouchpointSourceType>('nfc');
  const [selectedTouchpointId, setSelectedTouchpointId] = useState<string>(
    touchpoints[1]?.id || touchpoints[0]?.id || ''
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedTp =
    touchpoints.find((t) => t.id === selectedTouchpointId) || touchpoints[0];

  const baseOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://xploremenu.app';

  const buildTouchpointUrl = (tp: NfcTouchpoint) =>
    `${baseOrigin}/${restaurant.slug}?source=${tp.source_type}&location=${tp.code}`;

  const handleLabelChange = (val: string) => {
    setLabelInput(val);
    const autoSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    setCodeInput(autoSlug);
  };

  const handleCreateTouchpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelInput.trim() || !codeInput.trim()) return;

    const newTp: NfcTouchpoint = {
      id: `tp-${generateUUID().slice(0, 8)}`,
      restaurant_id: restaurant.id,
      label: labelInput.trim(),
      code: codeInput.trim().toLowerCase(),
      source_type: sourceType,
      scans_count: 1,
      is_active: true,
      last_scanned_at: new Date().toISOString(),
    };

    const updated = [newTp, ...touchpoints];
    onSaveTouchpoints(updated);
    setSelectedTouchpointId(newTp.id);
    setLabelInput('');
    setCodeInput('');
  };

  const handleDeleteTouchpoint = (id: string) => {
    const updated = touchpoints.filter((t) => t.id !== id);
    onSaveTouchpoints(updated);
    if (selectedTouchpointId === id && updated[0]) {
      setSelectedTouchpointId(updated[0].id);
    }
  };

  const handleCopyUrl = (tp: NfcTouchpoint) => {
    const fullUrl = buildTouchpointUrl(tp);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(fullUrl);
    }
    setCopiedId(tp.id);
    window.setTimeout(() => setCopiedId(null), 2200);
  };

  const activeMatrix = selectedTp
    ? buildDeterministicMatrix(buildTouchpointUrl(selectedTp))
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* COLUNA ESQUERDA: CRIAR MESA E LISTA DE MESAS */}
      <div className="lg:col-span-7 space-y-6">
        <form
          onSubmit={handleCreateTouchpoint}
          className="p-6 rounded-3xl bg-[#161616] border border-white/10 space-y-4"
        >
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400" />
              <span>Cadastrar Nova Mesa, Balcão ou Vitrine</span>
            </h2>
            <p className="text-xs text-[#A1A1AA]">
              Crie um link exclusivo para saber de qual mesa veio cada pedido ou leitura.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-300">
                Nome da Mesa ou Local *
              </label>
              <input
                type="text"
                required
                value={labelInput}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="Ex: Mesa 12 • Varanda, Vitrine..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-300">
                Identificador no Link *
              </label>
              <input
                type="text"
                required
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="mesa_12"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-emerald-400 font-mono focus:outline-none focus:border-white/40"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSourceType('nfc')}
                className={cn(
                  'px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all',
                  sourceType === 'nfc'
                    ? 'bg-white text-[#0F0F0F] border-white'
                    : 'bg-[#0F0F0F] border-white/10 text-zinc-400'
                )}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Aproximação (NFC)</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('qrcode')}
                className={cn(
                  'px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all',
                  sourceType === 'qrcode'
                    ? 'bg-white text-[#0F0F0F] border-white'
                    : 'bg-[#0F0F0F] border-white/10 text-zinc-400'
                )}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Code (Câmera)</span>
              </button>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-white text-[#0F0F0F] font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Plaquinha da Mesa</span>
            </button>
          </div>
        </form>

        {/* Lista de Mesas Cadastradas */}
        <div className="p-6 rounded-3xl bg-[#161616] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              Suas Mesas e Pontos de Contato ({touchpoints.length})
            </h3>
            <span className="text-xs text-[#A1A1AA]">
              Total de acessos:{' '}
              <strong className="text-white">
                {touchpoints.reduce((acc, t) => acc + t.scans_count, 0)}
              </strong>
            </span>
          </div>

          <div className="space-y-2.5">
            {touchpoints.map((tp) => {
              const isSelected = selectedTp?.id === tp.id;
              const isCopied = copiedId === tp.id;
              const relativeUrl = `/${restaurant.slug}?source=${tp.source_type}&location=${tp.code}`;

              return (
                <div
                  key={tp.id}
                  onClick={() => setSelectedTouchpointId(tp.id)}
                  className={cn(
                    'cursor-pointer p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                    isSelected
                      ? 'bg-[#0F0F0F] border-white/40'
                      : 'bg-[#0F0F0F]/60 border-white/[0.07] hover:border-white/20'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-white/[0.08] text-white flex items-center justify-center shrink-0">
                      {tp.source_type === 'qrcode' ? (
                        <QrCode className="w-5 h-5" />
                      ) : (
                        <Radio className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">
                          {tp.label}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px] text-zinc-300">
                          {tp.scans_count} clientes
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A1A1AA] truncate mt-0.5">
                        {tp.source_type === 'qrcode'
                          ? 'Abertura por câmera (QR Code)'
                          : 'Abertura por aproximação (NFC)'}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(tp)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all',
                        isCopied
                          ? 'bg-emerald-500 text-[#0F0F0F]'
                          : 'bg-white/[0.1] hover:bg-white/[0.18] text-white'
                      )}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Link Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={relativeUrl}
                      className="p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-white transition-colors"
                      title="Abrir cardápio como se estivesse nesta mesa"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    {touchpoints.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTouchpoint(tp.id)}
                        className="p-2 rounded-full bg-white/[0.06] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors"
                        aria-label="Remover mesa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* COLUNA DIREITA: PREVIEW DA PLAQUINHA DA MESA */}
      <div className="lg:col-span-5 space-y-6">
        {selectedTp && (
          <div className="p-6 rounded-3xl bg-[#161616] border border-white/10 space-y-5 sticky top-24">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A1A1AA]">
                Modelo da Plaquinha de Mesa
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold">
                Pronta para Uso
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-[#0F0F0F] border border-white/15 shadow-2xl text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] text-white text-[10px] font-semibold uppercase tracking-wider">
                <Wifi className="w-3.5 h-3.5 rotate-90 text-emerald-400" />
                <span>Aproxime o Celular ou Aponte a Câmera</span>
              </div>

              <div>
                <h3 className="font-serif text-2xl text-white">
                  {restaurant.name}
                </h3>
                <p className="text-xs font-medium text-[#A1A1AA] mt-0.5">
                  {selectedTp.label}
                </p>
              </div>

              <div className="mx-auto w-44 h-44 rounded-2xl bg-white p-3 shadow-inner flex items-center justify-center">
                <svg
                  viewBox="0 0 15 15"
                  className="w-full h-full"
                  shapeRendering="crispEdges"
                >
                  {activeMatrix.map((row, rIdx) =>
                    row.map((cell, cIdx) =>
                      cell ? (
                        <rect
                          key={`${rIdx}-${cIdx}`}
                          x={cIdx}
                          y={rIdx}
                          width={1}
                          height={1}
                          fill="#0F0F0F"
                        />
                      ) : null
                    )
                  )}
                </svg>
              </div>

              <p className="text-[11px] text-[#A1A1AA] max-w-[230px] mx-auto">
                Toque com o celular na plaquinha para ver os pratos sendo preparados em vídeo.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Link para gravar no adesivo/cartão desta mesa:</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#161616] font-mono text-[11px] text-zinc-300 break-all border border-white/5">
                {buildTouchpointUrl(selectedTp)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(selectedTp)}
                  className="flex-1 py-2.5 rounded-full bg-white text-[#0F0F0F] font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link da Mesa</span>
                </button>
                <Link
                  href={`/${restaurant.slug}?source=${selectedTp.source_type}&location=${selectedTp.code}`}
                  className="py-2.5 px-4 rounded-full bg-white/[0.1] hover:bg-white/[0.18] text-white font-medium text-xs flex items-center gap-1.5"
                >
                  <span>Testar Mesa</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
