'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Flame,
  Heart,
  Minus,
  Play,
  Plus,
  Sparkles,
  UtensilsCrossed,
  VolumeX,
} from 'lucide-react';
import type { MenuItem } from '@/types/database';
import { useMenuSession } from '@/context/MenuSessionContext';
import { useItemDwellObserver } from '@/hooks/useItemDwellObserver';
import { cn, formatCurrencyBRL, formatDurationSeconds } from '@/lib/utils';

interface SocialProductCardProps {
  item: MenuItem;
  categoryName?: string;
  priorityLoad?: boolean;
}

function getBadgeStyle(badge: string): string {
  const lower = badge.toLowerCase();
  if (lower.includes('best seller')) {
    return 'bg-gradient-to-r from-amber-500 to-orange-500 text-obsidian-950 font-bold shadow-lg shadow-amber-500/25';
  }
  if (lower.includes('novo')) {
    return 'bg-emerald-500/90 text-obsidian-950 font-bold shadow-lg shadow-emerald-500/20';
  }
  if (lower.includes('chef')) {
    return 'bg-rose-500/90 text-white font-semibold shadow-lg shadow-rose-500/20';
  }
  if (lower.includes('vegano')) {
    return 'bg-teal-500/85 text-obsidian-950 font-bold';
  }
  return 'bg-obsidian-900/85 text-amber-200 border border-amber-400/30 backdrop-blur-md';
}

