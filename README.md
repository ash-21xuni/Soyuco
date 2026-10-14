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
GEMINI_API_KEY=...
# GEMINI_MODEL=gemini-3.5-flash
SUPABASE_SERVICE_ROLE_KEY=...
# SOYUCOINS_TEST_PAYMENTS=true
```

The Supabase values back auth and cloud sync for entries, todos, habits, events, mood history, transactions, goals, and budget limits. `GEMINI_API_KEY` (a Google AI Studio key) powers the AI Day Planner and the Journal's "AI Assist" using `gemini-3.5-flash`, falling back to newer Flash models when it's overloaded; set `GEMINI_MODEL` to try a different Gemini model first — both routes degrade gracefully with a clear error if it's missing.

`SUPABASE_SERVICE_ROLE_KEY` (server only, never prefix it with `NEXT_PUBLIC_`) lets the server credit Soyucoins; run `supabase/sql/soyucoins.sql` once to create the wallet tables. No payment provider is connected yet, so buying coins is refused unless `SOYUCOINS_TEST_PAYMENTS=true`, which credits packs for free — for local testing only, never on a live site.

## Structure

- `src/app/` — routes: `/` (landing), `/login`, and the authenticated app shell at `/journal`, `/planner`, `/ai`, `/budget`
- `src/app/api/ai/` — server-side routes that call the Gemini API (keeps the key off the client)
- `src/lib/` — React contexts for auth, theme, toast, and each domain's data + Supabase sync (journal, planner, budget)
- `src/components/` — UI components grouped by domain, plus shared modals

## Deploy

Any standard Next.js host (e.g. Vercel) works out of the box — the app has no special build requirements beyond the environment variables above.
