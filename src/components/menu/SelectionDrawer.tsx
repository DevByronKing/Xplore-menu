'use client';

import React, { useState } from 'react';
import {
  Check,
  Copy,
  CreditCard,
  Heart,
  Minus,
  Plus,
  QrCode,
  Radio,
  ShoppingBag,
  Sparkles,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import type { MenuItem } from '@/types/database';
import { useMenuSession } from '@/context/MenuSessionContext';
import { cn, formatCurrencyBRL } from '@/lib/utils';

interface SelectionDrawerProps {
  allItems: MenuItem[];
}

export function SelectionDrawer({ allItems }: SelectionDrawerProps) {
  const {
    restaurant,
    sessionOrigin,
    selectedItems,
    likedItemIds,
    isDrawerOpen,
    setIsDrawerOpen,
    addItemToSelection,
    removeItemFromSelection,
    updateItemNotes,
    toggleLikeItem,
    totalSelectionCount,
    totalSelectionPriceCents,
    trackEvent,
  } = useMenuSession();

  const [activeTab, setActiveTab] = useState<'selection' | 'liked'>('selection');
  const [waiterPresentationMode, setWaiterPresentationMode] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'idle' | 'pix' | 'confirmed'>('idle');
  const [pixCopied, setPixCopied] = useState(false);

  const likedItems = allItems.filter((item) => likedItemIds.includes(item.id));

  const mockPixPayload = `00020126580014BR.GOV.BCB.PIX0136${restaurant.id}5204000053039865406${(
    totalSelectionPriceCents / 100
  ).toFixed(2)}5802BR5920NOMADE FORNARIA CAFE6009SAO PAULO62140510${sessionOrigin.locationCode.toUpperCase()}6304A1B2`;

  const handleStartCheckout = () => {
    trackEvent('checkout_start', null, null, {
      price_cents: totalSelectionPriceCents,
      quantity: totalSelectionCount,
      location: sessionOrigin.locationCode,
    });
    setCheckoutStep('pix');
  };

  const handleCopyPix = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(mockPixPayload);
    }
    setPixCopied(true);
    window.setTimeout(() => setPixCopied(false), 2500);
  };

  return (
    <>
      {/* FLOATING BOTTOM BAR (Always visible when user has saved items or likes) */}
      {(totalSelectionCount > 0 || likedItems.length > 0) && !isDrawerOpen && (
        <div className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                setActiveTab(totalSelectionCount > 0 ? 'selection' : 'liked');
                setIsDrawerOpen(true);
              }}
              className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-obsidian-900 via-obsidian-800 to-obsidian-900 border border-brand/50 shadow-2xl shadow-black/90 backdrop-blur-xl transition-transform active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-brand to-amber-500 text-obsidian-950 flex items-center justify-center font-black shadow-md shadow-brand/30">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 rounded-full bg-white text-obsidian-950 text-[11px] font-black flex items-center justify-center shadow">
                    {totalSelectionCount || likedItems.length}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Meus Favoritos & Pedido Rápido</span>
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {totalSelectionCount > 0
                      ? `${totalSelectionCount} ${
                          totalSelectionCount === 1 ? 'item salvo' : 'itens salvos'
                        } • ${sessionOrigin.locationLabel}`
                      : `${likedItems.length} ${
                          likedItems.length === 1 ? 'prato curtido' : 'pratos curtidos'
                        }`}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                {totalSelectionCount > 0 ? (
                  <>
                    <span className="block text-[10px] uppercase tracking-wider text-zinc-400">
                      Subtotal
                    </span>
                    <span className="text-base font-black text-amber-400">
                      {formatCurrencyBRL(totalSelectionPriceCents)}
                    </span>
                  </>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-brand/20 text-brand-light text-xs font-semibold">
                    Ver Lista
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* DRAWER BACKDROP & SLIDE-UP SHEET */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className="flex-1"
            onClick={() => {
              setWaiterPresentationMode(false);
              setCheckoutStep('idle');
              setIsDrawerOpen(false);
            }}
          />

          <div className="w-full max-w-md mx-auto max-h-[88vh] rounded-t-3xl bg-obsidian-900 border-t border-white/15 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            {/* Drawer Handle & Header */}
            <div className="px-5 pt-3 pb-3 border-b border-white/10">
              <div className="w-12 h-1.5 rounded-full bg-white/15 mx-auto mb-3" />

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>Minha Seleção na Mesa</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">
                      <Radio className="w-3 h-3" />
                      {sessionOrigin.locationLabel}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Mostre ao garçom ou conclua o pedido direto pelo celular
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setWaiterPresentationMode(false);
                    setCheckoutStep('idle');
                    setIsDrawerOpen(false);
                  }}
                  className="h-8 w-8 rounded-full bg-obsidian-800 text-zinc-400 hover:text-white flex items-center justify-center"
                  aria-label="Fechar gaveta"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs: Selection vs Liked Wishlist */}
              <div className="mt-3 grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-obsidian-950 border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('selection');
                    setWaiterPresentationMode(false);
                    setCheckoutStep('idle');
                  }}
                  className={cn(
                    'py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
                    activeTab === 'selection'
                      ? 'bg-obsidian-800 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-brand" />
                  <span>Pedido ({totalSelectionCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('liked');
                    setWaiterPresentationMode(false);
                    setCheckoutStep('idle');
                  }}
                  className={cn(
                    'py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
                    activeTab === 'liked'
                      ? 'bg-obsidian-800 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>Curtidos ({likedItems.length})</span>
                </button>
              </div>
            </div>

            {/* DRAWER BODY */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* MODE 1: WAITER PRESENTATION CARD */}
              {waiterPresentationMode && (
                <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-500/15 to-obsidian-950 border-2 border-amber-400/50 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                        Ficha para o Garçom
                      </span>
                      <h3 className="text-xl font-black text-white">
                        {sessionOrigin.locationLabel}
                      </h3>
                    </div>
                    <UserCheck className="w-8 h-8 text-amber-400" />
                  </div>

                  <div className="space-y-3">
                    {selectedItems.map(({ item, quantity, notes }) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 py-2 border-b border-white/5"
                      >
                        <div>
                          <div className="text-base font-extrabold text-white">
                            <span className="text-amber-400 mr-2">{quantity}x</span>
                            {item.name}
                          </div>
                          {notes && (
                            <p className="text-xs text-amber-200 mt-0.5">
                              Obs: {notes}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-bold text-zinc-300 shrink-0">
                          {formatCurrencyBRL(item.price_cents * quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-lg font-black text-white">
                    <span>Total Estimado</span>
                    <span className="text-amber-400">
                      {formatCurrencyBRL(totalSelectionPriceCents)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setWaiterPresentationMode(false)}
                    className="w-full py-2.5 rounded-xl bg-obsidian-800 text-xs font-bold text-zinc-300 hover:text-white"
                  >
                    Voltar à Edição da Sacola
                  </button>
                </div>
              )}

              {/* MODE 2: PIX / CHECKOUT INTEGRADO (Feature Flag Preview) */}
              {checkoutStep !== 'idle' && !waiterPresentationMode && (
                <div className="p-5 rounded-2xl bg-obsidian-950 border border-emerald-500/40 space-y-4">
                  {checkoutStep === 'pix' ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <QrCode className="w-4 h-4" />
                          Checkout Direto na {sessionOrigin.locationLabel}
                        </span>
                        <span className="text-sm font-black text-white">
                          {formatCurrencyBRL(totalSelectionPriceCents)}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-obsidian-900 border border-white/10 text-center space-y-2">
                        <div className="mx-auto w-32 h-32 rounded-xl bg-white p-2 flex items-center justify-center">
                          <QrCode className="w-24 h-24 text-obsidian-950" />
                        </div>
                        <p className="text-xs text-zinc-300 font-medium">
                          Escaneie ou copie o código Pix abaixo. Seu pedido será enviado direto para a cozinha vinculado à{' '}
                          <strong className="text-white">
                            {sessionOrigin.locationLabel}
                          </strong>
                          .
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 text-obsidian-950 font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110"
                        >
                          {pixCopied ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Código Pix Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copiar Pix Copia e Cola</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckoutStep('confirmed')}
                          className="py-3 px-4 rounded-xl bg-obsidian-800 border border-white/15 text-xs font-bold text-white hover:bg-obsidian-700"
                        >
                          Simular Pago
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 space-y-3">
                      <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <Check className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-extrabold text-white">
                        Pedido Enviado para a Cozinha!
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                        Nosso time já recebeu seu pedido vinculado à{' '}
                        <span className="text-white font-semibold">
                          {sessionOrigin.locationLabel}
                        </span>
                        .
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutStep('idle');
                          setIsDrawerOpen(false);
                        }}
                        className="mt-2 px-5 py-2.5 rounded-xl bg-brand text-obsidian-950 text-xs font-bold"
                      >
                        Continuar Explorando
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 3: STANDARD SELECTION LIST */}
              {activeTab === 'selection' &&
                !waiterPresentationMode &&
                checkoutStep === 'idle' && (
                  <>
                    {selectedItems.length === 0 ? (
                      <div className="text-center py-10 space-y-2">
                        <ShoppingBag className="w-10 h-10 text-zinc-600 mx-auto" />
                        <p className="text-sm font-bold text-zinc-300">
                          Sua seleção está vazia
                        </p>
                        <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                          Adicione os pratos que chamaram sua atenção no feed para mostrar ao garçom ou pedir direto da mesa.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedItems.map(({ item, quantity, notes }) => {
                          const thumb =
                            item.media_urls[0]?.poster || item.media_urls[0]?.url;
                          return (
                            <div
                              key={item.id}
                              className="p-3 rounded-2xl bg-obsidian-950 border border-white/[0.08] space-y-2.5"
                            >
                              <div className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={thumb}
                                  alt={item.name}
                                  className="h-16 w-16 rounded-xl object-cover shrink-0 bg-obsidian-800"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-bold text-white truncate">
                                    {item.name}
                                  </h4>
                                  <p className="text-xs font-extrabold text-amber-400 mt-0.5">
                                    {formatCurrencyBRL(item.price_cents * quantity)}
                                    <span className="text-[10px] text-zinc-500 font-normal ml-1">
                                      ({formatCurrencyBRL(item.price_cents)} un)
                                    </span>
                                  </p>

                                  {/* Quantity & Remove Controls */}
                                  <div className="mt-2 flex items-center justify-between">
                                    <div className="inline-flex items-center gap-2 bg-obsidian-900 border border-white/10 rounded-lg p-0.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeItemFromSelection(item, false)
                                        }
                                        className="h-6 w-6 rounded-md hover:bg-white/10 flex items-center justify-center text-zinc-300"
                                        aria-label="Diminuir"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="text-xs font-bold text-white px-1">
                                        {quantity}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => addItemToSelection(item)}
                                        className="h-6 w-6 rounded-md bg-brand/20 text-brand-light flex items-center justify-center"
                                        aria-label="Aumentar"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeItemFromSelection(item, true)
                                      }
                                      className="inline-flex items-center gap-1 text-[11px] text-rose-400/80 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                                      title="Remover item (registra evento de hesitação na telemetria)"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Desistir</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Optional kitchen note */}
                              <input
                                type="text"
                                value={notes || ''}
                                onChange={(e) =>
                                  updateItemNotes(item.id, e.target.value)
                                }
                                placeholder="Alguma observação? Ex: sem cebola, ponto da gema..."
                                className="w-full px-3 py-1.5 rounded-xl bg-obsidian-900 border border-white/[0.06] text-[11px] text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-brand/50"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

              {/* MODE 4: LIKED WISHLIST TAB */}
              {activeTab === 'liked' && (
                <div className="space-y-2.5">
                  {likedItems.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <Heart className="w-10 h-10 text-zinc-600 mx-auto" />
                      <p className="text-sm font-bold text-zinc-300">
                        Nenhum prato curtido ainda
                      </p>
                      <p className="text-xs text-zinc-500">
                        Dê dois toques nos vídeos ou toque no coração para salvar seus favoritos.
                      </p>
                    </div>
                  ) : (
                    likedItems.map((item) => {
                      const thumb =
                        item.media_urls[0]?.poster || item.media_urls[0]?.url;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-obsidian-950 border border-white/[0.08]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={thumb}
                              alt={item.name}
                              className="h-12 w-12 rounded-xl object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">
                                {item.name}
                              </h4>
                              <p className="text-xs font-bold text-amber-400">
                                {formatCurrencyBRL(item.price_cents)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                addItemToSelection(item);
                                setActiveTab('selection');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-brand text-obsidian-950 text-xs font-bold"
                            >
                              + Pedir
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleLikeItem(item)}
                              className="p-1.5 rounded-xl bg-obsidian-800 text-rose-400"
                              aria-label="Descurtir"
                            >
                              <Heart className="w-4 h-4 fill-rose-500" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* DRAWER FOOTER: Waiter Presentation + Integrated Checkout CTA */}
            {selectedItems.length > 0 &&
              !waiterPresentationMode &&
              checkoutStep === 'idle' && (
                <div className="p-4 bg-obsidian-950 border-t border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">
                      Total ({totalSelectionCount}{' '}
                      {totalSelectionCount === 1 ? 'item' : 'itens'})
                    </span>
                    <span className="text-lg font-black text-amber-400">
                      {formatCurrencyBRL(totalSelectionPriceCents)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setWaiterPresentationMode(true)}
                      className="py-3 px-3 rounded-2xl bg-obsidian-800 hover:bg-obsidian-700 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <UserCheck className="w-4 h-4 text-amber-400" />
                      <span>Mostrar ao Garçom</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStartCheckout}
                      className="py-3 px-3 rounded-2xl bg-gradient-to-r from-brand to-amber-500 text-obsidian-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-brand/25 hover:brightness-110 transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pedir & Pagar (Pix)</span>
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </>
  );
}
