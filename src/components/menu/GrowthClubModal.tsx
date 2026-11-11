'use client';

import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Gift,
  Instagram,
  MessageSquareHeart,
  Sparkles,
  Star,
  TicketPercent,
  X,
} from 'lucide-react';
import type { ClubMissionId, Restaurant } from '@/types/database';
import {
  registerClubMissionCompletion,
  submitCustomerReview,
} from '@/lib/storage/growthClubStorage';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

interface GrowthClubModalProps {
  restaurant: Restaurant;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'review' | 'club';
}

interface ClubMission {
  id: string;
  missionKey: ClubMissionId;
  title: string;
  subtitle: string;
  rewardBadge: string;
  discountPercent: number;
  couponCode: string;
  actionLabel: string;
  actionType: 'instagram' | 'google' | 'checkin';
}

const DEFAULT_MISSIONS: ClubMission[] = [
  {
    id: 'mission-insta-story',
    missionKey: 'instagram_story',
    title: 'Postar Story do Prato no Instagram',
    subtitle: 'Marque @nomadepadaria no seu Story mostrando sua escolha na mesa.',
    rewardBadge: '12% OFF + Café Cortesia',
    discountPercent: 12,
    couponCode: 'INSTAVIP12',
    actionLabel: 'Abrir Instagram (@nomadepadaria)',
    actionType: 'instagram',
  },
  {
    id: 'mission-google-5stars',
    missionKey: 'google_review',
    title: 'Avaliação 5 Estrelas no Google',
    subtitle: 'Conte como foi sua experiência e ajude nosso restaurante a crescer.',
    rewardBadge: '10% OFF na Comanda Hoje',
    discountPercent: 10,
    couponCode: 'GOOGLEVIP10',
    actionLabel: 'Avaliar no Google Agora',
    actionType: 'google',
  },
  {
    id: 'mission-club-checkin',
    missionKey: 'vip_whatsapp',
    title: 'Cadastro Rápido no Clube da Casa',
    subtitle: 'Receba convites de fornadas especiais e descontos de aniversariante.',
    rewardBadge: '15% OFF Desbloqueado Hoje',
    discountPercent: 15,
    couponCode: 'CLUBENOMADE15',
    actionLabel: 'Ativar Meu Passaporte VIP',
    actionType: 'checkin',
  },
];

