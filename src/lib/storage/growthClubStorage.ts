import type {
  ClubMissionId,
  ClubVipMemberLead,
  CustomerReviewSubmission,
  GrowthClubConfig,
} from '@/types/database';
import { generateUUID } from '@/lib/utils';

const GROWTH_CONFIG_KEY = 'xplore_growth_club_config_v1';
const REVIEWS_LIST_KEY = 'xplore_customer_reviews_v1';
const CLUB_LEADS_KEY = 'xplore_club_vip_leads_v1';
const ACTIVE_COUPON_KEY = 'xplore_active_customer_coupon_v1';

export const GROWTH_CLUB_UPDATED_EVENT = 'xplore:growth-club-updated';

export interface ActiveCustomerCoupon {
  missionId: ClubMissionId;
  couponCode: string;
  discountPercent: number;
  rewardLabel: string;
  unlockedAt: string;
}

export const DEFAULT_GROWTH_CLUB_CONFIG: GrowthClubConfig = {
  clubModuleEnabled: true,
  reviewsModuleEnabled: true,
  clubName: 'Clube NÓMADE VIP',
  googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ00000000000000',
  instagramHandle: '@nomade.fornaria',
  googleAdsPixelTag: 'AW-948201948/LocalStoreVisits',
  metaPixelId: 'IG-83920193842',
  missions: [
    {
      id: 'google_review',
      title: 'Avaliar no Google (5 Estrelas)',
      subtitle:
        'Avalie sua experiência na mesa e ajude mais pessoas a conhecerem nossa casa no Google.',
      discountPercent: 10,
      couponCode: 'GOOGLE10',
      rewardLabel: '10% de Desconto Imediato na Comanda',
      enabled: true,
    },
    {
      id: 'instagram_story',
      title: 'Postar Foto/Vídeo no Instagram',
      subtitle:
        'Publique um Story do seu prato marcando @nomade.fornaria para desbloquear seu benefício.',
      discountPercent: 12,
      couponCode: 'INSTA12',
      rewardLabel: '12% de Desconto + Café Expresso Cortesia',
      enabled: true,
    },
    {
      id: 'vip_whatsapp',
      title: 'Entrar no Clube VIP (WhatsApp)',
      subtitle:
        'Receba convites de fornadas especiais e descontos exclusivos em horários selecionados.',
      discountPercent: 15,
      couponCode: 'CLUBVIP15',
      rewardLabel: '15% de Desconto Desbloqueado Hoje',
      enabled: true,
    },
  ],
};

export const DEMO_INITIAL_REVIEWS: CustomerReviewSubmission[] = [
  {
    id: 'rev-1',
    tableLabel: 'Mesa 04',
    rating: 5,
    comment: 'A Focaccia de Burrata com Pistache e a projeção 3D na mesa são surreais! Atendimento impecável.',
    customerName: 'Mariana Costa',
    redirectedToGoogle: true,
    sharedOnInstagram: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
  },
  {
    id: 'rev-2',
    tableLabel: 'Mesa 02',
    rating: 5,
    comment: 'Melhor Pistachio Latte de São Paulo. Cardápio pelo NFC abriu instantâneo.',
    customerName: 'Rafael Mendes',
    redirectedToGoogle: true,
    sharedOnInstagram: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
  },
  {
    id: 'rev-3',
    tableLabel: 'Varanda 01',
    rating: 3,
    comment: 'O café chegou rápido, mas o ar-condicionado perto da janela estava um pouco forte.',
    customerName: 'Carlos Eduardo',
    redirectedToGoogle: false,
    sharedOnInstagram: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
];

export const DEMO_INITIAL_CLUB_LEADS: ClubVipMemberLead[] = [
  {
    id: 'lead-1',
    name: 'Mariana Costa',
    whatsapp: '(11) 99812-4401',
    tableLabel: 'Mesa 04',
    completedMissionId: 'instagram_story',
    unlockedCouponCode: 'INSTA12',
    discountPercent: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'lead-2',
    name: 'Rafael Mendes',
    whatsapp: '(11) 98734-1190',
    tableLabel: 'Mesa 02',
    completedMissionId: 'google_review',
    unlockedCouponCode: 'GOOGLE10',
    discountPercent: 10,
    createdAt: new Date(Date.now() - 1000 * 60 * 72).toISOString(),
  },
  {
    id: 'lead-3',
    name: 'Beatriz Nogueira',
    whatsapp: '(11) 99104-8823',
    tableLabel: 'Balcão Barista',
    completedMissionId: 'vip_whatsapp',
    unlockedCouponCode: 'CLUBVIP15',
    discountPercent: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
  },
];

function notifyGrowthUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(GROWTH_CLUB_UPDATED_EVENT));
  }
}

