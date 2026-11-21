-- Migration: POEM KPI Framework for monthly_updates
-- Timestamp: 2026-11-06
-- Adds 18 operational & financial metrics grouped by POEM (Proposition, Organization, Economics, Milestones)

ALTER TABLE public.monthly_updates
  -- 1. Proposition Metrics
  ADD COLUMN IF NOT EXISTS active_customers INTEGER NULL,
  ADD COLUMN IF NOT EXISTS monthly_user_growth_pct NUMERIC(6,2) NULL,
  ADD COLUMN IF NOT EXISTS paying_customers INTEGER NULL,
  ADD COLUMN IF NOT EXISTS churn_rate_pct NUMERIC(6,2) NULL,
  ADD COLUMN IF NOT EXISTS retention_rate_pct NUMERIC(6,2) NULL,
  ADD COLUMN IF NOT EXISTS revenue_growth_pct NUMERIC(6,2) NULL,

  -- 2. Organization Metrics
  ADD COLUMN IF NOT EXISTS team_size INTEGER NULL,
  ADD COLUMN IF NOT EXISTS founder_commitment TEXT NULL,
  ADD COLUMN IF NOT EXISTS reporting_consistency TEXT NULL,
  ADD COLUMN IF NOT EXISTS reporting_compliance TEXT NULL,

  -- 3. Economics Metrics
  ADD COLUMN IF NOT EXISTS monthly_revenue NUMERIC(14,2) NULL,
  ADD COLUMN IF NOT EXISTS burn_rate NUMERIC(14,2) NULL,
  ADD COLUMN IF NOT EXISTS runway_months NUMERIC(5,1) NULL,
  ADD COLUMN IF NOT EXISTS ltv_cac_ratio NUMERIC(6,2) NULL,
  ADD COLUMN IF NOT EXISTS operating_margin_pct NUMERIC(6,2) NULL,
  ADD COLUMN IF NOT EXISTS arr NUMERIC(14,2) NULL,
  ADD COLUMN IF NOT EXISTS gross_margin_pct NUMERIC(6,2) NULL,

  -- 4. Milestones Metrics
  ADD COLUMN IF NOT EXISTS targets_completion_rate_pct NUMERIC(6,2) NULL;

-- Optional validation check constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'monthly_updates_founder_commitment_check'
  ) THEN
    ALTER TABLE public.monthly_updates
      ADD CONSTRAINT monthly_updates_founder_commitment_check
      CHECK (founder_commitment IS NULL OR founder_commitment IN ('Full-time', 'Part-time', 'Transitioning', 'Other'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'monthly_updates_reporting_consistency_check'
  ) THEN
    ALTER TABLE public.monthly_updates
      ADD CONSTRAINT monthly_updates_reporting_consistency_check
      CHECK (reporting_consistency IS NULL OR reporting_consistency IN ('High', 'Medium', 'Low'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'monthly_updates_reporting_compliance_check'
  ) THEN
    ALTER TABLE public.monthly_updates
      ADD CONSTRAINT monthly_updates_reporting_compliance_check
      CHECK (reporting_compliance IS NULL OR reporting_compliance IN ('Compliant', 'Needs Review', 'Non-Compliant'));
  END IF;
END $$;
