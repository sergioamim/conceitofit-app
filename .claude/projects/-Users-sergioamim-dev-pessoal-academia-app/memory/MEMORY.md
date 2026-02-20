# Academia App – Memory

## Stack
- Next.js 16 (App Router), React 19, TypeScript, TailwindCSS 4, Shadcn/ui
- Dark-only theme (no light mode toggle needed)
- Fonts: Syne (display/headings) + DM Sans (body), Geist Mono

## Architecture
- Mock data layer: `src/lib/mock/store.ts` (module singleton) + `src/lib/mock/services.ts` (async functions)
- All services return `Promise<T>` → easy to swap for real API calls later
- All pages are `"use client"` (interactive, use useState/useEffect)
- Route group `(app)` for authenticated pages with sidebar layout

## Key files
- `src/lib/types.ts` – all TypeScript types (matches API entities)
- `src/lib/mock/store.ts` – in-memory store, resets on page refresh
- `src/lib/mock/services.ts` – mock service layer
- `src/components/layout/sidebar.tsx` – nav sidebar
- `src/components/shared/status-badge.tsx` – status badges for all entity types
- `src/app/(app)/layout.tsx` – app shell (sidebar + main content)

## Design tokens (CSS variables in globals.css)
- `--color-gym-accent: #c8f135` → lime green (primary CTA)
- `--color-gym-teal: #3de8a0` → success / active
- `--color-gym-danger: #ff5c5c` → error / blocked
- `--color-gym-warning: #ffb347` → warning / pending
- `--color-surface: #16181c`, `--color-surface2: #1e2026`
- Use in Tailwind: `bg-gym-accent`, `text-gym-teal`, `text-gym-danger`, etc.

## Pages built
- `/dashboard` – stats + prospects recentes + pagamentos pendentes
- `/prospects` – CRUD + status progression + converter button
- `/prospects/[id]/converter` – 3-step wizard (dados pessoais → plano → pagamento)
- `/alunos` – list with filters
- `/planos` – card grid + summary table
- `/matriculas` – list with cancel action
- `/pagamentos` – list with "receber" modal

## API reference
- Integration guide: `docs/FRONTEND_INTEGRATION_GUIDE.json`
- MVP HTML prototype: `academia-mvp.html`
- Default tenantId: `550e8400-e29b-41d4-a716-446655440000`
- Base URL: `http://localhost:8080`

## Notes
- Shadcn components used: Button, Card, Badge, Dialog, Input, Select, Table
- `font-display` → Syne; `font-sans` → DM Sans (set in @theme inline)
- Tailwind v4: add custom colors directly in `@theme inline` block
