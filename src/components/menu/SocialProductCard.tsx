'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Heart,
  Plus,
  Check,
  Sparkles,
  AlertTriangle,
  Clock,
  Flame,
  Utensils,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Box,
  Camera,
  Play,
  Image as ImageIcon,
  Maximize2,
} from 'lucide-react';
import type { MenuItem, MediaAsset } from '@/types/database';
import { useMenuSession } from '@/context/MenuSessionContext';
import { useItemDwellObserver } from '@/hooks/useItemDwellObserver';
import { formatCurrencyBRL, cn } from '@/lib/utils';
import { ProductARModal } from '@/components/menu/ProductARModal';

const DishARViewer = dynamic(
  () => import('@/components/menu/DishARViewer'),
  { ssr: false }
);

interface SocialProductCardProps {
  item: MenuItem;
  categoryName?: string;
  priority?: boolean;
}

type PresentationStage = 'photo' | 'video' | '3d';

export function SocialProductCard({ item }: SocialProductCardProps) {
  const {
    isItemLiked,
    getItemQuantity,
    toggleLikeItem,
    addItemToSelection,
    removeItemFromSelection,
    trackEvent,
  } = useMenuSession();

  const { elementRef, isVisibleInViewport } = useItemDwellObserver({
    item,
    threshold: 0.55,
  });

  // Separate media into primary Photo and primary Preparation Video
  const { primaryPhoto, primaryVideo } = useMemo(() => {
    const assets = Array.isArray(item.media_urls) ? item.media_urls : [];
    const photo =
      assets.find((m) => m.type === 'image') ||
      ({
        id: `${item.id}-fallback-img`,
        type: 'image',
        url:
          assets[0]?.poster ||
          'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=900&q=85',
        alt: item.name,
      } as MediaAsset);

    const video = assets.find((m) => m.type === 'video') || null;
    return { primaryPhoto: photo, primaryVideo: video };
  }, [item]);

  const modelGlbUrl =
    item.model_glb_url || '/models/focaccia-burrata.glb?v=2';

  // Presentation order requested by user: 1. Foto -> 2. Vídeo -> 3. 3D/AR
  const [stage, setStage] = useState<PresentationStage>('photo');
  const [showDetails, setShowDetails] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoStepLabel, setVideoStepLabel] = useState<string>(
    'Etapa 1/4 • Início do Preparo'
  );
  const [showARModal, setShowARModal] = useState(false);

  const lastTapRef = useRef<number>(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isLiked = isItemLiked(item.id);
  const selectedQuantity = getItemQuantity(item.id);
  const isSelected = selectedQuantity > 0;

  const stagesOrder: PresentationStage[] = primaryVideo
    ? ['photo', 'video', '3d']
    : ['photo', '3d'];
  const currentStageIndex = stagesOrder.indexOf(stage);

  // Control HTML5 video playback when in 'video' stage and visible in viewport
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (stage === 'video' && isVisibleInViewport && !videoFailed) {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay fallback handled gracefully
        });
      }
    } else {
      videoEl.pause();
    }
  }, [stage, isVisibleInViewport, videoFailed]);

  const switchStage = (nextStage: PresentationStage, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (nextStage === stage) return;
    setStage(nextStage);
    const idx = stagesOrder.indexOf(nextStage);
    trackEvent('media_swipe', item.id, null, {
      media_index: Math.max(0, idx),
    });
    if (nextStage === '3d') {
      trackEvent('3d_rotate', item.id, null, {
        price_cents: item.price_cents,
      });
    }
  };

  const handlePrevStage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIdx =
      (currentStageIndex - 1 + stagesOrder.length) % stagesOrder.length;
    const target = stagesOrder[prevIdx];
    if (target) switchStage(target);
  };

  const handleNextStage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = (currentStageIndex + 1) % stagesOrder.length;
    const target = stagesOrder[nextIdx];
    if (target) switchStage(target);
  };

  // Double-tap on photo/video canvas to like (disabled in 3D mode to avoid interfering with 3D orbit)
  const handleMediaCanvasClick = () => {
    if (stage === '3d') return;
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 280;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (!isLiked) {
        toggleLikeItem(item);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 750);
    }
    lastTapRef.current = now;
  };

  const handleMediaTouchStart = (e: React.TouchEvent) => {
    if (stage === '3d') return;
    const touch = e.touches[0];
    if (!touch) return;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleMediaTouchEnd = (e: React.TouchEvent) => {
    if (
      stage === '3d' ||
      touchStartXRef.current === null ||
      touchStartYRef.current === null
    ) {
      return;
    }
    const touch = e.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;

    if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      if (deltaX < 0) {
        const nextIdx = (currentStageIndex + 1) % stagesOrder.length;
        const target = stagesOrder[nextIdx];
        if (target) switchStage(target);
      } else {
        const prevIdx =
          (currentStageIndex - 1 + stagesOrder.length) % stagesOrder.length;
        const target = stagesOrder[prevIdx];
        if (target) switchStage(target);
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const handleToggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !showDetails;
    setShowDetails(nextState);
    if (nextState) {
      trackEvent('allergen_expand', item.id);
    }
  };

  const handleToggleOrderSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      removeItemFromSelection(item, true);
    } else {
      addItemToSelection(item);
    }
  };

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (!v.duration || Number.isNaN(v.duration)) return;
    const progress = v.currentTime / v.duration;
    if (progress < 0.25) {
      setVideoStepLabel('Etapa 1/4 • Preparo da Base');
    } else if (progress < 0.5) {
      setVideoStepLabel('Etapa 2/4 • Cocção Artesanal');
    } else if (progress < 0.75) {
      setVideoStepLabel('Etapa 3/4 • Montagem & Textura');
    } else {
      setVideoStepLabel('Etapa 4/4 • Finalização do Chef');
    }
  };

  const primaryBadge = item.badges.includes('Mais Pedido')
    ? 'BEST SELLER'
    : item.badges[0]?.toUpperCase();

  return (
    <article
      ref={elementRef}
      data-item-id={item.id}
      className={cn(
        'relative w-full h-[79dvh] min-h-[520px] max-h-[760px] snap-center shrink-0 my-2.5 rounded-3xl overflow-hidden bg-[#141414] border border-white/[0.1] select-none shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out'
      )}
    >
      {/* CAMADA DE MÍDIA (1. FOTO -> 2. VÍDEO -> 3. 3D/AR) */}
      <div
        className="absolute inset-0 z-0 bg-[#0F0F0F]"
        onClick={handleMediaCanvasClick}
        onTouchStart={handleMediaTouchStart}
        onTouchEnd={handleMediaTouchEnd}
      >
        {stage === 'photo' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryPhoto.url}
            alt={primaryPhoto.alt || item.name}
            loading="eager"
            className="h-full w-full object-cover object-center transition-opacity duration-300"
          />
        )}

        {stage === 'video' && primaryVideo && !videoFailed && (
          <video
            ref={videoRef}
            key={primaryVideo.url}
            src={primaryVideo.url}
            poster={primaryVideo.poster || primaryPhoto.url}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            onTimeUpdate={handleVideoTimeUpdate}
            onError={() => setVideoFailed(true)}
            className="h-full w-full object-cover object-center"
          />
        )}

        {stage === 'video' && (!primaryVideo || videoFailed) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryPhoto.url}
            alt={item.name}
            className="h-full w-full object-cover object-center"
          />
        )}

        {stage === '3d' && (
          <div className="h-full w-full">
            <DishARViewer
              modelGlbUrl={modelGlbUrl}
              modelUsdzUrl={item.model_usdz_url}
              posterUrl={primaryPhoto.url}
              itemName={item.name}
              arScaleFixed={item.ar_scale_fixed ?? true}
              dimensionsCm={item.dimensions_cm}
              fillContainer={true}
              showBuiltInButton={false}
              onRotate3D={() =>
                trackEvent('3d_rotate', item.id, null, {
                  price_cents: item.price_cents,
                })
              }
              onActivateAR={() =>
                trackEvent('ar_table_view', item.id, null, {
                  price_cents: item.price_cents,
                })
              }
              onDesktopFallbackNeeded={() => setShowARModal(true)}
            />
          </div>
        )}

        {/* Gradiente suave apenas no topo e rodapé para leitura limpa */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 transition-opacity duration-300',
            stage === '3d'
              ? 'bg-gradient-to-t from-black/95 via-black/30 to-black/50'
              : 'bg-gradient-to-t from-black/95 via-black/45 to-black/35'
          )}
        />

        {/* Animação de Like no Duplo Toque */}
        {showHeartBurst && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-30">
            <Heart className="w-24 h-24 text-white fill-rose-500 animate-ping opacity-90 drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* SETAS LATERAIS DISCRETAS (SOMENTE NO MEIO DO CARD, LONGE DOS BOTÕES) */}
      <button
        type="button"
        onClick={handlePrevStage}
        aria-label="Apresentação anterior"
        className="absolute left-2.5 top-[38%] -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/55 hover:bg-black/80 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all shadow-lg keep-white"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={handleNextStage}
        aria-label="Próxima apresentação"
        className="absolute right-2.5 top-[38%] -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/55 hover:bg-black/80 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all shadow-lg keep-white"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* TOPO INTERNO DO CARD: BARRAS + SELETOR 1. FOTO | 2. VÍDEO | 3. 3D/AR + LIKE */}
      <div className="relative z-20 pt-3.5 px-4 space-y-2.5">
        {/* Barras Horizontais de Progresso (3 etapas) */}
        <div className="flex items-center gap-1.5">
          {stagesOrder.map((st) => (
            <button
              key={st}
              type="button"
              onClick={(e) => switchStage(st, e)}
              aria-label={`Modo ${st}`}
              className={cn(
                'h-1 flex-1 rounded-full transition-all duration-300',
                st === stage ? 'bg-white' : 'bg-white/30 hover:bg-white/50'
              )}
            />
          ))}
        </div>

        {/* Linha de Controles do Topo: Seletor (Foto -> Vídeo -> 3D/AR) à esquerda + Curtir à direita */}
        <div className="flex items-center justify-between gap-2">
          {/* Pílulas de Ordem de Apresentação: 1. Foto | 2. Vídeo | 3. 3D/AR */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-black/75 border border-white/15 backdrop-blur-xl shadow-lg">
            <button
              type="button"
              onClick={(e) => switchStage('photo', e)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all',
                stage === 'photo'
                  ? 'bg-white text-[#0F0F0F] shadow'
                  : 'text-zinc-200 hover:text-white keep-white'
              )}
            >
              <ImageIcon className="w-3 h-3" />
              <span>1. Foto</span>
            </button>

            {primaryVideo && (
              <button
                type="button"
                onClick={(e) => switchStage('video', e)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all',
                  stage === 'video'
                    ? 'bg-amber-400 text-[#0F0F0F] shadow font-bold'
                    : 'text-zinc-200 hover:text-white keep-white'
                )}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>2. Vídeo</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => switchStage('3d', e)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all',
                stage === '3d'
                  ? 'bg-blue-600 text-white shadow keep-white'
                  : 'text-blue-300 hover:text-white keep-white'
              )}
            >
              <Box className="w-3 h-3" />
              <span>3. 3D / AR</span>
            </button>
          </div>

          {/* Botão de Curtir no Topo Direito (Zero conflito com preço ou botões inferiores!) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleLikeItem(item);
            }}
            aria-label={isLiked ? 'Remover curtida' : 'Curtir prato'}
            className={cn(
              'px-3 py-1.5 rounded-full flex items-center gap-1.5 border backdrop-blur-xl transition-all active:scale-90 keep-white',
              isLiked
                ? 'bg-rose-500/90 border-rose-400 text-white shadow-lg shadow-rose-500/25'
                : 'bg-black/65 border-white/15 text-white hover:bg-black/80'
            )}
          >
            <Heart
              className={cn('w-3.5 h-3.5', isLiked && 'fill-white text-white')}
            />
            <span className="text-[11px] font-bold">
              {(item.likes_initial_count ?? 120) + (isLiked ? 1 : 0)}
            </span>
          </button>
        </div>

        {/* Sub-linha de Status: Selo Best Seller ou Etapa do Vídeo */}
        <div className="flex items-center justify-between gap-2 pointer-events-none">
          {stage === 'video' ? (
            <span className="bg-amber-400 text-[#0F0F0F] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow">
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>{videoStepLabel}</span>
            </span>
          ) : primaryBadge ? (
            <span className="bg-black/70 text-white text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md border border-white/10 keep-white">
              {primaryBadge}
            </span>
          ) : (
            <span />
          )}

          {stage === '3d' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowARModal(true);
              }}
              className="pointer-events-auto bg-blue-600/90 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1 shadow-lg keep-white"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Tela Cheia / AR</span>
            </button>
          )}
        </div>
      </div>

      {/* RODAPÉ INTERNO DO CARD (SEM SOBREPOSIÇÃO DE BOTÕES!) */}
      <div
        className="relative z-20 pt-8 pb-4 px-4 space-y-2.5 keep-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Metadados Rápidos */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-300">
          {item.prep_time_minutes && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.12] backdrop-blur-md text-zinc-100">
              <Clock className="w-3 h-3" />
              {item.prep_time_minutes} min
            </span>
          )}
          {item.calories && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.12] backdrop-blur-md text-zinc-100">
              <Flame className="w-3 h-3" />
              {item.calories} kcal
            </span>
          )}
          {item.pairing_suggestion && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/30 text-amber-200 truncate max-w-[215px]">
              <Utensils className="w-3 h-3 shrink-0 text-amber-300" />
              <span className="truncate">{item.pairing_suggestion}</span>
            </span>
          )}
        </div>

        {/* Linha 1: Título Serifado + Preço Alinhado (Zero sobreposição!) */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-serif text-2xl sm:text-[26px] text-white leading-tight tracking-tight drop-shadow-sm flex-1 keep-white">
            {item.name}
          </h2>
          <div className="shrink-0 text-right bg-black/65 border border-white/15 px-3 py-1.5 rounded-2xl backdrop-blur-md">
            <span className="block text-[9px] uppercase tracking-widest text-zinc-300">
              Valor
            </span>
            <span className="text-base sm:text-lg font-bold text-amber-400 whitespace-nowrap">
              {formatCurrencyBRL(item.price_cents)}
            </span>
          </div>
        </div>

        {/* Linha 2: Descrição + Botão compacto de Alergênicos */}
        <div className="flex items-end justify-between gap-2">
          <p
            className={cn(
              'text-xs text-zinc-200 leading-relaxed flex-1',
              !showDetails && 'line-clamp-2'
            )}
          >
            {item.description}
          </p>
          <button
            type="button"
            onClick={handleToggleDetails}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.12] hover:bg-white/[0.18] border border-white/15 text-[11px] font-medium text-zinc-100 transition-colors"
          >
            <AlertTriangle className="w-3 h-3 text-amber-300" />
            <span>Ficha</span>
            {showDetails ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Painel Expansível: Alergênicos e Ingredientes */}
        {showDetails && (
          <div className="p-3 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/15 space-y-2.5 animate-fade-in">
            {item.allergens.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300 block mb-1">
                  Aviso de Alergênicos
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.allergens.map((allergen) => (
                    <span
                      key={allergen}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-200 border border-amber-400/30"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.ingredients.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-300 block mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-white" />
                  Ingredientes Frescos
                </span>
                <p className="text-xs text-zinc-200 leading-relaxed">
                  {item.ingredients.join(' • ')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Linha 3: Barra Dupla de Ação (Ver na Mesa 3D/AR + Adicionar ao Pedido) - ZERO CONFLITO */}
        <div className="grid grid-cols-12 gap-2 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowARModal(true);
            }}
            className="col-span-5 py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] border border-blue-400/40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/25 transition-all keep-white"
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Ver na Mesa</span>
          </button>

          <button
            type="button"
            onClick={handleToggleOrderSelection}
            className={cn(
              'col-span-7 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-lg',
              isSelected
                ? 'bg-emerald-500 text-white keep-white'
                : 'bg-amber-400 hover:bg-amber-300 text-[#0F0F0F]'
            )}
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />
                <span className="truncate">
                  No Pedido ({selectedQuantity}x)
                </span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
                <span className="truncate">Pedir / Favoritar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Dedicado 3D / WebAR ("Ver na sua mesa" em Escala Real 1:1) */}
      <ProductARModal
        item={{
          ...item,
          model_glb_url: modelGlbUrl,
        }}
        isOpen={showARModal}
        onClose={() => setShowARModal(false)}
      />
    </article>
  );
}
