-- Migration: Repair RLS policies that can never match
-- Timestamp: 2026-10-30
--
── THE PROBLEM ──────────────────────────────────────────────────────────────
-- Roles are written ONLY to `app_metadata`:
--   • settings.actions.ts  → inviteUserByEmail({ data: { role } }) → app_metadata
--   • settings.actions.ts  → updateUserById({ app_metadata: { role } })
--   • proxy.ts / auth.server.ts / useUser.ts all READ app_metadata.role
--
-- Two broken role expressions appear in the live schema:
--   (A) auth.jwt() -> 'user_metadata' ->> 'role'  → always NULL, role isn't there
--   (B) auth.jwt() ->> 'role'  → returns the Postgres role ('authenticated'),
--       never 'angel'/'internal'
-- Both are permanently FALSE, so a policy containing only one grants nothing.
-- An audit of 39 policies found 17 dead; 8 have no working sibling policy, so
-- the access they were meant to grant is simply absent.
--
── WHY THE APP STILL APPEARS TO WORK ────────────────────────────────────────
-- angel-portfolio.service.ts and investor-snapshot.service.ts read through the
-- service-role client, which BYPASSES RLS. The bypass masks these dead
-- policies. That is why this was never visible, and why the bypass cannot be
-- removed until this migration is applied.
--
── SCOPE ────────────────────────────────────────────────────────────────────
-- Each policy keeps its ORIGINAL row-scoping predicate. Only the role test is
-- corrected. Nothing is widened to a role it was not already written to allow.
-- Direction of change: dead → the access the author intended.
--
-- Apply:  npx supabase db push
-- Verify: node scripts/verify-rls-claims.mjs
--
── STILL DEAD AFTER THIS MIGRATION (harmless duplicates, no behaviour change) ─
-- Each has a working sibling on the same table/command, so they grant nothing
-- either way. Left in place to keep this diff reviewable; drop them in a
-- separate cleanup once the verify script is green:
--   internal_advisory_all, internal_exit_readiness_all,
--   "Internal employees can read exit_readiness",
--   "Internal employees can read funding_status",
--   monthly_updates_internal_read, "Internal employees can read monthly_updates",
--   exposure_positions_angel_own, exposure_positions_internal_all

-- ═════════════════════════════════════════════════════════════════════════
-- 1. ANGEL READ ACCESS  (scope: only companies this angel holds exposure in)
-- ═════════════════════════════════════════════════════════════════════════

-- advisory_activity: angels currently receive 0 advisory rows
DROP POLICY IF EXISTS "angel_advisory_read" ON public.advisory_activity;
CREATE POLICY "angel_advisory_read" ON public.advisory_activity
  FOR SELECT TO authenticated
  USING (
    (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'angel'
      OR get_user_role() = 'angel'
    )
    AND company_id IN (
      SELECT angel_exposures.company_id
      FROM public.angel_exposures
      WHERE angel_exposures.user_id = auth.uid()
    )
  );

-- exit_readiness: angels currently receive 0 exit-signal rows
DROP POLICY IF EXISTS "angel_exit_readiness_read" ON public.exit_readiness;
CREATE POLICY "angel_exit_readiness_read" ON public.exit_readiness
  FOR SELECT TO authenticated
  USING (
    (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'angel'
      OR get_user_role() = 'angel'
    )
    AND company_id IN (
      SELECT angel_exposures.company_id
      FROM public.angel_exposures
      WHERE angel_exposures.user_id = auth.uid()
    )
  );

-- funding_rounds: angels currently receive 0 valuation rows
DROP POLICY IF EXISTS "angel_funding_rounds_read" ON public.funding_rounds;
CREATE POLICY "angel_funding_rounds_read" ON public.funding_rounds
  FOR SELECT TO authenticated
  USING (
    (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'angel'
      OR get_user_role() = 'angel'
    )
    AND company_id IN (
      SELECT angel_exposures.company_id
      FROM public.angel_exposures
      WHERE angel_exposures.user_id = auth.uid()
    )
  );

-- ═════════════════════════════════════════════════════════════════════════
-- 2. ANGEL EXPOSURE LEDGER  ← ROOT CAUSE of the service-role bypass
-- ═════════════════════════════════════════════════════════════════════════
-- The original used auth.jwt() ->> 'role' = 'angel', which is always
-- 'authenticated'. Result: angels read ZERO rows from exposure_events, so
-- invested capital derives to 0. This single policy is what forced
-- angel-portfolio.service.ts onto the service-role client.
--
-- Also narrows TO authenticated — the original had no TO clause so it applied
-- to PUBLIC including anon (harmless only because auth.jwt() is NULL for anon).
-- Row scope unchanged: only positions held via a holders row owned by this user.
DROP POLICY IF EXISTS "exposure_events_angel_own" ON public.exposure_events;
CREATE POLICY "exposure_events_angel_own" ON public.exposure_events
  FOR SELECT TO authenticated
  USING (
    (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'angel'
      OR get_user_role() = 'angel'
    )
    AND position_id IN (
      SELECT exposure_positions.id
      FROM public.exposure_positions
      WHERE exposure_positions.holder_id IN (
        SELECT holders.id
        FROM public.holders
        WHERE holders.user_id = auth.uid()
      )
    )
  );

