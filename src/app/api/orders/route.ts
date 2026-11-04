import { NextRequest, NextResponse } from 'next/server';
import type { TableOrder, TableOrderStatus } from '@/types/database';
import { DEMO_RESTAURANT } from '@/data/mockMenuData';

// Initial realistic active table order so the kitchen screen already has 1 example order on first load
const runtimeOrdersStore: TableOrder[] = [
  {
    id: 'ord-demo-101',
    orderNumber: 101,
    restaurantId: DEMO_RESTAURANT.id,
    tableLabel: 'Mesa 04',
    locationCode: 'mesa_04',
    source: 'nfc',
    items: [
      {
        itemId: 'item-focaccia-burrata-pistache',
        name: 'Focaccia Burrata & Pistache',
        quantity: 1,
        priceCents: 5490,
        notes: 'Cortar ao meio para dividir',
      },
      {
        itemId: 'item-pistachio-cream-latte',
        name: 'Pistachio Crème Latte',
        quantity: 2,
        priceCents: 2690,
      },
    ],
    totalCents: 10870,
    paymentPreference: 'tab_end',
    status: 'novo',
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
];

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      orders: [...runtimeOrdersStore].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { order?: TableOrder };
    const order = body?.order;
    if (!order || !order.id || !Array.isArray(order.items)) {
      return NextResponse.json(
        { ok: false, error: 'Pedido inválido' },
        { status: 400 }
      );
    }

    const exists = runtimeOrdersStore.some((o) => o.id === order.id);
    if (!exists) {
      runtimeOrdersStore.unshift(order);
    }

    if (runtimeOrdersStore.length > 200) {
      runtimeOrdersStore.length = 200;
    }

    return NextResponse.json({ ok: true, order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Erro ao criar pedido',
      },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
      status?: TableOrderStatus;
    };
    if (!body.orderId || !body.status) {
      return NextResponse.json(
        { ok: false, error: 'orderId e status são obrigatórios' },
        { status: 400 }
      );
    }

    const idx = runtimeOrdersStore.findIndex((o) => o.id === body.orderId);
    if (idx > -1 && runtimeOrdersStore[idx]) {
      runtimeOrdersStore[idx] = {
        ...runtimeOrdersStore[idx]!,
        status: body.status,
      };
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : 'Erro ao atualizar pedido',
      },
      { status: 400 }
    );
  }
}
