import type {
  Category,
  ItemBehavioralAnalytics,
  MenuEngineeringQuadrant,
  MenuItem,
  TelemetryEventPayload,
} from '@/types/database';

interface BaselineItemSeed {
  uniqueViewers: number;
  totalDwellMs: number;
  dwellSamples: number;
  likes: number;
  allergenExpands: number;
  mediaSwipes: number;
  additions: number;
  removals: number;
  hesitations: number;
  rotations3d: number;
  arTableViews: number;
  arHesitations: number;
}

/**
 * Curated 7-day baseline telemetry for NÓMADE Fornaria & Café so the
 * Dashboard exhibits realistic behavioral patterns across all 4 quadrants
 * ("Estrelas", "Enigmas / Quase Pediu", "Invisíveis", "Cavalos de Batalha")
 * plus WebAR 3D table projection telemetry, while merging live browser telemetry in real time.
 */
const BASELINE_SEEDS: Record<string, BaselineItemSeed> = {
  'item-focaccia-burrata-pistache': {
    uniqueViewers: 410,
    totalDwellMs: 410 * 6420,
    dwellSamples: 410,
    likes: 164,
    allergenExpands: 48,
    mediaSwipes: 215,
    additions: 142,
    removals: 14,
    hesitations: 16,
    rotations3d: 184,
    arTableViews: 112,
    arHesitations: 9,
  },
  'item-focaccia-stracciatella-figo': {
    uniqueViewers: 365,
    totalDwellMs: 365 * 5850,
    dwellSamples: 365,
    likes: 118,
    allergenExpands: 74,
    mediaSwipes: 189,
    additions: 88,
    removals: 41,
    hesitations: 54,
    rotations3d: 146,
    arTableViews: 94,
    arHesitations: 32,
  },
  'item-shakshuka-tartine-trufada': {
    uniqueViewers: 330,
    totalDwellMs: 330 * 5120,
    dwellSamples: 330,
    likes: 129,
    allergenExpands: 62,
    mediaSwipes: 144,
    additions: 104,
    removals: 12,
    hesitations: 15,
    rotations3d: 0,
    arTableViews: 0,
    arHesitations: 0,
  },
  'item-french-toast-brioche': {
    uniqueViewers: 290,
    totalDwellMs: 290 * 4380,
    dwellSamples: 290,
    likes: 96,
    allergenExpands: 83,
    mediaSwipes: 110,
    additions: 64,
    removals: 29,
    hesitations: 38,
    rotations3d: 122,
    arTableViews: 78,
    arHesitations: 24,
  },
  'item-pistachio-cream-latte': {
    uniqueViewers: 455,
    totalDwellMs: 455 * 4950,
    dwellSamples: 455,
    likes: 210,
    allergenExpands: 91,
    mediaSwipes: 175,
    additions: 186,
    removals: 11,
    hesitations: 14,
    rotations3d: 219,
    arTableViews: 138,
    arHesitations: 8,
  },
  'item-v60-microlote-geisha': {
    uniqueViewers: 240,
    totalDwellMs: 240 * 1180,
    dwellSamples: 240,
    likes: 19,
    allergenExpands: 8,
    mediaSwipes: 22,
    additions: 16,
    removals: 4,
    hesitations: 6,
    rotations3d: 0,
    arTableViews: 0,
    arHesitations: 0,
  },
  'item-espresso-tonic-yuzu': {
    uniqueViewers: 315,
    totalDwellMs: 315 * 2850,
    dwellSamples: 315,
    likes: 88,
    allergenExpands: 19,
    mediaSwipes: 94,
    additions: 78,
    removals: 9,
    hesitations: 11,
    rotations3d: 0,
    arTableViews: 0,
    arHesitations: 0,
  },
  'item-matcha-strawberry-cloud': {
    uniqueViewers: 280,
    totalDwellMs: 280 * 1320,
    dwellSamples: 280,
    likes: 34,
    allergenExpands: 27,
    mediaSwipes: 31,
    additions: 22,
    removals: 8,
    hesitations: 12,
    rotations3d: 0,
    arTableViews: 0,
    arHesitations: 0,
  },
};

export interface ExtendedItemAnalytics extends ItemBehavioralAnalytics {
  hasVideo: boolean;
  isAvailable: boolean;
  conversionRatePercent: number;
  abandonmentRatePercent: number;
  mediaSwipesCount: number;
  netOrdersCount: number;
  recommendedAction: string;
}