export function GrowthClubModal({
  restaurant,
  isOpen,
  onClose,
  initialTab = 'club',
}: GrowthClubModalProps) {
  const { isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<'club' | 'review'>(initialTab);
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [unlockedMissions, setUnlockedMissions] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');

  if (!isOpen) return null;

  const googleReviewUrl =
    restaurant.google_review_url ||
    `https://search.google.com/local/writereview?placeid=ChIJ_XploreMenuDemo`;
  const instagramUrl = `https://instagram.com/${(
    restaurant.instagram_handle || 'nomadepadaria'
  ).replace('@', '')}`;

  const handleUnlockMission = (mission: ClubMission) => {
    if (!unlockedMissions.includes(mission.id)) {
      setUnlockedMissions((prev) => [...prev, mission.id]);
    }
    registerClubMissionCompletion({
      name: 'Cliente da Mesa',
      whatsapp: customerWhatsapp.trim() || 'Verificado na Mesa',
      tableLabel: 'Mesa 04',
      missionId: mission.missionKey,
      couponCode: mission.couponCode,
      discountPercent: mission.discountPercent,
      rewardLabel: mission.rewardBadge,
    });
    if (mission.actionType === 'instagram') {
      window.open(instagramUrl, '_blank', 'noopener,noreferrer');
    } else if (mission.actionType === 'google') {
      window.open(googleReviewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-[460px] rounded-t-3xl sm:rounded-3xl border p-5 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto transition-colors',
          isLight
            ? 'bg-[#F8F6F1] border-zinc-300 text-zinc-900'
            : 'bg-[#161616] border-white/15 text-white'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'h-10 w-10 rounded-2xl flex items-center justify-center border',
                isLight
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-800'
                  : 'bg-amber-500/20 border-amber-400/30 text-amber-400'
              )}
            >
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-widest block',
                  isLight ? 'text-amber-800' : 'text-amber-400'
                )}
              >
                Clube de Benefícios & Avaliação
              </span>
              <h3
                className={cn(
                  'font-serif text-xl leading-tight',
                  isLight ? 'text-zinc-900' : 'text-white'
                )}
              >
                {restaurant.name} VIP
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
              isLight
                ? 'bg-zinc-200/80 text-zinc-700 hover:bg-zinc-300'
                : 'bg-white/[0.08] text-zinc-400 hover:text-white'
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alternador de Abas: Clube de Descontos vs Avaliar Experiência */}
        <div
          className={cn(
            'grid grid-cols-2 gap-1.5 p-1 rounded-2xl border mb-5',
            isLight
              ? 'bg-zinc-200/70 border-zinc-300/80'
              : 'bg-[#0F0F0F] border-white/10'
          )}
        >
          <button
            type="button"
            onClick={() => setActiveTab('club')}
            className={cn(
              'py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
              activeTab === 'club'
                ? 'bg-amber-400 text-[#0F0F0F] shadow font-bold'
                : isLight
                  ? 'text-zinc-700 hover:text-zinc-950'
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
              'py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
              activeTab === 'review'
                ? 'bg-amber-400 text-[#0F0F0F] shadow font-bold'
                : isLight
                  ? 'text-zinc-700 hover:text-zinc-950'
                  : 'text-zinc-400 hover:text-white'
            )}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Avaliar & Instagram</span>
          </button>
        </div>

        {/* ABA 1: CLUBE DE DESCONTOS POR AÇÃO */}
        {activeTab === 'club' && (
          <div className="space-y-3.5">
            <div
              className={cn(
                'p-3.5 rounded-2xl border',
                isLight
                  ? 'bg-amber-100/80 border-amber-300 text-amber-950'
                  : 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-amber-400/25 text-zinc-200'
              )}
            >
              <p className="text-xs leading-relaxed">
                Realize uma das ações rápidas abaixo durante sua visita e{' '}
                <strong
                  className={cn(
                    'font-bold',
                    isLight ? 'text-amber-900' : 'text-amber-300'
                  )}
                >
                  desbloqueie descontos ou cortesias na hora
                </strong>{' '}
                para apresentar ao garçom ou no caixa!
              </p>
            </div>

            {DEFAULT_MISSIONS.map((mission) => {
              const isUnlocked = unlockedMissions.includes(mission.id);
              return (
                <div
                  key={mission.id}
                  className={cn(
                    'p-4 rounded-2xl border transition-all space-y-3',
                    isUnlocked
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                        : 'bg-emerald-500/10 border-emerald-400/40'
                      : isLight
                        ? 'bg-white border-zinc-200 shadow-sm'
                        : 'bg-[#0F0F0F]/80 border-white/10'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-1.5 border',
                          isLight
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                        )}
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        {mission.rewardBadge}
                      </span>
                      <h4
                        className={cn(
                          'text-sm font-bold',
                          isLight ? 'text-zinc-900' : 'text-white'
                        )}
                      >
                        {mission.title}
                      </h4>
                      <p
                        className={cn(
                          'text-xs mt-0.5 leading-relaxed',
                          isLight ? 'text-zinc-600' : 'text-zinc-400'
                        )}
                      >
                        {mission.subtitle}
                      </p>
                    </div>
                  </div>

                  {mission.actionType === 'checkin' && !isUnlocked && (
                    <input
                      type="tel"
                      value={customerWhatsapp}
                      onChange={(e) => setCustomerWhatsapp(e.target.value)}
                      placeholder="Seu WhatsApp com DDD (ex: 11 99999-9999)"
                      className={cn(
                        'w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none',
                        isLight
                          ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-amber-600'
                          : 'bg-[#161616] border-white/10 text-white placeholder:text-zinc-500 focus:border-amber-400'
                      )}
                    />
                  )}

                  {!isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => handleUnlockMission(mission)}
                      className={cn(
                        'w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
                        isLight
                          ? 'bg-zinc-900 hover:bg-zinc-800 text-white shadow'
                          : 'bg-white/10 hover:bg-white/15 text-white'
                      )}
                    >
                      <span>{mission.actionLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div
                      className={cn(
                        'flex items-center justify-between gap-2 p-2.5 rounded-xl border',
                        isLight
                          ? 'bg-white border-emerald-400'
                          : 'bg-[#0F0F0F] border-emerald-400/40'
                      )}
                    >
                      <div>
                        <span
                          className={cn(
                            'text-[10px] uppercase tracking-wider block font-bold',
                            isLight ? 'text-emerald-700' : 'text-emerald-400'
                          )}
                        >
                          Cupom Desbloqueado (Mostre ao Garçom)
                        </span>
                        <span
                          className={cn(
                            'font-mono text-sm font-bold tracking-wider',
                            isLight ? 'text-zinc-900' : 'text-white'
                          )}
                        >
                          {mission.couponCode}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyCoupon(mission.couponCode)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border',
                          isLight
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                        )}
                      >
                        {copiedCode === mission.couponCode ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ABA 2: FLUXO INTELIGENTE DE AVALIAÇÃO (GOOGLE MEU NEGÓCIO + INSTAGRAM) */}
        {activeTab === 'review' && (
          <div className="space-y-4">
            <div
              className={cn(
                'p-4 rounded-2xl border text-center space-y-3',
                isLight
                  ? 'bg-white border-zinc-200 shadow-sm'
                  : 'bg-[#0F0F0F]/80 border-white/10'
              )}
            >
              <span
                className={cn(
                  'text-xs font-medium block',
                  isLight ? 'text-zinc-600' : 'text-zinc-400'
                )}
              >
                Como está sendo sua experiência hoje no {restaurant.name}?
              </span>

              {/* Seletor de Estrelas Interativo */}
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      setFeedbackSubmitted(false);
                    }}
                    className="p-1.5 rounded-xl transition-transform active:scale-90"
                  >
                    <Star
                      className={cn(
                        'w-8 h-8 transition-colors',
                        star <= rating
                          ? 'text-amber-400 fill-amber-400 drop-shadow'
                          : isLight
                            ? 'text-zinc-300'
                            : 'text-zinc-700'
                      )}
                    />
                  </button>
                ))}
              </div>

              <span
                className={cn(
                  'text-xs font-bold block',
                  isLight ? 'text-amber-800' : 'text-amber-300'
                )}
              >
                {rating === 5 &&
                  '😍 Excelente! Ficamos muito felizes que você amou!'}
                {rating === 4 &&
                  '😊 Muito bom! Sua avaliação nos ajuda a crescer!'}
                {rating <= 3 &&
                  '🙏 Obrigado pela sinceridade! Queremos resolver agora mesmo.'}
              </span>
            </div>

            {/* Fluxo Inteligente: 4 ou 5 estrelas -> Direciona para Google Reviews & Instagram */}
            {rating >= 4 ? (
              <div className="space-y-3">
                <div
                  className={cn(
                    'p-4 rounded-2xl border space-y-3',
                    isLight
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-emerald-500/10 border-emerald-400/30'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                    <h4
                      className={cn(
                        'text-sm font-bold',
                        isLight ? 'text-zinc-900' : 'text-white'
                      )}
                    >
                      Publicar 5 Estrelas no Google (30 segundos)
                    </h4>
                  </div>
                  <p
                    className={cn(
                      'text-xs leading-relaxed',
                      isLight ? 'text-zinc-700' : 'text-zinc-300'
                    )}
                  >
                    Sua nota no Google destaca nossos pratos nas buscas da
                    região e libera seu cupom{' '}
                    <strong
                      className={cn(
                        'font-bold',
                        isLight ? 'text-emerald-800' : 'text-emerald-300'
                      )}
                    >
                      GOOGLEVIP12
                    </strong>
                    .
                  </p>
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      DEFAULT_MISSIONS[1] &&
                      handleUnlockMission(DEFAULT_MISSIONS[1])
                    }
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all keep-white"
                  >
                    <span>Avaliar no Google e Ganhar Benefício</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div
                  className={cn(
                    'p-4 rounded-2xl border space-y-3',
                    isLight
                      ? 'bg-pink-50 border-pink-300'
                      : 'bg-pink-500/10 border-pink-400/30'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Instagram
                      className={cn(
                        'w-4 h-4 shrink-0',
                        isLight ? 'text-pink-700' : 'text-pink-400'
                      )}
                    />
                    <h4
                      className={cn(
                        'text-sm font-bold',
                        isLight ? 'text-zinc-900' : 'text-white'
                      )}
                    >
                      Siga & Marque no Instagram ({restaurant.instagram_handle})
                    </h4>
                  </div>
                  <p
                    className={cn(
                      'text-xs leading-relaxed',
                      isLight ? 'text-zinc-700' : 'text-zinc-300'
                    )}
                  >
                    Acompanhe as fornadas do dia e marque nossa página nos seus
                    Stories para repostarmos sua mesa!
                  </p>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      DEFAULT_MISSIONS[0] &&
                      handleUnlockMission(DEFAULT_MISSIONS[0])
                    }
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all keep-white shadow-md"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>Abrir Perfil no Instagram</span>
                  </a>
                </div>
              </div>
            ) : (
              /* Filtro Protetor de Reputação: 1 a 3 estrelas -> Ouvidoria Direta com a Gerência na Mesa */
              <div
                className={cn(
                  'p-4 rounded-2xl border space-y-3',
                  isLight
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-amber-500/10 border-amber-400/30'
                )}
              >
                <div className="flex items-center gap-2">
                  <MessageSquareHeart
                    className={cn(
                      'w-4 h-4',
                      isLight ? 'text-amber-700' : 'text-amber-400'
                    )}
                  />
                  <h4
                    className={cn(
                      'text-sm font-bold',
                      isLight ? 'text-zinc-900' : 'text-white'
                    )}
                  >
                    Fale Direto com o Gerente Agora
                  </h4>
                </div>
                <p
                  className={cn(
                    'text-xs leading-relaxed',
                    isLight ? 'text-zinc-700' : 'text-zinc-300'
                  )}
                >
                  Queremos que você saia 100% satisfeito ainda hoje. Conte o que
                  houve para corrigirmos imediatamente na sua mesa:
                </p>

                {!feedbackSubmitted ? (
                  <>
                    <textarea
                      rows={3}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Ex: Meu café demorou ou veio morno..."
                      className={cn(
                        'w-full p-3 rounded-xl border text-xs focus:outline-none',
                        isLight
                          ? 'bg-white border-zinc-300 text-zinc-900'
                          : 'bg-[#0F0F0F] border-white/15 text-white'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        submitCustomerReview({
                          tableLabel: 'Mesa 04',
                          rating,
                          comment: feedbackText.trim() || 'Alerta enviado à gerência',
                          customerName: 'Cliente da Mesa',
                          redirectedToGoogle: false,
                          sharedOnInstagram: false,
                        });
                        setFeedbackSubmitted(true);
                      }}
                      className="w-full py-3 rounded-xl bg-amber-400 text-[#0F0F0F] text-xs font-bold"
                    >
                      Enviar Alerta Imediato à Gerência
                    </button>
                  </>
                ) : (
                  <div
                    className={cn(
                      'p-3 rounded-xl border text-xs font-medium',
                      isLight
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                        : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200'
                    )}
                  >
                    Recebido! Nosso responsável já foi avisado e irá até sua
                    mesa com uma cortesia especial.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
