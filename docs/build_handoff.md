# Portfolio OS — Build Handoff Spec (Post-Audit)
**For: local coding agent**
**Source: audit run August 2026, reviewed with Mudi**
**Scope: build/code work only. Company seeding/reconciliation data entry is explicitly excluded — Mudi is doing that separately.**

Work through sections in order. Each section is a discrete unit — do not start the next until the current one's acceptance criteria pass. Flag anything ambiguous rather than guessing; two items below (#3/#4 and #7) depend on decisions that may need to be confirmed with Mudi before implementation, noted inline.

Reminder of non-negotiable conventions (violations found in the audit — do not repeat them):
- No direct Supabase imports in pages or components — service layer only.
- `src/proxy.ts`, not `middleware.ts`.
- `getClaims()` server-side, never `getSession()`.
- Server components fetch/pre-render into slots; client components own interactivity only.
- Feature code under `src/features/[feature-name]/{types,services,actions,components}`.

---

## 1. Fix staleness threshold inconsistency
**Problem:** SQL (`governance_gaps` view) uses a 90-day threshold. `CompanyOverviewTab.tsx` and `ExposureTable.tsx` hardcode 60 days. These currently disagree on a live governance rule.

**Approach:** Do not pick a number — this is TD's decision, not yet confirmed. Instead, centralize the threshold as a single configurable value so it's fixed in one place once TD confirms it, and the SQL/UI can never drift apart again.

**Implementation:**
- Add `staleness_threshold_days` to `app_settings` (table already exists per prior workstream).
- SQL: update the governance gaps view to read from `app_settings` instead of a hardcoded `INTERVAL '90 days'`.
- Frontend: `CompanyOverviewTab.tsx` and `ExposureTable.tsx` fetch the threshold via a shared service function (e.g. `getStalenessThreshold()` in `src/features/settings/services/`) instead of hardcoding 60.
- Default value: 90 (matches current SQL, until TD confirms otherwise).

**Acceptance criteria:** One source of truth for the threshold; changing it in `app_settings` changes behavior everywhere with no code redeploy.

---

## 2. Service layer refactor — remove direct Supabase imports
**Problem:** 9 files import Supabase directly in pages/components, violating the service-layer convention: `founder-dashboard/page.tsx`, `companies/[id]/page.tsx`, `CompanyAdvisoryTab.tsx`, plus 6 more (agent to enumerate full list via repo grep before starting).

**Approach:** For each file, move the Supabase query into the appropriate feature's `services/` module (create one if it doesn't exist for that feature), and have the page/component call the service function instead.

**Implementation:**
- Grep repo for `createServerClient` / `createBrowserClient` / direct `supabase.from(...)` calls outside `services/` directories.
- For each hit, identify the correct feature folder, write or extend the service function there, and swap the call site.
- Preserve existing RLS behavior exactly — this is a refactor, not a behavior change. No new queries, no changed filters.

**Acceptance criteria:** Zero direct Supabase imports outside `services/*.ts` files, confirmed by repo-wide grep returning no results. No regression in existing page behavior.

---

## 3. `company_investment_summary` SQL view
**Problem:** Referenced in prior spec, never created. Needed before the deprecation migration in #4 can happen.

**Implementation:**
- New view, scoped to `holder_type = 'TVCLabs'`, joining `companies` with the exposure ledger (`exposure_positions` / `getCurrentExposure` equivalent) to surface the same shape of data currently read from `companies.amount_invested/currency/instrument_type/investment_date`.
- Match the column names/shape the frontend currently expects from those four columns, so #4's cutover is a data-source swap, not a UI rewrite.

**Acceptance criteria:** View returns correct values for the one seeded company (Crediometer) that can be manually cross-checked against the existing `companies` columns.

---

## 4. Staged deprecation migration for `companies` legacy columns
**Problem:** `companies.amount_invested`, `currency`, `instrument_type`, `investment_date` are still live and directly written to via `updateCompany.action.ts`, duplicating the event-sourced exposure system.

**Depends on:** #3 above.

**Approach — staged, not destructive in one step:**
1. Point all reads that currently use the four `companies` columns to `company_investment_summary` instead.
2. Stop writing to the four columns from `updateCompany.action.ts` (dual-write period ends).
3. Generate a discrepancy report comparing old column values against the new view for every company — this is for Mudi to review, not for the agent to resolve.
4. **Do not drop the columns.** Column drop happens only after Mudi has reviewed discrepancies. Leave them in place, unused, until told otherwise.

**Acceptance criteria:** No application code writes to the four legacy columns; `company_investment_summary` is the sole read path; discrepancy report generated and handed to Mudi.