export function loadGrowthClubConfig(): GrowthClubConfig {
  if (typeof window === 'undefined') return DEFAULT_GROWTH_CLUB_CONFIG;
  try {
    const raw = window.localStorage.getItem(GROWTH_CONFIG_KEY);
    if (!raw) return DEFAULT_GROWTH_CLUB_CONFIG;
    return { ...DEFAULT_GROWTH_CLUB_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GROWTH_CLUB_CONFIG;
  }
}

export function saveGrowthClubConfig(config: GrowthClubConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GROWTH_CONFIG_KEY, JSON.stringify(config));
    notifyGrowthUpdated();
  } catch {
    // ignore storage errors
  }
}

export function loadCustomerReviews(): CustomerReviewSubmission[] {
  if (typeof window === 'undefined') return DEMO_INITIAL_REVIEWS;
  try {
    const raw = window.localStorage.getItem(REVIEWS_LIST_KEY);
    if (!raw) return DEMO_INITIAL_REVIEWS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? (parsed as CustomerReviewSubmission[])
      : DEMO_INITIAL_REVIEWS;
  } catch {
    return DEMO_INITIAL_REVIEWS;
  }
}

export function submitCustomerReview(
  input: Omit<CustomerReviewSubmission, 'id' | 'createdAt'>
): CustomerReviewSubmission {
  const newReview: CustomerReviewSubmission = {
    ...input,
    id: `rev-${generateUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    const existing = loadCustomerReviews();
    const updated = [newReview, ...existing];
    window.localStorage.setItem(REVIEWS_LIST_KEY, JSON.stringify(updated));
    notifyGrowthUpdated();
  }

  return newReview;
}

export function loadClubVipLeads(): ClubVipMemberLead[] {
  if (typeof window === 'undefined') return DEMO_INITIAL_CLUB_LEADS;
  try {
    const raw = window.localStorage.getItem(CLUB_LEADS_KEY);
    if (!raw) return DEMO_INITIAL_CLUB_LEADS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? (parsed as ClubVipMemberLead[])
      : DEMO_INITIAL_CLUB_LEADS;
  } catch {
    return DEMO_INITIAL_CLUB_LEADS;
  }
}

export function registerClubMissionCompletion(input: {
  name: string;
  whatsapp: string;
  tableLabel: string;
  missionId: ClubMissionId;
  couponCode: string;
  discountPercent: number;
  rewardLabel: string;
}): ActiveCustomerCoupon {
  const coupon: ActiveCustomerCoupon = {
    missionId: input.missionId,
    couponCode: input.couponCode,
    discountPercent: input.discountPercent,
    rewardLabel: input.rewardLabel,
    unlockedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    const lead: ClubVipMemberLead = {
      id: `lead-${generateUUID().slice(0, 8)}`,
      name: input.name || 'Cliente da Mesa',
      whatsapp: input.whatsapp || 'Verificado na Mesa',
      tableLabel: input.tableLabel,
      completedMissionId: input.missionId,
      unlockedCouponCode: input.couponCode,
      discountPercent: input.discountPercent,
      createdAt: new Date().toISOString(),
    };

    const existingLeads = loadClubVipLeads();
    window.localStorage.setItem(
      CLUB_LEADS_KEY,
      JSON.stringify([lead, ...existingLeads])
    );
    window.localStorage.setItem(ACTIVE_COUPON_KEY, JSON.stringify(coupon));
    notifyGrowthUpdated();
  }

  return coupon;
}

export function getActiveCustomerCoupon(): ActiveCustomerCoupon | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_COUPON_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveCustomerCoupon;
  } catch {
    return null;
  }
}
