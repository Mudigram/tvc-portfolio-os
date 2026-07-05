// ─────────────────────────────────────────────────────────────
// Cap Table feature — public API
// Import from here, not from internal paths
// ─────────────────────────────────────────────────────────────

export { default as CapTableTab } from './components/CapTableTab'
export { default as CapTableClientView } from './components/CapTableClientView'
export { CapTableStatusBadge, OwnershipStatusBadge, AlertPill } from './components/CapTableBadges'
export { getCapTableByCompanyId, getAllCapTableSummaries } from './services/cap-table.server'
export { saveCapTable } from './actions/cap-table.actions'
export * from './utils/derive'
export * from './types'