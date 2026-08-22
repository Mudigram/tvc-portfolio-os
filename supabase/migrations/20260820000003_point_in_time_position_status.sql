-- Migration: Point-in-Time Position & Status Reconstruction RPC
-- Timestamp: 2026-08-20

CREATE OR REPLACE FUNCTION public.exposure_as_of(as_of DATE)
RETURNS TABLE (
  position_id     UUID,
  company_id      UUID,
  holder_id       UUID,
  holder_type     TEXT,
  exposure_type   TEXT,
  instrument_name TEXT,
  status          TEXT,
  ownership_pct   NUMERIC,
  amount_invested NUMERIC
) AS $$
  SELECT
    ep.id AS position_id,
    ep.company_id,
    ep.holder_id,
    ep.holder_type::text,
    ep.exposure_type::text,
    ep.instrument_name,
    CASE
      -- If position converted, exited, or cancelled AFTER as_of date, it was ACTIVE on as_of date
      WHEN ep.status IN ('Converted', 'Exited', 'Cancelled')
           AND NOT EXISTS (
             SELECT 1 FROM public.exposure_events ee_sub
             WHERE ee_sub.position_id = ep.id
               AND ee_sub.event_type IN ('Conversion', 'Exit', 'Cancellation')
               AND ee_sub.effective_date <= as_of
           ) THEN 'Active'
      ELSE ep.status::text
    END AS status,
    ep.ownership_pct,
    COALESCE(SUM(ee.amount), 0) AS amount_invested
  FROM public.exposure_positions ep
  LEFT JOIN public.exposure_events ee
    ON ee.position_id = ep.id
   AND ee.effective_date <= as_of
  WHERE (ep.issue_date IS NULL OR ep.issue_date <= as_of)
    AND ep.created_at::date <= as_of
  GROUP BY ep.id, ep.company_id, ep.holder_id, ep.holder_type, ep.exposure_type, ep.instrument_name, ep.status, ep.ownership_pct
  HAVING COALESCE(SUM(ee.amount), 0) > 0;
$$ LANGUAGE sql STABLE SECURITY INVOKER;
