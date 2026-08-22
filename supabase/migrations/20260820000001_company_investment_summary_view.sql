-- Migration: Company Investment Summary View (TVCLabs Scoped)
-- Timestamp: 2026-08-20

CREATE OR REPLACE VIEW public.company_investment_summary
WITH (security_invoker = on) AS
SELECT
  c.id AS company_id,
  c.id AS id,
  COALESCE(SUM(ee.amount), 0) AS amount_invested,
  COALESCE(MAX(ee.currency), 'USD') AS currency,
  COALESCE(
    (
      SELECT ep.exposure_type::text
      FROM public.exposure_positions ep
      JOIN public.holders h ON h.id = ep.holder_id
      WHERE ep.company_id = c.id AND h.holder_type = 'TVCLabs'
      ORDER BY ep.issue_date ASC NULLS LAST
      LIMIT 1
    ),
    c.instrument_type,
    'SAFE'
  ) AS instrument_type,
  COALESCE(
    MIN(ee.effective_date),
    c.investment_date
  ) AS investment_date
FROM public.companies c
LEFT JOIN public.exposure_positions ep ON ep.company_id = c.id
LEFT JOIN public.holders h ON h.id = ep.holder_id AND h.holder_type = 'TVCLabs'
LEFT JOIN public.exposure_events ee ON ee.position_id = ep.id
GROUP BY c.id, c.instrument_type, c.investment_date;