---

## 5. Master ledger reconciliation UI
**Problem:** `master_ledger_status` view and `reconcilePosition` function both exist server-side, but there is no operator-facing console. Right now reconciliation only happens if someone calls the service function directly — this is the main blocker to Korede operating reconciliation without Mudi.

**Implementation:**
- New page/route (suggest `/internal/reconciliation` or similar, under internal role access) rendering the `master_ledger_status` rollup across companies: which are verified, which are missing evidence, last verified date.
- A reconcile action per position: button triggers a Server Action calling `reconcilePosition`, respecting the existing hard gate (at least one linked source document required — do not bypass this in the UI).
- Follow the slot pattern: server component fetches the rollup, client component owns the interactive reconcile button.

**Acceptance criteria:** Korede can view reconciliation status for all companies and mark a position verified from the UI, with the source-document gate enforced, without any direct DB or service-layer access.

---

## 6. Point-in-time exposure UI
**Problem:** `getPositionAsOf` exists in the service layer; there's no way to use it from the UI.

**Implementation:**
- Add a date-picker control to the exposure dashboard (portfolio-wide exposure page).
- Selecting a date calls `getPositionAsOf` and re-renders the exposure table/values as of that date, using the same components as the current-state view where possible rather than a parallel UI.
- Default to "current" when no date is selected — this should be additive, not a replacement of the existing default view.

**Acceptance criteria:** Selecting a past date shows historically accurate values for a position with more than one exposure event recorded (test against seeded data with corrections/multiple events, once available).

---

## 7. Full founder reporting workflow
**Problem:** Only a bare submission form exists. Missing: targets, reminders, review/verification, corrections.

**Note before starting:** confirm scope with Me — this is the largest item on this list and the audit's "Built" label for it was inaccurate (it's closer to 20% done). Don't assume the full spec below is final; treat it as a starting point.

**Implementation, staged:**
1. **Targets** — schema/UI for founders to see what's expected of them per reporting period (extend `funding_status` or a new `reporting_targets` table — check for overlap with `investor_materials_status` before adding new columns).
2. **Reminders** — reuse the existing Resend integration from Campaigns (already built) rather than building new email infrastructure; scheduled or triggered sends based on target due dates.
3. **Review/verification** — internal-role UI to review a founder submission, mark verified/needs-correction, consistent with the verification pattern already used in master ledger reconciliation (#5) — reuse that pattern rather than inventing a new one.
4. **Corrections** — founder can resubmit against a flagged item; internal role sees the resubmission against the original.

**Acceptance criteria:** A founder can see a target, receive a reminder, submit, get reviewed, and correct if flagged — full loop demonstrable end to end for one founder account.

---

## 8. Operational resilience
**Problem:** MFA ring-fencing is done. Staging environment and backup/recovery are not started.

**Implementation:**
- Staging environment: separate Vercel deployment + separate Supabase project (or schema-level separation if a second project isn't feasible — flag this decision, don't assume budget for a second Supabase project).
- Backup/recovery: confirm what Supabase's built-in backup tier already covers before building custom tooling — this may be a configuration task, not a code task. Document the recovery procedure regardless.

**Acceptance criteria:** A documented, tested recovery procedure exists; staging environment is live and separate from production data.

---

## 9. Operator-facing documentation — ✅ COMPLETE
**Deliverable**: Created [`docs/operator_manual.md`](file:///c:/Users/USER/Projects/tvc-portfolio-os/docs/operator_manual.md).

**Contents Covered**:
- Operating the Master Ledger Reconciliation Console (`/reconciliation`) and source document verification hard gates.
- Managing the Founder Monthly Reporting Pipeline (`/updates`, setting targets, Resend email reminders, review & verification decisions, and corrections flow).
- Monitoring Governance Gap alerts & configuring `staleness_threshold_days` in `/settings`.
- Step-by-step 3-phase Monthly Portfolio Review Protocol (Pre-cycle setup, active submission review, end-of-month reconciliation & sign-off).
- Troubleshooting matrix & operator escalation protocols.

---

## 10. Per-company POEM-style register output
**Problem:** Not started. Gate 2 requirement, not Gate 1 — lowest priority on this list, included for completeness.

**Implementation:** Hold until Gate 1 items above are done. Do not start speculatively.

---

## Reporting back

After each numbered section, report status using the same Built/Tested/Operational/Complete framing as the audit. Flag any item where the acceptance criteria can't be verified without seeded company data beyond Crediometer — note it as blocked-on-data rather than marking it incomplete.