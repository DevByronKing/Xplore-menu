export type MediaType = 'video' | 'image';

export interface MenuMediaItem {
  id: string;
  type: MediaType;
  url: string;
  poster?: string;
  alt?: string;
  aspectRatio?: '9:16' | '4:5' | '1:1';
}

export interface RestaurantThemeConfig {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  fontFamily: string;
  currency: 'BRL' | 'USD' | 'EUR';
  locale: 'pt-BR' | 'en-US';
  enableDirectCheckout: boolean;
  enableWaiterCall: boolean;
}

export interface Restaurant {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  tagline: string;
  address?: string;
  opening_hours?: string;
  instagram_handle?: string;
  wifi_ssid?: string;
  logo_url: string;
  cover_url?: string;
  theme_config: RestaurantThemeConfig;
  created_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  slug: string;
  icon_name?: string;
  sort_order: number;
  is_active: boolean;
}

export type ProductBadge =
  | 'Best Seller'
  | 'Novo'
  | 'Sugestão do Chef'
  | 'Fornada Quente'
  | 'Edição Limitada'
  | 'Vegano'
  | 'Fermentação Natural 48h';

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string;
  price_cents: number;
  media_urls: MenuMediaItem[];
  badges: string[];
  allergens: string[];
  ingredients: string[];
  calories?: number;
  prep_time_minutes?: number;
  pairing_suggestion?: string;
  is_available: boolean;
  is_featured?: boolean;
  sort_order: number;
  likes_initial_count?: number;
}

export type TouchpointSourceType = 'nfc' | 'qrcode' | 'link';

export interface NfcTouchpoint {
  id: string;
  restaurant_id: string;
  label: string;
  code: string;
  source_type: TouchpointSourceType;
  scans_count: number;
  is_active: boolean;
  last_scanned_at: string | null;
}

export type TelemetryEventType =
  | 'view_duration'
  | 'like'
  | 'unlike'
  | 'allergen_expand'
  | 'add_to_selection'
  | 'remove_from_selection'
  | 'checkout_start'
  | 'media_swipe'
  | 'video_replay'
  | 'cart_hesitation'
  | 'session_context';

export interface TelemetryEventMetadata {
  source?: string;
  location?: string;
  category_slug?: string;
  media_index?: number;
  quantity?: number;
  price_cents?: number;
  view_count_in_session?: number;
  hesitation_reason?: 'removed_from_selection' | 'repeated_views_no_action' | 'session_exit_with_selection';
  device_type?: 'mobile' | 'tablet' | 'desktop';
  connection_effective_type?: string;
  viewport_ratio?: number;
  hour_of_day?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface TelemetryEventPayload {
  id: string;
  restaurant_id: string;
  session_id: string;
  touchpoint_id: string | null;
  menu_item_id: string | null;
  event_type: TelemetryEventType;
  duration_ms: number | null;
  metadata: TelemetryEventMetadata;
  created_at: string;
}

export interface SelectedMenuItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
  addedAt: string;
}

export interface SessionOriginContext {
  sessionId: string;
  source: TouchpointSourceType;
  locationCode: string;
  locationLabel: string;
  touchpointId: string | null;
  startedAt: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType: string;
}

export type MenuEngineeringQuadrant = 'star' | 'enigma' | 'invisible' | 'workhorse';

export interface ItemBehavioralAnalytics {
  menuItemId: string;
  itemName: string;
  categoryName: string;
  priceCents: number;
  avgDwellTimeMs: number;
  uniqueViewers: number;
  interactionRatePercent: number;
  likesCount: number;
  allergenExpandsCount: number;
  additionsCount: number;
  removalsCount: number;
  hesitationScore: number; // 0 to 100
  quadrant: MenuEngineeringQuadrant;
  diagnosticNote: string;
}
