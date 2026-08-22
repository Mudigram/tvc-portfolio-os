-- Migration: Exposure Event Log — decompose economic_exposure into positions + events
-- Timestamp: 2026-08-09
--
-- This migration was applied directly to the production Supabase DB.
-- This file exists for version-control parity with the live schema.
--
-- Changes:
--   1. Create exposure_positions (position metadata, manually verified)
--   2. Create exposure_events (append-only dollar-amount ledger)
--   3. Migrate data from the old economic_exposure table
--   4. Replace the table with a backward-compatible view
--   5. Create exposure_as_of(date) function for point-in-time queries

BEGIN;

-- ─── 1. exposure_positions ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS exposure_positions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  holder_id        UUID NOT NULL REFERENCES holders(id) ON DELETE CASCADE,
  holder_type      holder_type_enum NOT NULL,
  exposure_type    exposure_type_enum NOT NULL,
  instrument_name  TEXT,
  issue_date       DATE,
  ownership_pct    NUMERIC,
  share_class      TEXT,
  status           exposure_status_enum NOT NULL DEFAULT 'Active',
  last_verified_date TIMESTAMPTZ,
  verified_by      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exposure_positions_company ON exposure_positions(company_id);
CREATE INDEX IF NOT EXISTS idx_exposure_positions_holder  ON exposure_positions(holder_id);

ALTER TABLE exposure_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read for exposure_positions"
  ON exposure_positions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Internal write for exposure_positions"
  ON exposure_positions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ─── 2. exposure_events ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS exposure_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id         UUID NOT NULL REFERENCES exposure_positions(id) ON DELETE CASCADE,
  event_type          TEXT NOT NULL CHECK (event_type IN (
                        'investment', 'conversion', 'write_down', 'write_up', 'exit', 'correction'
                      )),
  effective_date      DATE NOT NULL,
  amount              NUMERIC NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'USD',
  source_document_url TEXT,
  reverses_event_id   UUID REFERENCES exposure_events(id),
  notes               TEXT,
  created_by          UUID NOT NULL REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Each event can only be reversed once
CREATE UNIQUE INDEX IF NOT EXISTS idx_exposure_events_reversal
  ON exposure_events(reverses_event_id) WHERE reverses_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_exposure_events_position ON exposure_events(position_id);
CREATE INDEX IF NOT EXISTS idx_exposure_events_effective ON exposure_events(position_id, effective_date);

ALTER TABLE exposure_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read for exposure_events"
  ON exposure_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Internal insert for exposure_events"
  ON exposure_events FOR INSERT TO authenticated WITH CHECK (true);

-- ─── 3. Migrate data from old economic_exposure table ───────────────────────
-- (Data migration was performed during live deployment)

-- ─── 4. Replace table with backward-compatible view ─────────────────────────

-- DROP TABLE economic_exposure; (was performed live)

CREATE OR REPLACE VIEW economic_exposure AS
SELECT
  ep.id,
  ep.company_id,
  ep.holder_id,
  ep.holder_type,
  ep.exposure_type,
  ep.instrument_name,
  ep.issue_date,
  COALESCE(SUM(ee.amount), 0) AS amount_invested,
  ep.ownership_pct,
  ep.share_class,
  ep.status,
  ep.last_verified_date,
  ep.verified_by,
  ep.created_at,
  ep.updated_at
FROM exposure_positions ep
LEFT JOIN exposure_events ee ON ee.position_id = ep.id
GROUP BY ep.id;

-- ─── 5. Point-in-time query function ────────────────────────────────────────

CREATE OR REPLACE FUNCTION exposure_as_of(as_of DATE)
RETURNS TABLE (
  position_id     UUID,
  company_id      UUID,
  holder_id       UUID,
  amount_invested NUMERIC
) AS $$
  SELECT
    ep.id AS position_id,
    ep.company_id,
    ep.holder_id,
    COALESCE(SUM(ee.amount), 0) AS amount_invested
  FROM exposure_positions ep
  LEFT JOIN exposure_events ee
    ON ee.position_id = ep.id
    AND ee.effective_date <= as_of
  GROUP BY ep.id, ep.company_id, ep.holder_id
$$ LANGUAGE sql STABLE;

COMMIT;
