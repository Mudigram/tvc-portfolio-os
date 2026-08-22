-- Migration: Master Ledger Reconciliation Rollup View
-- Timestamp: 2026-08-10
--
-- Creates the `public.master_ledger_status` view for company reconciliation status:
--   - counts total exposure_positions per company
--   - counts verified exposure_positions (last_verified_date and verified_by not null)
--   - is_reconciled is true ONLY when total_positions > 0 AND total_positions == verified_positions
--   (zero-position companies return is_reconciled = false)
--
-- `with (security_invoker = on)` ensures RLS policies of underlying exposure_positions apply.

CREATE OR REPLACE VIEW public.master_ledger_status
WITH (security_invoker = on) AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  COUNT(p.id) AS total_positions,
  COUNT(p.id) FILTER (WHERE p.last_verified_date IS NOT NULL AND p.verified_by IS NOT NULL) AS verified_positions,
  (
    COUNT(p.id) > 0
    AND COUNT(p.id) = COUNT(p.id) FILTER (WHERE p.last_verified_date IS NOT NULL AND p.verified_by IS NOT NULL)
  ) AS is_reconciled
FROM public.companies c
LEFT JOIN public.exposure_positions p ON p.company_id = c.id
GROUP BY c.id, c.name;
