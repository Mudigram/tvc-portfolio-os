-- Migration: Centralized Staleness Threshold Setting & Governance Gaps View Update
-- Timestamp: 2026-08-20

-- 1. Insert default staleness_threshold_days setting into app_settings if not already present
INSERT INTO public.app_settings (key, value, label, description, updated_at)
VALUES (
  'staleness_threshold_days',
  '90',
  'Position Verification Staleness Threshold',
  'Number of days before an unverified exposure position is flagged as stale in governance risk reports',
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- 2. Recreate governance_gaps view to dynamically read staleness_threshold_days from app_settings
CREATE OR REPLACE VIEW public.governance_gaps
WITH (security_invoker = on) AS
SELECT
  'unverified_position' AS gap_type,
  p.id AS record_id,
  p.company_id,
  p.holder_id,
  p.last_verified_date AS detail_date,
  NULL::text AS detail_text
FROM public.exposure_positions p
WHERE p.last_verified_date IS NULL
   OR p.last_verified_date < (
        CURRENT_DATE - (
          COALESCE(
            (SELECT value FROM public.app_settings WHERE key = 'staleness_threshold_days' LIMIT 1),
            '90'
          )::integer * INTERVAL '1 day'
        )
      )

UNION ALL

SELECT
  'missing_evidence' AS gap_type,
  e.id AS record_id,
  p.company_id,
  p.holder_id,
  e.effective_date AS detail_date,
  e.event_type AS detail_text
FROM public.exposure_events e
JOIN public.exposure_positions p ON p.id = e.position_id
WHERE e.source_document_url IS NULL;
