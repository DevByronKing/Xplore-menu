import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LiveOrdersView } from '@/components/dashboard/LiveOrdersView';
import { DEMO_RESTAURANT } from '@/data/mockMenuData';

export const metadata: Metadata = {
  title: 'Monitor de Pedidos na Cozinha & Garçom • Ao Vivo',
  description:
    'Tela de recebimento de pedidos ao vivo das mesas com alerta sonoro e integração WhatsApp.',
};

export default function KitchenLiveOrdersPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white theme-adaptive">
      <header className="border-b border-white/10 bg-[#0F0F0F]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
              Tela da Cozinha & Balcão
            </span>
            <h1 className="font-serif text-xl text-white">
              {DEMO_RESTAURANT.name} • Pedidos ao Vivo
            </h1>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ir para o Painel Completo</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <LiveOrdersView />
      </main>
    </div>
  );
}
