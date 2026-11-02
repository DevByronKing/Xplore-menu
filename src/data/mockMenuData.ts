import type {
  Category,
  MenuItem,
  NfcTouchpoint,
  Restaurant,
} from '@/types/database';

export const DEMO_RESTAURANT: Restaurant = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  owner_id: '00000000-0000-0000-0000-000000000001',
  name: 'NÓMADE Fornaria & Café',
  slug: 'nomade-bistro',
  tagline: 'Fermentação natural 48h • Torra própria • Cozinha de fogo',
  address: 'Rua dos Pinheiros, 482 — Jardins, São Paulo',
  opening_hours: 'Ter–Dom • 08h às 23h',
  instagram_handle: '@nomade.fornaria',
  wifi_ssid: 'NOMADE_5G (Senha: sourdough48)',
  logo_url:
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=240&q=80',
  cover_url:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  theme_config: {
    primaryColor: '#F97316',
    accentColor: '#F59E0B',
    backgroundColor: '#070709',
    surfaceColor: '#15171E',
    fontFamily: 'Inter',
    currency: 'BRL',
    locale: 'pt-BR',
    enableDirectCheckout: false,
    enableWaiterCall: true,
  },
  created_at: '2026-10-01T10:00:00Z',
};

export const DEMO_CATEGORIES: Category[] = [
  {
    id: 'cat-destaques',
    restaurant_id: DEMO_RESTAURANT.id,
    name: 'Destaques',
    slug: 'destaques',
    icon_name: 'Flame',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'cat-focaccias',
    restaurant_id: DEMO_RESTAURANT.id,
    name: 'Focaccias',
    slug: 'focaccias',
    icon_name: 'Croissant',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'cat-especiais',
    restaurant_id: DEMO_RESTAURANT.id,
    name: 'Especiais',
    slug: 'especiais',
    icon_name: 'Sparkles',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'cat-cafes',
    restaurant_id: DEMO_RESTAURANT.id,
    name: 'Cafés',
    slug: 'cafes',
    icon_name: 'Coffee',
    sort_order: 4,
    is_active: true,
  },
  {
    id: 'cat-bebidas-geladas',
    restaurant_id: DEMO_RESTAURANT.id,
    name: 'Bebidas Geladas',
    slug: 'bebidas-geladas',
    icon_name: 'GlassWater',
    sort_order: 5,
    is_active: true,
  },
];

export const DEMO_TOUCHPOINTS: NfcTouchpoint[] = [
  {
    id: 'tp-mesa-01',
    restaurant_id: DEMO_RESTAURANT.id,
    label: 'Mesa 01 • Janela',
    code: 'mesa_01',
    source_type: 'nfc',
    scans_count: 142,
    is_active: true,
    last_scanned_at: '2026-11-02T14:10:00Z',
  },
  {
    id: 'tp-mesa-04',
    restaurant_id: DEMO_RESTAURANT.id,
    label: 'Mesa 04 • Jardim Interno',
    code: 'mesa_04',
    source_type: 'nfc',
    scans_count: 289,
    is_active: true,
    last_scanned_at: '2026-11-02T14:20:00Z',
  },
  {
    id: 'tp-mesa-08',
    restaurant_id: DEMO_RESTAURANT.id,
    label: 'Mesa 08 • Lounge Sofá',
    code: 'mesa_08',
    source_type: 'nfc',
    scans_count: 97,
    is_active: true,
    last_scanned_at: '2026-11-02T13:45:00Z',
  },
  {
    id: 'tp-vitrine',
    restaurant_id: DEMO_RESTAURANT.id,
    label: 'Vitrine Externa • Calçada',
    code: 'vitrine',
    source_type: 'qrcode',
    scans_count: 418,
    is_active: true,
    last_scanned_at: '2026-11-02T14:21:00Z',
  },
  {
    id: 'tp-balcao',
    restaurant_id: DEMO_RESTAURANT.id,
    label: 'Balcão Espresso Bar',
    code: 'balcao_01',
    source_type: 'nfc',
    scans_count: 176,
    is_active: true,
    last_scanned_at: '2026-11-02T14:05:00Z',
  },
];

