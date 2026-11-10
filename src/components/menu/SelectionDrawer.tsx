'use client';

import React, { useEffect, useState } from 'react';
import {
  Banknote,
  Check,
  Copy,
  CreditCard,
  Gift,
  Heart,
  MessageCircle,
  Minus,
  Plus,
  QrCode,
  Receipt,
  Trash2,
  UserCheck,
  Utensils,
  X,
} from 'lucide-react';
import type { OrderPaymentPreference, TableOrder } from '@/types/database';
import { useMenuSession } from '@/context/MenuSessionContext';
import {
  type ActiveCustomerCoupon,
  getActiveCustomerCoupon,
  GROWTH_CLUB_UPDATED_EVENT,
} from '@/lib/storage/growthClubStorage';
import {
  buildWhatsAppOrderUrl,
  submitNewTableOrder,
} from '@/lib/storage/ordersStorage';
import { cn, formatCurrencyBRL, generateUUID } from '@/lib/utils';

export function SelectionDrawer() {
  const {
    restaurant,
    sessionOrigin,
    selectedItems,
    isDrawerOpen,
    setIsDrawerOpen,
    addItemToSelection,
    removeItemFromSelection,
    updateItemNotes,
    totalSelectionCount,
    totalSelectionPriceCents,
    trackEvent,
  } = useMenuSession();

  const [paymentPreference, setPaymentPreference] =
    useState<OrderPaymentPreference>('tab_end');
  const [cashChangeFor, setCashChangeFor] = useState('');
  const [waiterPresentationMode, setWaiterPresentationMode] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'editing' | 'pix' | 'sent'>(
    'editing'
  );
  const [lastCreatedOrder, setLastCreatedOrder] = useState<TableOrder | null>(
    null
  );
  const [pixCopied, setPixCopied] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState<ActiveCustomerCoupon | null>(
    null
  );

  useEffect(() => {
    const syncCoupon = () => setActiveCoupon(getActiveCustomerCoupon());
    syncCoupon();
    window.addEventListener(GROWTH_CLUB_UPDATED_EVENT, syncCoupon);
    return () =>
      window.removeEventListener(GROWTH_CLUB_UPDATED_EVENT, syncCoupon);
  }, [isDrawerOpen]);

  const discountCents = activeCoupon
    ? Math.round(totalSelectionPriceCents * (activeCoupon.discountPercent / 100))
    : 0;
  const finalTotalCents = Math.max(0, totalSelectionPriceCents - discountCents);

  const tableLabel =
    sessionOrigin.locationCode !== 'acesso_direto'
      ? sessionOrigin.locationLabel.split('•')[0]?.trim() || 'Mesa 04'
      : 'Mesa 04';

  const mockPixPayload = `00020126580014BR.GOV.BCB.PIX0136${restaurant.id}5204000053039865406${(
    totalSelectionPriceCents / 100
  ).toFixed(2)}5802BR5920NOMADE FORNARIA CAFE6009SAO PAULO62140510${sessionOrigin.locationCode.toUpperCase()}6304A1B2`;

  const handleConfirmOrder = () => {
    trackEvent('checkout_start', null, null, {
      price_cents: totalSelectionPriceCents,
      quantity: totalSelectionCount,
      location: sessionOrigin.locationCode,
      payment_preference: paymentPreference,
    });

    const newOrder: TableOrder = {
      id: `ord-${generateUUID().slice(0, 8)}`,
      orderNumber: Math.floor(102 + (Date.now() % 890)),
      restaurantId: restaurant.id,
      tableLabel,
      locationCode: sessionOrigin.locationCode,
      source: sessionOrigin.source,
      items: selectedItems.map(({ item, quantity, notes }) => ({
        itemId: item.id,
        name: item.name,
        quantity,
        priceCents: item.price_cents,
        notes: notes?.trim() || undefined,
      })),
      totalCents: finalTotalCents,
      discountCents: discountCents > 0 ? discountCents : undefined,
      couponCode: activeCoupon?.couponCode,
      paymentPreference,
      cashChangeFor:
        paymentPreference === 'cash' && cashChangeFor.trim()
          ? cashChangeFor.trim()
          : undefined,
      status: 'novo',
      createdAt: new Date().toISOString(),
    };

    setLastCreatedOrder(newOrder);
    void submitNewTableOrder(newOrder);

    if (paymentPreference === 'pix_now') {
      setOrderStatus('pix');
    } else {
      setOrderStatus('sent');
    }
  };

  const handleCopyPix = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(mockPixPayload);
    }
    setPixCopied(true);
    window.setTimeout(() => setPixCopied(false), 2500);
  };

  const closeDrawer = () => {
    setWaiterPresentationMode(false);
    setOrderStatus('editing');
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* FLOATING BOTTOM PILL (Visible when items are saved) */}
      {totalSelectionCount > 0 && !isDrawerOpen && (
        <div className="fixed bottom-5 inset-x-0 z-40 px-5 pointer-events-none theme-adaptive">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                setWaiterPresentationMode(false);
                setOrderStatus('editing');
                setIsDrawerOpen(true);
              }}
              className="w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-full bg-white text-[#0F0F0F] shadow-2xl shadow-black/40 transition-transform active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <span className="h-6 min-w-[24px] px-1.5 rounded-full bg-[#0F0F0F] text-white text-xs font-bold flex items-center justify-center">
                  {totalSelectionCount}
                </span>
                <span className="text-sm font-semibold tracking-tight">
                  Ver Favoritos / Fazer Pedido
                </span>
              </div>

              <span className="text-sm font-bold tracking-tight">
                {formatCurrencyBRL(totalSelectionPriceCents)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* SLIDE-UP SHEET */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="flex-1" onClick={closeDrawer} />

          <div className="w-full max-w-md mx-auto max-h-[88dvh] rounded-t-3xl bg-[#161616] border-t border-white/10 shadow-2xl flex flex-col overflow-hidden animate-slide-up theme-adaptive">
            {/* Sheet Handle & Header */}
            <div className="px-5 pt-3 pb-3.5 border-b border-white/[0.08]">
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3" />

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-2xl text-white tracking-tight">
                    Sua Seleção • {tableLabel}
                  </h2>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    Peça agora para a mesa ou mostre seus favoritos ao garçom
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDrawer}
                  className="h-8 w-8 rounded-full bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SHEET BODY */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* EMPTY STATE */}
              {selectedItems.length === 0 ? (
                <div className="text-center py-12 space-y-2.5">
                  <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto text-zinc-400">
                    <Heart className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-white">
                    Nenhum item salvo ainda
                  </p>
                  <p className="text-xs text-[#A1A1AA] max-w-xs mx-auto leading-relaxed">
                    Toque no coração nos pratos do cardápio para montar sua seleção ou enviar o pedido para sua mesa.
                  </p>
                </div>
              ) : waiterPresentationMode ? (
                /* MODE A: SHOW TO WAITER SCREEN */
                <div className="p-5 rounded-2xl bg-[#0F0F0F] border border-white/15 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#A1A1AA]">
                        Apresentar ao Garçom
                      </span>
                      <h3 className="font-serif text-2xl text-white mt-0.5">
                        {tableLabel}
                      </h3>
                    </div>
                    <UserCheck className="w-6 h-6 text-white/80" />
                  </div>

                  <div className="space-y-3">
                    {selectedItems.map(({ item, quantity, notes }) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 py-2 border-b border-white/[0.06]"
                      >
                        <div>
                          <div className="text-base font-semibold text-white">
                            <span className="text-zinc-400 mr-2">
                              {quantity}x
                            </span>
                            {item.name}
                          </div>
                          {notes && (
                            <p className="text-xs text-[#A1A1AA] mt-0.5">
                              Obs: {notes}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-white shrink-0">
                          {formatCurrencyBRL(item.price_cents * quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-base font-semibold text-white">
                    <span>Total</span>
                    <span>{formatCurrencyBRL(totalSelectionPriceCents)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setWaiterPresentationMode(false)}
                    className="w-full py-2.5 rounded-full bg-white/[0.1] text-xs font-medium text-white hover:bg-white/[0.15]"
                  >
                    Voltar à Seleção
                  </button>
                </div>
              ) : orderStatus === 'sent' ? (
                /* MODE B: ORDER CONFIRMED FOR TABLE (RINGING IN KITCHEN / COUNTER) */
                <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/15 text-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-white text-[#0F0F0F] flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 stroke-[2.5]" />
                  </div>

                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold">
                      Pedido #{lastCreatedOrder?.orderNumber || 104} •{' '}
                      {tableLabel}
                    </span>
                    <h3 className="font-serif text-2xl text-white">
                      Pedido Recebido na Cozinha!
                    </h3>
                    <p className="text-xs text-[#A1A1AA] max-w-xs mx-auto leading-relaxed">
                      {paymentPreference === 'tab_end' &&
                        'Lançado na comanda da sua mesa para pagamento no final.'}
                      {paymentPreference === 'cash' &&
                        `Pagamento em dinheiro registrado${
                          cashChangeFor ? ` (troco para R$ ${cashChangeFor})` : ''
                        }.`}
                      {paymentPreference === 'card_machine' &&
                        'O garçom levará a maquininha até sua mesa.'}
                      {paymentPreference === 'pix_now' &&
                        'Pagamento via Pix informado à equipe.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-left space-y-1.5 text-xs">
                    {selectedItems.map(({ item, quantity }) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-zinc-300"
                      >
                        <span>
                          {quantity}x {item.name}
                        </span>
                        <span className="text-white font-medium">
                          {formatCurrencyBRL(item.price_cents * quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {lastCreatedOrder && (
                    <a
                      href={buildWhatsAppOrderUrl(lastCreatedOrder)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Enviar Cópia no WhatsApp do Caixa</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="w-full py-3 rounded-full bg-white text-[#0F0F0F] text-xs font-semibold"
                  >
                    Continuar no Cardápio
                  </button>
                </div>
              ) : orderStatus === 'pix' ? (
                /* MODE C: PIX NOW */
                <div className="p-5 rounded-2xl bg-[#0F0F0F] border border-white/15 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#A1A1AA]">
                      Pix Copia e Cola • {tableLabel}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {formatCurrencyBRL(totalSelectionPriceCents)}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#161616] border border-white/10 text-center space-y-2">
                    <div className="mx-auto w-28 h-28 rounded-xl bg-white p-2 flex items-center justify-center">
                      <QrCode className="w-20 h-20 text-[#0F0F0F]" />
                    </div>
                    <p className="text-xs text-[#A1A1AA]">
                      Seu pedido #{lastCreatedOrder?.orderNumber} já apitou na cozinha! Copie o Pix abaixo:
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="flex-1 py-3 px-4 rounded-full bg-white text-[#0F0F0F] font-semibold text-xs flex items-center justify-center gap-2"
                    >
                      {pixCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Código Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Código Pix</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderStatus('sent')}
                      className="py-3 px-4 rounded-full bg-white/[0.12] text-xs font-medium text-white"
                    >
                      Concluir
                    </button>
                  </div>
                </div>
              ) : (
                /* MODE D: EDITING ITEMS + FLEXIBLE PAYMENT / ORDER OPTIONS */
                <>
                  <div className="space-y-3">
                    {selectedItems.map(({ item, quantity, notes }) => {
                      const thumb =
                        item.media_urls[0]?.poster || item.media_urls[0]?.url;
                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-[#0F0F0F] border border-white/[0.08] space-y-2.5"
                        >
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={thumb}
                              alt={item.name}
                              className="h-14 w-14 rounded-xl object-cover shrink-0 bg-[#1F1F1F]"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-serif text-base text-white truncate">
                                {item.name}
                              </h4>
                              <p className="text-xs font-medium text-zinc-300 mt-0.5">
                                {formatCurrencyBRL(item.price_cents * quantity)}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <div className="inline-flex items-center gap-2 bg-white/[0.08] rounded-full px-2 py-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeItemFromSelection(item, false)
                                  }
                                  className="h-6 w-6 rounded-full hover:bg-white/10 flex items-center justify-center text-white"
                                  aria-label="Diminuir"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-semibold text-white min-w-[14px] text-center">
                                  {quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => addItemToSelection(item)}
                                  className="h-6 w-6 rounded-full bg-white text-[#0F0F0F] flex items-center justify-center"
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
                                className="p-2 rounded-full text-zinc-500 hover:text-white transition-colors"
                                aria-label="Remover item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={notes || ''}
                            onChange={(e) =>
                              updateItemNotes(item.id, e.target.value)
                            }
                            placeholder="Observação para a cozinha (ex: sem cebola, ponto...)"
                            className="w-full px-3 py-1.5 rounded-xl bg-[#161616] border border-white/[0.06] text-[11px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Payment Timing & Method Selector */}
                  <div className="space-y-2.5 pt-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#A1A1AA]">
                      Como prefere pagar?
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentPreference('tab_end')}
                        className={cn(
                          'p-3 rounded-2xl border text-left transition-all flex flex-col gap-1',
                          paymentPreference === 'tab_end'
                            ? 'bg-white text-[#0F0F0F] border-white font-semibold'
                            : 'bg-[#0F0F0F] border-white/10 text-zinc-300 hover:border-white/25'
                        )}
                      >
                        <Receipt className="w-4 h-4" />
                        <span className="text-xs">Pagar no Final</span>
                        <span
                          className={cn(
                            'text-[10px]',
                            paymentPreference === 'tab_end'
                              ? 'text-[#0F0F0F]/70'
                              : 'text-zinc-500'
                          )}
                        >
                          Lançar na comanda da mesa
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentPreference('cash')}
                        className={cn(
                          'p-3 rounded-2xl border text-left transition-all flex flex-col gap-1',
                          paymentPreference === 'cash'
                            ? 'bg-white text-[#0F0F0F] border-white font-semibold'
                            : 'bg-[#0F0F0F] border-white/10 text-zinc-300 hover:border-white/25'
                        )}
                      >
                        <Banknote className="w-4 h-4" />
                        <span className="text-xs">Dinheiro</span>
                        <span
                          className={cn(
                            'text-[10px]',
                            paymentPreference === 'cash'
                              ? 'text-[#0F0F0F]/70'
                              : 'text-zinc-500'
                          )}
                        >
                          Pagar em espécie na mesa
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentPreference('card_machine')}
                        className={cn(
                          'p-3 rounded-2xl border text-left transition-all flex flex-col gap-1',
                          paymentPreference === 'card_machine'
                            ? 'bg-white text-[#0F0F0F] border-white font-semibold'
                            : 'bg-[#0F0F0F] border-white/10 text-zinc-300 hover:border-white/25'
                        )}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span className="text-xs">Cartão na Mesa</span>
                        <span
                          className={cn(
                            'text-[10px]',
                            paymentPreference === 'card_machine'
                              ? 'text-[#0F0F0F]/70'
                              : 'text-zinc-500'
                          )}
                        >
                          Garçom traz a maquininha
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentPreference('pix_now')}
                        className={cn(
                          'p-3 rounded-2xl border text-left transition-all flex flex-col gap-1',
                          paymentPreference === 'pix_now'
                            ? 'bg-white text-[#0F0F0F] border-white font-semibold'
                            : 'bg-[#0F0F0F] border-white/10 text-zinc-300 hover:border-white/25'
                        )}
                      >
                        <QrCode className="w-4 h-4" />
                        <span className="text-xs">Pix pelo Celular</span>
                        <span
                          className={cn(
                            'text-[10px]',
                            paymentPreference === 'pix_now'
                              ? 'text-[#0F0F0F]/70'
                              : 'text-zinc-500'
                          )}
                        >
                          Adiantar pagamento agora
                        </span>
                      </button>
                    </div>

                    {paymentPreference === 'cash' && (
                      <div className="pt-1 animate-fadeIn">
                        <input
                          type="text"
                          value={cashChangeFor}
                          onChange={(e) => setCashChangeFor(e.target.value)}
                          placeholder="Precisa de troco para quanto? (Ex: R$ 100,00 ou deixe em branco)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0F0F] border border-white/15 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* SHEET FOOTER */}
            {selectedItems.length > 0 &&
              !waiterPresentationMode &&
              orderStatus === 'editing' && (
                <div className="p-5 bg-[#0F0F0F] border-t border-white/10 space-y-3">
                  {activeCoupon && discountCents > 0 && (
                    <div className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Gift className="w-3.5 h-3.5" />
                        Cupom Clube VIP ({activeCoupon.couponCode} -{activeCoupon.discountPercent}%)
                      </span>
                      <span className="font-bold">
                        -{formatCurrencyBRL(discountCents)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#A1A1AA]">
                      Total ({totalSelectionCount}{' '}
                      {totalSelectionCount === 1 ? 'item' : 'itens'})
                    </span>
                    <div className="text-right">
                      {discountCents > 0 && (
                        <span className="text-xs text-zinc-500 line-through mr-2">
                          {formatCurrencyBRL(totalSelectionPriceCents)}
                        </span>
                      )}
                      <span className="text-lg font-semibold text-white">
                        {formatCurrencyBRL(finalTotalCents)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    className="w-full py-3.5 px-5 rounded-full bg-white text-[#0F0F0F] font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99]"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>
                      {paymentPreference === 'pix_now'
                        ? 'Enviar Pedido e Gerar Pix'
                        : `Enviar Pedido para ${tableLabel}`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWaiterPresentationMode(true)}
                    className="w-full py-2.5 px-4 rounded-full bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Apenas Mostrar Favoritos ao Garçom</span>
                  </button>
                </div>
              )}
          </div>
        </div>
      )}
    </>
  );
}
