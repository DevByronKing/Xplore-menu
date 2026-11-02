import React from 'react';
import type { Metadata } from 'next';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export const metadata: Metadata = {
  title: 'Painel de Engenharia de Cardápio & Telemetria • Xplore Menu',
  description:
    'Análise comportamental de Dwell Time, relatório Quase Pediu e Desistiu, CRUD de pratos e gerador de tags NFC/QR Code.',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