export function SocialProductCard({
  item,
  categoryName,
  priorityLoad = false,
}: SocialProductCardProps) {
  const {
    isItemLiked,
    getItemQuantity,
    toggleLikeItem,
    addItemToSelection,
    removeItemFromSelection,
    trackEvent,
    dwellTimeByItem,
    hesitationItems,
    isTelemetryHudOpen,
  } = useMenuSession();

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isAllergensExpanded, setIsAllergensExpanded] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastTapRef = useRef<number>(0);
  const touchStartXRef = useRef<number | null>(null);

  const mediaList = item.media_urls.length > 0 ? item.media_urls : [];
  const activeMedia = mediaList[currentMediaIndex] ?? mediaList[0];

  const liked = isItemLiked(item.id);
  const quantity = getItemQuantity(item.id);
  const totalLikes = (item.likes_initial_count ?? 120) + (liked ? 1 : 0);
  const hasHesitationFlag = hesitationItems.includes(item.id);

  // Sync video playback with viewport visibility (>=70% threshold)
  const handleActiveViewportChange = useCallback((isActive: boolean) => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isActive) {
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsVideoPlaying(true))
          .catch(() => setIsVideoPlaying(false));
      }
    } else {
      vid.pause();
      setIsVideoPlaying(false);
    }
  }, []);

  const { cardRef, isVisibleInViewport, activeElapsedMs } = useItemDwellObserver({
    item,
    visibilityThreshold: 0.7,
    onActiveChange: handleActiveViewportChange,
  });

  const cumulativeDwellMs = (dwellTimeByItem[item.id] || 0) + activeElapsedMs;

  // Handle switching media slides in carousel
  useEffect(() => {
    setVideoError(false);
    if (activeMedia?.type === 'video' && isVisibleInViewport && videoRef.current) {
      videoRef.current
        .play()
        .then(() => setIsVideoPlaying(true))
        .catch(() => setIsVideoPlaying(false));
    }
  }, [currentMediaIndex, activeMedia?.type, isVisibleInViewport]);

  const handleNextMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (mediaList.length <= 1) return;
    const nextIdx = (currentMediaIndex + 1) % mediaList.length;
    setCurrentMediaIndex(nextIdx);
    trackEvent('media_swipe', item.id, null, { media_index: nextIdx });
  };

  const handlePrevMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (mediaList.length <= 1) return;
    const prevIdx = (currentMediaIndex - 1 + mediaList.length) % mediaList.length;
    setCurrentMediaIndex(prevIdx);
    trackEvent('media_swipe', item.id, null, { media_index: prevIdx });
  };

  // Touch swipe handlers for mobile carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || mediaList.length <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = touchStartXRef.current - endX;
    touchStartXRef.current = null;

    if (Math.abs(deltaX) > 45) {
      if (deltaX > 0) {
        handleNextMedia();
      } else {
        handlePrevMedia();
      }
    }
  };

  // Double-tap on media to Like (Instagram/TikTok gesture)
  const handleMediaTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked) {
        toggleLikeItem(item);
      }
      setShowDoubleTapHeart(true);
      window.setTimeout(() => setShowDoubleTapHeart(false), 750);
    }
    lastTapRef.current = now;
  };

  const handleToggleAllergens = () => {
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
        'relative w-full snap-start snap-always rounded-3xl overflow-hidden bg-obsidian-900 border transition-all duration-300 shadow-2xl mb-5',
        isVisibleInViewport
          ? 'border-white/15 ring-1 ring-brand/25'
          : 'border-white/[0.06] opacity-95'
      )}
    >
      {/* MEDIA STAGE (Vertical 9:16 / 4:5 Immersive Aspect) */}
      <div
        className="relative w-full h-[540px] sm:h-[580px] bg-obsidian-950 select-none overflow-hidden"
        onClick={handleMediaTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top Story-style Carousel Progress Indicators */}
        {mediaList.length > 1 && (
          <div className="absolute top-3 inset-x-4 z-30 flex items-center gap-1.5">
            {mediaList.map((media, idx) => (
              <button
                key={media.id}
                type="button"
                aria-label={`Ver mídia ${idx + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex(idx);
                  trackEvent('media_swipe', item.id, null, { media_index: idx });
                }}
                className="h-1 flex-1 rounded-full overflow-hidden bg-white/25 backdrop-blur-sm"
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    idx === currentMediaIndex
                      ? 'w-full bg-white shadow-sm'
                      : idx < currentMediaIndex
                      ? 'w-full bg-white/70'
                      : 'w-0'
                  )}
                />
              </button>
            ))}
          </div>
        )}

        {/* Active Video or Image */}
        {activeMedia?.type === 'video' && !videoError ? (
          <video
            ref={videoRef}
            src={activeMedia.url}
            poster={activeMedia.poster}
            muted
            loop
            playsInline
            preload={priorityLoad ? 'auto' : 'metadata'}
            onError={() => setVideoError(true)}
            onEnded={() => trackEvent('video_replay', item.id)}
            className="h-full w-full object-cover transition-transform duration-700"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeMedia?.poster || activeMedia?.url}
            alt={activeMedia?.alt || item.name}
            loading={priorityLoad ? 'eager' : 'lazy'}
            className="h-full w-full object-cover transition-transform duration-700"
          />
        )}

        {/* Subtle Top & Bottom Cinematic Gradients for Readability */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/75 via-black/30 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-obsidian-950 via-obsidian-950/90 to-transparent z-10" />

        {/* Double-Tap Animated Heart Burst */}
        {showDoubleTapHeart && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
            <div className="animate-heart-pop rounded-full bg-rose-500/20 p-5 backdrop-blur-md">
              <Heart className="w-20 h-20 text-rose-500 fill-rose-500 drop-shadow-2xl" />
            </div>
          </div>
        )}

        {/* Top Badges & Live Telemetry Indicator */}
        <div className="absolute top-6 inset-x-4 z-20 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {categoryName && (
              <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-black/55 text-zinc-200 border border-white/15 backdrop-blur-md">
                {categoryName}
              </span>
            )}
            {item.badges.map((badge) => (
              <span
                key={badge}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] tracking-tight',
                  getBadgeStyle(badge)
                )}
              >
                {badge.toLowerCase().includes('best seller') && (
                  <Flame className="w-3 h-3 fill-current" />
                )}
                {badge.toLowerCase().includes('chef') && (
                  <ChefHat className="w-3 h-3" />
                )}
                {badge.toLowerCase().includes('novo') && (
                  <Sparkles className="w-3 h-3" />
                )}
                {badge}
              </span>
            ))}
          </div>

          {/* Media Type / Telemetry Dwell Badge */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {activeMedia?.type === 'video' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 border border-white/15 text-[10px] text-zinc-200 backdrop-blur-md">
                {isVideoPlaying ? (
                  <>
                    <VolumeX className="w-3 h-3 text-amber-400" />
                    <span>Vídeo HD</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Autoplay</span>
                  </>
                )}
              </span>
            )}

            {(isTelemetryHudOpen || cumulativeDwellMs >= 1000) && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border backdrop-blur-md transition-colors',
                  isVisibleInViewport
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                    : 'bg-black/60 border-white/10 text-zinc-400'
                )}
                title="Tempo de atenção acumulado neste prato (IntersectionObserver >= 70%)"
              >
                <Eye className="w-3 h-3" />
                {formatDurationSeconds(cumulativeDwellMs)}
              </span>
            )}

            {hasHesitationFlag && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 border border-amber-400/40 text-amber-300 backdrop-blur-md">
                Hesitação detectada
              </span>
            )}
          </div>
        </div>

        {/* Left/Right Carousel Buttons when multiple media exist */}
        {mediaList.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevMedia}
              aria-label="Foto anterior"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/45 hover:bg-black/70 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMedia}
              aria-label="Próxima foto"
              className="absolute right-14 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/45 hover:bg-black/70 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Right-Side Vertical Social Action Bar (Like / Quick Add) */}
        <div
          className="absolute right-3 bottom-36 z-30 flex flex-col items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Like / Wishlist Heart Button */}
          <button
            type="button"
            onClick={() => toggleLikeItem(item)}
            aria-label={liked ? 'Remover dos curtidos' : 'Curtir prato'}
            className="group flex flex-col items-center gap-1"
          >
            <div
              className={cn(
                'h-11 w-11 rounded-full flex items-center justify-center border backdrop-blur-xl transition-all duration-200',
                liked
                  ? 'bg-rose-500/25 border-rose-500/60 text-rose-400 animate-heart-pop shadow-lg shadow-rose-500/25'
                  : 'bg-black/55 border-white/15 text-white hover:bg-black/75'
              )}
            >
              <Heart
                className={cn(
                  'w-5 h-5 transition-transform group-active:scale-125',
                  liked && 'fill-rose-500 text-rose-500'
                )}
              />
            </div>
            <span className="text-[11px] font-semibold text-white drop-shadow">
              {totalLikes}
            </span>
          </button>

          {/* Quick Selection Add Button */}
          <button
            type="button"
            onClick={() => addItemToSelection(item)}
            disabled={!item.is_available}
            aria-label="Salvar na lista de pedido"
            className="group flex flex-col items-center gap-1"
          >
            <div
              className={cn(
                'h-11 w-11 rounded-full flex items-center justify-center border backdrop-blur-xl transition-all duration-200',
                quantity > 0
                  ? 'bg-brand text-obsidian-950 border-brand-light shadow-lg shadow-brand/40'
                  : 'bg-black/55 border-white/15 text-white hover:border-brand/60'
              )}
            >
              {quantity > 0 ? (
                <span className="text-sm font-extrabold">{quantity}x</span>
              ) : (
                <Plus className="w-5 h-5" />
              )}
            </div>
            <span className="text-[10px] font-semibold text-zinc-200 drop-shadow">
              {quantity > 0 ? 'Salvo' : 'Pedir'}
            </span>
          </button>
        </div>

        {/* Bottom Overlay: Title, Price (BRL) & Quick Metadata */}
        <div
          className="absolute inset-x-0 bottom-0 z-20 p-4 pt-10 flex flex-col justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Prep Time & Calories Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5 text-[11px] text-zinc-300">
            {item.prep_time_minutes && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-sm">
                <Clock className="w-3 h-3 text-amber-400" />
                {item.prep_time_minutes} min
              </span>
            )}
            {item.calories && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-sm">
                {item.calories} kcal
              </span>
            )}
            {mediaList.length > 1 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-sm text-zinc-300">
                {currentMediaIndex + 1}/{mediaList.length} mídias
              </span>
            )}
          </div>

          {/* Dish Name & Formatted BRL Price */}
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight tracking-tight">
              {item.name}
            </h2>
            <div className="shrink-0 text-right">
              <span className="block text-[10px] uppercase tracking-wider text-zinc-400">
                Valor
              </span>
              <span className="text-xl font-black text-amber-400 tracking-tight">
                {formatCurrencyBRL(item.price_cents)}
              </span>
            </div>
          </div>

          {/* Appetizing Short Description */}
          <p className="mt-2 text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-3">
            {item.description}
          </p>

          {/* Pairing Suggestion */}
          {item.pairing_suggestion && (
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-2.5 py-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span className="truncate">{item.pairing_suggestion}</span>
            </div>
          )}
        </div>
      </div>

      {/* CARD FOOTER: Expandable Allergens/Ingredients & Primary Action */}
      <div className="bg-obsidian-900 px-4 pb-4 pt-2 border-t border-white/[0.06] space-y-3">
        {/* Expandable Accordion: Alergênicos & Ingredientes */}
        <div>
          <button
            type="button"
            onClick={handleToggleAllergens}
            aria-expanded={isAllergensExpanded}
            className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-obsidian-800/80 hover:bg-obsidian-800 border border-white/[0.06] text-xs text-zinc-300 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Alergênicos & Ingredientes da Receita</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">
                {item.allergens.length} alertas
              </span>
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-zinc-400 transition-transform duration-200',
                isAllergensExpanded && 'rotate-180 text-amber-400'
              )}
            />
          </button>

          {isAllergensExpanded && (
            <div className="mt-2 p-3 rounded-xl bg-obsidian-950/90 border border-white/[0.07] space-y-2.5 text-xs animate-fadeIn">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-1.5">
                  Atenção Alergênicos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {item.allergens.map((allergen) => (
                    <span
                      key={allergen}
                      className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px] font-medium"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>

              {item.ingredients.length > 0 && (
                <div className="pt-2 border-t border-white/[0.06]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Ficha de Ingredientes
                  </p>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {item.ingredients.join(' • ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Row: Add to Selection / Quantity Controls */}
        <div className="flex items-center gap-2.5">
          {quantity === 0 ? (
            <button
              type="button"
              disabled={!item.is_available}
              onClick={() => addItemToSelection(item)}
              className={cn(
                'flex-1 py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
                item.is_available
                  ? 'bg-gradient-to-r from-brand to-amber-500 text-obsidian-950 shadow-lg shadow-brand/25 hover:brightness-110'
                  : 'bg-obsidian-800 text-zinc-500 cursor-not-allowed'
              )}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>
                {item.is_available
                  ? 'Adicionar aos Favoritos / Pedido'
                  : 'Esgotado Hoje'}
              </span>
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-between bg-obsidian-800 border border-brand/40 rounded-2xl p-1.5">
              <button
                type="button"
                onClick={() => removeItemFromSelection(item, false)}
                className="h-9 w-10 rounded-xl bg-obsidian-900 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-200 flex items-center justify-center transition-colors"
                aria-label="Diminuir quantidade"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>
                  {quantity} {quantity === 1 ? 'salvo' : 'salvos'} (
                  {formatCurrencyBRL(item.price_cents * quantity)})
                </span>
              </div>

              <button
                type="button"
                onClick={() => addItemToSelection(item)}
                className="h-9 w-10 rounded-xl bg-brand text-obsidian-950 flex items-center justify-center font-bold hover:brightness-110 transition-all"
                aria-label="Aumentar quantidade"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
