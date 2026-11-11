'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  MenuItem,
  NfcTouchpoint,
  Restaurant,
  SelectedMenuItem,
  SessionOriginContext,
  TelemetryEventMetadata,
  TelemetryEventPayload,
  TelemetryEventType,
  TouchpointSourceType,
} from '@/types/database';
import {
  detectDeviceAndNetwork,
  generateUUID,
  resolveLocationLabel,
} from '@/lib/utils';
import {
  appendToLocalTelemetryHistory,
  getOrCreateSessionId,
  getPendingTelemetryQueue,
  loadTenantSelection,
  saveTenantSelection,
  setPendingTelemetryQueue,
} from '@/lib/storage/offlinePersistence';
import { syncTelemetryBatchToBackend } from '@/lib/supabase/client';

interface MenuSessionContextValue {
  restaurant: Restaurant;
  sessionOrigin: SessionOriginContext;
  selectedItems: SelectedMenuItem[];
  likedItemIds: string[];
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  isTelemetryHudOpen: boolean;
  setIsTelemetryHudOpen: (open: boolean) => void;
  // Selection & Wishlist actions
  isItemLiked: (itemId: string) => boolean;
  getItemQuantity: (itemId: string) => number;
  toggleLikeItem: (item: MenuItem) => void;
  addItemToSelection: (item: MenuItem, notes?: string) => void;
  removeItemFromSelection: (item: MenuItem, removeAll?: boolean) => void;
  updateItemNotes: (itemId: string, notes: string) => void;
  clearSelection: () => void;
  completeOrderSelection: () => void;
  totalSelectionCount: number;
  totalSelectionPriceCents: number;
  // Behavioral Telemetry actions & live metrics
  trackEvent: (
    eventType: TelemetryEventType,
    menuItemId: string | null,
    durationMs?: number | null,
    metadata?: TelemetryEventMetadata
  ) => void;
  recordItemDwellTime: (item: MenuItem, durationMs: number, viewportRatio: number) => void;
  dwellTimeByItem: Record<string, number>;
  viewCountByItem: Record<string, number>;
  hesitationItems: string[];
  recentSessionEvents: TelemetryEventPayload[];
  pendingBatchCount: number;
  flushTelemetryNow: () => Promise<void>;
}

const MenuSessionContext = createContext<MenuSessionContextValue | null>(null);

interface MenuSessionProviderProps {
  restaurant: Restaurant;
  touchpoints: NfcTouchpoint[];
  initialSourceParam?: string | null;
  initialLocationParam?: string | null;
  children: React.ReactNode;
}

