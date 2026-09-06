# Soyuco — The Private Sanctuary

A personal journal, day planner, and budget tracker with an AI-assisted planning flow, built with Next.js (App Router), TypeScript, and Supabase.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create `.env.local` at the repo root with:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
```

The Supabase values back auth and cloud sync for entries, todos, habits, events, mood history, transactions, goals, and budget limits. `ANTHROPIC_API_KEY` powers the AI Day Planner and the Journal's "AI Assist" — both routes degrade gracefully with a clear error if it's missing.

## Structure

- `src/app/` — routes: `/` (landing), `/login`, and the authenticated app shell at `/journal`, `/planner`, `/ai`, `/budget`
- `src/app/api/ai/` — server-side routes that call the Anthropic API (keeps the key off the client)
- `src/lib/` — React contexts for auth, theme, toast, and each domain's data + Supabase sync (journal, planner, budget)
- `src/components/` — UI components grouped by domain, plus shared modals

## Deploy

Any standard Next.js host (e.g. Vercel) works out of the box — the app has no special build requirements beyond the environment variables above.
