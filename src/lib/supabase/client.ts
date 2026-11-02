import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { TelemetryEventPayload } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id') &&
    supabaseUrl.startsWith('http')
);

let browserSupabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!browserSupabaseClient) {
    browserSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return browserSupabaseClient;
}

/**
 * Flushes a batch of behavioral telemetry events to Supabase (if configured)
 * or to our internal Next.js API route (/api/telemetry).
 */
export async function syncTelemetryBatchToBackend(
  events: TelemetryEventPayload[]
): Promise<boolean> {
  if (events.length === 0) return true;

  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('telemetry_events').insert(
        events.map((ev) => ({
          id: ev.id,
          restaurant_id: ev.restaurant_id,
          session_id: ev.session_id,
          touchpoint_id: ev.touchpoint_id,
          menu_item_id: ev.menu_item_id,
          event_type: ev.event_type,
          duration_ms: ev.duration_ms,
          metadata: ev.metadata,
          created_at: ev.created_at,
        }))
      );
      if (error) {
        console.warn('[Telemetry] Supabase insert warning:', error.message);
        return false;
      }
      return true;
    }

    // Fallback to Next.js API endpoint for local/demo telemetry ingestion
    const response = await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
      keepalive: true,
    });

    return response.ok;
  } catch {
    // Network offline or unstable 4G - return false so queue keeps events in LocalStorage
    return false;
  }
}
