export interface Founder {
    id: string
    email: string
    full_name: string
    startup_name: string | null
    phone: string | null
    industry: string | null
    stage: string | null
    city: string | null
    country: string | null
    ddr_status: string | null
    notes: string | null
    linkedin_url: string | null
    created_at: string
    updated_at: string
  
    linked_company: {
      id: string
      name: string
      portfolio_health: 'Green' | 'Amber' | 'Red' | null
      update_submitted_this_cycle: boolean
    } | null
  }
  
  export interface FounderListItem {
    id: string
    full_name: string
    email: string
    startup_name: string | null
    industry: string | null
    stage: string | null
    city: string | null
    country: string | null
    ddr_status: string | null
    updated_at: string | null
    linked_company: {
      id: string
      name: string
      portfolio_health: 'Green' | 'Amber' | 'Red' | null
    } | null
  }
  
  export interface UpdateFounderInput {
    full_name: string
    email: string
    startup_name: string | null
    phone: string | null
    industry: string | null
    stage: string | null
    city: string | null
    country: string | null
    ddr_status: string | null
    notes: string | null
    linkedin_url: string | null
  }