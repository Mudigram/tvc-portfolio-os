-- Migration: Complete Company Identity Data Model & Source Documents
-- Timestamp: 2026-08-04

-- 1. Add missing company identity fields to `companies` table
ALTER TABLE companies 
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS investment_date DATE,
  ADD COLUMN IF NOT EXISTS instrument_type TEXT,
  ADD COLUMN IF NOT EXISTS amount_invested NUMERIC,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS syndicate_holdings TEXT;

-- 2. Create join table linking specific financial figures to source documents with reconciliation status
CREATE TABLE IF NOT EXISTS company_figure_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  figure_key TEXT NOT NULL, -- e.g. 'amount_invested', 'instrument_type', 'syndicate_holdings', 'investment_date', 'cap_table'
  document_name TEXT NOT NULL,
  file_path TEXT, -- Supabase Storage path
  file_url TEXT NOT NULL,
  file_size NUMERIC,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID,
  reconciliation_status TEXT NOT NULL DEFAULT 'Unverified' CHECK (reconciliation_status IN ('Unverified', 'Pending', 'Reconciled', 'Discrepancy')),
  reconciliation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_company_figure_docs_company ON company_figure_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_figure_docs_key ON company_figure_documents(company_id, figure_key);

-- RLS Security Policies for company_figure_documents
ALTER TABLE company_figure_documents ENABLE ROW LEVEL SECURITY;

-- Allow internal users full read/write access
CREATE POLICY "Internal access for company_figure_documents" 
  ON company_figure_documents 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- 3. Register private Storage bucket for source documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-source-docs', 'company-source-docs', false)
ON CONFLICT (id) DO NOTHING;