export function MenuSessionProvider({
  restaurant,
  touchpoints,
  initialSourceParam,
  initialLocationParam,
  children,
}: MenuSessionProviderProps) {
  const [selectedItems, setSelectedItems] = useState<SelectedMenuItem[]>([]);
  const [likedItemIds, setLikedItemIds] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTelemetryHudOpen, setIsTelemetryHudOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Live behavioral metrics state
  const [dwellTimeByItem, setDwellTimeByItem] = useState<Record<string, number>>({});
  const [viewCountByItem, setViewCountByItem] = useState<Record<string, number>>({});
  const [hesitationItems, setHesitationItems] = useState<string[]>([]);
  const [recentSessionEvents, setRecentSessionEvents] = useState<TelemetryEventPayload[]>([]);
  const [pendingBatchCount, setPendingBatchCount] = useState<number>(0);

  const queueRef = useRef<TelemetryEventPayload[]>([]);
  const hesitationTriggeredRef = useRef<Set<string>>(new Set());
  const sessionInitializedRef = useRef(false);

  // Resolve NFC / QR Code origin context
  const sessionOrigin = useMemo<SessionOriginContext>(() => {
    const rawSource = (initialSourceParam || '').toLowerCase();
    const rawLocation = (initialLocationParam || '').toLowerCase();

    const matchedTouchpoint = touchpoints.find(
      (tp) => tp.code.toLowerCase() === rawLocation
    );

    const source: TouchpointSourceType =
      rawSource === 'nfc' || matchedTouchpoint?.source_type === 'nfc'
        ? 'nfc'
        : rawSource === 'qrcode' || rawSource === 'qr' || matchedTouchpoint?.source_type === 'qrcode'
        ? 'qrcode'
        : rawLocation
        ? 'nfc'
        : 'link';

    const locationCode = rawLocation || 'acesso_direto';
    const locationLabel =
      matchedTouchpoint?.label ||
      (rawLocation ? resolveLocationLabel(rawLocation) : 'Mesa 04 • Demo NFC');

    const { deviceType, connectionType } = detectDeviceAndNetwork();

    return {
      sessionId: typeof window !== 'undefined' ? getOrCreateSessionId() : 'ssr-session',
      source,
      locationCode,
      locationLabel,
      touchpointId: matchedTouchpoint?.id ?? null,
      startedAt: new Date().toISOString(),
      deviceType,
      connectionType,
    };
  }, [initialSourceParam, initialLocationParam, touchpoints]);

  // Flush queue to Supabase / API route
  const flushTelemetryNow = useCallback(async () => {
    if (queueRef.current.length === 0) return;

    const batchToFlush = [...queueRef.current];
    queueRef.current = [];
    setPendingBatchCount(0);
    setPendingTelemetryQueue([]);

    const success = await syncTelemetryBatchToBackend(batchToFlush);
    if (!success) {
      // Restore to persistent queue if offline / unstable 4G
      const combined = [...batchToFlush, ...queueRef.current].slice(-250);
      queueRef.current = combined;
      setPendingBatchCount(combined.length);
      setPendingTelemetryQueue(combined);
    }
  }, []);

  // Core telemetry event dispatcher
  const trackEvent = useCallback(
    (
      eventType: TelemetryEventType,
      menuItemId: string | null,
      durationMs: number | null = null,
      metadata: TelemetryEventMetadata = {}
    ) => {
      if (typeof window === 'undefined') return;

      const { deviceType, connectionType } = detectDeviceAndNetwork();
      const eventPayload: TelemetryEventPayload = {
        id: generateUUID(),
        restaurant_id: restaurant.id,
        session_id: getOrCreateSessionId(),
        touchpoint_id: sessionOrigin.touchpointId,
        menu_item_id: menuItemId,
        event_type: eventType,
        duration_ms: durationMs !== null ? Math.round(durationMs) : null,
        metadata: {
          source: sessionOrigin.source,
          location: sessionOrigin.locationCode,
          device_type: deviceType,
          connection_effective_type: connectionType,
          hour_of_day: new Date().getHours(),
          ...metadata,
        },
        created_at: new Date().toISOString(),
      };

      queueRef.current = [...queueRef.current, eventPayload];
      setPendingBatchCount(queueRef.current.length);
      setPendingTelemetryQueue(queueRef.current);
      appendToLocalTelemetryHistory([eventPayload]);
      setRecentSessionEvents((prev) => [eventPayload, ...prev.slice(0, 29)]);
    },
    [restaurant.id, sessionOrigin]
  );

  // Hydrate persisted selection bag & pending telemetry queue
  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      const saved = await loadTenantSelection(restaurant.slug);
      const pending = getPendingTelemetryQueue();

      if (!mounted) return;
      setSelectedItems(saved.selection);
      setLikedItemIds(saved.likedIds);
      if (pending.length > 0) {
        queueRef.current = [...pending, ...queueRef.current];
        setPendingBatchCount(queueRef.current.length);
      }
      setIsHydrated(true);
    }
    void hydrate();
    return () => {
      mounted = false;
    };
  }, [restaurant.slug]);

  // Persist selection changes to LocalStorage + IndexedDB
  useEffect(() => {
    if (!isHydrated) return;
    saveTenantSelection(restaurant.slug, selectedItems, likedItemIds);
  }, [selectedItems, likedItemIds, restaurant.slug, isHydrated]);

  // Track initial session_context and set up 5s batch timer + visibilitychange listener
  useEffect(() => {
    if (!sessionInitializedRef.current && typeof window !== 'undefined') {
      sessionInitializedRef.current = true;
      trackEvent('session_context', null, null, {
        location: sessionOrigin.locationCode,
        source: sessionOrigin.source,
      });
    }

    const intervalId = window.setInterval(() => {
      void flushTelemetryNow();
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void flushTelemetryNow();
      }
    };

    const handleOnline = () => {
      void flushTelemetryNow();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [flushTelemetryNow, sessionOrigin.locationCode, sessionOrigin.source, trackEvent]);

  // Record Dwell Time from IntersectionObserver (>70% viewport visibility)
  const recordItemDwellTime = useCallback(
    (item: MenuItem, durationMs: number, viewportRatio: number) => {
      // Ignore micro-scrolls under 250ms to prevent noise
      if (durationMs < 250) return;

      const roundedMs = Math.round(durationMs);

      setDwellTimeByItem((prev) => ({
        ...prev,
        [item.id]: (prev[item.id] || 0) + roundedMs,
      }));

      setViewCountByItem((prev) => {
        const nextCount = (prev[item.id] || 0) + 1;

        // Check for Repeated Views Hesitation (>3 views of >= 1.5s without adding to selection)
        const isSelected = selectedItems.some((s) => s.item.id === item.id);
        const hesitationKey = `repeat_${item.id}`;
        if (
          nextCount > 3 &&
          roundedMs >= 1500 &&
          !isSelected &&
          !hesitationTriggeredRef.current.has(hesitationKey)
        ) {
          hesitationTriggeredRef.current.add(hesitationKey);
          setHesitationItems((curr) =>
            curr.includes(item.id) ? curr : [...curr, item.id]
          );
          trackEvent('cart_hesitation', item.id, roundedMs, {
            hesitation_reason: 'repeated_views_no_action',
            view_count_in_session: nextCount,
            price_cents: item.price_cents,
          });
        }

        return {
          ...prev,
          [item.id]: nextCount,
        };
      });

      trackEvent('view_duration', item.id, roundedMs, {
        viewport_ratio: Number(viewportRatio.toFixed(2)),
        price_cents: item.price_cents,
      });
    },
    [selectedItems, trackEvent]
  );

  // Like / Wishlist toggle
  const isItemLiked = useCallback(
    (itemId: string) => likedItemIds.includes(itemId),
    [likedItemIds]
  );

  const toggleLikeItem = useCallback(
    (item: MenuItem) => {
      setLikedItemIds((prev) => {
        const alreadyLiked = prev.includes(item.id);
        if (alreadyLiked) {
          trackEvent('unlike', item.id, null, { price_cents: item.price_cents });
          return prev.filter((id) => id !== item.id);
        } else {
          trackEvent('like', item.id, null, { price_cents: item.price_cents });
          return [...prev, item.id];
        }
      });
    },
    [trackEvent]
  );

  // Selection Bag ("Meus Favoritos / Pedido Rápido") operations
  const getItemQuantity = useCallback(
    (itemId: string) => {
      const found = selectedItems.find((entry) => entry.item.id === itemId);
      return found ? found.quantity : 0;
    },
    [selectedItems]
  );

  const addItemToSelection = useCallback(
    (item: MenuItem, notes?: string) => {
      setSelectedItems((prev) => {
        const existingIndex = prev.findIndex((entry) => entry.item.id === item.id);
        if (existingIndex > -1) {
          const updated = [...prev];
          const current = updated[existingIndex]!;
          updated[existingIndex] = {
            ...current,
            quantity: current.quantity + 1,
            notes: notes !== undefined ? notes : current.notes,
          };
          return updated;
        }
        return [
          ...prev,
          {
            item,
            quantity: 1,
            notes,
            addedAt: new Date().toISOString(),
          },
        ];
      });

      // Automatically mark as liked if not already
      setLikedItemIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));

      trackEvent('add_to_selection', item.id, null, {
        price_cents: item.price_cents,
      });
    },
    [trackEvent]
  );

  const removeItemFromSelection = useCallback(
    (item: MenuItem, removeAll = false) => {
      setSelectedItems((prev) => {
        const existing = prev.find((entry) => entry.item.id === item.id);
        if (!existing) return prev;

        if (removeAll || existing.quantity <= 1) {
          // Track removal & Cart Hesitation ("Quase pediu e desistiu")
          trackEvent('remove_from_selection', item.id, null, {
            price_cents: item.price_cents,
          });
          trackEvent('cart_hesitation', item.id, null, {
            hesitation_reason: 'removed_from_selection',
            price_cents: item.price_cents,
          });
          setHesitationItems((curr) =>
            curr.includes(item.id) ? curr : [...curr, item.id]
          );
          return prev.filter((entry) => entry.item.id !== item.id);
        }

        trackEvent('remove_from_selection', item.id, null, {
          price_cents: item.price_cents,
          quantity: existing.quantity - 1,
        });

        return prev.map((entry) =>
          entry.item.id === item.id
            ? { ...entry, quantity: entry.quantity - 1 }
            : entry
        );
      });
    },
    [trackEvent]
  );

  const updateItemNotes = useCallback((itemId: string, notes: string) => {
    setSelectedItems((prev) =>
      prev.map((entry) =>
        entry.item.id === itemId ? { ...entry, notes } : entry
      )
    );
  }, []);

  const clearSelection = useCallback(() => {
    selectedItems.forEach((entry) => {
      trackEvent('cart_hesitation', entry.item.id, null, {
        hesitation_reason: 'removed_from_selection',
        price_cents: entry.item.price_cents,
      });
    });
    setSelectedItems([]);
  }, [selectedItems, trackEvent]);

  const completeOrderSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const totalSelectionCount = useMemo(
    () => selectedItems.reduce((acc, entry) => acc + entry.quantity, 0),
    [selectedItems]
  );

  const totalSelectionPriceCents = useMemo(
    () =>
      selectedItems.reduce(
        (acc, entry) => acc + entry.item.price_cents * entry.quantity,
        0
      ),
    [selectedItems]
  );

  const value = useMemo<MenuSessionContextValue>(
    () => ({
      restaurant,
      sessionOrigin,
      selectedItems,
      likedItemIds,
      isDrawerOpen,
      setIsDrawerOpen,
      isTelemetryHudOpen,
      setIsTelemetryHudOpen,
      isItemLiked,
      getItemQuantity,
      toggleLikeItem,
      addItemToSelection,
      removeItemFromSelection,
      updateItemNotes,
      clearSelection,
      completeOrderSelection,
      totalSelectionCount,
      totalSelectionPriceCents,
      trackEvent,
      recordItemDwellTime,
      dwellTimeByItem,
      viewCountByItem,
      hesitationItems,
      recentSessionEvents,
      pendingBatchCount,
      flushTelemetryNow,
    }),
    [
      restaurant,
      sessionOrigin,
      selectedItems,
      likedItemIds,
      isDrawerOpen,
      isTelemetryHudOpen,
      isItemLiked,
      getItemQuantity,
      toggleLikeItem,
      addItemToSelection,
      removeItemFromSelection,
      updateItemNotes,
      clearSelection,
      completeOrderSelection,
      totalSelectionCount,
      totalSelectionPriceCents,
      trackEvent,
      recordItemDwellTime,
      dwellTimeByItem,
      viewCountByItem,
      hesitationItems,
      recentSessionEvents,
      pendingBatchCount,
      flushTelemetryNow,
    ]
  );

  return (
    <MenuSessionContext.Provider value={value}>
      {children}
    </MenuSessionContext.Provider>
  );
}

export function useMenuSession(): MenuSessionContextValue {
  const ctx = useContext(MenuSessionContext);
  if (!ctx) {
    throw new Error('useMenuSession must be used within a MenuSessionProvider');
  }
  return ctx;
}
