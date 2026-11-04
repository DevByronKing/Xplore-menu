import type {
  OrderPaymentPreference,
  TableOrder,
  TableOrderStatus,
} from '@/types/database';
import { formatCurrencyBRL } from '@/lib/utils';

const ORDERS_STORAGE_KEY = 'xplore_live_table_orders_v1';
export const ORDERS_UPDATED_EVENT = 'xplore:orders-updated';
const BROADCAST_CHANNEL_NAME = 'xplore_live_orders_channel_v1';

export const PAYMENT_LABELS_PT: Record<OrderPaymentPreference, string> = {
  tab_end: 'Pagar no Final (Comanda da Mesa)',
  cash: 'Dinheiro na Mesa',
  card_machine: 'Cartão na Mesa (Levar Maquininha)',
  pix_now: 'Pix pelo Celular',
};

/**
 * Plays a crisp two-tone kitchen counter bell ("Ding-Dong!") using Web Audio API
 * with zero external audio files required.
 */
export function playKitchenOrderBell(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First chime (High E6 - 1318.5 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.5, now);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.55);

    // Second chime (Warm C6 - 1046.5 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1046.5, now + 0.22);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.32, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.15);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.22);
    osc2.stop(now + 1.15);
  } catch {
    // Ignore audio context autoplay restrictions if user hasn't interacted yet
  }
}

export function loadLocalOrders(): TableOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TableOrder[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalOrders(orders: TableOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      ORDERS_STORAGE_KEY,
      JSON.stringify(orders.slice(0, 100))
    );
  } catch {
    // Ignore storage errors
  }
}

/**
 * Submits a new table order from the Customer Social Menu and notifies
 * any open Kitchen / Dashboard screens immediately (with sound alert!).
 */
export async function submitNewTableOrder(order: TableOrder): Promise<void> {
  if (typeof window !== 'undefined') {
    const existing = loadLocalOrders();
    const updated = [order, ...existing.filter((o) => o.id !== order.id)];
    saveLocalOrders(updated);
    window.dispatchEvent(
      new CustomEvent(ORDERS_UPDATED_EVENT, { detail: { newOrder: order } })
    );

    if ('BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.postMessage({ type: 'NEW_ORDER', order });
        bc.close();
      } catch {
        // Ignore BroadcastChannel errors
      }
    }
  }

  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });
  } catch {
    // Offline fallback handled by localStorage
  }
}

export async function updateTableOrderStatus(
  orderId: string,
  status: TableOrderStatus
): Promise<void> {
  if (typeof window !== 'undefined') {
    const existing = loadLocalOrders();
    const updated = existing.map((o) =>
      o.id === orderId ? { ...o, status } : o
    );
    saveLocalOrders(updated);
    window.dispatchEvent(new CustomEvent(ORDERS_UPDATED_EVENT));

    if ('BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.postMessage({ type: 'STATUS_UPDATE', orderId, status });
        bc.close();
      } catch {
        // Ignore
      }
    }
  }

  try {
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
  } catch {
    // Offline fallback
  }
}

/**
 * Fetches merged orders from both the server API (/api/orders) and LocalStorage
 */
export async function fetchMergedTableOrders(): Promise<TableOrder[]> {
  const local = loadLocalOrders();
  try {
    const res = await fetch('/api/orders', { cache: 'no-store' });
    if (!res.ok) return local;
    const data = (await res.json()) as { orders?: TableOrder[] };
    const remote = Array.isArray(data.orders) ? data.orders : [];

    const byId = new Map<string, TableOrder>();
    for (const r of remote) byId.set(r.id, r);
    for (const l of local) {
      // Keep local status if already updated, or merge
      const existing = byId.get(l.id);
      if (!existing) {
        byId.set(l.id, l);
      } else {
        byId.set(l.id, { ...l, status: existing.status });
      }
    }

    const merged = Array.from(byId.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    saveLocalOrders(merged);
    return merged;
  } catch {
    return local;
  }
}

/**
 * Formats an order into a structured WhatsApp message for the counter/waiter
 */
export function buildWhatsAppOrderUrl(
  order: TableOrder,
  whatsappPhone = '5511999999999'
): string {
  const lines: string[] = [
    `*NOVO PEDIDO #${order.orderNumber} • ${order.tableLabel.toUpperCase()}*`,
    `Origem: ${order.source === 'nfc' ? 'Aproximação NFC' : 'QR Code da Mesa'}`,
    `--------------------------------`,
  ];

  for (const item of order.items) {
    lines.push(
      `• *${item.quantity}x ${item.name}* (${formatCurrencyBRL(
        item.priceCents * item.quantity
      )})`
    );
    if (item.notes) {
      lines.push(`   _Obs: ${item.notes}_`);
    }
  }

  lines.push(`--------------------------------`);
  lines.push(`*Total:* ${formatCurrencyBRL(order.totalCents)}`);
  lines.push(`*Pagamento:* ${PAYMENT_LABELS_PT[order.paymentPreference]}`);
  if (order.paymentPreference === 'cash' && order.cashChangeFor) {
    lines.push(`*Troco para:* R$ ${order.cashChangeFor}`);
  }

  const cleanPhone = whatsappPhone.replace(/\D/g, '');
  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

export function getBroadcastChannelName(): string {
  return BROADCAST_CHANNEL_NAME;
}
