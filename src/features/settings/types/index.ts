// ─────────────────────────────────────────────────────────────
// Settings — Types
// ─────────────────────────────────────────────────────────────

// ── App settings ─────────────────────────────────────────────
export interface AppSetting {
    key: string
    value: string
    label: string
    description: string | null
    updated_at: string
    updated_by: string | null
  }
  
  // Known setting keys — keeps usage typesafe
  export type SettingKey =
    | 'founder_dilution_threshold'
    | 'tvc_dilution_threshold'
    | 'cap_table_stale_months'
    | 'update_cycle_warning_days'
    | 'update_cycle_critical_days'
    | 'staleness_threshold_days'
  
  // Convenience map
  export type SettingsMap = Record<SettingKey, AppSetting>
  
  // ── User management ───────────────────────────────────────────
  export type UserRole = 'admin' | 'internal' | 'angel' | 'founder'
  
  export interface ManagedUser {
    id: string
    email: string
    role: UserRole | null
    last_sign_in_at: string | null
    created_at: string
    is_disabled: boolean
  }
  
  export interface InviteUserPayload {
    email: string
    role: UserRole
  }
  
  export interface UpdateRolePayload {
    userId: string
    role: UserRole
  }
  
  // ── TVC entities ──────────────────────────────────────────────
  export interface TvcEntity {
    id: string
    name: string
    holder_type: string
    email: string | null
  }
  
  // ── Save result (shared) ──────────────────────────────────────
  export interface SettingsActionResult {
    success: boolean
    error?: string
  }

  // ── Angel holdings management ──────────────────────────────────
  export interface AngelHolding {
    id: string              // angel_exposures.id
    exposure_id: string     // exposure_positions.id
    company_id: string
    company_name: string
    logo_path: string | null
    instrument_name: string | null
    exposure_type: string
    amount_invested: number
    ownership_pct: number | null
    status: string
    issue_date: string | null
  }

  export interface AvailableExposure {
    id: string              // exposure_positions.id
    company_id: string
    company_name: string
    instrument_name: string | null
    exposure_type: string
    amount_invested: number
  }