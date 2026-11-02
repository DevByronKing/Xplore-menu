import React from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Flame,
  QrCode,
  Radio,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { DEMO_RESTAURANT, DEMO_TOUCHPOINTS } from '@/data/mockMenuData';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-obsidian-950 text-white flex flex-col justify-between relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-brand/15 blur-[130px]" />

      <div className="max-w-3xl mx-auto px-5 py-12 sm:py-20 relative z-10 space-y-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/10 border border-brand/30 text-brand-light text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Xplore Menu SaaS • NFC Social Menu & Behavioral Telemetry</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1]">
            O Cardápio em Formato{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-amber-400 to-orange-500">
              Rede Social
            </span>{' '}
            que Mede o Desejo na Mesa.
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
            Acionado via tags NFC e QR Codes nas mesas. Vídeos verticais em autoplay silencioso, carrossel gastronômico de alta conversão e motor de telemetria comportamental que revela o tempo de tela (Dwell Time) e quem <em>&ldquo;quase pediu e desistiu&rdquo;</em>.
          </p>
        </div>

        {/* Primary CTA to Demo Tenant & Dashboard */}
        <div className="p-6 rounded-3xl bg-obsidian-900/90 border border-white/10 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={DEMO_RESTAURANT.logo_url}
                alt={DEMO_RESTAURANT.name}
                className="h-14 w-14 rounded-2xl object-cover ring-2 ring-brand/50"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  Ambiente de Demonstração Ativo
                </span>
                <h2 className="text-lg font-extrabold text-white">
                  {DEMO_RESTAURANT.name}
                </h2>
                <p className="text-xs text-zinc-400">{DEMO_RESTAURANT.tagline}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-obsidian-800 hover:bg-obsidian-700 border border-white/15 text-white font-bold text-xs transition-all"
              >
                <BarChart3 className="w-4 h-4 text-brand" />
                <span>Painel Analítico (/dashboard)</span>
              </Link>

              <Link
                href={`/${DEMO_RESTAURANT.slug}?source=nfc&location=mesa_04`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-brand to-amber-500 text-obsidian-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-brand/25 hover:brightness-110 transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>Abrir Cardápio Social</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Simulate NFC / QR Touchpoints */}
          <div>
            <p className="text-xs font-semibold text-zinc-300 mb-2.5 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simular leitura de Tag NFC ou QR Code por localização:</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_TOUCHPOINTS.map((tp) => (
                <Link
                  key={tp.id}
                  href={`/${DEMO_RESTAURANT.slug}?source=${tp.source_type}&location=${tp.code}`}
                  className="group flex items-center justify-between p-3 rounded-2xl bg-obsidian-950 hover:bg-obsidian-800 border border-white/[0.07] hover:border-brand/40 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400">
                      {tp.source_type === 'qrcode' ? (
                        <QrCode className="w-4 h-4" />
                      ) : (
                        <Radio className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-brand-light transition-colors">
                        {tp.label}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        /{DEMO_RESTAURANT.slug}?source={tp.source_type}&location={tp.code}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-obsidian-900/60 border border-white/[0.06] space-y-1.5">
            <Flame className="w-4 h-4 text-brand" />
            <h3 className="font-bold text-white">Feed Vertical Snap</h3>
            <p className="text-zinc-400 leading-relaxed">
              Vídeos curtos em autoplay silencioso, carrossel de fotos e acordeão de alergênicos.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-obsidian-900/60 border border-white/[0.06] space-y-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white">Dwell Time 70% Viewport</h3>
            <p className="text-zinc-400 leading-relaxed">
              IntersectionObserver nativo registra milissegundos reais de atenção e hesitação de compra.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-obsidian-900/60 border border-white/[0.06] space-y-1.5">
            <QrCode className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white">Engenharia de Cardápio</h3>
            <p className="text-zinc-400 leading-relaxed">
              Classifica automaticamente Estrelas, Enigmas (&ldquo;quase pediu&rdquo;) e Invisíveis em `/dashboard`.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
