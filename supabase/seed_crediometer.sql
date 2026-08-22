-- Seed Data for Crediometer Acceptance Test
-- Run this script in the Supabase SQL Editor or via database migration runner

DO $$
DECLARE
  v_company_id UUID;
BEGIN
  -- 1. Insert or update Crediometer company profile
  SELECT id INTO v_company_id FROM companies WHERE name = 'Crediometer' LIMIT 1;

  IF v_company_id IS NULL THEN
    INSERT INTO companies (
      id,
      name,
      sector,
      stage,
      country,
      website,
      legal_entity,
      logo_url,
      bio,
      investment_date,
      instrument_type,
      amount_invested,
      currency,
      syndicate_holdings,
      portfolio_health,
      last_verified_date,
      verified_by
    ) VALUES (
      gen_random_uuid(),
      'Crediometer',
      'Fintech',
      'Seed',
      'Nigeria',
      'https://crediometer.com',
      'Crediometer Technologies Ltd (2022)',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
      'Automated credit decisioning engine and embedded lending infrastructure for emerging market financial institutions and neobanks.',
      '2023-11-15',
      'SAFE',
      75000,
      'USD',
      'TVCLabs Syndicate Alpha (10% allocation option reserved)',
      'Green',
      NOW(),
      'Segun'
    ) RETURNING id INTO v_company_id;
  ELSE
    UPDATE companies SET
      sector = 'Fintech',
      stage = 'Seed',
      country = 'Nigeria',
      website = 'https://crediometer.com',
      legal_entity = 'Crediometer Technologies Ltd (2022)',
      logo_url = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
      bio = 'Automated credit decisioning engine and embedded lending infrastructure for emerging market financial institutions and neobanks.',
      investment_date = '2023-11-15',
      instrument_type = 'SAFE',
      amount_invested = 75000,
      currency = 'USD',
      syndicate_holdings = 'TVCLabs Syndicate Alpha (10% allocation option reserved)',
      portfolio_health = 'Green',
      last_verified_date = NOW(),
      verified_by = 'Segun'
    WHERE id = v_company_id;
  END IF;

  -- 2. Clear old test documents for Crediometer
  DELETE FROM company_figure_documents WHERE company_id = v_company_id;

  -- 3. Insert linked figure source documents for Crediometer
  INSERT INTO company_figure_documents (
    company_id,
    figure_key,
    document_name,
    file_url,
    reconciliation_status,
    reconciliation_notes
  ) VALUES
  (
    v_company_id,
    'amount_invested',
    'Crediometer_Executed_SAFE_75k_2023.pdf',
    'https://suqbaykmygwhldhacnyu.supabase.co/storage/v1/object/public/company-source-docs/crediometer_safe_executed.pdf',
    'Reconciled',
    'Reconciled to bank deposit statement by Segun on 2026-08-01'
  ),
  (
    v_company_id,
    'instrument_type',
    'Crediometer_SAFE_TermSheet_BoardResolution.pdf',
    'https://suqbaykmygwhldhacnyu.supabase.co/storage/v1/object/public/company-source-docs/crediometer_termsheet.pdf',
    'Reconciled',
    'Verified pre-money valuation cap of $3.5M USD'
  ),
  (
    v_company_id,
    'investment_date',
    'Bank_Wire_Confirmation_15Nov2023.pdf',
    'https://suqbaykmygwhldhacnyu.supabase.co/storage/v1/object/public/company-source-docs/bank_wire_receipt_15nov.pdf',
    'Reconciled',
    'Wire settlement confirmed by TVCLabs Treasury'
  ),
  (
    v_company_id,
    'syndicate_holdings',
    'TVCLabs_Syndicate_Alpha_SideLetter.pdf',
    'https://suqbaykmygwhldhacnyu.supabase.co/storage/v1/object/public/company-source-docs/syndicate_side_letter.pdf',
    'Reconciled',
    'Syndicate agreement executed by Ibukun & TD'
  );

END $$;
