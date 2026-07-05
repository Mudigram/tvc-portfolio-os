export type RoundName = 
    | 'Pre-seed' 
    | 'Seed' 
    | 'Series A' 
    | 'Series B' 
    | 'Series C' 
    | 'Series D' 
    | 'Series E+'
    | 'Bridge'
    | 'Debt'
    | 'Grant'
    | 'Other';

export interface FundingRound {
    id: string;
    company_id: string;
    round_name: RoundName;
    amount_raised: number | null;
    pre_money_valuation: number | null;
    post_money_valuation: number | null;
    date_closed: string | null;
    lead_investor: string | null;
    investors: string[] | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

// 🟩 Adjusted to match your exact Postgres schema columns 
export interface FundingStatus {
    id: string;
    company_id: string;
    runway_months: number | null;
    current_raise_target: number | null;
    instrument: string | null;
    lead_investor_status: string | null;
    existing_commitments: number | null;
    followon_opportunity: boolean;
    last_verified_date: string | null;
    verified_by: string | null;
    created_at: string;
    updated_at: string;
    is_actively_raising: boolean | null;
}

export interface FundingRoundInput {
    company_id: string;
    round_name: RoundName;
    amount_raised?: number | null;
    pre_money_valuation?: number | null;
    post_money_valuation?: number | null;
    date_closed?: string | null;
    lead_investor?: string | null;
    investors?: string[] | null;
    notes?: string | null;
}

// 🟩 Extended to support runway tracking metrics
export interface CompanyFundingSummary {
    total_raised: number;
    total_rounds: number;
    latest_round: FundingRound | null;
    latest_valuation: number | null;
    actively_raising: boolean;
    runway_months: number | null; // Critical requirement
}