import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats integer cents into Brazilian Real (BRL) currency string.
 * Example: 3890 -> "R$ 38,90"
 */
export function formatCurrencyBRL(priceCents: number): string {
  const value = priceCents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats milliseconds into human-readable seconds (e.g., 4200 -> "4.2s")
 */
export function formatDurationSeconds(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Resilient UUID v4 generator for anonymous session and telemetry event IDs
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * Converts a URL query param location code (e.g. "mesa_04", "vitrine") into a friendly label
 */
export function resolveLocationLabel(code: string | null | undefined): string {
  if (!code) return 'Acesso Direto';
  const normalized = code.trim().toLowerCase();

  if (normalized.startsWith('mesa_') || normalized.startsWith('mesa-')) {
    const numberPart = normalized.replace(/^mesa[_-]/, '').padStart(2, '0');
    return `Mesa ${numberPart}`;
  }
  if (normalized === 'vitrine' || normalized === 'vitrine_externa') {
    return 'Vitrine Externa';
  }
  if (normalized.startsWith('balcao')) {
    return 'Balcão & Bar';
  }
  if (normalized.startsWith('lounge') || normalized.startsWith('deck')) {
    return 'Deck & Lounge';
  }

  return normalized
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Detects device type and network connection profile for behavioral telemetry
 */
export function detectDeviceAndNetwork(): {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType: string;
} {
  if (typeof window === 'undefined') {
    return { deviceType: 'mobile', connectionType: '4g' };
  }

  const width = window.innerWidth;
  const deviceType: 'mobile' | 'tablet' | 'desktop' =
    width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';

  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean };
  };
  const connectionType = nav.connection?.effectiveType || '4g';

  return { deviceType, connectionType };
}
