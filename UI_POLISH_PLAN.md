# UI Polish Execution Plan

This document is the step-by-step UI polishing plan for the portfolio application. It follows the required workflow in [ui-workflow.md](ui-workflow.md) and is designed so an agent can work through it one change at a time without skipping the design process.

## Core rule

Before changing any UI element, follow this order exactly:

1. Inspect existing patterns and references
2. Propose 2–3 options for each UI change
3. Wait for approval before implementing the chosen direction
4. Integrate the approved change using the existing stack only
5. Run a token pass afterward to check spacing, radius, motion, and contrast

Do not batch unrelated UI changes together. Finish one task completely before moving to the next.

---

## Why the current UI did not feel polished

The app already has a Next.js shell, Tailwind setup, and some layout components, but the work is still closer to starter-template output than a finished product.

The most common issues are:

- The home page still contains default Next.js boilerplate content in [src/app/page.tsx](src/app/page.tsx)
- The token system exists in [src/app/globals.css](src/app/globals.css), but it is not yet shaped into a deliberate product design language
- The shell components in [src/components/layout/AppShell.tsx](src/components/layout/AppShell.tsx), [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx), and [src/components/layout/Header.tsx](src/components/layout/Header.tsx) use a lot of hardcoded values instead of a consistent component system
- There was no disciplined reference-first design pass before implementation
- There was no final token audit for spacing, motion, and contrast consistency

The goal of this plan is to fix those issues deliberately and in order.

---

## Workflow to follow for every task

For every UI task below, do the following:

### Step A — Inspect
- Review the relevant existing app screen or component
- Open at least 2–3 of the following reference sources using the **browser tool** on their live demos (not just static docs) — inspect actual markup, computed styles, and motion values:
  - https://ui.shadcn.com
  - https://beautifui.dev
  - https://beui.dev
  - https://rareui.com
  - https://transitions.dev
  - https://ui-skills.com
  - https://reui.io/components
- Look specifically at spacing, hierarchy, elevation, motion, keyboard focus, and responsiveness
- **Flag any design decision where no matching reference was found** — do not guess silently; note it explicitly before proposing

### Step B — Propose
- Present 2–3 candidate approaches
- Include source references and note why each approach fits the app
- Explain which one is best for this project and why
- **Write the proposals as a plan artifact** (not just inline chat text) — the artifact must exist before asking for approval
- Wait for explicit go-ahead before writing any code

### Step C — Integrate
- Apply only the chosen approach
- Reuse existing primitives from [src/components/ui](src/components/ui) before creating new UI patterns
- Do not add new dependencies unless explicitly approved

### Step D — Token pass
- Recheck spacing scale, radius, color contrast, and motion duration
- Confirm the style is consistent with the rest of the app
- Remove guessing and hardcoded one-off styling if it breaks consistency
- **Validate motion decisions against https://emilkowal.ski/ui/you-dont-need-animations** — remove or shorten any transition that does not serve a clear purpose
- **Validate token completeness against https://designsystemchecklist.com** — apply findings consistently project-wide, not just to the component just built

---

## Stage 1 — Reset the app shell and baseline experience

### Task 1.1 — Replace starter landing page with product-level shell foundation
Files involved:
- [src/app/page.tsx](src/app/page.tsx)

Instructions:
- Remove default Next.js starter content
- Replace with a clean product shell or proper app landing state that matches the app’s brand
- Keep the design minimal, serious, and operational rather than template-like
- Use the existing app shell structure instead of inventing a new layout system

Done when:
- The page no longer looks like boilerplate
- It aligns with the app’s existing navigation and design token system
- It reads like a polished internal product entry point

---

### Task 1.2 — Standardize the main app shell
Files involved:
- [src/components/layout/AppShell.tsx](src/components/layout/AppShell.tsx)
- [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx)
- [src/components/layout/Header.tsx](src/components/layout/Header.tsx)

Instructions:
- Review shell layout and ensure it feels like a single design system
- Normalize spacing, typography, borders, and transitions
- Make sidebar states, collapsed states, and mobile menu states feel intentional
- Ensure the shell communicates hierarchy without overvisual decoration

Done when:
- The app shell feels like a stable foundation, not a patchwork of ad hoc styles
- Desktop and mobile layouts feel visually consistent
- Transitions are subtle and purposeful

---

## Stage 2 — Build the design system foundation

### Task 2.1 — Audit the token system in globals.css
Files involved:
- [src/app/globals.css](src/app/globals.css)

Instructions:
- Review all defined colors, spacing-related tokens, radius values, and focus ring styling
- Determine which values are currently default or generic and replace them with intentional product values
- Make sure focus states and inputs use the same brand color logic across the app

Done when:
- Core tokens align with the product’s intended look
- colors feel consistent across cards, inputs, sidebar, buttons, and headers
- there are no conflicting or accidental brand values

