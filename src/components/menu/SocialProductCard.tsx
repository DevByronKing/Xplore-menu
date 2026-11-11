'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Heart,
  Plus,
  Check,
  Sparkles,
  Clock,
  Flame,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Box,
  Camera,
  Play,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Info,
  X,
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
    item.model_glb_url || '/models/focaccia-burrata.glb?v=6';

  // Presentation order: 1. Foto -> 2. Vídeo -> 3. 3D/AR
  const [stage, setStage] = useState<PresentationStage>('photo');
  const [isCleanView, setIsCleanView] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoStepLabel, setVideoStepLabel] = useState<string>(
    'Preparo Artesanal'
  );
  const [showARModal, setShowARModal] = useState(false);

  const lastTapRef = useRef<number>(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }
    };
  }, []);

  const switchStage = (nextStage: PresentationStage, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (nextStage === stage) return;
    setStage(nextStage);
    setShowDetails(false);
    if (nextStage === '3d') {
      setIsCleanView(false);
    }
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

  // Single tap on photo/video toggles Clean Image View ("Ver só o prato"); Double tap likes the dish
  const handleMediaCanvasClick = () => {
    if (stage === '3d') return;
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 260;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      if (!isLiked) {
        toggleLikeItem(item);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 750);
    } else {
      singleTapTimerRef.current = setTimeout(() => {
        setIsCleanView((prev) => !prev);
        setShowDetails(false);
      }, DOUBLE_TAP_DELAY);
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
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
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
      setVideoStepLabel('1/4 • Ingredientes');
    } else if (progress < 0.5) {
      setVideoStepLabel('2/4 • Preparo');
    } else if (progress < 0.75) {
      setVideoStepLabel('3/4 • Montagem');
    } else {
      setVideoStepLabel('4/4 • Finalização');
    }
  };

  return (
    <article
      ref={elementRef}
      data-item-id={item.id}
      className={cn(
        'relative w-full h-[83dvh] min-h-[500px] max-h-[780px] snap-center shrink-0 my-2 rounded-3xl overflow-hidden bg-[#111111] border border-white/[0.1] select-none shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out'
      )}
    >
      {/* CAMADA DE MÍDIA EM TELA CHEIA (FOTO -> VÍDEO -> 3D REAL) */}
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
            className="h-full w-full object-cover object-center transition-transform duration-500"
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

        {/* Gradiente enxuto APENAS na base e topo, deixando o centro do prato 100% nítido */}
        {!isCleanView && (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/75 via-black/25 to-transparent" />
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 bottom-0 transition-all duration-300',
                stage === '3d'
                  ? 'h-36 bg-gradient-to-t from-black/95 via-black/75 to-transparent'
                  : 'h-56 bg-gradient-to-t from-black/95 via-black/70 to-transparent'
              )}
            />
          </>
        )}

        {/* Animação de Like no Duplo Toque */}
        {showHeartBurst && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-30">
            <Heart className="w-24 h-24 text-white fill-rose-500 animate-ping opacity-90 drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* MODO SOMENTE IMAGEM (TELA LIMPA): Botão flutuante discreto para voltar */}
      {isCleanView && (
        <div className="relative z-30 mt-auto p-4 flex items-center justify-between pointer-events-none">
          <span className="px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-white keep-white">
            {item.name} • {formatCurrencyBRL(item.price_cents)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCleanView(false);
            }}
            className="pointer-events-auto px-3.5 py-2 rounded-full bg-white text-[#0F0F0F] text-xs font-bold flex items-center gap-1.5 shadow-xl active:scale-95 transition-transform"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Mostrar Card</span>
          </button>
        </div>
      )}

      {/* SETAS LATERAIS DISCRETAS (Ocultas no modo 3D e no modo Tela Limpa) */}
      {!isCleanView && stage !== '3d' && (
        <>
          <button
            type="button"
            onClick={handlePrevStage}
            aria-label="Apresentação anterior"
            className="absolute left-2.5 top-[44%] -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/45 hover:bg-black/75 border border-white/15 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all keep-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextStage}
            aria-label="Próxima apresentação"
            className="absolute right-2.5 top-[44%] -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/45 hover:bg-black/75 border border-white/15 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all keep-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* TOPO INTERNO DO CARD: SELETOR LIMPO (Foto | Vídeo | 3D) + BOTÃO "SÓ IMAGEM" + LIKE */}
      {!isCleanView && (
        <div className="relative z-20 pt-3 px-3.5 space-y-2">
          {/* Barras Horizontais de Progresso */}
          <div className="flex items-center gap-1.5">
            {stagesOrder.map((st) => (
              <button
                key={st}
                type="button"
                onClick={(e) => switchStage(st, e)}
                aria-label={`Modo ${st}`}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all duration-300',
                  st === stage ? 'bg-white' : 'bg-white/25 hover:bg-white/45'
                )}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-1.5">
            {/* Seletor enxuto: Foto -> Vídeo -> 3D */}
            <div className="inline-flex items-center gap-0.5 p-1 rounded-full bg-black/75 border border-white/15 backdrop-blur-xl shadow-lg">
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
                <span>Foto</span>
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
                  <span>Vídeo</span>
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
                <span>3D</span>
              </button>
            </div>

            {/* Ações Rápidas do Topo Direito: Modo "Só Imagem" + Curtir */}
            <div className="flex items-center gap-1.5">
              {stage !== '3d' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCleanView(true);
                    setShowDetails(false);
                  }}
                  title="Ver somente a foto/vídeo sem textos"
                  aria-label="Ver somente a imagem do produto"
                  className="px-2.5 py-1.5 rounded-full bg-black/70 hover:bg-black/85 border border-white/15 text-white text-[11px] font-semibold flex items-center gap-1 backdrop-blur-xl active:scale-90 transition-all keep-white"
                >
                  <EyeOff className="w-3 h-3 text-amber-300" />
                  <span>Só Foto</span>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLikeItem(item);
                }}
                aria-label={isLiked ? 'Remover curtida' : 'Curtir prato'}
                className={cn(
                  'px-2.5 py-1.5 rounded-full flex items-center gap-1 border backdrop-blur-xl transition-all active:scale-90 keep-white',
                  isLiked
                    ? 'bg-rose-500/90 border-rose-400 text-white shadow-lg shadow-rose-500/25'
                    : 'bg-black/70 border-white/15 text-white hover:bg-black/85'
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
          </div>

          {/* Indicador discreto de etapa apenas durante reprodução de vídeo */}
          {stage === 'video' && (
            <div className="pointer-events-none flex items-center">
              <span className="bg-black/70 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1.5 keep-white">
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>{videoStepLabel}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* RODAPÉ ENXUTO E DESPOLUÍDO (PROJETADO PARA CELULAR) */}
      {!isCleanView && (
        <div
          className="relative z-20 pb-3.5 px-3.5 space-y-2 keep-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gaveta de Informações Completas (abre só quando o cliente toca em Info) */}
          {showDetails && (
            <div className="p-3.5 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/15 space-y-2.5 animate-fade-in shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Ficha Técnica & Ingredientes
                </span>
                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-zinc-200 leading-relaxed">
                {item.description}
              </p>

              {/* Tempo, Calorias e Harmonização ficam aqui dentro para não poluir a foto */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {item.prep_time_minutes && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-zinc-100">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {item.prep_time_minutes} min
                  </span>
                )}
                {item.calories && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-zinc-100">
                    <Flame className="w-3 h-3 text-amber-400" />
                    {item.calories} kcal
                  </span>
                )}
                {item.pairing_suggestion && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/30 text-amber-200">
                    <Utensils className="w-3 h-3 text-amber-300" />
                    {item.pairing_suggestion}
                  </span>
                )}
              </div>

              {item.ingredients.length > 0 && (
                <div className="text-[11px] text-zinc-300">
                  <strong className="text-white">Ingredientes: </strong>
                  {item.ingredients.join(' • ')}
                </div>
              )}

              {item.allergens.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {item.allergens.map((allergen) => (
                    <span
                      key={allergen}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30"
                    >
                      Contém: {allergen}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Linha 1: Título + Preço Compacto */}
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-xl sm:text-2xl text-white leading-tight tracking-tight drop-shadow-sm truncate keep-white">
                {item.name}
              </h2>
              {stage !== '3d' && !showDetails && (
                <p className="text-xs text-zinc-300 line-clamp-1 mt-0.5">
                  {item.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleToggleDetails}
                aria-label="Ver descrição e ficha completa"
                className={cn(
                  'h-9 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1 backdrop-blur-md transition-colors',
                  showDetails
                    ? 'bg-white text-[#0F0F0F] border-white'
                    : 'bg-black/65 border-white/15 text-zinc-200 hover:bg-black/80'
                )}
              >
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Info</span>
              </button>

              <div className="bg-black/75 border border-white/15 px-3 py-1.5 rounded-xl backdrop-blur-md text-right">
                <span className="text-sm sm:text-base font-bold text-amber-400 whitespace-nowrap block leading-tight">
                  {formatCurrencyBRL(item.price_cents)}
                </span>
              </div>
            </div>
          </div>

          {/* Linha 2: Botões de Ação (Ver na Mesa 3D/AR + Pedir) */}
          <div className="grid grid-cols-12 gap-2 pt-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (stage !== '3d') {
                  switchStage('3d', e);
                } else {
                  setShowARModal(true);
                }
              }}
              className="col-span-5 py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] border border-blue-400/40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/25 transition-all keep-white"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {stage === '3d' ? 'Câmera AR' : 'Ver em 3D'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleToggleOrderSelection}
              className={cn(
                'col-span-7 py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-lg',
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
      )}

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