export const DEMO_MENU_ITEMS: MenuItem[] = [
  {
    id: 'item-focaccia-burrata-pistache',
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: 'cat-focaccias',
    name: 'Focaccia Burrata, Mortadela & Pistache',
    description:
      'Massa de fermentação lenta 48h no azeite extravirgem, recheada com mortadela italiana defumada, burrata cremosa inteira, pesto rústico de pistache tostado e raspas de limão siciliano.',
    price_cents: 5490,
    media_urls: [
      {
        id: 'm-1a',
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-cutting-a-fresh-pizza-on-a-wooden-board-42433-large.mp4',
        poster:
          'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=900&q=80',
        alt: 'Focaccia artesanal sendo cortada crocante',
        aspectRatio: '9:16',
      },
      {
        id: 'm-1b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=900&q=80',
        alt: 'Close-up da burrata cremosa e pistache na focaccia',
        aspectRatio: '9:16',
      },
      {
        id: 'm-1c',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=900&q=80',
        alt: 'Interior alveolado da massa de fermentação natural 48h',
        aspectRatio: '9:16',
      },
    ],
    badges: ['Best Seller', 'Sugestão do Chef', 'Fermentação Natural 48h'],
    allergens: ['Glúten (Trigo)', 'Lactose (Leite de Búfala)', 'Oleaginosas (Pistache)'],
    ingredients: [
      'Farinha italiana Tipo 00',
      'Levain 48h',
      'Burrata fresca 120g',
      'Mortadela Bologna IGP',
      'Pistache iraniano tostado',
      'Azeite extravirgem arbequina',
      'Raspas de limão siciliano',
    ],
    calories: 640,
    prep_time_minutes: 8,
    pairing_suggestion: 'Harmoniza com Espresso Tonic Siciliano ou Cold Brew',
    is_available: true,
    is_featured: true,
    sort_order: 1,
    likes_initial_count: 342,
  },
  {
    id: 'item-focaccia-stracciatella-figo',
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: 'cat-focaccias',
    name: 'Focaccia Stracciatella, Prosciutto & Figo',
    description:
      'Crocante por fora e nuvem por dentro. Coberta com stracciatella artesanal fria, fatias de prosciutto crudo maturado 18 meses, figos frescos grelhados no mel de laranjeira e flor de sal.',
    price_cents: 5890,
    media_urls: [
      {
        id: 'm-2a',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80',
        alt: 'Focaccia com prosciutto crudo, figos e mel',
        aspectRatio: '9:16',
      },
      {
        id: 'm-2b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=900&q=80',
        alt: 'Detalhe da stracciatella com redução balsâmica',
        aspectRatio: '9:16',
      },
    ],
    badges: ['Novo', 'Fornada Quente'],
    allergens: ['Glúten (Trigo)', 'Lactose'],
    ingredients: [
      'Massa de focaccia genovesa',
      'Stracciatella fresca',
      'Prosciutto di Parma 18 meses',
      'Figos roxos orgânicos',
      'Mel de flor de laranjeira',
      'Rúcula selvagem',
    ],
    calories: 590,
    prep_time_minutes: 9,
    pairing_suggestion: 'Harmoniza com Cascara Spritz Artesanal',
    is_available: true,
    is_featured: true,
    sort_order: 2,
    likes_initial_count: 218,
  },
  {
    id: 'item-shakshuka-tartine-trufada',
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: 'cat-especiais',
    name: 'Eggs Royale & Tartine de Cogumelos Trufados',
    description:
      'Fatia alta de sourdough tostado na manteiga noisette, mix de cogumelos Eryngii e Paris salteados no tomilho, dois ovos caipiras pochê perfeitos, hollandaise aerado de trufa negra e cebolinha.',
    price_cents: 4890,
    media_urls: [
      {
        id: 'm-3a',
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-Waiter-serving-a-dish-with-a-poached-egg-42926-large.mp4',
        poster:
          'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80',
        alt: 'Gema cremosa escorrendo sobre tartine de cogumelos',
        aspectRatio: '9:16',
      },
      {
        id: 'm-3b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80',
        alt: 'Tartine de ovos pochê com hollandaise trufado',
        aspectRatio: '9:16',
      },
      {
        id: 'm-3c',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80',
        alt: 'Detalhe dos cogumelos dourados e sourdough',
        aspectRatio: '9:16',
      },
    ],
    badges: ['Best Seller', 'Sugestão do Chef'],
    allergens: ['Ovos', 'Glúten (Trigo)', 'Lactose (Manteiga)'],
    ingredients: [
      'Pão sourdough de campanha',
      'Ovos caipiras orgânicos (2 un)',
      'Cogumelos Eryngii e Paris frescos',
      'Manteiga clarificada com salsa de trufas negras',
      'Grana Padano 24 meses ralado na hora',
    ],
    calories: 520,
    prep_time_minutes: 12,
    pairing_suggestion: 'Harmoniza com Flat White Duplo (Catuaí Vermelho)',
    is_available: true,
    is_featured: true,
    sort_order: 3,
    likes_initial_count: 289,
  },
  {
    id: 'item-french-toast-brioche',
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: 'cat-especiais',
    name: 'Brioche French Toast Caramelizada & Mascarpone',
    description:
      'Fatia generosa de brioche de fermentação natural selada em crosta de açúcar demerara e baunilha em fava, quenelle de mascarpone batido com cumaru, frutas vermelhas frescas e calda de maple.',
    price_cents: 4290,
    media_urls: [
      {
        id: 'm-4a',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=900&q=80',
        alt: 'Brioche French Toast com mirtilos, morangos e calda',
        aspectRatio: '9:16',
      },
      {
        id: 'm-4b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=900&q=80',
        alt: 'Textura caramelizada do brioche com mascarpone',
        aspectRatio: '9:16',
      },
    ],
    badges: ['Best Seller'],
    allergens: ['Glúten (Trigo)', 'Ovos', 'Lactose'],
    ingredients: [
      'Brioche amanteigado artesanal',
      'Creme de mascarpone com cumaru amazônico',
      'Mirtilos, framboesas e morangos orgânicos',
      'Maple syrup puro canadense',
      'Fava de baunilha de Madagascar',
    ],
    calories: 610,
    prep_time_minutes: 10,
    pairing_suggestion: 'Harmoniza com V60 Geisha Floral Sem Açúcar',
    is_available: true,
    is_featured: false,
    sort_order: 4,
    likes_initial_count: 194,
  },
  {
    id: 'item-pistachio-cream-latte',
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: 'cat-cafes',
    name: 'Pistachio Crème Latte (Quente ou Iced)',
    description:
      'Dose dupla do nosso espresso autoral (Mantiqueira de Minas 87 pts), ganache artesanal de pistache na borda da xícara, leite vaporizado sedoso (ou aveia barista) e farofa crocante de pistache.',
    price_cents: 2690,
    media_urls: [
      {
        id: 'm-5a',
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-milk-into-a-cup-of-coffee-41763-large.mp4',
        poster:
          'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=900&q=80',
        alt: 'Latte art sendo despejado sobre ganache de pistache',
        aspectRatio: '9:16',
      },
      {
        id: 'm-5b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=900&q=80',
        alt: 'Pistachio Latte com borda cremosa e pistaches triturados',
        aspectRatio: '9:16',
      },
    ],
    badges: ['Best Seller', 'Edição Limitada'],
    allergens: ['Lactose (Opção Vegana com Leite de Aveia)', 'Oleaginosas (Pistache)'],
    ingredients: [
      'Espresso duplo 100% Arábica (Notas de caramelo e avelã)',
      'Pasta pura de pistache artesanal (sem corantes)',
      'Leite Tipo A integral ou Aveia Barista',
      'Pralliné de pistache tostado com flor de sal',
    ],
    calories: 245,
    prep_time_minutes: 4,
    pairing_suggestion: 'Perfeito com Focaccia Stracciatella',
    is_available: true,
    is_featured: true,
    sort_order: 5,
    likes_initial_count: 412,
  },
  {
    id: 'item-v60-microlote-geisha',
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: 'cat-cafes',
    name: 'Filtrado Hario V60 • Microlote Geisha 89 pts',
    description:
      'Extraído na mesa em jarra de vidro borossilicato. Café de altitude (1.420m, Caparaó), processo fermentado anaeróbico com notas intensas de jasmim, pêssego branco, bergamota e acidez cítrica brilhante.',
    price_cents: 2400,
    media_urls: [
      {
        id: 'm-6a',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
        alt: 'Extração de café especial em método Hario V60',
        aspectRatio: '9:16',
      },
      {
        id: 'm-6b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80',
        alt: 'Café filtrado servido em cristal',
        aspectRatio: '9:16',
      },
    ],
    badges: ['Sugestão do Chef', 'Vegano'],
    allergens: ['Sem Alergênicos'],
    ingredients: [
      'Grãos 100% Arábica Variedade Geisha (20g)',
      'Água mineral remineralizada a 93°C (300ml)',
    ],
    calories: 5,
    prep_time_minutes: 5,
    pairing_suggestion: 'Ideal com Brioche French Toast',
    is_available: true,
    is_featured: false,
    sort_order: 6,
    likes_initial_count: 128,
  },
  {
    id: 'item-espresso-tonic-yuzu',
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: 'cat-bebidas-geladas',
    name: 'Yuzu & Siciliano Espresso Tonic',
    description:
      'Refrescante, cítrico e fotogênico. Camada de água tônica botânica artesanal com infusão de yuzu japonês e limão siciliano, gelo cristal translúcido, ramo de alecrim maçaricado e duplo espresso flutuante.',
    price_cents: 2590,
    media_urls: [
      {
        id: 'm-7a',
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-iced-coffee-into-a-glass-with-milk-41856-large.mp4',
        poster:
          'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=900&q=80',
        alt: 'Espresso sendo despejado sobre tônica e gelo cristal',
        aspectRatio: '9:16',
      },
      {
        id: 'm-7b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=900&q=80',
        alt: 'Copo alto de Espresso Tonic em duas camadas com limão siciliano',
        aspectRatio: '9:16',
      },
    ],
    badges: ['Best Seller', 'Vegano'],
    allergens: ['Sem Alergênicos (Contém Cafeína)'],
    ingredients: [
      'Duplo Espresso Torra Clara',
      'Água tônica de quinino natural',
      'Cordial artesanal de Yuzu e Limão Siciliano',
      'Alecrim fresco defumado na hora',
    ],
    calories: 95,
    prep_time_minutes: 3,
    pairing_suggestion: 'Corta perfeitamente a untuosidade da Focaccia Burrata',
    is_available: true,
    is_featured: true,
    sort_order: 7,
    likes_initial_count: 276,
  },
  {
    id: 'item-matcha-strawberry-cloud',
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: 'cat-bebidas-geladas',
    name: 'Uji Matcha & Strawberry Cold Foam',
    description:
      'Matcha cerimonial japonês de Uji batido em chasen de bambu sobre leite de amêndoas gelado e compota fresca de morangos orgânicos no fundo do copo, finalizado com cold foam aveludado.',
    price_cents: 2890,
    media_urls: [
      {
        id: 'm-8a',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=900&q=80',
        alt: 'Iced Matcha Latte em camadas verde vibrante e morango',
        aspectRatio: '9:16',
      },
      {
        id: 'm-8b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80',
        alt: 'Preparo de Matcha Cerimonial Uji',
        aspectRatio: '9:16',
      },
    ],
    badges: ['Novo', 'Edição Limitada'],
    allergens: ['Oleaginosas (Leite de Amêndoas)', 'Lactose (Opcional no Cold Foam)'],
    ingredients: [
      'Matcha Cerimonial Uji Colheita de Primavera (3g)',
      'Redução rústica de morangos frescos',
      'Leite de amêndoas artesanal',
      'Espuma fria de baunilha',
    ],
    calories: 180,
    prep_time_minutes: 4,
    pairing_suggestion: 'Harmoniza com qualquer item de brunch',
    is_available: true,
    is_featured: false,
    sort_order: 8,
    likes_initial_count: 319,
  },
];

/**
 * Helper to fetch restaurant data by slug (supports any demo tenantSlug gracefully)
 */
export function getMenuDataByTenantSlug(tenantSlug: string): {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
  touchpoints: NfcTouchpoint[];
} {
  const normalizedSlug = decodeURIComponent(tenantSlug).toLowerCase();

  // Customize display name slightly if user visits a custom slug, while keeping rich demo data
  const customRestaurant: Restaurant =
    normalizedSlug === DEMO_RESTAURANT.slug ||
    normalizedSlug === 'demo' ||
    normalizedSlug === 'nomade'
      ? DEMO_RESTAURANT
      : {
          ...DEMO_RESTAURANT,
          slug: normalizedSlug,
          name:
            normalizedSlug
              .split('-')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ') + ' • Social Menu',
        };

  return {
    restaurant: customRestaurant,
    categories: DEMO_CATEGORIES,
    items: DEMO_MENU_ITEMS,
    touchpoints: DEMO_TOUCHPOINTS,
  };
}
