'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { MenuItem } from '@/types/database';
import { useMenuSession } from '@/context/MenuSessionContext';

interface UseItemDwellObserverOptions {
  item: MenuItem;
  /** Minimum fraction of the card visible to start counting dwell time (default 0.55) */
  threshold?: number;
  /** Minimum dwell duration in ms before logging (default 800ms) */
  minDwellMs?: number;
}

/**
 * Tracks how long a dish card stays visible in the customer's viewport
 * without causing re-renders or re-creating observers during scroll.
 */
export function useItemDwellObserver({
  item,
  threshold = 0.55,
  minDwellMs = 800,
}: UseItemDwellObserverOptions) {
  const { recordItemDwellTime } = useMenuSession();
  const elementRef = useRef<HTMLElement | null>(null);
  const enterTimestampRef = useRef<number | null>(null);
  const lastRatioRef = useRef<number>(threshold);
  const isVisibleRef = useRef<boolean>(false);
  const [isVisibleInViewport, setIsVisibleInViewport] = useState(false);

  const commitCurrentDwell = useCallback(() => {
    if (enterTimestampRef.current !== null) {
      const elapsed = Math.round(performance.now() - enterTimestampRef.current);
      enterTimestampRef.current = null;
      if (elapsed >= minDwellMs) {
        recordItemDwellTime(item, elapsed, lastRatioRef.current);
      }
    }
  }, [item, minDwellMs, recordItemDwellTime]);

  useEffect(() => {
    const node = elementRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            lastRatioRef.current = entry.intersectionRatio;
            if (enterTimestampRef.current === null) {
              enterTimestampRef.current = performance.now();
            }
            if (!isVisibleRef.current) {
              isVisibleRef.current = true;
              setIsVisibleInViewport(true);
            }
          } else {
            if (isVisibleRef.current) {
              isVisibleRef.current = false;
              setIsVisibleInViewport(false);
            }
            commitCurrentDwell();
          }
        }
      },
      {
        threshold: [0, threshold],
      }
    );

    observer.observe(node);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        commitCurrentDwell();
      } else if (
        document.visibilityState === 'visible' &&
        isVisibleRef.current
      ) {
        enterTimestampRef.current = performance.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      commitCurrentDwell();
    };
  }, [threshold, commitCurrentDwell]);

  return {
    elementRef,
    isVisibleInViewport,
  };
}
