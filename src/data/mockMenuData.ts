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
    primaryColor: '#FFFFFF',
    accentColor: '#F59E0B',
    backgroundColor: '#0F0F0F',
    surfaceColor: '#161616',
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
    label: 'Balcão Cafeteria',
    code: 'balcao_01',
    source_type: 'nfc',
    scans_count: 176,
    is_active: true,
    last_scanned_at: '2026-11-02T14:05:00Z',
  },
];

/**
 * Every dish has:
 * - Slide 1: Local vertical MP4 preparation video (/videos/prep-*.mp4) with a unique poster image
 * - Slide 2: A completely distinct preparation/ingredient photo (never repeating the poster)
 * - Slide 3: A third distinct detail/plated photo
 */
export const DEMO_MENU_ITEMS: MenuItem[] = [
  {
    id: 'item-focaccia-burrata-pistache',
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: 'cat-focaccias',
    name: 'Focaccia Burrata & Pistache',
    description:
      'Massa de fermentação lenta 48h no azeite extravirgem, mortadela italiana defumada, burrata cremosa inteira, pesto rústico de pistache tostado e raspas de limão siciliano.',
    price_cents: 5490,
    media_urls: [
      {
        id: 'm-1a',
        type: 'video',
        url: '/videos/prep-focaccia-burrata.mp4?v=4',
        poster:
          'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=900&q=80',
        alt: 'Vídeo do preparo da Focaccia Burrata & Pistache',
        aspectRatio: '9:16',
      },
      {
        id: 'm-1b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=900&q=80',
        alt: 'Corte transversal mostrando o recheio generoso e alvéolos da massa',
        aspectRatio: '9:16',
      },
      {
        id: 'm-1c',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
        alt: 'Fornada artesanal saindo quente do forno de pedra',
        aspectRatio: '9:16',
      },
    ],
    badges: ['Mais Pedido', 'Sugestão do Chef'],
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
    pairing_suggestion: 'Harmoniza com Espresso Tonic Siciliano',
    is_available: true,
    is_featured: true,
    sort_order: 1,
    likes_initial_count: 342,
    model_glb_url: '/models/focaccia-burrata.glb',
    ar_scale_fixed: true,
    dimensions_cm: { width: 24, height: 9, depth: 18 },
  },
  {
    id: 'item-focaccia-stracciatella-figo',
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: 'cat-focaccias',
    name: 'Focaccia Stracciatella & Figo',
    description:
      'Crocante por fora e macia por dentro. Coberta com stracciatella artesanal fria, prosciutto crudo maturado 18 meses, figos frescos grelhados no mel de laranjeira e flor de sal.',
    price_cents: 5890,
    media_urls: [
      {
        id: 'm-2a',
        type: 'video',
        url: '/videos/prep-focaccia-figo.mp4?v=4',
        poster:
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80',
        alt: 'Vídeo de montagem da Focaccia com figos e prosciutto',
        aspectRatio: '9:16',
      },
      {
        id: 'm-2b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=900&q=80',
        alt: 'Finalização com stracciatella fresca e redução balsâmica',
        aspectRatio: '9:16',
      },
      {
        id: 'm-2c',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=900&q=80',
        alt: 'Massa de fermentação lenta regada no azeite extravirgem',
        aspectRatio: '9:16',
      },
    ],
    badges: ['Novidade', 'Fornada Quente'],
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
    pairing_suggestion: 'Harmoniza com Filtrado V60 Geisha',
    is_available: true,
    is_featured: true,
    sort_order: 2,
    likes_initial_count: 218,
    model_glb_url: '/models/focaccia-figo.glb',
    ar_scale_fixed: true,
    dimensions_cm: { width: 26, height: 8, depth: 20 },
  },
  {
    id: 'item-shakshuka-tartine-trufada',
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: 'cat-especiais',
    name: 'Eggs Royale & Tartine Trufada',
    description:
      'Fatia alta de pão sourdough tostado na manteiga noisette, mix de cogumelos Eryngii e Paris salteados no tomilho, dois ovos caipiras pochê e molho hollandaise aerado de trufa negra.',
    price_cents: 4890,
    media_urls: [
      {
        id: 'm-3a',
        type: 'video',
        url: '/videos/prep-eggs-royale.mp4?v=4',
        poster:
          'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80',
        alt: 'Vídeo do preparo dos ovos pochê e cogumelos trufados',
        aspectRatio: '9:16',
      },
      {
        id: 'm-3b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80',
        alt: 'Detalhe da gema cremosa sobre os cogumelos dourados',
        aspectRatio: '9:16',
      },
      {
        id: 'm-3c',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
        alt: 'Salteado de cogumelos frescos na manteiga e ervas',
        aspectRatio: '9:16',
      },
    ],
    badges: ['Mais Pedido', 'Sugestão do Chef'],
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
    pairing_suggestion: 'Harmoniza com Pistachio Crème Latte',
    is_available: true,
    is_featured: true,
    sort_order: 3,
    likes_initial_count: 289,
  },
  {
    id: 'item-french-toast-brioche',
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: 'cat-especiais',
    name: 'Brioche French Toast & Mascarpone',
    description:
      'Fatia generosa de brioche artesanal selada em crosta de açúcar demerara e fava de baunilha, creme de mascarpone batido com cumaru, frutas vermelhas frescas e calda de maple.',
    price_cents: 4290,
    media_urls: [
      {
        id: 'm-4a',
        type: 'video',
        url: '/videos/prep-french-toast.mp4?v=4',
        poster:
          'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=900&q=80',
        alt: 'Vídeo caramelizando o brioche e finalizando com calda',
        aspectRatio: '9:16',
      },
      {
        id: 'm-4b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=900&q=80',
        alt: 'Crosta dourada de açúcar demerara com frutas vermelhas',
        aspectRatio: '9:16',
      },
      {
        id: 'm-4c',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=80',
        alt: 'Finalização com quenelle de mascarpone e mirtilos frescos',
        aspectRatio: '9:16',
      },
    ],
    badges: ['Mais Pedido'],
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
    model_glb_url: '/models/french-toast.glb',
    ar_scale_fixed: true,
    dimensions_cm: { width: 22, height: 11, depth: 22 },
  },
  {
    id: 'item-pistachio-cream-latte',
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: 'cat-cafes',
    name: 'Pistachio Crème Latte',
    description:
      'Dose dupla do nosso espresso autoral (Mantiqueira de Minas 87 pts), ganache artesanal de pistache na borda da xícara, leite vaporizado sedoso (ou aveia barista) e praliné de pistache.',
    price_cents: 2690,
    media_urls: [
      {
        id: 'm-5a',
        type: 'video',
        url: '/videos/prep-pistachio-latte.mp4?v=4',
        poster:
          'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=900&q=80',
        alt: 'Vídeo extraindo o espresso e vaporizando o Pistachio Latte',
        aspectRatio: '9:16',
      },
      {
        id: 'm-5b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=900&q=80',
        alt: 'Arte no leite vaporizado sobre ganache de pistache',
        aspectRatio: '9:16',
      },
      {
        id: 'm-5c',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=900&q=80',
        alt: 'Extração cremosa do café especial 100% Arábica',
        aspectRatio: '9:16',
      },
    ],
    badges: ['Mais Pedido', 'Edição Limitada'],
    allergens: ['Lactose (Opção Vegana com Leite de Aveia)', 'Oleaginosas (Pistache)'],
    ingredients: [
      'Espresso duplo 100% Arábica (Notas de caramelo e avelã)',
      'Pasta pura de pistache artesanal (sem corantes)',
      'Leite Tipo A integral ou Aveia Barista',
      'Praliné de pistache tostado com flor de sal',
    ],
    calories: 245,
    prep_time_minutes: 4,
    pairing_suggestion: 'Perfeito com Focaccia Stracciatella',
    is_available: true,
    is_featured: true,
    sort_order: 5,
    likes_initial_count: 412,
    model_glb_url: '/models/pistachio-latte.glb',
    ar_scale_fixed: true,
    dimensions_cm: { width: 14, height: 12, depth: 14 },
  },
  {
    id: 'item-v60-microlote-geisha',
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: 'cat-cafes',
    name: 'Filtrado Hario V60 • Geisha',
    description:
      'Extraído na mesa em jarra de cristal. Café de altitude (1.420m, Caparaó), fermentação anaeróbica com notas florais de jasmim, pêssego branco, bergamota e acidez delicada.',
    price_cents: 2400,
    media_urls: [
      {
        id: 'm-6a',
        type: 'video',
        url: '/videos/prep-v60-geisha.mp4?v=4',
        poster:
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
        alt: 'Vídeo da infusão manual no método Hario V60',
        aspectRatio: '9:16',
      },
      {
        id: 'm-6b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80',
        alt: 'Café especial servido em jarra térmica de vidro',
        aspectRatio: '9:16',
      },
      {
        id: 'm-6c',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80',
        alt: 'Grãos de microlote Geisha recém-torrados na casa',
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
      'Refrescante e cítrico. Camada de água tônica botânica artesanal com infusão de yuzu japonês e limão siciliano, gelo cristal, ramo de alecrim defumado e duplo espresso flutuante.',
    price_cents: 2590,
    media_urls: [
      {
        id: 'm-7a',
        type: 'video',
        url: '/videos/prep-espresso-tonic.mp4?v=4',
        poster:
          'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=900&q=80',
        alt: 'Vídeo formando as duas camadas do Espresso Tonic com gelo',
        aspectRatio: '9:16',
      },
      {
        id: 'm-7b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80',
        alt: 'Contraste do café escuro descendo sobre a tônica cítrica',
        aspectRatio: '9:16',
      },
      {
        id: 'm-7c',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80',
        alt: 'Preparo com limão siciliano fresco e gelo translúcido',
        aspectRatio: '9:16',
      },
    ],
    badges: ['Mais Pedido', 'Vegano'],
    allergens: ['Sem Alergênicos (Contém Cafeína)'],
    ingredients: [
      'Duplo Espresso Torra Clara',
      'Água tônica de quinino natural',
      'Redução artesanal de Yuzu e Limão Siciliano',
      'Alecrim fresco maçaricado na hora',
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
    name: 'Iced Strawberry Matcha',
    description:
      'Matcha cerimonial japonês de Uji batido na hora com chasen de bambu sobre leite de amêndoas gelado e compota fresca de morangos orgânicos no fundo do copo.',
    price_cents: 2890,
    media_urls: [
      {
        id: 'm-8a',
        type: 'video',
        url: '/videos/prep-matcha-cloud.mp4?v=4',
        poster:
          'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=900&q=80',
        alt: 'Vídeo batendo o Matcha Uji e montando sobre compota de morango',
        aspectRatio: '9:16',
      },
      {
        id: 'm-8b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80',
        alt: 'Emulsão tradicional do chá verde cerimonial com chasen de bambu',
        aspectRatio: '9:16',
      },
      {
        id: 'm-8c',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=900&q=80',
        alt: 'Camadas de morango orgânico, leite vegetal e espuma fria',
        aspectRatio: '9:16',
      },
    ],
    badges: ['Novidade', 'Edição Limitada'],
    allergens: ['Oleaginosas (Leite de Amêndoas)', 'Lactose (Opcional na Espuma)'],
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

export function getMenuDataByTenantSlug(tenantSlug: string): {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
  touchpoints: NfcTouchpoint[];
} {
  const normalizedSlug = decodeURIComponent(tenantSlug).toLowerCase();

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
              .join(' '),
        };

  return {
    restaurant: customRestaurant,
    categories: DEMO_CATEGORIES,
    items: DEMO_MENU_ITEMS,
    touchpoints: DEMO_TOUCHPOINTS,
  };
}
