'use client';

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Check,
  Heart,
  QrCode,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import type { MenuItem } from '@/types/database';
import { useMenuSession } from '@/context/MenuSessionContext';
import { cn, formatCurrencyBRL } from '@/lib/utils';

const DynamicDishARViewer = dynamic(
  () => import('@/components/menu/DishARViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-full rounded-2xl bg-neutral-900/90 border border-white/10 flex items-center justify-center text-xs text-zinc-400">
        Carregando visualizador 3D em escala real...
      </div>
    ),
  }
);

interface ProductARModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductARModal({ item, isOpen, onClose }: ProductARModalProps) {
  const {
    restaurant,
    sessionOrigin,
    getItemQuantity,
    isItemLiked,
    addItemToSelection,
    trackEvent,
  } = useMenuSession();

  const [showDesktopQrFallback, setShowDesktopQrFallback] = useState(false);
  const hasTriggeredArRef = useRef(false);

  if (!isOpen || !item.model_glb_url) return null;

  const quantity = getItemQuantity(item.id);
  const liked = isItemLiked(item.id);
  const isSaved = quantity > 0 || liked;
  const posterMedia = item.media_urls[0]?.poster || item.media_urls[0]?.url;

  const handleCloseModal = () => {
    // Se o cliente acionou "Ver na sua mesa" (ar_table_view) e fechou sem adicionar ao pedido, registra 'ar_hesitation'
    if (hasTriggeredArRef.current && quantity === 0 && !liked) {
      trackEvent('ar_hesitation', item.id, null, {
        price_cents: item.price_cents,
        hesitation_reason: 'ar_view_without_order',
      });
    }
    setShowDesktopQrFallback(false);
    onClose();
  };

  const handleRotate3D = () => {
    trackEvent('3d_rotate', item.id, null, {
      price_cents: item.price_cents,
    });
  };

  const handleActivateAR = () => {
    hasTriggeredArRef.current = true;
    trackEvent('ar_table_view', item.id, null, {
      price_cents: item.price_cents,
    });
  };

  const currentOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://xplore-menu.vercel.app';

  const mobileArUrl = `${currentOrigin}/${restaurant.slug}?source=qrcode&location=${encodeURIComponent(
    sessionOrigin.locationCode || 'mesa_04'
  )}&ar_item=${encodeURIComponent(item.id)}`;

  const qrCodeImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
    mobileArUrl
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      onClick={handleCloseModal}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#161616] border-t sm:border border-white/15 shadow-2xl p-5 space-y-4 max-h-[92dvh] overflow-y-auto theme-adaptive"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Box className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block">
                Realidade Aumentada WebAR
              </span>
              <h3 className="text-sm font-bold text-white">
                Projeção 3D na Mesa (Proporção 1:1)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center"
            aria-label="Fechar visualizador 3D"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/*Cabeçalho de Produto */}
        <div className="p-3.5 rounded-2xl bg-[#0F0F0F] border border-white/10 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-serif text-xl text-white leading-tight">
              {item.name}
            </h4>
            <p className="text-xs text-[#A1A1AA] line-clamp-2 mt-1">
              {item.description}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
              Valor
            </span>
            <span className="text-base font-bold text-white">
              {formatCurrencyBRL(item.price_cents)}
            </span>
          </div>
        </div>

        {/* Viewport 3D Interativa + Botão "Ver na sua mesa" */}
        <DynamicDishARViewer
          modelGlbUrl={item.model_glb_url}
          modelUsdzUrl={item.model_usdz_url}
          posterUrl={posterMedia}
          itemName={item.name}
          arScaleFixed={item.ar_scale_fixed !== false}
          dimensionsCm={item.dimensions_cm}
          onRotate3D={handleRotate3D}
          onActivateAR={handleActivateAR}
          onDesktopFallbackNeeded={() => setShowDesktopQrFallback(true)}
        />

        {/* Fallback Inteligente para Desktop (QR Code Dinâmico) */}
        {showDesktopQrFallback && (
          <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-3 animate-fadeIn">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-bold text-white">
                  Aponte a câmera do seu celular para projetar na mesa
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDesktopQrFallback(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-white shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeImageSrc}
                  alt={`QR Code AR para ${item.name}`}
                  className="w-24 h-24 object-contain"
                />
              </div>
              <div className="space-y-1.5 text-xs text-zinc-300">
                <p>
                  Como você está em um computador, escaneie este QR Code com seu{' '}
                  <strong>iPhone</strong> ou <strong>Android</strong> para abrir a
                  câmera em Realidade Aumentada 1:1.
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] text-blue-300 font-semibold">
                  <Sparkles className="w-3 h-3" />
                  Sem precisar baixar aplicativo
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé Rápido: Adicionar ao Pedido ou Mostrar QR Code */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowDesktopQrFallback((prev) => !prev)}
            className="px-3 py-2.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-zinc-300 flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-400" />
            <span>QR Code Celular</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (quantity === 0) {
                addItemToSelection(item);
              }
              onClose();
            }}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
              isSaved
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-white text-[#0F0F0F] hover:bg-zinc-200'
            )}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Salvo no seu Pedido</span>
              </>
            ) : (
              <>
                <Heart className="w-3.5 h-3.5" />
                <span>Gostei! Adicionar ao Pedido</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
