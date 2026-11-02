-- ============================================================================
-- XPLORE MENU - SaaS Multi-Tenant Interactive Social Menu & Behavioral Telemetry
-- Migration: 20261102000001_initial_schema.sql
-- Database: Supabase PostgreSQL 15+
-- ============================================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLE: restaurants (Multi-Tenant Root)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT,
    logo_url TEXT,
    cover_url TEXT,
    theme_config JSONB NOT NULL DEFAULT '{
        "primaryColor": "#F97316",
        "accentColor": "#F59E0B",
        "backgroundColor": "#070709",
        "surfaceColor": "#15171E",
        "fontFamily": "Inter",
        "currency": "BRL",
        "locale": "pt-BR",
        "enableDirectCheckout": false,
        "enableWaiterCall": true
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON public.restaurants(owner_id);

-- ============================================================================
-- 2. TABLE: categories (Horizontal Pill Navigation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon_name TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (restaurant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_categories_restaurant_sort
    ON public.categories(restaurant_id, is_active, sort_order ASC);

-- ============================================================================
-- 3. TABLE: menu_items (Social Feed Rich Media Products)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    -- media_urls format: [{"type": "video"|"image", "url": "https://...", "poster": "https://...", "aspectRatio": "9:16"}]
    media_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    badges TEXT[] NOT NULL DEFAULT '{}',
    allergens TEXT[] NOT NULL DEFAULT '{}',
    ingredients TEXT[] NOT NULL DEFAULT '{}',
    calories INTEGER,
    prep_time_minutes INTEGER,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_category
    ON public.menu_items(restaurant_id, category_id, is_available, sort_order ASC);

-- ============================================================================
-- 4. TABLE: nfc_touchpoints (Physical NFC Tags & QR Codes per Table/Vitrine)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.nfc_touchpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    label TEXT NOT NULL,          -- e.g., "Mesa 04", "Vitrine Externa", "Balcão Bar"
    code TEXT NOT NULL,           -- e.g., "mesa_04", "vitrine", "balcao_01"
    source_type TEXT NOT NULL DEFAULT 'nfc' CHECK (source_type IN ('nfc', 'qrcode', 'link')),
    scans_count BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_scanned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (restaurant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_nfc_touchpoints_restaurant_code
    ON public.nfc_touchpoints(restaurant_id, code);

-- ============================================================================
-- 5. TABLE: telemetry_events (Behavioral Analytics Stream)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.telemetry_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    touchpoint_id UUID REFERENCES public.nfc_touchpoints(id) ON DELETE SET NULL,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (
        event_type IN (
            'view_duration',
            'like',
            'unlike',
            'allergen_expand',
            'add_to_selection',
            'remove_from_selection',
            'checkout_start',
            'media_swipe',
            'video_replay',
            'cart_hesitation',
            'session_context'
        )
    ),
    duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_restaurant_created
    ON public.telemetry_events(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_item_event
    ON public.telemetry_events(menu_item_id, event_type);
CREATE INDEX IF NOT EXISTS idx_telemetry_session
    ON public.telemetry_events(session_id);

-- ============================================================================
-- 6. ATOMIC RPC: Increment NFC/QR Scan Count & Resolve Touchpoint
-- ============================================================================
CREATE OR REPLACE FUNCTION public.register_touchpoint_scan(
    p_restaurant_id UUID,
    p_code TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_touchpoint_id UUID;
BEGIN
    UPDATE public.nfc_touchpoints
    SET
        scans_count = scans_count + 1,
        last_scanned_at = NOW()
    WHERE restaurant_id = p_restaurant_id
      AND code = LOWER(TRIM(p_code))
      AND is_active = TRUE
    RETURNING id INTO v_touchpoint_id;

    RETURN v_touchpoint_id;
END;
$$;

-- ============================================================================
-- 7. ANALYTICAL VIEW: Menu Engineering & Behavioral Conversion Matrix
-- ============================================================================
CREATE OR REPLACE VIEW public.v_menu_item_telemetry_summary AS
SELECT
    mi.id AS menu_item_id,
    mi.restaurant_id,
    mi.category_id,
    mi.name AS item_name,
    mi.price_cents,
    mi.is_available,
    COUNT(DISTINCT te.session_id) FILTER (WHERE te.event_type = 'view_duration') AS unique_viewers,
    COALESCE(ROUND(AVG(te.duration_ms) FILTER (WHERE te.event_type = 'view_duration')), 0)::INTEGER AS avg_dwell_time_ms,
    COUNT(*) FILTER (WHERE te.event_type = 'like') AS likes_count,
    COUNT(*) FILTER (WHERE te.event_type = 'allergen_expand') AS allergen_expands_count,
    COUNT(*) FILTER (WHERE te.event_type = 'add_to_selection') AS additions_count,
    COUNT(*) FILTER (WHERE te.event_type = 'remove_from_selection') AS removals_count,
    COUNT(*) FILTER (WHERE te.event_type = 'cart_hesitation') AS hesitation_count,
    CASE
        WHEN COALESCE(AVG(te.duration_ms) FILTER (WHERE te.event_type = 'view_duration'), 0) < 1500 THEN 'invisible'
        WHEN COALESCE(AVG(te.duration_ms) FILTER (WHERE te.event_type = 'view_duration'), 0) >= 3500
             AND COUNT(*) FILTER (WHERE te.event_type = 'add_to_selection') > COUNT(*) FILTER (WHERE te.event_type = 'remove_from_selection') * 2
             THEN 'star'
        WHEN COALESCE(AVG(te.duration_ms) FILTER (WHERE te.event_type = 'view_duration'), 0) >= 3500
             AND (
                 COUNT(*) FILTER (WHERE te.event_type = 'remove_from_selection') > 0
                 OR COUNT(*) FILTER (WHERE te.event_type = 'cart_hesitation') > 0
             )
             THEN 'enigma'
        ELSE 'workhorse'
    END AS matrix_classification
FROM public.menu_items mi
LEFT JOIN public.telemetry_events te ON te.menu_item_id = mi.id
GROUP BY mi.id, mi.restaurant_id, mi.category_id, mi.name, mi.price_cents, mi.is_available;

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

-- 8.1 restaurants Policies
CREATE POLICY "Public can view restaurants by slug"
    ON public.restaurants
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Owners can manage their own restaurants"
    ON public.restaurants
    FOR ALL
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- 8.2 categories Policies
CREATE POLICY "Public can view active categories"
    ON public.categories
    FOR SELECT
    TO anon, authenticated
    USING (
        is_active = TRUE
        OR EXISTS (
            SELECT 1 FROM public.restaurants r
            WHERE r.id = categories.restaurant_id
              AND r.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can manage categories of their restaurants"
    ON public.categories
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants r
            WHERE r.id = categories.restaurant_id
              AND r.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.restaurants r
            WHERE r.id = categories.restaurant_id
              AND r.owner_id = auth.uid()
        )
    );

-- 8.3 menu_items Policies
CREATE POLICY "Public can view menu items"
    ON public.menu_items
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Owners can manage menu items of their restaurants"
    ON public.menu_items
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants r
            WHERE r.id = menu_items.restaurant_id
              AND r.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.restaurants r
            WHERE r.id = menu_items.restaurant_id
              AND r.owner_id = auth.uid()
        )
    );

-- 8.4 nfc_touchpoints Policies
CREATE POLICY "Public can read active touchpoints"
    ON public.nfc_touchpoints
    FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE);

CREATE POLICY "Owners can manage touchpoints of their restaurants"
    ON public.nfc_touchpoints
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants r
            WHERE r.id = nfc_touchpoints.restaurant_id
              AND r.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.restaurants r
            WHERE r.id = nfc_touchpoints.restaurant_id
              AND r.owner_id = auth.uid()
        )
    );

-- 8.5 telemetry_events Policies
-- Anonymous customers on 4G/Wi-Fi can INSERT telemetry batches freely
CREATE POLICY "Public anonymous clients can insert telemetry events"
    ON public.telemetry_events
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        session_id IS NOT NULL
        AND length(session_id) >= 8
        AND EXISTS (
            SELECT 1 FROM public.restaurants r
            WHERE r.id = telemetry_events.restaurant_id
        )
    );

-- Only the restaurant owner can SELECT telemetry analytics
CREATE POLICY "Owners can read telemetry events of their restaurants"
    ON public.telemetry_events
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants r
            WHERE r.id = telemetry_events.restaurant_id
              AND r.owner_id = auth.uid()
        )
    );
