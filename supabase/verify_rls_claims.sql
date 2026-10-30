-- verify_rls_claims.sql
-- READ ONLY. Verifies that no RLS policy in public depends on a role
-- expression that can never be true.
--
-- Roles are written ONLY to app_metadata, so:
--   (A) auth.jwt() -> 'user_metadata' ->> 'role'   is always NULL
--   (B) auth.jwt() ->> 'role'                      is 'authenticated', not the app role
-- A policy whose ONLY role test is (A) or (B) grants nothing.
--
-- Run in the Supabase SQL editor, or:  npx supabase db query --linked -f supabase/verify_rls_claims.sql
-- Exit condition for removing the service-role bypass: section [2] returns 0 rows.

-- ==== [1] SUMMARY ====
WITH expr AS (
  SELECT c.relname AS tbl, p.polname AS pol,
         pg_get_expr(p.polqual, p.polrelid) AS qual
  FROM pg_policy p
  JOIN pg_class c     ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
)
SELECT
  count(*)                                                    AS total_policies,
  count(*) FILTER (WHERE qual LIKE '%auth.jwt() ->> ''role''%') AS dead_bare_role,
  count(*) FILTER (
    WHERE qual LIKE '%user_metadata%''role''%'
      AND qual NOT LIKE '%app_metadata%'
      AND qual NOT LIKE '%get_user_role%'
  )                                                           AS dead_user_metadata
FROM expr;

-- ==== [2] POLICIES THAT CAN NEVER MATCH (must return 0 rows) ====
SELECT c.relname AS table_name,
       p.polname AS policy_name,
       CASE
         WHEN pg_get_expr(p.polqual, p.polrelid) LIKE '%auth.jwt() ->> ''role''%'
           THEN 'DEAD: auth.jwt() ->> ''role'' is the Postgres role, not the app role'
         ELSE 'DEAD: role is stored in app_metadata, not user_metadata'
       END AS reason
FROM pg_policy p
JOIN pg_class c     ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND (
        pg_get_expr(p.polqual, p.polrelid) LIKE '%auth.jwt() ->> ''role''%'
     OR (
          pg_get_expr(p.polqual, p.polrelid) LIKE '%user_metadata%''role''%'
      AND pg_get_expr(p.polqual, p.polrelid) NOT LIKE '%app_metadata%'
      AND pg_get_expr(p.polqual, p.polrelid) NOT LIKE '%get_user_role%'
        )
      )
ORDER BY c.relname, p.polname;

-- ==== [3] THE 8 REPAIRED POLICIES - confirm every row says REPAIRED ====
WITH targets(tbl, pol) AS (
  VALUES
    ('advisory_activity', 'angel_advisory_read'),
    ('exit_readiness',    'angel_exit_readiness_read'),
    ('funding_rounds',    'angel_funding_rounds_read'),
    ('exposure_events',   'exposure_events_angel_own'),
    ('advisory_activity', 'founder_advisory_read'),
    ('exit_readiness',    'founder_exit_readiness_read'),
    ('funding_rounds',    'founder_funding_rounds_read'),
    ('ddr_status',        'internal_ddr_all')
)
SELECT
  t.tbl AS table_name,
  t.pol AS policy_name,
  CASE
    WHEN p.polname IS NULL                THEN 'MISSING — migration not applied'
    WHEN pg_get_expr(p.polqual, p.polrelid) LIKE '%auth.jwt() ->> ''role''%'
                                            THEN 'STILL DEAD — bare role test'
    WHEN pg_get_expr(p.polqual, p.polrelid) LIKE '%app_metadata%'
      OR pg_get_expr(p.polqual, p.polrelid) LIKE '%get_user_role%'
                                            THEN 'REPAIRED'
    ELSE 'UNEXPECTED — no app_metadata or get_user_role test found'
  END AS status
FROM targets t
LEFT JOIN pg_policy p ON p.polname = t.pol
  AND p.polrelid = ('public.' || t.tbl)::regclass
ORDER BY status DESC, t.tbl, t.pol;

-- ==== [4] ANGEL ISOLATION SANITY - scoping predicate must still be present ====
-- A widened policy is a leak. Each angel policy must still be bounded by
-- auth.uid() (or, for exposure_events, holders.user_id = auth.uid()).
SELECT c.relname AS table_name,
       p.polname AS policy_name,
       (pg_get_expr(p.polqual, p.polrelid) LIKE '%auth.uid()%') AS still_scoped_to_caller
FROM pg_policy p
JOIN pg_class c     ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND p.polname IN ('angel_advisory_read','angel_exit_readiness_read',
                    'angel_funding_rounds_read','exposure_events_angel_own')
ORDER BY p.polname;

-- ==== [5] ESCALATION WATCH - user_metadata used as an authority source ====
-- MUST return 0 rows. Any policy testing user_metadata can be satisfied by the
-- end user, because Supabase lets a signed-in user write their own
-- user_metadata via supabase.auth.updateUser({ data: { role: 'admin' } }) and
-- user_metadata is embedded in the JWT. Where such a policy is OR-ed with a
-- legitimate app_metadata test it does not merely fail closed — it hands the
-- user the higher privilege.
-- Note this is a DIFFERENT defect from section [2]: a user_metadata-only policy
-- is inert, a user_metadata-OR-app_metadata policy is exploitable.
SELECT c.relname AS table_name,
       p.polname AS policy_name
FROM pg_policy p
JOIN pg_class c     ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND pg_get_expr(p.polqual, p.polrelid) LIKE '%user_metadata%'
ORDER BY c.relname, p.polname;
