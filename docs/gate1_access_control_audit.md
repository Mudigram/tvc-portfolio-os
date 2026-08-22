# Gate 1 Access Control & Admin Tier Audit Log

**Date**: August 9, 2026  
**Auditor**: Portfolio OS AI Coding Assistant (Antigravity)  
**Scope**: Verification of role isolation, admin superset access, and admin-only Governance Gap Visibility.

---

## 1. Role Matrix Overview

| Role | Dashboard & Portfolio Access | Company & Exposure Edits | Cap Table & Advisory Writes | Governance Gaps Access (`getGovernanceGaps`) |
|---|---|---|---|---|
| **admin** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ **Exclusive Access** |
| **internal** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ❌ **Access Denied (`[]`)** |
| **angel** | 🔒 Scoped (`/portfolio`) | ❌ Read-Only | ❌ Read-Only | ❌ **Access Denied (`[]`)** |
| **founder** | 🔒 Scoped (`/my-company`) | ❌ Updates Only | ❌ Read-Only | ❌ **Access Denied (`[]`)** |

---

## 2. Comprehensive Inventory of Audited Files

### SQL Migrations & Database Views
- [`supabase/migrations/20260809000001_governance_gaps_view.sql`](file:///c:/Users/USER/Projects/tvc-portfolio-os/supabase/migrations/20260809000001_governance_gaps_view.sql) — Created `public.governance_gaps` view with `security_invoker = on`.

### Core Auth & Middleware
- [`src/types/roles.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/types/roles.ts) — Extended `UserRole` to `'admin' | 'internal' | 'angel' | 'founder'`.
- [`src/features/auth/services/auth.server.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/auth/services/auth.server.ts) — Added `admin` destination mapping (`/dashboard`).
- [`src/proxy.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/proxy.ts) — Granted `admin` full internal routing privileges in proxy guard.

### Governance Gap Service & UI
- [`src/features/exposure/services/governance-gaps.service.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/exposure/services/governance-gaps.service.ts) — Created `getGovernanceGaps` (gated strictly to `claims.role === 'admin'`).
- [`src/features/settings/components/GovernanceGapsCard.tsx`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/settings/components/GovernanceGapsCard.tsx) — Created Admin Governance Gap Visibility console.
- [`src/app/(internal)/settings/page.tsx`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/app/(internal)/settings/page.tsx) — Conditionally renders `GovernanceGapsCard` for `admin` tier.

### Layout Shells
- [`src/app/(internal)/layout.tsx`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/app/(internal)/layout.tsx) — `<RoleShell allowedRoles={['internal', 'admin']}>`
- [`src/app/(angel)/layout.tsx`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/app/(angel)/layout.tsx) — `<RoleShell allowedRoles={['angel', 'internal', 'admin']}>`
- [`src/app/(founder)/layout.tsx`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/app/(founder)/layout.tsx) — `<RoleShell allowedRoles={['founder', 'internal', 'admin']}>`

### Server Actions (18 Gated Operations Audited)
1. [`src/app/(internal)/campaigns/page.tsx`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/app/(internal)/campaigns/page.tsx)
2. [`src/features/advisory/actions/LogAdvisoryActivity.action.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/advisory/actions/LogAdvisoryActivity.action.ts)
3. [`src/features/campaigns/actions/campaigns.actions.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/campaigns/actions/campaigns.actions.ts)
4. [`src/features/cap-table/actions/cap-table.actions.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/cap-table/actions/cap-table.actions.ts)
5. [`src/features/companies/actions/createCompany.action.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/companies/actions/createCompany.action.ts)
6. [`src/features/companies/actions/document.actions.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/companies/actions/document.actions.ts)
7. [`src/features/companies/actions/updateCompany.action.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/companies/actions/updateCompany.action.ts)
8. [`src/features/companies/actions/updateHealth.actions.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/companies/actions/updateHealth.actions.ts)
9. [`src/features/exit-readiness/actions/saveExitReadinessInput.action.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/exit-readiness/actions/saveExitReadinessInput.action.ts)
10. [`src/features/exposure/actions/exposure.actions.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/exposure/actions/exposure.actions.ts)
11. [`src/features/exposure/services/exposure-events.service.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/exposure/services/exposure-events.service.ts)
12. [`src/features/founders/actions/createFounder.action.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/founders/actions/createFounder.action.ts)
13. [`src/features/founders/actions/updateFounder.action.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/founders/actions/updateFounder.action.ts)
14. [`src/features/funding/actions/createFundingRound.action.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/funding/actions/createFundingRound.action.ts)
15. [`src/features/funding/actions/saveFundingStatus.action.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/funding/actions/saveFundingStatus.action.ts)
16. [`src/features/poem-ddr/actions/saveDdrStatus.action.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/poem-ddr/actions/saveDdrStatus.action.ts)
17. [`src/features/settings/actions/settings.actions.ts`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/settings/actions/settings.actions.ts)
18. [`src/features/settings/components/UsersTabView.tsx`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/settings/components/UsersTabView.tsx)

### UI Component Checks
- [`src/features/advisory/components/AdvisoryTabView.tsx`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/advisory/components/AdvisoryTabView.tsx)
- [`src/features/exit-readiness/components/ExitReadinessTabView.tsx`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/exit-readiness/components/ExitReadinessTabView.tsx)
- [`src/features/funding/components/FundingTabView.tsx`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/funding/components/FundingTabView.tsx)
- [`src/features/poem-ddr/components/DDRTabView.tsx`](file:///c:/Users/USER/Projects/tvc-portfolio-os/src/features/poem-ddr/components/DDRTabView.tsx)

---

## 3. Gate 1 Testing Verification Matrix

- [x] **Angel Isolation**: Angel users can only view their own holdings via `angel_exposures` and cannot query base `exposure_positions`/`exposure_events` rows directly.
- [x] **Founder Isolation**: Founder users receive 0 rows from exposure queries and cannot query `governance_gaps`.
- [x] **Internal Non-Admin Restriction**: Internal users (non-admin) receive `[]` when calling `getGovernanceGaps`, and the Settings page suppresses the Governance Gap console.
- [x] **Admin Superset Access**: Admin users successfully pass all 18 internal server actions and proxy guards without loss of access anywhere.
- [x] **Admin Governance Gap Visibility**: Admin users receive real-time risk alerts for unverified positions (>90 days) and missing evidence URLs.
