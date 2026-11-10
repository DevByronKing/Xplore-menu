'use client';

import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ExternalLink,
  Gift,
  Instagram,
  MessageSquareHeart,
  ShieldCheck,
  Sparkles,
  Star,
  TicketPercent,
  X,
} from 'lucide-react';
import type { ClubMissionId, GrowthClubConfig } from '@/types/database';
import { useMenuSession } from '@/context/MenuSessionContext';
import {
  type ActiveCustomerCoupon,
  getActiveCustomerCoupon,
  GROWTH_CLUB_UPDATED_EVENT,
  loadGrowthClubConfig,
  registerClubMissionCompletion,
  submitCustomerReview,
} from '@/lib/storage/growthClubStorage';
import { cn } from '@/lib/utils';

interface GrowthClubModalProps {
  isOpen: boolean;
  initialTab?: 'review' | 'club';
  onClose: () => void;
}

export function GrowthClubModal({
  isOpen,
  initialTab = 'club',
  onClose,
}: GrowthClubModalProps) {
  const { sessionOrigin, trackEvent } = useMenuSession();
  const [config, setConfig] = useState<GrowthClubConfig>(loadGrowthClubConfig());
  const [activeTab, setActiveTab] = useState<'review' | 'club'>(initialTab);

  // Review state
  const [rating, setRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Club state
  const [activeCoupon, setActiveCoupon] = useState<ActiveCustomerCoupon | null>(
    null
  );
  const [selectedMissionId, setSelectedMissionId] =
    useState<ClubMissionId>('google_review');

  useEffect(() => {
    const sync = () => {
      const loaded = loadGrowthClubConfig();
      setConfig(loaded);
      setActiveCoupon(getActiveCustomerCoupon());
      if (!loaded.clubModuleEnabled && activeTab === 'club') {
        setActiveTab('review');
      }
    };
    sync();
    window.addEventListener(GROWTH_CLUB_UPDATED_EVENT, sync);
    return () => window.removeEventListener(GROWTH_CLUB_UPDATED_EVENT, sync);
  }, [activeTab]);

  useEffect(() => {
    if (isOpen) {
      setActiveCoupon(getActiveCustomerCoupon());
      if (!config.clubModuleEnabled) {
        setActiveTab('review');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, initialTab, config.clubModuleEnabled]);

  if (!isOpen) return null;

  const tableLabel =
    sessionOrigin.locationLabel.split('•')[0]?.trim() || 'Mesa 04';

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isPromoter = rating >= 4;

    submitCustomerReview({
      tableLabel,
      rating,
      comment:
        reviewComment.trim() ||
        (isPromoter
          ? 'Experiência excelente na mesa!'
          : 'Feedback enviado à gerência.'),
      customerName: customerName.trim() || undefined,
      customerPhone: customerWhatsapp.trim() || undefined,
      redirectedToGoogle: isPromoter,
      sharedOnInstagram: isPromoter,
    });

    trackEvent('review_submitted', null, null, {
      rating,
      location: tableLabel,
    });

    // Se o módulo de Clube estiver ativo e o cliente avaliou, já desbloqueia a missão de avaliação!
    if (config.clubModuleEnabled) {
      const reviewMission = config.missions.find(
        (m) => m.id === 'google_review' && m.enabled
      );
      if (reviewMission) {
        const coupon = registerClubMissionCompletion({
          name: customerName.trim() || 'Cliente Avaliador',
          whatsapp: customerWhatsapp.trim() || 'Avaliação na Mesa',
          tableLabel,
          missionId: 'google_review',
          couponCode: reviewMission.couponCode,
          discountPercent: reviewMission.discountPercent,
          rewardLabel: reviewMission.rewardLabel,
        });
        setActiveCoupon(coupon);
      }
    }

    setReviewSubmitted(true);
  };

  const handleCompleteMission = (missionId: ClubMissionId) => {
    const mission = config.missions.find((m) => m.id === missionId);
    if (!mission) return;

    const coupon = registerClubMissionCompletion({
      name: customerName.trim() || 'Membro Clube VIP',
      whatsapp: customerWhatsapp.trim() || 'Validado via NFC',
      tableLabel,
      missionId: mission.id,
      couponCode: mission.couponCode,
      discountPercent: mission.discountPercent,
      rewardLabel: mission.rewardLabel,
    });

    trackEvent('club_mission_completed', null, null, {
      mission_id: mission.id,
      discount_percent: mission.discountPercent,
    });

    setActiveCoupon(coupon);

    // Open external target if Google or Instagram mission
    if (missionId === 'google_review' && config.googleReviewUrl) {
      window.open(config.googleReviewUrl, '_blank', 'noopener,noreferrer');
    } else if (missionId === 'instagram_story') {
      const cleanHandle = config.instagramHandle.replace(/^@/, '');
      window.open(
        `https://instagram.com/${cleanHandle}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#161616] border-t sm:border border-white/15 shadow-2xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto theme-adaptive"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              {config.clubModuleEnabled ? (
                <Gift className="w-4 h-4" />
              ) : (
                <Star className="w-4 h-4" />
              )}
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                {tableLabel} • Experiência & Benefícios
              </span>
              <h3 className="font-serif text-xl text-white">
                {config.clubModuleEnabled
                  ? config.clubName
                  : 'Avalie Nossa Casa'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Seletor de Abas (quando Clube de Descontos está ativo) */}
        {config.clubModuleEnabled && (
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#0F0F0F] border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('club')}
              className={cn(
                'py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
                activeTab === 'club'
                  ? 'bg-white text-[#0F0F0F]'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <TicketPercent className="w-3.5 h-3.5" />
              <span>Clube de Descontos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('review')}
              className={cn(
                'py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
                activeTab === 'review'
                  ? 'bg-white text-[#0F0F0F]'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Avaliar Experiência</span>
            </button>
          </div>
        )}

        {/* Banner de Cupom Ativo (se já desbloqueou) */}
        {activeCoupon && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                  Benefício Aplicado na sua Comanda
                </span>
                <p className="text-xs font-bold text-white truncate">
                  {activeCoupon.rewardLabel} ({activeCoupon.couponCode})
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-400 text-[#0F0F0F] text-xs font-black shrink-0">
              -{activeCoupon.discountPercent}%
            </span>
          </div>
        )}

        {/* ABA 1: CLUBE DE DESCONTOS GAMIFICADO (MÓDULO OPCIONAL) */}
        {activeTab === 'club' && config.clubModuleEnabled && (
          <div className="space-y-3.5 text-xs">
            <p className="text-zinc-300 leading-relaxed">
              Realize <strong>1 ação rápida</strong> abaixo para desbloquear seu
              desconto imediato no pedido de hoje:
            </p>

            <div className="space-y-2.5">
              {config.missions
                .filter((m) => m.enabled)
                .map((mission) => {
                  const isSelected = selectedMissionId === mission.id;
                  const isUnlocked =
                    activeCoupon?.missionId === mission.id ||
                    activeCoupon?.couponCode === mission.couponCode;

                  return (
                    <div
                      key={mission.id}
                      onClick={() => setSelectedMissionId(mission.id)}
                      className={cn(
                        'p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2',
                        isSelected
                          ? 'bg-[#0F0F0F] border-amber-400/60 ring-1 ring-amber-400/30'
                          : 'bg-[#0F0F0F]/60 border-white/10 hover:border-white/25'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {mission.id === 'google_review' && (
                            <Star className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          {mission.id === 'instagram_story' && (
                            <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
                          )}
                          {mission.id === 'vip_whatsapp' && (
                            <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                          <span className="font-bold text-white text-xs">
                            {mission.title}
                          </span>
                        </div>

                        <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold shrink-0">
                          -{mission.discountPercent}% OFF
                        </span>
                      </div>

                      <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                        {mission.subtitle}
                      </p>

                      {isSelected && (
                        <div className="pt-2 space-y-2 border-t border-white/10">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="Seu nome (opcional)"
                              className="px-3 py-2 rounded-xl bg-[#161616] border border-white/10 text-white text-xs"
                            />
                            <input
                              type="tel"
                              value={customerWhatsapp}
                              onChange={(e) =>
                                setCustomerWhatsapp(e.target.value)
                              }
                              placeholder="Seu WhatsApp p/ cupom"
                              className="px-3 py-2 rounded-xl bg-[#161616] border border-white/10 text-white text-xs"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteMission(mission.id);
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-white text-[#0F0F0F] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-200 transition-all"
                          >
                            {isUnlocked ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>
                                  Cupom {mission.couponCode} Já Desbloqueado!
                                </span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                <span>
                                  Realizar Ação & Desbloquear -{mission.discountPercent}%
                                </span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ABA 2: FLUXO DE AVALIAÇÃO INTELIGENTE (GOOGLE ADS + INSTAGRAM + ESCUDO DE REPUTAÇÃO) */}
        {(activeTab === 'review' || !config.clubModuleEnabled) && (
          <div className="space-y-4 text-xs">
            {!reviewSubmitted ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 text-center space-y-2.5">
                  <span className="text-xs font-semibold text-zinc-300 block">
                    Como está sendo sua experiência hoje na {tableLabel}?
                  </span>

                  <div className="flex items-center justify-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1.5 rounded-full transition-transform active:scale-90"
                      >
                        <Star
                          className={cn(
                            'w-8 h-8 transition-colors',
                            star <= rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-zinc-600'
                          )}
                        />
                      </button>
                    ))}
                  </div>

                  <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-white">
                    {rating === 5 && '5 Estrelas • Experiência Inesquecível!'}
                    {rating === 4 && '4 Estrelas • Muito Bom!'}
                    {rating === 3 && '3 Estrelas • Pode Melhorar'}
                    {rating <= 2 && 'Precisamos resolver algo na sua mesa agora'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300">
                    {rating >= 4
                      ? 'O que você mais gostou no prato ou atendimento?'
                      : 'Conte diretamente para a gerência como podemos resolver agora:'}
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={
                      rating >= 4
                        ? 'Ex: A Focaccia Burrata e o Pistachio Latte estavam perfeitos!'
                        : 'Sua mensagem vai direto para o gerente em tempo real...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Seu nome (opcional)"
                    className="px-3.5 py-2.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"
                  />
                  <input
                    type="tel"
                    value={customerWhatsapp}
                    onChange={(e) => setCustomerWhatsapp(e.target.value)}
                    placeholder="Seu WhatsApp (opcional)"
                    className="px-3.5 py-2.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-white text-[#0F0F0F] font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-lg"
                >
                  <MessageSquareHeart className="w-4 h-4" />
                  <span>
                    {rating >= 4
                      ? config.clubModuleEnabled
                        ? 'Enviar Avaliação & Ganhar 10% OFF'
                        : 'Enviar Avaliação Positiva'
                      : 'Enviar Alerta Direto à Gerência'}
                  </span>
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/15 space-y-4 text-center animate-fadeIn">
                {rating >= 4 ? (
                  <>
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif text-xl text-white">
                        Muito obrigado pelo carinho!
                      </h4>
                      <p className="text-xs text-[#A1A1AA]">
                        Sua nota de {rating} estrelas ajuda nossa casa a crescer
                        no Google e no Instagram.
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      <a
                        href={config.googleReviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 rounded-xl bg-white text-[#0F0F0F] font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200"
                      >
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                        <span>Publicar no Google Maps (1 Toque)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <a
                        href={`https://instagram.com/${config.instagramHandle.replace(
                          /^@/,
                          ''
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2"
                      >
                        <Instagram className="w-4 h-4" />
                        <span>
                          Seguir & Marcar {config.instagramHandle} no Instagram
                        </span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif text-xl text-white">
                        Gerência Notificada na Hora
                      </h4>
                      <p className="text-xs text-[#A1A1AA]">
                        Recebemos seu feedback privado da {tableLabel}. Nosso
                        responsável já foi avisado para cuidar pessoalmente da
                        sua mesa.
                      </p>
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setReviewSubmitted(false);
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/10 text-zinc-300 font-semibold text-xs"
                >
                  Voltar ao Cardápio
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