export function computeMenuEngineeringAnalytics(
  items: MenuItem[],
  categories: Category[],
  liveEvents: TelemetryEventPayload[]
): {
  itemAnalytics: ExtendedItemAnalytics[];
  globalAvgDwellMs: number;
  globalInteractionRate: number;
  totalTrackedSessions: number;
  totalHesitationEvents: number;
} {
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  // Group live events by menu_item_id
  const liveByItem = new Map<
    string,
    {
      dwellTotalMs: number;
      dwellCount: number;
      likes: number;
      allergens: number;
      swipes: number;
      additions: number;
      removals: number;
      hesitations: number;
      rotations3d: number;
      arTableViews: number;
      arHesitations: number;
      sessions: Set<string>;
    }
  >();

  const allLiveSessions = new Set<string>();

  for (const ev of liveEvents) {
    if (ev.session_id) allLiveSessions.add(ev.session_id);
    if (!ev.menu_item_id) continue;

    let bucket = liveByItem.get(ev.menu_item_id);
    if (!bucket) {
      bucket = {
        dwellTotalMs: 0,
        dwellCount: 0,
        likes: 0,
        allergens: 0,
        swipes: 0,
        additions: 0,
        removals: 0,
        hesitations: 0,
        rotations3d: 0,
        arTableViews: 0,
        arHesitations: 0,
        sessions: new Set(),
      };
      liveByItem.set(ev.menu_item_id, bucket);
    }

    bucket.sessions.add(ev.session_id);

    switch (ev.event_type) {
      case 'view_duration':
        if (ev.duration_ms && ev.duration_ms >= 250) {
          bucket.dwellTotalMs += ev.duration_ms;
          bucket.dwellCount += 1;
        }
        break;
      case 'like':
        bucket.likes += 1;
        break;
      case 'allergen_expand':
        bucket.allergens += 1;
        break;
      case 'media_swipe':
      case 'video_replay':
        bucket.swipes += 1;
        break;
      case 'add_to_selection':
        bucket.additions += 1;
        break;
      case 'remove_from_selection':
        bucket.removals += 1;
        break;
      case 'cart_hesitation':
        bucket.hesitations += 1;
        break;
      case '3d_rotate':
        bucket.rotations3d += 1;
        break;
      case 'ar_table_view':
        bucket.arTableViews += 1;
        break;
      case 'ar_hesitation':
        bucket.arHesitations += 1;
        break;
      default:
        break;
    }
  }

  let totalDwellSum = 0;
  let totalInteractionSum = 0;
  let totalHesitationEvents = 0;

  const itemAnalytics: ExtendedItemAnalytics[] = items.map((item) => {
    const has3DModel = Boolean(item.model_glb_url);
    const seed: BaselineItemSeed = BASELINE_SEEDS[item.id] ?? {
      uniqueViewers: 120,
      totalDwellMs: 120 * 2400,
      dwellSamples: 120,
      likes: 28,
      allergenExpands: 12,
      mediaSwipes: 35,
      additions: 24,
      removals: 5,
      hesitations: 6,
      rotations3d: has3DModel ? 45 : 0,
      arTableViews: has3DModel ? 28 : 0,
      arHesitations: has3DModel ? 4 : 0,
    };

    const live = liveByItem.get(item.id);
    const uniqueViewers = seed.uniqueViewers + (live ? live.sessions.size : 0);
    const dwellSamples = seed.dwellSamples + (live ? live.dwellCount : 0);
    const totalDwellMs = seed.totalDwellMs + (live ? live.dwellTotalMs : 0);

    const avgDwellTimeMs =
      dwellSamples > 0 ? Math.round(totalDwellMs / dwellSamples) : 0;

    const likesCount = seed.likes + (live ? live.likes : 0);
    const allergenExpandsCount =
      seed.allergenExpands + (live ? live.allergens : 0);
    const mediaSwipesCount = seed.mediaSwipes + (live ? live.swipes : 0);
    const additionsCount = seed.additions + (live ? live.additions : 0);
    const removalsCount = seed.removals + (live ? live.removals : 0);
    const rawHesitations = seed.hesitations + (live ? live.hesitations : 0);

    const rotations3dCount = seed.rotations3d + (live ? live.rotations3d : 0);
    const arTableViewsCount =
      seed.arTableViews + (live ? live.arTableViews : 0);
    const arHesitationsCount =
      seed.arHesitations + (live ? live.arHesitations : 0);

    const arConvertedOrders = Math.max(
      0,
      arTableViewsCount - arHesitationsCount
    );
    const arConversionPercent =
      arTableViewsCount > 0
        ? Math.min(
            98,
            Math.round((arConvertedOrders / arTableViewsCount) * 100)
          )
        : 0;

    const totalInteractions =
      likesCount +
      allergenExpandsCount +
      mediaSwipesCount +
      additionsCount +
      rotations3dCount +
      arTableViewsCount;
    const interactionRatePercent = Math.min(
      98,
      Math.round((totalInteractions / Math.max(1, uniqueViewers * 1.4)) * 100)
    );

    const netOrdersCount = Math.max(0, additionsCount - removalsCount);
    const conversionRatePercent = Math.round(
      (netOrdersCount / Math.max(1, uniqueViewers)) * 100
    );

    const abandonmentRatePercent =
      additionsCount > 0
        ? Math.min(100, Math.round((removalsCount / additionsCount) * 100))
        : 0;

    // Hesitation score (0 - 100) combining bag removals, AR hesitation, allergen checks & repeated views
    const hesitationScore = Math.min(
      100,
      Math.round(
        abandonmentRatePercent * 1.15 +
          ((rawHesitations + arHesitationsCount) / Math.max(1, uniqueViewers)) *
            180
      )
    );

    // Automatic Matrix Quadrant Classification
    let quadrant: MenuEngineeringQuadrant;
    let diagnosticNote: string;
    let recommendedAction: string;

    const hasVideo = item.media_urls.some((m) => m.type === 'video');

    if (avgDwellTimeMs < 1500) {
      quadrant = 'invisible';
      diagnosticNote = `Scroll rápido (${(avgDwellTimeMs / 1000).toFixed(
        1
      )}s). O cliente passa pelo card sem parar na primeira dobra.`;
      recommendedAction = hasVideo
        ? 'Trocar os primeiros 2 segundos do vídeo por close-up de movimento (corte ou calda).'
        : 'Substituir foto estática por vídeo vertical em autoplay e ativar modelo 3D/AR.';
    } else if (
      avgDwellTimeMs >= 3500 &&
      (abandonmentRatePercent >= 28 || hesitationScore >= 52)
    ) {
      quadrant = 'enigma';
      diagnosticNote = `Retenção alta (${(avgDwellTimeMs / 1000).toFixed(
        1
      )}s), mas ${abandonmentRatePercent}% removem da sacola${
        arHesitationsCount > 0
          ? ` e ${arHesitationsCount} desistiram após projetar na mesa em AR`
          : ''
      }.`;
      recommendedAction =
        'Destacar "Serve 2 pessoas" na descrição ou criar opção meia-porção para reduzir atrito de ticket.';
    } else if (avgDwellTimeMs >= 3500 && conversionRatePercent >= 18) {
      quadrant = 'star';
      diagnosticNote = `Campeão de atenção (${(avgDwellTimeMs / 1000).toFixed(
        1
      )}s) e ${conversionRatePercent}% de conversão líquida para pedido.`;
      recommendedAction =
        'Manter no topo de "Destaques" e impulsionar no Google Ads Local / Instagram.';
    } else {
      quadrant = 'workhorse';
      diagnosticNote = `Decisão rápida (${(avgDwellTimeMs / 1000).toFixed(
        1
      )}s) com conversão estável de ${conversionRatePercent}%.`;
      recommendedAction =
        'Sugerir como acompanhamento automático na gaveta de "Meus Favoritos".';
    }

    totalDwellSum += avgDwellTimeMs;
    totalInteractionSum += interactionRatePercent;
    totalHesitationEvents +=
      rawHesitations + removalsCount + arHesitationsCount;

    return {
      menuItemId: item.id,
      itemName: item.name,
      categoryName: categoryNameById.get(item.category_id) || 'Cardápio',
      priceCents: item.price_cents,
      avgDwellTimeMs,
      uniqueViewers,
      interactionRatePercent,
      likesCount,
      allergenExpandsCount,
      additionsCount,
      removalsCount,
      hesitationScore,
      quadrant,
      diagnosticNote,
      hasVideo,
      isAvailable: item.is_available,
      conversionRatePercent,
      abandonmentRatePercent,
      mediaSwipesCount,
      netOrdersCount,
      recommendedAction,
      has3DModel,
      rotations3dCount,
      arTableViewsCount,
      arHesitationsCount,
      arConversionPercent,
    };
  });

  const count = Math.max(1, itemAnalytics.length);

  return {
    itemAnalytics,
    globalAvgDwellMs: Math.round(totalDwellSum / count),
    globalInteractionRate: Math.round(totalInteractionSum / count),
    totalTrackedSessions: 1122 + allLiveSessions.size,
    totalHesitationEvents,
  };
}
