-- Migration: Widen runway_months and percentage bounds on monthly_updates to prevent numeric overflow (error 22003)
-- Timestamp: 2026-11-17

ALTER TABLE public.monthly_updates
  ALTER COLUMN runway_months TYPE NUMERIC(10,1),
  ALTER COLUMN monthly_user_growth_pct TYPE NUMERIC(10,2),
  ALTER COLUMN revenue_growth_pct TYPE NUMERIC(10,2),
  ALTER COLUMN targets_completion_rate_pct TYPE NUMERIC(8,2),
  ALTER COLUMN ltv_cac_ratio TYPE NUMERIC(8,2);