-- ═════════════════════════════════════════════════════════════════════════
-- 3. FOUNDER READ ACCESS  (scope: only their own company, via founders.email)
--    NOTE: auth.jwt() ->> 'email' is a top-level JWT claim and is valid; that
--    part of the original predicate is preserved as-is.
-- ═════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "founder_advisory_read" ON public.advisory_activity;
CREATE POLICY "founder_advisory_read" ON public.advisory_activity
  FOR SELECT TO authenticated
  USING (
    (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'founder'
      OR get_user_role() = 'founder'
    )
    AND company_id IN (
      SELECT c.id
      FROM public.companies c
      WHERE c.crm_founder_id IN (
        SELECT f.id
        FROM public.founders f
        WHERE f.email = (auth.jwt() ->> 'email')
      )
    )
  );

DROP POLICY IF EXISTS "founder_exit_readiness_read" ON public.exit_readiness;
CREATE POLICY "founder_exit_readiness_read" ON public.exit_readiness
  FOR SELECT TO authenticated
  USING (
    (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'founder'
      OR get_user_role() = 'founder'
    )
    AND company_id IN (
      SELECT c.id
      FROM public.companies c
      WHERE c.crm_founder_id IN (
        SELECT f.id
        FROM public.founders f
        WHERE f.email = (auth.jwt() ->> 'email')
      )
    )
  );

DROP POLICY IF EXISTS "founder_funding_rounds_read" ON public.funding_rounds;
CREATE POLICY "founder_funding_rounds_read" ON public.funding_rounds
  FOR SELECT TO authenticated
  USING (
    (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'founder'
      OR get_user_role() = 'founder'
    )
    AND company_id IN (
      SELECT c.id
      FROM public.companies c
      WHERE c.crm_founder_id IN (
        SELECT f.id
        FROM public.founders f
        WHERE f.email = (auth.jwt() ->> 'email')
      )
    )
  );

-- ═════════════════════════════════════════════════════════════════════════
-- 4. ddr_status — had exactly ONE policy and it was dead: NOBODY could read or
--    write this table through RLS, internal users included.
--    get_user_role() already maps 'admin' onto 'internal'.
-- ═════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "internal_ddr_all" ON public.ddr_status;
CREATE POLICY "internal_ddr_all" ON public.ddr_status
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('internal', 'admin')
    OR get_user_role() = 'internal'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('internal', 'admin')
    OR get_user_role() = 'internal'
  );

-- ═════════════════════════════════════════════════════════════════════════
-- 5. reporting_targets — PRIVILEGE ESCALATION, not a dead policy
-- ═════════════════════════════════════════════════════════════════════════
-- The original reads:
--     (auth.jwt() -> 'app_metadata'  ->> 'role') IN ('internal','admin')
--  OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('internal','admin')
--
-- Unlike the policies above, the user_metadata branch here is not inert — it
-- is attacker-controlled. Supabase lets any signed-in user write their own
-- user_metadata via supabase.auth.updateUser({ data: { role: 'admin' } }), and
-- user_metadata is embedded in the JWT. So any founder or angel could grant
-- themselves FOR ALL rights over reporting_targets (founder targets, revenue
-- and MRR goals) by updating their own profile. The app-level guards in
-- advisory / exit-readiness / funding / DDR actions had the same flaw and were
-- fixed in the same change.
--
-- user_metadata is removed as an authority source entirely.
DROP POLICY IF EXISTS "Internal and admin users manage reporting targets"
  ON public.reporting_targets;
CREATE POLICY "Internal and admin users manage reporting targets"
  ON public.reporting_targets
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('internal', 'admin')
    OR get_user_role() = 'internal'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('internal', 'admin')
    OR get_user_role() = 'internal'
  );

-- NOTE (NOT fixed here — needs a product decision, do not guess):
-- The sibling policy "Founders view reporting targets for their company"
-- matches on `companies.crm_founder_id = auth.uid()`. Every other founder
-- policy in this schema resolves the founder via
-- `founders.email = auth.jwt() ->> 'email'` instead, which implies
-- crm_founder_id references founders.id rather than an auth user id. If that
-- is true, founders currently see ZERO reporting targets. Confirm what
-- crm_founder_id actually stores before changing it — the two forms are not
-- interchangeable and the wrong choice widens founder access.
