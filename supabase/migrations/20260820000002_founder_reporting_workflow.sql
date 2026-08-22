-- Migration: Founder Reporting Workflow (Targets, Review/Verification & Corrections)
-- Timestamp: 2026-08-20

-- 1. Create reporting_targets table
CREATE TABLE IF NOT EXISTS public.reporting_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  target_revenue NUMERIC NULL,
  target_mrr NUMERIC NULL,
  key_milestones TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NULL,
  UNIQUE (company_id, month, year)
);

-- RLS policies for reporting_targets
ALTER TABLE public.reporting_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal and admin users manage reporting targets"
  ON public.reporting_targets
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('internal', 'admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('internal', 'admin')
  );

CREATE POLICY "Founders view reporting targets for their company"
  ON public.reporting_targets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = reporting_targets.company_id
      AND c.crm_founder_id = auth.uid()
    )
  );

-- 2. Extend monthly_updates with review fields
ALTER TABLE public.monthly_updates
  ADD COLUMN IF NOT EXISTS review_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT NULL;

-- Update status constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'monthly_updates_status_check'
  ) THEN
    ALTER TABLE public.monthly_updates DROP CONSTRAINT monthly_updates_status_check;
  END IF;
END $$;

ALTER TABLE public.monthly_updates
  ADD CONSTRAINT monthly_updates_status_check
  CHECK (status IN ('Draft', 'Submitted', 'Verified', 'Needs Correction'));
