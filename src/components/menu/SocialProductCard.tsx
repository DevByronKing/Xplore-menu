'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Camera, ChevronDown, Heart, X } from 'lucide-react';
import type { MenuItem } from '@/types/database';
import { useMenuSession } from '@/context/MenuSessionContext';
import { useTheme } from '@/context/ThemeContext';
import { useItemDwellObserver } from '@/hooks/useItemDwellObserver';
import { ProductARModal } from '@/components/menu/ProductARModal';
import { cn, formatCurrencyBRL } from '@/lib/utils';

interface SocialProductCardProps {
  item: MenuItem;
  priorityLoad?: boolean;
}

export function SocialProductCard({
  item,
  priorityLoad = false,
}: SocialProductCardProps) {
  const {
    isItemLiked,
    getItemQuantity,
    toggleLikeItem,
    addItemToSelection,
    removeItemFromSelection,
    trackEvent,
  } = useMenuSession();
  const { isLight } = useTheme();

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isAllergensExpanded, setIsAllergensExpanded] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoProgressPct, setVideoProgressPct] = useState(0);
  const [isArModalOpen, setIsArModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastTapRef = useRef<number>(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const mediaList = item.media_urls.length > 0 ? item.media_urls : [];
  const activeMedia = mediaList[currentMediaIndex] ?? mediaList[0];

  const liked = isItemLiked(item.id);
  const quantity = getItemQuantity(item.id);
  const isSaved = liked || quantity > 0;

  // Primary badge (only 1 clean badge in top-left as per reference)
  const primaryBadge = item.badges[0];

  // Autoplay/pause video based on >=70% viewport visibility
  const handleActiveViewportChange = useCallback((isActive: boolean) => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isActive) {
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked or low-power mode; poster remains visible
        });
      }
    } else {
      vid.pause();
    }
  }, []);

  const { cardRef, isVisibleInViewport } = useItemDwellObserver({
    item,
    visibilityThreshold: 0.7,
    onActiveChange: handleActiveViewportChange,
  });

  useEffect(() => {
    setVideoError(false);
    setVideoProgressPct(0);
    if (
      activeMedia?.type === 'video' &&
      isVisibleInViewport &&
      videoRef.current
    ) {
      videoRef.current.play().catch(() => {});
    }
  }, [currentMediaIndex, activeMedia?.type, isVisibleInViewport]);

  const handleVideoTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid || !vid.duration || !Number.isFinite(vid.duration)) return;
    const pct = Math.min(100, Math.max(0, (vid.currentTime / vid.duration) * 100));
    setVideoProgressPct(pct);
  };

  const handleNextMedia = useCallback(() => {
    if (mediaList.length <= 1) return;
    const nextIdx = (currentMediaIndex + 1) % mediaList.length;
    setCurrentMediaIndex(nextIdx);
    trackEvent('media_swipe', item.id, null, { media_index: nextIdx });
  }, [currentMediaIndex, item.id, mediaList.length, trackEvent]);

  const handlePrevMedia = useCallback(() => {
    if (mediaList.length <= 1) return;
    const prevIdx =
      (currentMediaIndex - 1 + mediaList.length) % mediaList.length;
    setCurrentMediaIndex(prevIdx);
    trackEvent('media_swipe', item.id, null, { media_index: prevIdx });
  }, [currentMediaIndex, item.id, mediaList.length, trackEvent]);

  // Horizontal touch swipe for carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (
      touchStartXRef.current === null ||
      touchStartYRef.current === null ||
      mediaList.length <= 1
    ) {
      return;
    }
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const endY = e.changedTouches[0]?.clientY ?? touchStartYRef.current;
    const deltaX = touchStartXRef.current - endX;
    const deltaY = Math.abs(touchStartYRef.current - endY);

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Only trigger slide change if horizontal swipe is dominant
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) {
        handleNextMedia();
      } else {
        handlePrevMedia();
      }
    }
  };

  // Toggle favorite + selection bag in 1 tap
  const handleToggleFavoriteAction = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!item.is_available) return;

    if (quantity > 0) {
      removeItemFromSelection(item, true);
      if (liked) toggleLikeItem(item);
    } else {
      addItemToSelection(item);
    }
  };

  // Story-style tap zones (left 30% prev, right 30% next, double-tap center to favorite)
  const handleMediaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < 280;
    lastTapRef.current = now;

    if (isDoubleTap) {
      if (quantity === 0 && item.is_available) {
        addItemToSelection(item);
      }
      setShowDoubleTapHeart(true);
      window.setTimeout(() => setShowDoubleTapHeart(false), 650);
      return;
    }

    if (mediaList.length > 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = clickX / rect.width;
      if (ratio < 0.3) {
        handlePrevMedia();
      } else if (ratio > 0.7) {
        handleNextMedia();
      }
    }
  };

  const handleToggleAllergens = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isAllergensExpanded;
    setIsAllergensExpanded(nextState);
    if (nextState) {
      trackEvent('allergen_expand', item.id, null, {
        price_cents: item.price_cents,
      });
    }
  };

  return (
    <article
      ref={cardRef as React.RefObject<HTMLElement>}
      data-menu-item-id={item.id}
      className={cn(
        'relative w-full h-[76dvh] min-h-[470px] max-h-[650px] scroll-mt-28 rounded-3xl overflow-hidden bg-[#161616] select-none mb-5 will-change-transform transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
        isVisibleInViewport
          ? isLight
            ? 'scale-100 opacity-100 shadow-[0_22px_50px_rgba(20,20,19,0.22)] ring-1 ring-black/15'
            : 'scale-100 opacity-100 shadow-2xl ring-1 ring-white/15'
          : isLight
            ? 'scale-[0.975] opacity-85 shadow-md ring-1 ring-black/10'
            : 'scale-[0.975] opacity-80 shadow-lg ring-1 ring-white/[0.06]'
      )}
      onClick={handleMediaClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* MEDIA LAYER (Full-bleed 9:16 inside the rounded-3xl card) */}
      {activeMedia?.type === 'video' && !videoError ? (
        <video
          ref={videoRef}
          src={activeMedia.url}
          poster={activeMedia.poster}
          muted
          loop
          playsInline
          preload={priorityLoad ? 'auto' : 'metadata'}
          onTimeUpdate={handleVideoTimeUpdate}
          onError={() => setVideoError(true)}
          onEnded={() => trackEvent('video_replay', item.id)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={activeMedia?.id}
          src={activeMedia?.poster || activeMedia?.url}
          alt={activeMedia?.alt || item.name}
          loading={priorityLoad ? 'eager' : 'lazy'}
          className="absolute inset-0 h-full w-full object-cover animate-fadeIn"
        />
      )}

      {/* Subtle Top Vignette for Story Bars & Badge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent z-10" />

      {/* TOP INTERNAL BAR: Instagram Stories Progress Bars + Floating Badge */}
      <div className="absolute top-0 inset-x-0 z-20 p-4 space-y-3">
        {/* Story Progress Bars (shows real-time playback progress on video slide) */}
        {mediaList.length > 1 && (
          <div
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {mediaList.map((media, idx) => {
              const isCurrent = idx === currentMediaIndex;
              const isPast = idx < currentMediaIndex;
              const barWidth = isCurrent
                ? media.type === 'video' && videoProgressPct > 0
                  ? `${videoProgressPct}%`
                  : '100%'
                : isPast
                  ? '100%'
                  : '0%';

              return (
                <button
                  key={media.id}
                  type="button"
                  aria-label={`Mídia ${idx + 1}`}
                  onClick={() => {
                    setCurrentMediaIndex(idx);
                    trackEvent('media_swipe', item.id, null, { media_index: idx });
                  }}
                  className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden transition-all"
                >
                  <div
                    style={{ width: barWidth }}
                    className="h-full rounded-full bg-white transition-[width] duration-150 ease-linear"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Top-Left Floating Badge (MAIS PEDIDO / NOVIDADE / SUGESTÃO DO CHEF) + Selo 3D / AR */}
        <div
          className="flex items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5">
            {primaryBadge && (
              <span className="bg-black/70 text-white text-[10px] font-medium uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md">
                {primaryBadge}
              </span>
            )}

            {item.model_glb_url && (
              <button
                type="button"
                onClick={() => setIsArModalOpen(true)}
                className="bg-blue-600/90 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1 shadow-md transition-all active:scale-95"
              >
                <Box className="w-3 h-3" />
                <span>3D / AR</span>
              </button>
            )}
          </div>

          {!item.is_available && (
            <span className="bg-rose-950/85 text-rose-200 border border-rose-500/30 text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md">
              Esgotado
            </span>
          )}
        </div>
      </div>

      {/* Double-Tap Heart Feedback */}
      {showDoubleTapHeart && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="animate-heart-pop rounded-full bg-black/40 p-5 backdrop-blur-md">
            <Heart className="w-16 h-16 text-white fill-white" />
          </div>
        </div>
      )}

      {/* BOTTOM INTERNAL FOOTER (Gradient Overlay - always high contrast white over dark photo vignette) */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-20 pb-5 px-5 flex flex-col justify-end"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Expandable Allergens & Ingredients Popover Sheet */}
        {isAllergensExpanded && (
          <div className="mb-3.5 p-3.5 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/15 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                Alergênicos & Ingredientes
              </span>
              <button
                type="button"
                onClick={() => setIsAllergensExpanded(false)}
                className="text-zinc-400 hover:text-white p-0.5"
                aria-label="Fechar alergênicos"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {item.allergens.map((allergen) => (
                <span
                  key={allergen}
                  className="px-2 py-0.5 rounded-full bg-white/[0.12] text-white text-[11px]"
                >
                  {allergen}
                </span>
              ))}
            </div>

            {item.ingredients.length > 0 && (
              <p className="text-[11px] text-[#D4D4D8] leading-relaxed pt-1 border-t border-white/10">
                {item.ingredients.join(' • ')}
              </p>
            )}
          </div>
        )}

        {/* Line 1: Editorial Serif Title */}
        <h2 className="font-serif text-3xl text-white font-normal tracking-tight leading-[1.12] drop-shadow-sm">
          {item.name}
        </h2>

        {/* Line 2: Description of ingredients */}
        <p className="mt-1.5 text-xs text-zinc-200 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Line 3 (Base): Price on left + ALERGÊNICOS v + Botão "Ver na sua mesa" + Circular Favorite button */}
        <div className="mt-4 pt-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="text-base font-medium text-white tracking-tight shrink-0">
              {formatCurrencyBRL(item.price_cents)}
            </span>

            <button
              type="button"
              onClick={handleToggleAllergens}
              aria-expanded={isAllergensExpanded}
              className="text-[11px] uppercase tracking-widest text-zinc-300 hover:text-white flex items-center gap-1 transition-colors py-1 shrink-0"
            >
              <span>Alergênicos</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-200',
                  isAllergensExpanded && 'rotate-180 text-white'
                )}
              />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {item.model_glb_url && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsArModalOpen(true);
                }}
                className="px-3 py-2 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 backdrop-blur-md transition-all active:scale-95"
              >
                <Box className="w-3.5 h-3.5" />
                <span>Ver na sua mesa</span>
                <Camera className="w-3 h-3 opacity-80" />
              </button>
            )}

            {/* Right Circular Favorite / Add Button */}
            <button
              type="button"
              disabled={!item.is_available}
              onClick={handleToggleFavoriteAction}
              aria-label={
                isSaved ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
              }
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0',
                isSaved
                  ? 'bg-white text-[#0F0F0F] border border-white shadow-md animate-heart-pop'
                  : 'bg-white/[0.14] border border-white/20 text-white backdrop-blur-md hover:bg-white/[0.22]'
              )}
            >
              <Heart
                className={cn(
                  'w-4 h-4 transition-colors',
                  isSaved ? 'fill-[#0F0F0F] text-[#0F0F0F]' : 'text-white'
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Modal 3D / Realidade Aumentada 1:1 ("Ver na sua mesa") */}
      {item.model_glb_url && (
        <ProductARModal
          item={item}
          isOpen={isArModalOpen}
          onClose={() => setIsArModalOpen(false)}
        />
      )}
    </article>
  );
}
