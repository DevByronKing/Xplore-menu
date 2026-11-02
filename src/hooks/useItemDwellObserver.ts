'use client';

import { useEffect, useRef, useState } from 'react';
import type { MenuItem } from '@/types/database';
import { useMenuSession } from '@/context/MenuSessionContext';

interface UseItemDwellObserverOptions {
  item: MenuItem;
  visibilityThreshold?: number; // Default 0.7 (70% of viewport)
  onActiveChange?: (isActive: boolean) => void;
}

/**
 * Custom Behavioral Analytics Hook:
 * - Uses native IntersectionObserver to measure exact Dwell Time (ms) when a card
 *   is >= 70% visible in the viewport.
 * - Automatically pauses measurement if the browser tab is hidden (visibilitychange)
 *   and flushes the exact elapsed milliseconds when the user scrolls away.
 * - Exposes live elapsed ms while the user is actively looking at the card.
 */
export function useItemDwellObserver({
  item,
  visibilityThreshold = 0.7,
  onActiveChange,
}: UseItemDwellObserverOptions) {
  const { recordItemDwellTime } = useMenuSession();
  const cardRef = useRef<HTMLElement | null>(null);
  const [isVisibleInViewport, setIsVisibleInViewport] = useState(false);
  const [activeElapsedMs, setActiveElapsedMs] = useState(0);

  const entryTimestampRef = useRef<number | null>(null);
  const peakRatioRef = useRef<number>(0);

  useEffect(() => {
    const element = cardRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const commitCurrentDwell = () => {
      if (entryTimestampRef.current !== null) {
        const elapsed = performance.now() - entryTimestampRef.current;
        entryTimestampRef.current = null;
        setActiveElapsedMs(0);
        if (elapsed >= 250) {
          recordItemDwellTime(item, elapsed, peakRatioRef.current || visibilityThreshold);
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        const isAboveThreshold =
          entry.isIntersecting && entry.intersectionRatio >= visibilityThreshold;

        if (isAboveThreshold) {
          peakRatioRef.current = Math.max(peakRatioRef.current, entry.intersectionRatio);
          if (entryTimestampRef.current === null) {
            entryTimestampRef.current = performance.now();
            setIsVisibleInViewport(true);
            onActiveChange?.(true);
          }
        } else {
          if (entryTimestampRef.current !== null) {
            commitCurrentDwell();
            setIsVisibleInViewport(false);
            onActiveChange?.(false);
            peakRatioRef.current = 0;
          }
        }
      },
      {
        threshold: [0, 0.4, 0.7, 0.85, 0.95],
      }
    );

    observer.observe(element);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        commitCurrentDwell();
      } else if (document.visibilityState === 'visible' && isVisibleInViewport) {
        entryTimestampRef.current = performance.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      commitCurrentDwell();
    };
  }, [item, onActiveChange, recordItemDwellTime, visibilityThreshold, isVisibleInViewport]);

  // Live ticker while card is actively viewed (updates every 200ms for smooth HUD display)
  useEffect(() => {
    if (!isVisibleInViewport) {
      setActiveElapsedMs(0);
      return;
    }

    const ticker = window.setInterval(() => {
      if (entryTimestampRef.current !== null) {
        setActiveElapsedMs(Math.round(performance.now() - entryTimestampRef.current));
      }
    }, 200);

    return () => window.clearInterval(ticker);
  }, [isVisibleInViewport]);

  return {
    cardRef,
    isVisibleInViewport,
    activeElapsedMs,
  };
}
