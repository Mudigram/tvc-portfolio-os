# Portfolio OS — Project Context for Continuation

Read this in full before touching code. It exists because the last several weeks of decisions happened in conversation and review sessions, not in the repo — this file is that context made explicit.

## What this system is

Portfolio OS is TVCLabs' internal platform for tracking portfolio companies and economic exposure from first investment through exit. Solo-developed by Mudiaga Omene ("Mudi"), reporting to Harry 'Tomi Davies ("TD"), TVCLabs' principal and final scope authority.

**Governing question, confirmed by TD on 28 July 2026 as the correct test to build against:**
> Does this allow Korede to operate the Portfolio Revenue Engine accurately, independently, and at scale?

Every task, schema decision, and feature exists to serve that question. If a piece of work doesn't clearly serve it, stop and ask before building.

## People and what they own (Responsibility Matrix)

| Domain | Owner | Role |
|---|---|---|
| Platform design, development, technical operation | Mudi | Builds and operates the system |
| Portfolio operating requirements & UAT | Korede | Defines what's usable; runs acceptance tests; **must be able to operate the system without Mudi present** — this is the single most important constraint on how things get built |
| Financial valuation & economic exposure reconciliation | Segun | Confirms figures reconcile to agreements/payments/cap tables |
| Founder advisory information | Amaju | Owns accuracy of founder advisory content |
| Angel reporting requirements | Ibukun | Owns what angels need to see, with an independent reviewer on access separation |
| Strategic approval & final sign-off | TD | Gate decisions; final authority on scope |

## TD's four-state test (governs "done")

A feature is not complete until all four are true — track against all four, not just the first:

- **Built** — can be demonstrated live
- **Tested** — evidence it works, beyond a demo
- **Operational** — Korede can use it without Mudi present
- **Complete** — agreed acceptance criteria have passed

## Non-negotiable technical conventions

- No direct Supabase imports in pages or components — all data access through the service layer.
- Middleware lives in `src/proxy.ts`, not `middleware.ts`.
- Env vars: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`. Never put `NEXT_PUBLIC_` on anything privileged (service role key, etc.).
- Use `getClaims()` server-side for auth checks, not `getSession()`.
- PKCE code exchange is client-side only (`page.tsx` with `createBrowserClient`) — a `route.ts` handler cannot access the code verifier and will fail.
- Server components fetch data and pre-render into slots; client components receive slots as props and own interactivity only ("slot pattern"). Don't wrap slot-pattern components in `next/dynamic` — the two mechanisms conflict.
- Calculated/derived values (dilution, ownership %, freshness) are computed at read time, not stored — **except** historical position tracking, which is a deliberate exception: use an append-only event log, not periodic snapshots (see Current Tasks doc for detail).
- New holder records must always default `is_tvclabs_entity = false`.
- Feature code lives under `src/features/[feature-name]/`: types in `types/index.ts`, data access in `services/[name].ts`, server actions colocated, UI alongside.

## What's already built (high confidence — verify against live repo before assuming)

Auth (magic-link, PKCE), role-based app shell (internal/angel/founder), internal dashboard, seven-tab company profiles, cap table & ownership management, exposure tracking, founders CRM, angel portfolio view, founder portal (submission form only), settings (thresholds/users/TVC entities), scoring/governance logic (verified against TD's criteria list).

## What's built but incomplete, per TD's live walkthrough (Crediometer test)

Company identity only has stage/sector/country/legal-entity/website — missing logo, bio, investment date, instrument type, amount, currency, syndicate holdings, and source-document links per figure. Cap table exists but isn't reconciled to agreements/payments. No historical/point-in-time position view. Founder reporting is a submission form, not the full workflow TD described (targets, evidence, reminders, review/verification, corrections). Access control enforces internal/angel/founder split but founder-to-founder and angel-to-angel isolation, plus a distinct admin tier, aren't independently tested.

## What's not built at all

Reconciliation workflow, historical position tracking, full founder reporting workflow, admin tier, operational resilience (MFA-protected ring-fenced accounts, staging environment, backup/recovery), documentation (operator-facing), master ledger reconciliation, per-company POEM-style register output.

## Decisions TD has explicitly resolved (do not re-litigate)

- **MVP Scope v2 is conceptually approved** (28 July 2026 email) — final confirmation happens at a Korede check-in, but the scope itself is not up for redesign.
- **Governance/compliance gap visibility**: confirmed in scope, but **admin-tier only** — TD-level visibility into risks/missing evidence/control gaps. Explicitly **not** a broad compliance-management module. Don't build more than this.
- **Gate 1 (Internal Sandbox) is the evidence threshold before any Platform Enablement Fee conversation with Segun.** This is now a commercial trigger, not just an internal milestone — don't declare it passed prematurely; the fee conversation depends on it being genuinely evidenced.

## Still open — do not build speculatively

**DG Collective's long-term role** — whether TVCLabs needs its own durable data-room/exit-readiness tracking, or DG Collective remains the permanent system of record. Pending resolution at the Korede check-in. Do not build data-room tracking beyond the current thin DDR tab until this resolves.

## Explicitly out of scope until gates pass in sequence

No external angel access, no founder production use, no official investor reporting, no commercial licensing, no third-party involvement of any kind (including external reviewers) until Sandbox → External Pilot → Production gates pass in that order. Currently: **nowhere near production; not even a formal staging environment exists yet.**

## The gate structure (why sequencing matters)

**Gate 1 (Internal Sandbox)** requires: 10 companies fully reconciled (master ledger); Korede running a full monthly review and report unaided; access control tested (founder/angel isolation + admin tier + governance visibility); TD able to see how the platform is monitored and controlled. No third party engaged before this passes.

**Gate 2 (External Pilot)** requires Gate 1 passed first, plus: owned email-sending domain live (Resend blocked on this — business/budget decision, not engineering), full founder reporting workflow, POEM-style register live, NDPR/data-protection review done, named pilot list from TD, basic error monitoring in place.

**Gate 3 (Production)** requires Gate 2 run clean for a TD-defined period, plus independent external review and TD's licensing decision.

## Reporting cadence (from August, not a build task but relevant context)

TD wants build progress, revenue performance, pipeline maturity, and platform adoption readiness reported as **four separate status lines** — specifically so pre-revenue build activity stops reading as economic performance. Keep this in mind when describing progress: don't conflate "I built X" with "the platform is generating value."

## Companion file

See `PORTFOLIO_OS_CURRENT_TASKS.md` for the specific, sequenced, currently-actionable work — start there for what to actually build first.