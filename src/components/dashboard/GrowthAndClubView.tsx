'use client';

import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Gift,
  Instagram,
  Megaphone,
  MessageSquareWarning,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import type {
  ClubMissionId,
  ClubVipMemberLead,
  CustomerReviewSubmission,
  GrowthClubConfig,
  MenuItem,
} from '@/types/database';
import type { ExtendedItemAnalytics } from '@/lib/analytics/menuEngineeringEngine';
import {
  GROWTH_CLUB_UPDATED_EVENT,
  loadClubVipLeads,
  loadCustomerReviews,
  loadGrowthClubConfig,
  saveGrowthClubConfig,
} from '@/lib/storage/growthClubStorage';
import { cn, formatCurrencyBRL } from '@/lib/utils';

interface GrowthAndClubViewProps {
  items: MenuItem[];
  analytics: ExtendedItemAnalytics[];
}

export function GrowthAndClubView({
  items,
  analytics,
}: GrowthAndClubViewProps) {
  const [config, setConfig] = useState<GrowthClubConfig>(() =>
    loadGrowthClubConfig()
  );
  const [reviews, setReviews] = useState<CustomerReviewSubmission[]>([]);
  const [leads, setLeads] = useState<ClubVipMemberLead[]>([]);
  const [savedToast, setSavedToast] = useState(false);
  const [copiedAdId, setCopiedAdId] = useState<string | null>(null);

  const refreshGrowthState = () => {
    setConfig(loadGrowthClubConfig());
    setReviews(loadCustomerReviews());
    setLeads(loadClubVipLeads());
  };

  useEffect(() => {
    refreshGrowthState();
    window.addEventListener(GROWTH_CLUB_UPDATED_EVENT, refreshGrowthState);
    window.addEventListener('storage', refreshGrowthState);
    return () => {
      window.removeEventListener(GROWTH_CLUB_UPDATED_EVENT, refreshGrowthState);
      window.removeEventListener('storage', refreshGrowthState);
    };
  }, []);

  const handleToggleClubModule = () => {
    const updated: GrowthClubConfig = {
      ...config,
      clubModuleEnabled: !config.clubModuleEnabled,
    };
    setConfig(updated);
    saveGrowthClubConfig(updated);
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 2500);
  };

  const updateMissionField = (
    missionId: ClubMissionId,
    field: 'discountPercent' | 'couponCode',
    value: number | string
  ) => {
    setConfig((prev) => ({
      ...prev,
      missions: prev.missions.map((m) =>
        m.id === missionId
          ? {
              ...m,
              [field]: value,
              rewardLabel:
                field === 'discountPercent'
                  ? `${value}% OFF Imediato`
                  : m.rewardLabel,
            }
          : m
      ),
    }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveGrowthClubConfig(config);
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 2500);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedAdId(id);
    window.setTimeout(() => setCopiedAdId(null), 2200);
  };

  const googleMission = config.missions.find((m) => m.id === 'google_review');
  const igMission = config.missions.find((m) => m.id === 'instagram_story');
  const vipMission = config.missions.find((m) => m.id === 'vip_whatsapp');

  // Top dish by Dwell Time & AR projections to power Google Ads + Instagram Reels
  const topMagneticDish =
    [...analytics].sort(
      (a, b) =>
        b.avgDwellTimeMs +
        b.arTableViewsCount * 400 -
        (a.avgDwellTimeMs + a.arTableViewsCount * 400)
    )[0] || analytics[0];

  const topDishItem = items.find((i) => i.id === topMagneticDish?.menuItemId);

  const publicReviewsCount = reviews.filter((r) => r.redirectedToGoogle).length;
  const interceptedCount = reviews.filter((r) => !r.redirectedToGoogle).length;
  const avgStars =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        ).toFixed(1)
      : '4.9';

  const googleAdCopy = `Título 1: ${topMagneticDish?.itemName || 'Focaccia Artesanal 48h'} Hoje
Título 2: Veja o Prato em 3D na Sua Mesa | Nômade Fornaria
Título 3: Reserve ou Peça sem Fila (+4.9★ no Google)
Descrição: O prato que prende o olhar por ${(
    (topMagneticDish?.avgDwellTimeMs || 6200) / 1000
  ).toFixed(1)}s no nosso cardápio interativo. Venha viver a experiência gastronômica em Pinheiros (${
    topDishItem ? formatCurrencyBRL(topDishItem.price_cents) : 'R$ 54,90'
  }).`;

  const instagramReelsCopy = `🔥 O vídeo que está fazendo todo mundo parar na mesa por ${(
    (topMagneticDish?.avgDwellTimeMs || 6200) / 1000
  ).toFixed(1)} segundos!
Toque no cardápio da mesa, veja nossa ${
    topMagneticDish?.itemName || 'Focaccia Burrata'
  } em tamanho real 3D (1:1) antes de pedir e desbloqueie seu mimo no Clube VIP! ✨
📍 Nômade Fornaria • ${config.instagramHandle}
#Gastronomia #CardapioInterativo #WebAR #ExperienciaNaMesa`;

  return (
    <div className="space-y-8">
      {/* 1. CABEÇALHO DE MÉTRICAS DE REPUTAÇÃO, GOOGLE ADS & CLUBE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#161616] border border-white/[0.08] flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <span className="text-xs text-[#A1A1AA]">Nota Média Captada</span>
            <p className="text-2xl font-bold text-white mt-0.5">
              {avgStars} / 5.0
            </p>
            <span className="text-[11px] text-amber-400">
              {publicReviewsCount} enviadas ao Google Maps
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#161616] border border-white/[0.08] flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A1A1AA]">
              Críticas Retidas na Mesa
            </span>
            <p className="text-2xl font-bold text-white mt-0.5">
              {interceptedCount} alertas
            </p>
            <span className="text-[11px] text-emerald-400">
              Blindagem de nota no Google
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#161616] border border-white/[0.08] flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-pink-500/15 text-pink-400 flex items-center justify-center shrink-0">
            <Instagram className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A1A1AA]">
              Alcance Orgânico Stories
            </span>
            <p className="text-2xl font-bold text-white mt-0.5">
              {config.instagramHandle}
            </p>
            <span className="text-[11px] text-pink-400">
              Clientes marcando a casa na mesa
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#161616] border border-white/[0.08] flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A1A1AA]">
              Cadastros Clube VIP WhatsApp
            </span>
            <p className="text-2xl font-bold text-white mt-0.5">
              {leads.length} clientes
            </p>
            <span className="text-[11px] text-blue-400">
              Base própria sem taxa de iFood
            </span>
          </div>
        </div>
      </div>

      {/* 2. MÓDULO ADICIONAL OPCIONAL: CLUBE DE DESCONTOS GAMIFICADO */}
      <section className="p-6 rounded-3xl bg-[#161616] border border-amber-500/35 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                <Gift className="w-3.5 h-3.5" />
                Módulo Adicional Opcional (Add-On)
              </span>
              <span className="text-[11px] text-zinc-400">
                Não obrigatório na compra do cardápio base • Pode ser ativado sob demanda
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Clube de Descontos & Recompensas por Ação na Mesa
            </h2>
            <p className="text-xs text-[#A1A1AA] max-w-3xl">
              Quando ativado, o cliente ganha um desconto instantâneo na comanda ao realizar uma ação de crescimento para o restaurante: avaliar 5 estrelas no Google, postar um Story marcando o perfil ou entrar no Clube VIP de WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleToggleClubModule}
              className={cn(
                'px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2.5 border transition-all shadow-lg',
                config.clubModuleEnabled
                  ? 'bg-emerald-500 text-[#0F0F0F] border-emerald-400'
                  : 'bg-white/[0.08] text-zinc-300 border-white/15 hover:bg-white/15'
              )}
            >
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full',
                  config.clubModuleEnabled ? 'bg-[#0F0F0F]' : 'bg-zinc-500'
                )}
              />
              <span>
                {config.clubModuleEnabled
                  ? 'Clube de Descontos: ATIVO no Cardápio'
                  : 'Clube de Descontos: DESATIVADO (Apenas Avaliação)'}
              </span>
            </button>
          </div>
        </div>

        {/* Configuração das Regras, Links do Google/Instagram e Google Ads */}
        <form
          onSubmit={handleSaveSettings}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/10 text-xs"
        >
          <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400" />
              1. Google Meu Negócio & Blindagem
            </span>
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">
                Link Direto de Avaliação no Google Maps
              </label>
              <input
                type="url"
                value={config.googleReviewUrl}
                onChange={(e) =>
                  setConfig({ ...config, googleReviewUrl: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#161616] border border-white/10 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-zinc-400">
                  Desconto Google (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={googleMission?.discountPercent ?? 10}
                  onChange={(e) =>
                    updateMissionField(
                      'google_review',
                      'discountPercent',
                      Number(e.target.value) || 10
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#161616] border border-white/10 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400">Código Cupom</label>
                <input
                  type="text"
                  value={googleMission?.couponCode ?? 'GOOGLE10'}
                  onChange={(e) =>
                    updateMissionField(
                      'google_review',
                      'couponCode',
                      e.target.value.toUpperCase()
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#161616] border border-white/10 text-amber-300 font-bold"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Instagram className="w-4 h-4 text-pink-400" />
              2. Presença Digital no Instagram
            </span>
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">
                @Perfil do Estabelecimento
              </label>
              <input
                type="text"
                value={config.instagramHandle}
                onChange={(e) =>
                  setConfig({ ...config, instagramHandle: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#161616] border border-white/10 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-zinc-400">
                  Desconto Story (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={igMission?.discountPercent ?? 12}
                  onChange={(e) =>
                    updateMissionField(
                      'instagram_story',
                      'discountPercent',
                      Number(e.target.value) || 12
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#161616] border border-white/10 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400">Código Cupom</label>
                <input
                  type="text"
                  value={igMission?.couponCode ?? 'STORY12'}
                  onChange={(e) =>
                    updateMissionField(
                      'instagram_story',
                      'couponCode',
                      e.target.value.toUpperCase()
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#161616] border border-white/10 text-pink-300 font-bold"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-blue-400" />
                3. Clube VIP WhatsApp & Google Ads Tag
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400">
                    Desconto VIP (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={vipMission?.discountPercent ?? 15}
                    onChange={(e) =>
                      updateMissionField(
                        'vip_whatsapp',
                        'discountPercent',
                        Number(e.target.value) || 15
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#161616] border border-white/10 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400">
                    Tag Google Ads
                  </label>
                  <input
                    type="text"
                    value={config.googleAdsPixelTag}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        googleAdsPixelTag: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#161616] border border-white/10 text-blue-300"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-white text-[#0F0F0F] font-bold text-xs hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5"
            >
              {savedToast ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Configurações Salvas no Cardápio!</span>
                </>
              ) : (
                <span>Salvar Regras de Avaliação & Clube</span>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* 3. MOTOR DE TRÁFEGO PAGO AUTOMÁTICO (GOOGLE ADS LOCAL + INSTAGRAM REELS) */}
      <section className="p-6 rounded-3xl bg-[#161616] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <span>Inteligência de Tráfego Pago Baseada no Cardápio</span>
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Anúncios Prontos do Prato Mais Magnético ({topMagneticDish?.itemName})
            </h2>
            <p className="text-xs text-[#A1A1AA]">
              O sistema cruza o prato com maior tempo de atenção no vídeo + projeções 3D na mesa e gera o anúncio pronto para Google Ads e Instagram.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Google Ads Local */}
          <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 flex flex-col justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 text-[11px] font-bold">
                  Google Ads Local + Google Maps (Raio 3km)
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  Índice de Qualidade: 9.4/10
                </span>
              </div>
              <pre className="p-3 rounded-xl bg-[#161616] border border-white/[0.06] text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
                {googleAdCopy}
              </pre>
            </div>
            <button
              type="button"
              onClick={() => handleCopyText('google-ad', googleAdCopy)}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              {copiedAdId === 'google-ad' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Anúncio Copiado para o Google Ads!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Anúncio para Google Ads</span>
                </>
              )}
            </button>
          </div>

          {/* Card Instagram Reels / Meta Ads */}
          <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 flex flex-col justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-pink-500/15 text-pink-300 text-[11px] font-bold">
                  Legenda & Roteiro para Instagram Reels / Ads
                </span>
                <span className="text-[11px] text-amber-300 font-semibold">
                  Use o vídeo de 25s + WebAR
                </span>
              </div>
              <pre className="p-3 rounded-xl bg-[#161616] border border-white/[0.06] text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
                {instagramReelsCopy}
              </pre>
            </div>
            <button
              type="button"
              onClick={() => handleCopyText('ig-ad', instagramReelsCopy)}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-[#0F0F0F] hover:bg-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              {copiedAdId === 'ig-ad' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Legenda Copiada para o Instagram!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Copiar Legenda para Instagram</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 4. AVALIAÇÕES RECENTES & BLINDAGEM + LEADS DO CLUBE VIP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-3xl bg-[#161616] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquareWarning className="w-4 h-4 text-amber-400" />
              <span>Últimas Avaliações nas Mesas</span>
            </h3>
            <span className="text-[11px] text-[#A1A1AA]">
              4-5★ vão ao Google • 1-3★ ficam privadas
            </span>
          </div>

          <div className="space-y-2.5">
            {reviews.slice(0, 6).map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 rounded-2xl bg-[#0F0F0F] border border-white/[0.08] flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {rev.customerName || 'Cliente na Mesa'} ({rev.tableLabel})
                    </span>
                    <span className="text-xs text-amber-400 font-bold">
                      {'★'.repeat(rev.rating)}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                      rev.redirectedToGoogle
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    )}
                  >
                    {rev.redirectedToGoogle
                      ? 'Redirecionado ao Google Maps'
                      : 'Retido na Gerência (Privado)'}
                  </span>
                </div>
                <p className="text-xs text-zinc-300">{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#161616] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-emerald-400" />
              <span>Membros do Clube VIP (WhatsApp Capturados)</span>
            </h3>
            <span className="text-[11px] text-emerald-400 font-semibold">
              Prontos para remarketing
            </span>
          </div>

          <div className="space-y-2.5">
            {leads.slice(0, 6).map((lead) => (
              <div
                key={lead.id}
                className="p-3.5 rounded-2xl bg-[#0F0F0F] border border-white/[0.08] flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-bold text-white">
                    {lead.name} •{' '}
                    <span className="text-emerald-400">{lead.whatsapp}</span>
                  </p>
                  <span className="text-[11px] text-[#A1A1AA]">
                    Cupom liberado:{' '}
                    <strong className="text-white">
                      {lead.unlockedCouponCode}
                    </strong>{' '}
                    (-{lead.discountPercent}%)
                  </span>
                </div>
                <a
                  href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-semibold"
                >
                  Chamar no WhatsApp
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
