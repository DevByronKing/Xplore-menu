import type { Category, MenuItem, NfcTouchpoint } from '@/types/database';
import {
  DEMO_CATEGORIES,
  DEMO_MENU_ITEMS,
  DEMO_TOUCHPOINTS,
} from '@/data/mockMenuData';

const CATALOG_ITEMS_KEY = 'xplore_catalog_items_v1';
const CATALOG_CATEGORIES_KEY = 'xplore_catalog_categories_v1';
const CATALOG_TOUCHPOINTS_KEY = 'xplore_catalog_touchpoints_v1';
export const CATALOG_UPDATED_EVENT = 'xplore:catalog-updated';

function notifyCatalogUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CATALOG_UPDATED_EVENT));
  }
}

export function loadStoredMenuItems(fallback: MenuItem[] = DEMO_MENU_ITEMS): MenuItem[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(CATALOG_ITEMS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as MenuItem[]) : fallback;
  } catch {
    return fallback;
  }
}

export function saveStoredMenuItems(items: MenuItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CATALOG_ITEMS_KEY, JSON.stringify(items));
    notifyCatalogUpdated();
  } catch {
    // Ignore storage quota errors
  }
}

export function loadStoredCategories(
  fallback: Category[] = DEMO_CATEGORIES
): Category[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(CATALOG_CATEGORIES_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? (parsed as Category[])
      : fallback;
  } catch {
    return fallback;
  }
}

export function saveStoredCategories(categories: Category[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      CATALOG_CATEGORIES_KEY,
      JSON.stringify(categories)
    );
    notifyCatalogUpdated();
  } catch {
    // Ignore storage quota errors
  }
}

export function loadStoredTouchpoints(
  fallback: NfcTouchpoint[] = DEMO_TOUCHPOINTS
): NfcTouchpoint[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(CATALOG_TOUCHPOINTS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? (parsed as NfcTouchpoint[])
      : fallback;
  } catch {
    return fallback;
  }
}

export function saveStoredTouchpoints(touchpoints: NfcTouchpoint[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      CATALOG_TOUCHPOINTS_KEY,
      JSON.stringify(touchpoints)
    );
    notifyCatalogUpdated();
  } catch {
    // Ignore storage quota errors
  }
}

export function resetCatalogToDefault(): {
  items: MenuItem[];
  categories: Category[];
  touchpoints: NfcTouchpoint[];
} {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(CATALOG_ITEMS_KEY);
    window.localStorage.removeItem(CATALOG_CATEGORIES_KEY);
    window.localStorage.removeItem(CATALOG_TOUCHPOINTS_KEY);
    notifyCatalogUpdated();
  }
  return {
    items: DEMO_MENU_ITEMS,
    categories: DEMO_CATEGORIES,
    touchpoints: DEMO_TOUCHPOINTS,
  };
}
