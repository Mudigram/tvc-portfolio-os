-- Migration: Fix exposure_events RLS policies for internal and admin users
-- Timestamp: 2026-10-02
--
-- Description:
-- The previous exposure_events_internal_all policy evaluated `auth.jwt() ->> 'role'`,
-- which in Supabase Auth evaluates to 'authenticated' rather than 'internal' or 'admin'.
-- This caused PostgREST to silently return 0 rows for exposure_events on internal queries.
--
-- This migration updates the policy to check `app_metadata->>role` and `get_user_role() = 'internal'`.

DROP POLICY IF EXISTS "exposure_events_internal_all" ON public.exposure_events;

CREATE POLICY "exposure_events_internal_all"
  ON public.exposure_events
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
