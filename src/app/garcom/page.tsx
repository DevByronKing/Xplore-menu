import React from 'react';
import type { Metadata } from 'next';
import { WaiterTerminalClient } from '@/components/waiter/WaiterTerminalClient';

export const metadata: Metadata = {
  title: 'Terminal do Garçom • Anotação de Pedidos & Comandas',
  description:
    'Perfil do garçom para mapa de mesas ao vivo, lançamento rápido de pedidos para a cozinha, divisão de conta e fechamento de comanda.',
};

export default function WaiterProfilePage() {
  return <WaiterTerminalClient />;
}
