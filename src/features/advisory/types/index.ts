// Aligned exactly with your database enum labels
export type AdvisorInteractionType = 'TD' | 'TVCLabs' | 'Angel' | 'External';

export interface AdvisoryActivity {
  id: string;
  company_id: string;
  advisor_name: string;
  advisor_type: AdvisorInteractionType;
  topic: string | null;
  session_date: string;
  next_action_date: string | null;
  next_action: string | null;
  owner: string | null;
  equity_or_fee: string | null;
  created_at: string;
}

export interface AdvisorRosterItem {
  id: string;
  advisor_name: string;
  instrument_name: string | null;
  ownership_pct: number | null;
}

export interface CreateAdvisoryActivityInput {
  company_id: string;
  advisor_name: string;
  advisor_type: AdvisorInteractionType;
  topic: string;
  session_date: string;
  next_action?: string | null;
  next_action_date?: string | null;
}