export type DgcDdrStatus = 'Awaiting Documents' | 'In Progress' | 'Verified' | 'Flagged';

export interface DdrStatusData {
  id: string;
  company_id: string;
  current_status: DgcDdrStatus;
  dgc_contact_name: string | null;
  notes: string | null;
  last_updated_at: string;
  updated_by: string;
}

export interface SaveDdrStatusInput {
  companyId: string;
  currentStatus: DgcDdrStatus;
  dgcContactName: string | null;
  notes: string | null;
}