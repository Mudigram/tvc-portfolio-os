-- Migration: Extend update_status_enum with Verified and Needs Correction if missing
-- Timestamp: 2026-11-17

DO $$
BEGIN
  ALTER TYPE public.update_status_enum ADD VALUE IF NOT EXISTS 'Verified';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  ALTER TYPE public.update_status_enum ADD VALUE IF NOT EXISTS 'Needs Correction';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
