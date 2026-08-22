-- Migration: Admin Governance Gap Visibility View
-- Timestamp: 2026-08-09
--
-- Creates the `public.governance_gaps` view for admin-level risk visibility:
--   1. unverified_position: positions where last_verified_date is null or older than 90 days
--   2. missing_evidence: exposure_events where source_document_url is null
--
-- `with (security_invoker = on)` ensures the query runs with the calling user's permissions,
-- so underlying RLS policies on exposure_positions and exposure_events apply automatically.

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
   OR p.last_verified_date < (CURRENT_DATE - INTERVAL '90 days')

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
