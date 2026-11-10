-- ============================================================================
-- XPLORE MENU - FEATURE EXPANSION: WEBAR ("VER NA SUA MESA") & GROWTH CLUB
-- Migration: 20261110000002_migration_add_webar.sql
-- ============================================================================

ALTER TABLE public.menu_items
    ADD COLUMN IF NOT EXISTS model_glb_url TEXT,
    ADD COLUMN IF NOT EXISTS model_usdz_url TEXT,
    ADD COLUMN IF NOT EXISTS ar_scale_fixed BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS dimensions_cm JSONB;

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
