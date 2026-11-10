-- ============================================================================
-- XPLORE MENU - FEATURE EXPANSION: WEBAR ("VER NA SUA MESA") & GROWTH CLUB
-- Migration: migration_add_webar.sql
-- ============================================================================

-- 1. EVOLUÇÃO DA TABELA menu_items PARA SUPORTE 3D (.GLB / .USDZ) E ESCALA 1:1
ALTER TABLE public.menu_items
    ADD COLUMN IF NOT EXISTS model_glb_url TEXT,
    ADD COLUMN IF NOT EXISTS model_usdz_url TEXT,
    ADD COLUMN IF NOT EXISTS ar_scale_fixed BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS dimensions_cm JSONB;

COMMENT ON COLUMN public.menu_items.model_glb_url IS 'Caminho do modelo 3D otimizado (.glb) no Supabase Storage para WebXR e Scene Viewer (Android/Web)';
COMMENT ON COLUMN public.menu_items.model_usdz_url IS 'Caminho do modelo 3D (.usdz) para Apple AR Quick Look (iOS/iPadOS)';
COMMENT ON COLUMN public.menu_items.ar_scale_fixed IS 'Trava a projeção AR na proporção física real 1:1 na mesa do cliente';
COMMENT ON COLUMN public.menu_items.dimensions_cm IS 'Dimensões reais em centímetros: { "width": 24, "height": 9, "depth": 18 }';

-- 2. ATUALIZAÇÃO DO CHECK CONSTRAINT DE telemetry_events.event_type
ALTER TABLE public.telemetry_events
    DROP CONSTRAINT IF EXISTS telemetry_events_event_type_check;

ALTER TABLE public.telemetry_events
    ADD CONSTRAINT telemetry_events_event_type_check CHECK (
        event_type IN (
            'session_start',
            'view_duration',
            'media_swipe',
            'video_replay',
            'allergen_expand',
            'like',
            'unlike',
            'add_to_selection',
            'remove_from_selection',
            'cart_hesitation',
            'drawer_open',
            'checkout_intent',
            '3d_rotate',
            'ar_table_view',
            'ar_hesitation',
            'review_submitted',
            'club_mission_completed'
        )
    );

-- 3. ATUALIZAÇÃO DA VIEW DE INTELIGÊNCIA COM TELEMETRIA DE REALIDADE AUMENTADA
CREATE OR REPLACE VIEW public.v_menu_item_telemetry_summary AS
SELECT
    mi.id AS menu_item_id,
    mi.restaurant_id,
    mi.category_id,
    mi.name AS item_name,
    mi.price_cents,
    mi.is_available,
    mi.model_glb_url,
    COUNT(DISTINCT te.session_id) FILTER (WHERE te.event_type = 'view_duration') AS unique_viewers,
    COALESCE(ROUND(AVG(te.duration_ms) FILTER (WHERE te.event_type = 'view_duration')), 0)::INTEGER AS avg_dwell_time_ms,
    COUNT(*) FILTER (WHERE te.event_type = 'like') AS likes_count,
    COUNT(*) FILTER (WHERE te.event_type = 'allergen_expand') AS allergen_expands_count,
    COUNT(*) FILTER (WHERE te.event_type = 'add_to_selection') AS additions_count,
    COUNT(*) FILTER (WHERE te.event_type = 'remove_from_selection') AS removals_count,
    COUNT(*) FILTER (WHERE te.event_type = 'cart_hesitation') AS hesitation_count,
    COUNT(*) FILTER (WHERE te.event_type = '3d_rotate') AS rotations_3d_count,
    COUNT(*) FILTER (WHERE te.event_type = 'ar_table_view') AS ar_table_views_count,
    COUNT(*) FILTER (WHERE te.event_type = 'ar_hesitation') AS ar_hesitations_count,
    CASE
        WHEN COALESCE(AVG(te.duration_ms) FILTER (WHERE te.event_type = 'view_duration'), 0) < 1500 THEN 'invisible'
        WHEN COALESCE(AVG(te.duration_ms) FILTER (WHERE te.event_type = 'view_duration'), 0) >= 3500
             AND COUNT(*) FILTER (WHERE te.event_type = 'add_to_selection') > COUNT(*) FILTER (WHERE te.event_type = 'remove_from_selection') * 2
             THEN 'star'
        WHEN COALESCE(AVG(te.duration_ms) FILTER (WHERE te.event_type = 'view_duration'), 0) >= 3500
             AND (
                 COUNT(*) FILTER (WHERE te.event_type = 'remove_from_selection') > 0
                 OR COUNT(*) FILTER (WHERE te.event_type = 'cart_hesitation') > 0
                 OR COUNT(*) FILTER (WHERE te.event_type = 'ar_hesitation') > 0
             )
             THEN 'enigma'
        ELSE 'workhorse'
    END AS matrix_classification
FROM public.menu_items mi
LEFT JOIN public.telemetry_events te ON te.menu_item_id = mi.id
GROUP BY mi.id, mi.restaurant_id, mi.category_id, mi.name, mi.price_cents, mi.is_available, mi.model_glb_url;

-- 4. CONFIGURAÇÃO DO BUCKET PÚBLICO models-3d NO SUPABASE STORAGE COM RLS
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES (
    'models-3d',
    'models-3d',
    true,
    ARRAY['model/gltf-binary', 'model/vnd.usdz+zip', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    allowed_mime_types = ARRAY['model/gltf-binary', 'model/vnd.usdz+zip', 'application/octet-stream'];

-- Políticas RLS para storage.objects no bucket 'models-3d'
DROP POLICY IF EXISTS "Public read access for 3D models" ON storage.objects;
CREATE POLICY "Public read access for 3D models"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'models-3d');

DROP POLICY IF EXISTS "Restaurant owners can upload and manage 3D models" ON storage.objects;
CREATE POLICY "Restaurant owners can upload and manage 3D models"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (
        bucket_id = 'models-3d'
        AND EXISTS (
            SELECT 1 FROM public.restaurants r
            WHERE r.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        bucket_id = 'models-3d'
        AND EXISTS (
            SELECT 1 FROM public.restaurants r
            WHERE r.owner_id = auth.uid()
        )
    );
