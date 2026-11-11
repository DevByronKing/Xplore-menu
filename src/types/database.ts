export type MediaType = 'video' | 'image';

export interface MenuMediaItem {
  id: string;
  type: MediaType;
  url: string;
  poster?: string;
  alt?: string;
  aspectRatio?: '9:16' | '4:5' | '1:1';
}

export type MediaAsset = MenuMediaItem;

export interface ProductPhysicalDimensionsCm {
  width: number;
  height: number;
  depth: number;
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
  google_review_url?: string;
  wifi_ssid?: string;
  wifi_password?: string;
  whatsapp_phone?: string;
  logo_url: string;
  cover_url?: string;
  theme_color?: string;
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
  | 'Mais Pedido'
  | 'Novidade'
  | 'Sugestão do Chef'
  | 'Fornada Quente'
  | 'Edição Limitada'
  | 'Vegano'
  | 'Fermentação 48h';

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
  // Módulo WebAR ("Ver na sua mesa") & 3D 1:1
  model_glb_url?: string | null;
  model_usdz_url?: string | null;
  ar_scale_fixed?: boolean;
  dimensions_cm?: ProductPhysicalDimensionsCm | null;
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
  | 'session_context'
  | '3d_rotate'
  | 'ar_table_view'
  | 'ar_hesitation'
  | 'review_submitted'
  | 'club_mission_completed';

export interface TelemetryEventMetadata {
  source?: string;
  location?: string;
  category_slug?: string;
  media_index?: number;
  quantity?: number;
  price_cents?: number;
  view_count_in_session?: number;
  hesitation_reason?:
    | 'removed_from_selection'
    | 'repeated_views_no_action'
    | 'session_exit_with_selection'
    | 'ar_view_without_order';
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

export type MenuEngineeringQuadrant =
  | 'star'
  | 'enigma'
  | 'invisible'
  | 'workhorse';

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
  hesitationScore: number;
  quadrant: MenuEngineeringQuadrant;
  diagnosticNote: string;
  // Telemetria WebAR 3D
  has3DModel: boolean;
  rotations3dCount: number;
  arTableViewsCount: number;
  arHesitationsCount: number;
  arConversionPercent: number;
}

export type OrderPaymentPreference =
  | 'tab_end'
  | 'cash'
  | 'card_machine'
  | 'pix_now';

export type TableOrderStatus = 'novo' | 'preparando' | 'entregue';

export interface TableOrderItem {
  itemId: string;
  name: string;
  quantity: number;
  priceCents: number;
  notes?: string;
}

export interface TableOrder {
  id: string;
  orderNumber: number;
  restaurantId: string;
  tableLabel: string;
  locationCode: string;
  source: TouchpointSourceType;
  items: TableOrderItem[];
  totalCents: number;
  discountCents?: number;
  couponCode?: string;
  paymentPreference: OrderPaymentPreference;
  cashChangeFor?: string;
  waiterName?: string;
  status: TableOrderStatus;
  createdAt: string;
}

// ============================================================================
// MÓDULO DE AVALIAÇÃO + GOOGLE ADS + INSTAGRAM & CLUBE DE DESCONTOS (OPCIONAL)
// ============================================================================
export type ClubMissionId = 'google_review' | 'instagram_story' | 'vip_whatsapp';

export interface GrowthClubConfig {
  // Indica se o estabelecimento contratou/ativou o módulo adicional de Clube de Descontos
  clubModuleEnabled: boolean;
  reviewsModuleEnabled: boolean;
  clubName: string;
  googleReviewUrl: string;
  instagramHandle: string;
  googleAdsPixelTag: string;
  metaPixelId: string;
  missions: {
    id: ClubMissionId;
    title: string;
    subtitle: string;
    discountPercent: number;
    couponCode: string;
    rewardLabel: string;
    enabled: boolean;
  }[];
}

export interface CustomerReviewSubmission {
  id: string;
  tableLabel: string;
  rating: number;
  comment: string;
  customerName?: string;
  customerPhone?: string;
  redirectedToGoogle: boolean;
  sharedOnInstagram: boolean;
  createdAt: string;
}

export interface ClubVipMemberLead {
  id: string;
  name: string;
  whatsapp: string;
  tableLabel: string;
  completedMissionId: ClubMissionId;
  unlockedCouponCode: string;
  discountPercent: number;
  createdAt: string;
}
