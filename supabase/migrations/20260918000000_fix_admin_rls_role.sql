-- Migration: Fix Admin RLS Access
-- Timestamp: 2026-09-18
--
-- Description:
-- Admin role is a superset of internal access.
-- Previously, get_user_role() returned 'admin' directly, but all internal RLS policies
-- strictly checked `get_user_role() = 'internal'`, completely locking admin users out of
-- reading companies, founders, exposure_positions, and other internal tables.
--
-- This migration updates get_user_role() to treat 'admin' as having 'internal' level
-- privileges at the database RLS layer, and updates companies policies to explicitly
-- permit both 'internal' and 'admin'.

CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN (auth.jwt() -> 'app_metadata' ->> 'role') IN ('internal', 'admin') THEN 'internal'
    ELSE COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), 'anon')
  END;
$$;

-- Also update companies_internal_all policy explicitly
DROP POLICY IF EXISTS "companies_internal_all" ON public.companies;

CREATE POLICY "companies_internal_all"
  ON public.companies
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('internal', 'admin')
    OR get_user_role() = 'internal'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('internal', 'admin')
    OR get_user_role() = 'internal'
  );