---

### Task 2.2 — Align the app with reusable shadcn-style primitive patterns
Files involved:
- [src/components/ui](src/components/ui)

Instructions:
- Audit the utility components already in the project
- Confirm they are being reused instead of re-created
- Check whether common elements like buttons, cards, selects, form fields, and tables follow the same visual language

Done when:
- The app uses a consistent primitive library
- new UI work reuses existing patterns instead of building one-off versions

---

## Stage 3 — Unify core interaction patterns

### Task 3.1 — Standardize buttons and action patterns
Files involved:
- [src/components/ui/button.tsx](src/components/ui/button.tsx)
- screens and features that use action buttons

Instructions:
- Review the standard button states: default, hover, focus, disabled, danger, icon-only
- Remove style mismatches across views
- Ensure buttons feel purposeful and consistent across the system

Done when:
- All action buttons share the same visual hierarchy
- no one screen feels visually louder or more premium than the others

---

### Task 3.2 — Standardize form controls and focus states
Files involved:
- [src/components/ui/input.tsx](src/components/ui/input.tsx)
- [src/components/ui/select.tsx](src/components/ui/select.tsx)
- [src/components/ui/form-select.tsx](src/components/ui/form-select.tsx)
- [src/app/globals.css](src/app/globals.css)

Instructions:
- Ensure inputs, selects, dates, and textareas share the same focus ring, border treatment, radius, and height
- Remove hardcoded focus overrides that do not fit the token system
- Confirm the visual treatment is strong enough for accessibility without being noisy

Done when:
- inputs feel consistent and intentional across all flows
- focus states are obvious without being distracting
- no inconsistent date input styling remains

---

### Task 3.3 — Improve cards, panels, and data surfaces
Files involved:
- [src/components/ui/card.tsx](src/components/ui/card.tsx)
- dashboard/content pages across the app

Instructions:
- Review surfaces used for overview panels, summary cards, and content blocks
- Standardize padding, border color, radius, contrast, and typography hierarchy
- Make cards feel like structured overview blocks instead of generic boxes

Done when:
- Cards are consistent across the app
- spacing and density are clean and readable
- the product feels more premium without adding noise

---

## Stage 4 — Improve tables and operational views

### Task 4.1 — Standardize data table presentation
Files involved:
- [src/components/ui/table.tsx](src/components/ui/table.tsx)
- any dashboard or data-heavy pages

Instructions:
- Review table density, row hover, cell padding, header style, and status presentation
- Make tables look crisp and easy to scan rather than generic or cramped
- Keep the density suitable for operational workflows, not marketing layouts

Done when:
- Tables feel easy to read and scan
- hierarchy and alignment are consistent
- status chips and row actions are easy to interpret

---

### Task 4.2 — Create a consistent pattern for status and metadata badges
Files involved:
- [src/components/ui/badge.tsx](src/components/ui/badge.tsx)
- relevant feature screens using status labels

Instructions:
- Standardize badge usage for state, role, severity, and metadata
- Decide which statuses need strong contrast and which should be more neutral
- Keep badge styling subtle enough to support scanning rather than compete with content

Done when:
- Status labels behave consistently throughout the product
- the meaning of critical vs neutral state is obvious

---

## Stage 5 — Polish motion and interaction quality

### Task 5.1 — Review animations and transitions
Files involved:
- all layout and component files with transition classes

Instructions:
- Check all animation timing and easing values
- Remove unnecessary motion that adds clutter without value
- Keep transitions for layout changes and hover states short and soft
- Favor clarity over decorative animation

Done when:
- UI movement feels purposeful and restrained
- there is no excessive animation or visual noise
- the app feels more premium and less “default”

---

### Task 5.2 — Final token pass across the product
Instructions:
- Review spacing values across the entire app
- Check consistency of radius and borders
- Confirm motion timing is consistent across all components
- Sweep for any leftover hardcoded colors or mismatched focus ring styles

Done when:
- The app feels coherent from page to page
- visual decisions are consistent with the same token system
- the overall project reads as one product, not many separate experiments

---

## Recommended execution order

Work in this sequence:

1. App shell and navigation
2. Token system and foundations
3. Buttons and form controls
4. Cards and content panels
5. Tables and badge patterns
6. Motion final pass
7. Final polish sweep

Do not skip directly to page-specific polishing before the app shell and foundation are in place.

---

## Agent instructions

When completing each task:

- Make only the edits required for that specific task
- Confirm whether the task is part of Inspection, Proposal, Integration, or Token Pass
- If the task requires design decisions, present options first and wait for approval
- Never introduce a competing UI library or a new dependency without approval
- Keep all styling aligned to the existing Tailwind and shadcn-style system already installed in the project

The goal is polished product quality, not speed at the expense of consistency.
