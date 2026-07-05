export type ReadinessSignal = 'Early' | 'Progressing' | 'Ready';

export interface ExitReadinessData {
  id: string;
  company_id: string;
  overall_readiness: ReadinessSignal | null;
  revenue_growth: number | null;
  governance: number | null;
  cap_table_quality: number | null;
  financial_reporting: number | null;
  product_maturity: number | null;
  team_depth: number | null;
  customer_concentration: number | null;
  fundraising_history: number | null;
  poemddr_completeness: number | null;
  acquirer_attractiveness: number | null;
  scored_at: string | null;
  scored_by: string | null;
  last_verified_date: string | null;
  verified_by: string | null;
  created_at: string;
}

export interface SaveExitReadinessInput {
  companyId: string;
  overallReadiness: ReadinessSignal;
  revenueGrowth: number;
  governance: number;
  capTableQuality: number;
  financialReporting: number;
  productMaturity: number;
  teamDepth: number;
  customerConcentration: number;
  fundraisingHistory: number;
  poemddrCompleteness: number;
  acquirerAttractiveness: number;
}