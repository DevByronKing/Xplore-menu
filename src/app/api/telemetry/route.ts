import { NextRequest, NextResponse } from 'next/server';
import type { TelemetryEventPayload } from '@/types/database';

// In-memory ring buffer for local dev server inspection
const devTelemetryStore: TelemetryEventPayload[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { events?: TelemetryEventPayload[] };
    const events = Array.isArray(body?.events) ? body.events : [];

    if (events.length === 0) {
      return NextResponse.json(
        { ok: true, ingested: 0, message: 'No events in batch' },
        { status: 200 }
      );
    }

    for (const ev of events) {
      if (ev.id && ev.restaurant_id && ev.session_id && ev.event_type) {
        devTelemetryStore.push(ev);
      }
    }

    // Keep ring buffer bounded to latest 1000 events
    if (devTelemetryStore.length > 1000) {
      devTelemetryStore.splice(0, devTelemetryStore.length - 1000);
    }

    return NextResponse.json(
      {
        ok: true,
        ingested: events.length,
        totalStoredInRuntime: devTelemetryStore.length,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Invalid telemetry payload',
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      count: devTelemetryStore.length,
      events: devTelemetryStore.slice(-100),
    },
    { status: 200 }
  );
}
