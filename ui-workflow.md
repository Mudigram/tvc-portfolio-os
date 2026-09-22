## UI Reference Workflow — read before writing any UI code

### Stack constraints
- Framework: Next.js 16 (App Router) + React 19
- Styling: Tailwind CSS v4 (`@import "tailwindcss"`), `tw-animate-css`, shadcn Tailwind preset — already installed; do not add a competing styling system
- Design tokens: `src/app/globals.css` (`:root` CSS variables, `@theme inline` radius/color tokens)
- UI primitives: `src/components/ui/` (shadcn-style: badge, button, card, dialog, dropdown-menu, form-select, input, label, select, separator, sheet, sidebar, skeleton, table, tabs, tooltip)
- Layout & shared: `src/components/layout/`, `src/components/shared/`
- Utilities: `src/lib/utils.ts` (`cn()` via `clsx` + `tailwind-merge`)
- Icons: `lucide-react`
- Charts: `recharts` (data viz only — not for general UI)
- Reuse existing primitives before introducing new ones.

### Reference sources
Before implementing a feature, page, or component, browse and inspect these:
- https://ui.shadcn.com
- https://beautifui.dev
- https://beui.dev
- https://rareui.com
- https://transitions.dev
- https://ui-skills.com
- https://coss.com/ui
- https://reui.io/components
- https://designsystemchecklist.com
- https://emilkowal.ski/ui/you-dont-need-animations

Use the browser tool to open live demos, not just static docs — inspect actual markup, computed styles, and motion values (easing, duration), not just descriptions.

### Process (do these as separate steps, produce a plan artifact after step 2)
1. Inspect: pull relevant component patterns (e.g. modal, form inputs, empty states) from the sources above.
2. Propose: present 2–3 candidate approaches per component with source links, before writing code. Wait for my go-ahead.
3. Integrate: once I pick, adapt the chosen code to our existing tokens/stack — don't import a competing UI library or new dependency.
4. Token pass: after components are in, do a separate pass checking spacing scale, easing curves, and motion durations against designsystemchecklist.com and the "you don't need animations" piece — apply consistently project-wide, not just to the one component you built first.

### Guardrails
- No new npm dependencies unless I approve them.
- No inventing a UI pattern not grounded in one of the references above.
- Flag any place you had to guess instead of finding a matching reference.
