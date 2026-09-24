# LOOP — Full Project Analysis

> AI-powered Voice-of-Customer (VoC) intelligence platform.
> This document analyzes every file, the architecture, the data flow, and answers 60+ common
> interview / review questions with references to the actual source code.

---

## Table of contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [AI Questions](#3-ai-questions)
4. [Authentication](#4-authentication)
5. [Database](#5-database)
6. [Feedback Flow](#6-feedback-flow)
7. [Dashboard](#7-dashboard)
8. [Security](#8-security)
9. [Performance](#9-performance)
10. [Deployment](#10-deployment)
11. [Challenges](#11-challenges)
12. [Improvements](#12-improvements)
13. [Scenario Questions](#13-scenario-questions)
14. [Explain LOOP in 60 seconds](#explain-loop-in-60-seconds)
15. [Walk through the complete request flow](#walk-through-the-complete-request-flow)
16. [Why did you choose your tech stack?](#why-did-you-choose-your-tech-stack)
17. [How does Gemini integration work?](#how-does-gemini-integration-work)
18. [How do you manage API keys securely?](#how-do-you-manage-api-keys-securely)
19. [Database schema and relationships](#database-schema-and-relationships)
20. [Feedback analysis pipeline](#feedback-analysis-pipeline)
21. [Biggest challenges and how you solved them](#biggest-challenges-and-how-you-solved-them)
22. [Scaling the application](#scaling-the-application)
23. [What would you improve in the next version](#what-would-you-improve-in-the-next-version)

---

# 1. Project Overview

### Q1. What problem does LOOP solve?

LOOP solves the **"voice of the customer is drowning in noise"** problem. Customer feedback
lives scattered across support tickets, app reviews, surveys, sales call notes, and community
posts. Teams cannot read thousands of items, so insight is lost. LOOP **ingests** that raw
feedback, **analyzes** it (sentiment, themes, feature areas) automatically, and surfaces
**trends, analytics, reports, and natural-language answers** so product and CX teams can act
on what customers actually say.

### Q2. Why did you build this project?

To prove a full-stack SaaS product end-to-end: a real multi-tenant web app with
authentication, a role-based workspace model, AI integration (Gemini), a Postgres database,
analytics, and production deployment on Vercel. It demonstrates every layer a real product
needs: landing page → auth → onboarding → core value (ingest + AI analysis) → analytics →
collaboration → reporting.

### Q3. Who is the target audience?

- **Product managers** who need to prioritize features based on customer pain.
- **CX / customer support teams** who want to spot negative spikes early.
- **Executive / leadership** who want weekly Voice-of-Customer summaries.
- Small-to-mid teams that lack a dedicated analytics/data-science function.

### Q4. What makes LOOP different from a simple feedback form?

A form only collects one channel. LOOP is a **multi-channel VoC intelligence hub**:

- Imports feedback from 5+ channels (Support Ticket, App Review, Survey, Community Post,
  Sales Call Note) via manual entry, CSV, or simulated sample data (`lib/importConstants.ts`).
- Runs **automatic AI analysis** (sentiment, sentiment score, theme, feature area, confidence)
  on every item (`lib/feedbackAnalysis.ts`).
- Provides **analytics** (volume over time, channels, response time, theme growth, period
  comparison) — a form cannot.
- **Ask LOOP**: natural-language chat *over your own feedback data*, grounded in real rows
  (`lib/askLoop.ts`).
- Generates **AI-written reports** (`lib/ai.ts`).
- Supports **multi-tenant workspaces with RBAC roles** (Admin/Analyst/Viewer).

### Q5. Explain your project in one minute.

> "LOOP is a Voice-of-Customer analytics platform. A company feeds it customer feedback from
> support tickets, app reviews, surveys, and more — by typing it in, uploading a CSV, or one
> click of simulated sample data. On import, Gemini automatically classifies each item:
> sentiment, a score, a theme, and a product area. The dashboard then shows KPIs and charts —
> feedback volume, sentiment mix, top themes, channels, response time — plus AI-generated
> insights that refresh every 30 seconds. Analysts can drill into themes, generate
> AI-written executive reports, and ask questions in plain English ('what's driving the
> negative sentiment this week?') through a chat interface that grounds every answer in the
> company's actual feedback. It's built on Next.js, PostgreSQL, Prisma, and the Gemini API,
> with NextAuth login, role-based permissions, and multi-tenant workspaces."

---

# 2. Architecture

### Q6. Explain the architecture.

**High-level:** Next.js 16 (App Router) full-stack application on Vercel, PostgreSQL
(Neon/local) accessed through Prisma 7, with Google Gemini for AI, NextAuth v5 for auth.

```
Browser
   │  (React 19 + Tailwind / colocated CSS)
   ▼
Next.js 16 App Router
   ├─ Landing & auth pages        app/page.tsx, app/auth/*, app/api/auth/page.tsx
   ├─ Authenticated UI            app/(dashboard)/*  ← async Server Components
   │    ├─ pages query Prisma DIRECTLY (lib/*Queries.ts)  [server-rendered]
   │    └─ interactive parts are Client Components (…Client.tsx)
   │         └─ fetch REST API routes (app/api/*)
   ├─ API route handlers          app/api/*  (27 route.ts files)
   │    └─ auth guards: lib/workspaceAuth.ts, lib/importAuth.ts, lib/permissions.ts
   ├─ Domain logic / lib          lib/*  (queries, AI, CSV, validations, mail)
   │    └─ Gemini                   @google/generative-ai (lib/geminiClient.ts)
   │    └─ Prisma Client            app/generated/prisma (via lib/prisma.ts)
   ▼
PostgreSQL  ──Prisma ORM──▶  lib/prisma.ts (singleton + PrismaPg adapter)
```

**Key architectural decision:** a **hybrid rendering split**.

1. **Server Components read data directly with Prisma** for first paint (dashboard stats,
   themes, reports lists, etc.) — no client round-trip on initial load.
2. **Client Components** handle *all* interactivity — streaming, infinite scroll, modals,
   CSV upload — and talk to the **REST API route handlers** (`app/api/*`), which are the only
   place mutations happen.
3. Every tenant-scoped route uses `requireWorkspaceUser()` / `requireWorkspacePermission()`
   (`lib/workspaceAuth.ts`) so the `workspaceId` is always re-loaded from the DB — never
   trusted from the client.

### Q7. Why did you choose Next.js instead of React?

- **Server Components + Route Handlers in one codebase** — pages, APIs, and auth in a single
  deployable; no separate backend.
- **File-based routing** for the App Router — clean `app/(dashboard)/`, `app/api/` structure.
- **Middleware/proxy routing** for route protection (`proxy.ts`) with zero extra infra.
- **Streaming responses** are first-class (`app/api/ask-loop/ask/route.ts` returns a
  `ReadableStream`).
- **Vercel deployment** is the natural host for Next.js — `vercel.json` wires the build.
- React alone would need a separate Express/Fastify backend, CORS config, and an extra deploy.

### Q8. Why PostgreSQL?

- **Relational data with real relationships** — Workspace→User→Feedback→Theme→Report and the
  many-to-many `FeedbackTheme` join table fit SQL perfectly.
- **Multi-tenant isolation** via foreign keys (`workspaceId` everywhere) + composite indexes.
- **Mature features** — enums (`Role`, `Sentiment`, `FeedbackStatus`), transactions, partial
  unique constraints (used by `Theme @@unique([workspaceId, name])`).
- **Managed hosting (Neon)** — pooled + unpooled connection URLs, serverless-friendly
  (see `prisma.config.ts` and `.env.example`).
- **Query performance at scale** — indexed lookups, `count()`, `groupBy` for analytics.

### Q9. Why Prisma?

- **Type-safe queries** — schema in `prisma/schema.prisma` generates a typed client into
  `app/generated/prisma` (`lib/prisma.ts` re-exports it).
- **Migrations as code** — `prisma/migrations/` (3 migrations) with `migrate deploy` for
  CI/prod, `migrate dev` for local iteration.
- **Relations handled declaratively** — `include: { themes: { include: { theme } } }`
  makes joins trivial (e.g. `lib/analyticsQueries.ts`).
- **Transaction support** — `prisma.$transaction([...])` used for chat messages
  (`lib/askLoopQueries.ts`) and batch feedback inserts (`lib/feedbackImport.ts`).
- **Postgres adapter (`@prisma/adapter-pg`)** — modern Prisma 7 driver-adapter approach
  (`lib/prisma.ts`).

### Q10. Why TypeScript?

- **End-to-end type safety**: the Prisma-generated client types every DB query result;
  Zod schemas (`lib/validations.ts`) type every API request body.
- **Catches bugs at compile time** — interfaces like `FeedbackAnalysis`,
  `RetrievedContext`, `VoCReportContent` make the AI layer predictable.
- **Better refactoring** — shared types across server pages, API routes, and client
  components (`app/generated/prisma`, `lib/askLoop.ts`, `types/next-auth.d.ts`).
- **Maintainability** — the codebase is ~5k lines across 100+ files; TS keeps it sane.

### Q11. Why Gemini instead of OpenAI or Claude?

- **Cost / free tier** — Gemini Flash models offer a generous free tier, ideal for a
  portfolio project and per-feedback analysis.
- **Streaming** — `generateContentStream` maps perfectly to the Ask LOOP streaming UI
  (`lib/askLoop.ts`).
- **`@google/generative-ai` SDK is lightweight** and easy to wrap with retry/backoff
  (`lib/geminiRetry.ts`).
- **Env-name fallback design** — `lib/geminiClient.ts` reads `GEMINI_API_KEY` first and
  falls back to `ANTHROPIC_API_KEY`, so the abstraction could be pointed at another
  provider with minimal change.
- **Model chosen:** `gemini-3.6-flash` (default, overridable via `GEMINI_MODEL`) — fast,
  cheap, and adequate for JSON classification + chat. Note: `gemini-2.5-flash` is 404 for
  new keys, so the model is config-driven (`lib/geminiClient.ts`).

---

# 3. AI Questions

### Q12. How does Gemini work in your project?

Three distinct AI features, all in `lib/`:

| Feature | File | Call |
|---|---|---|
| Feedback analysis on import | `lib/feedbackAnalysis.ts` | `analyzeFeedback()` / `analyzeFeedbackBatch()` → `model.generateContent(prompt)` |
| VoC report generation | `lib/ai.ts` | `generateVoCReport()` → `model.generateContent(prompt)` |
| Ask LOOP chat (RAG) | `lib/askLoop.ts` | `streamAskLoopAnswer()` → `model.generateContentStream(prompt)` |

All three share:
- `lib/geminiClient.ts` — `createGeminiModel()` / `createGeminiModelOptional()`.
- `lib/geminiRetry.ts` — `withRetry()` / `withStreamRetry()` for 429/5xx with exponential
  backoff.

### Q13. What prompt do you send?

**Feedback analysis** (`lib/feedbackAnalysis.ts:126`):
```
You are a customer feedback analyst for a SaaS product called LOOP.
Analyze this feedback and return ONLY valid JSON (no markdown):
{ "sentiment", "sentimentScore", "theme", "featureArea", "confidence" }
Channel: <channel>
Rating: <rating>/5
Feedback: """<content up to 2000 chars>"""
```

**Report generation** (`lib/ai.ts:96`): a long prompt embedding **pre-computed stats**
(sentiment counts + %, top themes, channel distribution, sample quotes) plus
template instructions, asking for a strict JSON object
(`executiveSummary`, `sentimentSummary`, `themeInsights`, `recommendations`).

**Ask LOOP** (`lib/askLoop.ts`): composed of
1. `SYSTEM_PREAMBLE` — role ("LOOP AI") + grounding rules ("never invent statistics").
2. `WORKSPACE DATA SNAPSHOT` — summary stats, sentiment breakdown, top themes,
   and up to 20 matched feedback quotes.
3. `CONVERSATION SO FAR` — last 8 turns.
4. `New question from the user: """..."""`.

### Q14. What information is included in the prompt?

Ask LOOP prompt (`lib/askLoop.ts` `formatContext`):
- **Summary stats**: total feedback, resolution rate, avg response time, avg satisfaction,
  negative share.
- **Sentiment breakdown** with percentages.
- **Top themes** with mention counts and week-over-week change.
- **Matched feedback rows** (up to 20, truncated at 220 chars): `[SENTIMENT, theme, channel, date] "content"`.
- Last 8 conversation turns.
- The new question.

Report prompt includes pre-computed counts/percentages/theme mentions/channel distribution,
and sample positive/negative quotes. Feedback-analysis prompt includes channel, rating, and
the content.

### Q15. How do you reduce token usage?

- **Truncation everywhere**:
  - Feedback content sliced to 2000 chars for AI (`lib/feedbackAnalysis.ts:139`).
  - Feedback quotes sliced to 220 chars in Ask LOOP context (`lib/askLoop.ts:185`).
  - Only **top 20** matched rows and **top 6 themes** go into the Ask LOOP prompt.
  - Only the **last 8 turns** of history are included (`lib/askLoop.ts:242`).
- **Pre-computed stats** — the report prompt never sends raw feedback; it sends numbers the
  app already computed (`lib/ai.ts` `preComputeStats`).
- **Heuristic mode for bulk imports** — `analyzeFeedbackBatch` uses keyword heuristics when
  `items.length > 40` or `fast: true` (`lib/feedbackAnalysis.ts:190`), skipping Gemini
  entirely for large CSV imports.
- **Keyword-based retrieval** instead of embedding the whole corpus (`lib/askLoop.ts`).

### Q16. How do you manage the Gemini API key?

- Stored as an **environment variable** `GEMINI_API_KEY` in `.env` locally and in the Vercel
  project settings for production — never in code or client bundles.
- `.env` is git-ignored; `.env.example` documents the required vars with placeholder values.
- `lib/geminiClient.ts` reads it at runtime **only on the server** (`createGeminiModel` is
  only called from server libs / API routes).
- There is also a fallback chain `GEMINI_API_KEY || ANTHROPIC_API_KEY` and a
  `createGeminiModelOptional()` that returns `null` when no key is set, letting AI features
  degrade to heuristics.

### Q17. How do you prevent users from seeing your API key?

- The key only exists on the **server**. `lib/geminiClient.ts` reads `process.env` and is
  imported exclusively by server-side modules (`lib/ai.ts`, `lib/askLoop.ts`,
  `lib/feedbackAnalysis.ts`) that run inside API route handlers.
- Nothing with `NEXT_PUBLIC_` prefix exposes the key — the only `NEXT_PUBLIC_*` variable is
  `NEXT_PUBLIC_APP_URL` (used for invite links).
- Client components never import `geminiClient`; they only hit `/api/*` routes, and the AI
  itself runs in route handlers.
- `.env` is in `.gitignore`, and the `.env.example` ships placeholders only.

### Q18. What happens if Gemini is unavailable?

Every AI path has a **graceful fallback**:

- **Import analysis**: `analyzeFeedback` catches errors and returns `heuristicAnalyze()`
  (keyword sentiment + theme scoring); if no API key at all, `createGeminiModelOptional()`
  returns `null` and heuristics are used directly (`lib/feedbackAnalysis.ts`).
- **Reports**: `generateVoCReport` has a try/catch that returns a **stats-only report** with
  pre-computed numbers and generic recommendations when the AI call throws
  (`lib/ai.ts:172`).
- **Ask LOOP**: `withStreamRetry` retries transient failures; if streaming itself fails the
  route returns an inline fallback message and persists it (`app/api/ask-loop/ask/route.ts:51`).
- **Retry**: `lib/geminiRetry.ts` retries 429/5xx up to 3 times with exponential backoff
  (5s base → 30s cap) and honors the `retryDelay` field in Gemini error details.

### Q19. Which Gemini model are you using and why?

`gemini-3.6-flash` (default, `lib/geminiClient.ts:9`), overridable via the `GEMINI_MODEL`
env var. Rationale:
- **Flash class** = fast + cheap, ideal for per-item classification and streaming chat.
- Config-driven because Google retires model IDs (the code notes `gemini-2.5-flash` 404s for
  new keys — `.env.example` documents alternatives like `gemini-3.5-flash`).

### Q20. How long does one AI request take?

Not hardcoded; depends on model + payload. Observations from the design:

- **Feedback analysis**: a single `generateContent` on a short JSON prompt typically
  returns in **1–3 seconds**; bulk imports use a concurrency pool of 4
  (`lib/feedbackAnalysis.ts:195`).
- **Reports**: one `generateContent` on a stats-packed prompt, **3–10 seconds**, before the
  stats-only fallback is even needed.
- **Ask LOOP**: **streaming** — first token typically within **1–4 seconds** (retrieval + DB
  queries happen first), then tokens arrive incrementally, so perceived latency is low.
- When **Gemini is down or rate-limited**, `geminiRetry` adds up to `5s→10s→20s` delays
  before falling back.

---

# 4. Authentication

### Q21. How does login work?

Two providers in NextAuth v5 (`lib/auth.ts`):

1. **Credentials (email/password)**:
   - `authorize()` looks up the user by email, rejects if `!isActive` or no `passwordHash`,
     then `bcrypt.compare()` the password.
   - Passwords are hashed with **bcrypt cost 12** at registration (`app/api/register/route.ts`
     → `hash(password, 12)`) and on invite acceptance.
2. **Google OAuth**:
   - The `signIn` callback auto-creates a `User` row if the email is new (with
     `emailVerified` set), otherwise links to the existing row.

Registration is a separate public endpoint `POST /api/register` (validated by
`RegisterSchema`, 409 if email exists). Sign-up/sign-in UI lives in
`app/components/auth-form.tsx`, served at `/api/auth` (`app/api/auth/page.tsx`).

### Q22. Why NextAuth?

- **Battle-tested standard** for Next.js auth; v5 is the current API.
- **JWT strategy** is stateless and serverless-friendly.
- **Provider support out of the box** (Google OAuth + Credentials).
- Callbacks to enrich the session with `id` and `role` (`lib/auth.ts:72`).
- The Prisma adapter covers `Account`/`Session`/`VerificationToken` tables when needed,
  though the app runs JWT sessions.

### Q23. Why JWT?

- **Serverless/stateless**: no session store to query on every request; the token carries
  `id` + `role` (`lib/auth.ts:72`).
- **Cost & latency**: fewer DB round-trips per request than a database-session strategy.
- The session is still used to look up the *authoritative* `workspaceId` from Postgres on
  every tenant route (defense in depth, `lib/workspaceAuth.ts`).

### Q24. Where is the session stored?

- **JWT in a cookie**: `authjs.session-token` (dev) / `__Secure-authjs.session-token` (prod,
  HTTPS). The `proxy.ts` reads exactly these two cookie names.
- The JWT payload holds `id` and `role`; `expires` defaults per NextAuth.
- Chat history etc. is stored in Postgres (`AskLoopConversation`/`AskLoopMessage`), not in
  the session.

### Q25. How do you protect routes?

**Three layers:**

1. **Middleware proxy gate** (`proxy.ts`): checks for the session cookie on all protected
   paths (`/dashboard`, `/analytics`, `/ask-loop`, `/feedback-inbox`, `/reports`, `/settings`,
   `/team`, `/themes`, `/profile`, `/workspace`) and redirects to `/api/auth` if missing.
2. **Server Component guard**: `app/(dashboard)/layout.tsx` calls `auth()` and
   `redirect("/api/auth")` if there is no session — this protects even if middleware is
   bypassed. It is `force-dynamic`.
3. **API route guards**: every tenant route calls `requireWorkspaceUser()` /
   `requireWorkspacePermission()` (`lib/workspaceAuth.ts`) which re-loads the user from the
   DB and returns 401/400/403 `NextResponse`s. Permission matrix is in
   `lib/permissions.ts` (e.g. `team:manage` = ADMIN only).

---

# 5. Database

### Q26. Explain your database schema.

Full schema in `prisma/schema.prisma`. Models:

| Model | Purpose |
|---|---|
| `Workspace` | Tenant container; users/feedback/themes/reports/invitations/chat |
| `User` | Identity + `role` (ADMIN/ANALYST/VIEWER) + `workspaceId`, `isActive`, `passwordHash` |
| `Account`, `Session`, `VerificationToken` | NextAuth provider/session tables |
| `Feedback` | The core row: content, channel, sourceRef, sentiment, sentimentScore, status, responseTime, satisfaction, featureArea, timestamps, workspace + importedBy FKs |
| `Theme` | Topic inventory per workspace; unique `[workspaceId, name]` |
| `FeedbackTheme` | Join table (feedback ↔ theme) with `confidence` |
| `Report` | Generated report documents (status DRAFT/SCHEDULED/COMPLETED, `contentJson`) |
| `Invitation` | Team invites (token, role, expiry, acceptedAt) |
| `AskLoopConversation` / `AskLoopMessage` | Per-user Ask LOOP chat history |
| `Embedding` | (Future RAG) feedback embeddings, `feedbackId` unique, vector stored as text |
| `Conversation` / `Message` | (Alternate/legacy chat model with citations) |

### Q27. How are users related to feedback?

- `User.workspaceId → Workspace` (nullable, `onDelete: SetNull`).
- `Feedback.workspaceId → Workspace` (`onDelete: Cascade`).
- `Feedback.importedById → User` (relation name `"ImportedBy"`, `onDelete: SetNull`) so
  feedback survives user removal.
- Users access feedback **only through the shared workspace** — every query in
  `lib/*Queries.ts` filters `where: { workspaceId }`, and `workspaceScope()` in
  `lib/workspaceAuth.ts` enforces this pattern.

### Q28. Why use relations?

- **Referential integrity** — `onDelete` policies handle workspace/user deletion
  (cascade or set-null) safely.
- **Single-query fetching** — `include: { themes: { include: { theme } } }` pulls nested
  data in one SQL join instead of N+1 hand-rolled queries.
- **Enforced isolation** — the `workspaceId` foreign key is the backbone of multi-tenancy;
  a query can never leak across companies.
- **Composability** — theme mention counts, sentiment-per-theme, growth-over-time all
  derive from the `FeedbackTheme` relation (`lib/analyticsQueries.ts`).

### Q29. Explain Prisma migrations.

Three migrations in `prisma/migrations/`:
1. `20260712142554_init_with_feedback_models` — initial schema (workspaces, users, auth
   tables, feedback, themes, reports).
2. `20260715170219_feedback_import_fields` — import metadata (sourceRef, featureArea,
   importedBy, satisfaction, responseTime, indexes).
3. `20260718103600_add_ask_loop_and_rag_models` — Ask LOOP conversations/messages,
   Embedding, Conversation/Message (RAG support).

Workflow: `pnpm db:migrate:dev` creates migrations locally from `schema.prisma` changes;
`pnpm db:migrate` (i.e. `prisma migrate deploy`) applies them in CI/prod. `prisma.config.ts`
points migrations at the unpooled `DATABASE_URL_UNPOOLED` for Neon.

### Q30. How do you prevent duplicate records?

- **DB-level unique constraints**:
  - `User.email @unique` → `POST /api/register` returns 409 on duplicates.
  - `Invitation.token @unique` (32-byte crypto-random hex).
  - `Theme @@unique([workspaceId, name])`.
  - `FeedbackTheme @@id([feedbackId, themeId])` → `upsert` used everywhere
    (`lib/feedbackImport.ts:97`).
- **Duplicate-invite guard**: `POST /api/team/invite` rejects if an active invitation for
  that email/workspace already exists (`app/api/team/invite/route.ts`).
- **Upsert pattern**: theme linking uses `prisma.feedbackTheme.upsert` with the composite
  key; `resolveThemeId` also handles race conditions by re-fetching after a failed create
  (`lib/feedbackImport.ts:69`).
- Imported CSV rows are treated as distinct records (no natural-key dedupe) — a deliberate
  trade-off, but `sourceRef` is captured so the UI could dedupe by external ID later.

---

# 6. Feedback Flow

### Q31. What happens after a user submits feedback?

**Manual flow** (`POST /api/feedback/manual` → `importSingleFeedback`):
1. Auth + permission check (`feedback:manual` or `feedback:import`).
2. Zod-validate the body; validate `channel` against the allowlist.
3. `prisma.feedback.create` the row (defaults: `NEW`, `NEUTRAL`, score 0).
4. `analyzeFeedback()` calls Gemini → sentiment/score/theme/featureArea/confidence.
5. `applyAnalysis()` updates the feedback and `upsert`s the `FeedbackTheme` join
   (auto-creating the `Theme` if new).
6. The API returns the analysis result, which the UI renders (sentiment badge, theme,
   feature area, confidence) in the modal, then `router.refresh()` updates the page.

### Q32. How does CSV upload work?

`POST /api/feedback/import` (`app/api/feedback/import/route.ts`):
1. Accepts `multipart/form-data` (field `file`) or raw text; **5 MB** limit.
2. Extension/type validation (`.csv`).
3. `parseFeedbackCsv(csvText, { maxRows: 5000, requireChannel: true })`
   (`lib/csvParse.ts`) — hand-rolled RFC-4180-ish parser (handles quotes, escaped quotes,
   CRLF, BOM).
4. Flexible header mapping: `normalizeHeader()` + `HEADER_ALIASES` maps names like
   `feedback`, `message`, `comment` → `content`; `source`/`platform` → `channel`;
   `rating`/`csat`/`score` → `satisfaction`; `date`/`timestamp` → `createdAt`, etc.
5. Rows missing `content` (or `channel`) are **skipped** and counted as failures.
6. Valid rows → `importFeedbackBatch()` → AI analysis (batch, concurrency 4, heuristic if
   >40 items) → inserts in **25-row transactions** → links themes.
7. Response includes `imported`, `successful`, `failed`, `analysisComplete`, and up to 50
   warnings. UI shows a progress bar (fake to 88%, then waits for the response) in
   `ImportFeedbackClient.tsx`.

### Q33. How do you validate uploaded files?

- **Size**: 5 MB max (`MAX_FILE_BYTES`, checked for both multipart and raw text).
- **Type**: extension must be `.csv` OR the MIME type must include csv/text.
- **Parsing**: structural validation per row — a header row + ≥1 data row is required; a
  `content` column must be present (recognized aliases listed in the error).
- **Field coercion**: satisfaction must parse to 0–5, dates must parse, sentiment/status are
  mapped from synonyms, and out-of-range values are ignored with a warning
  (`lib/csvParse.ts`).
- **Row cap**: only the first 5000 rows are imported (with a warning).

### Q34. What happens if the CSV contains invalid rows?

- Rows missing `content`/`channel` are **skipped**, counted in `skipped`, and each gets an
  error like `Row 3: missing content` (`lib/csvParse.ts:279`).
- If **zero** valid rows → 400 with `{ error, details, failed, imported, successful }`.
- If some rows are valid: the valid ones import and the response returns `failed` count +
  up to 50 warnings, so the UI shows a partial-success summary (`message` like
  "42 Records Imported · 40 Successful · 2 Failed").
- A batch insert failure triggers a **row-by-row fallback** with per-row error capture
  (`lib/feedbackImport.ts:277`), including a special message for stale-Prisma-client
  "Unknown argument" errors.

---

# 7. Dashboard

### Q35. How are analytics generated?

Analytics are **computed on the server from live Postgres data** — no AI, no mock data:

- `lib/dashboardQueries.ts`: KPI cards (`getDashboardStats` — 18 parallel Prisma calls
  computing this-week vs last-week deltas), recent feedback (`getRecentFeedback`), and
  rule-based `getDashboardInsights` (weekly summary, top issue theme, recommendation,
  risk alert, positive highlight).
- `lib/analyticsQueries.ts`: sentiment breakdown (counts → percentages), volume over time
  (grouped by day), channel distribution (`groupBy`), top themes (mention counts +
  week-over-week change), theme growth over time (8 weekly buckets), period comparison
  (current vs prior N days with % deltas), response time distribution (buckets).
- Pages (`app/(dashboard)/dashboard/page.tsx`, `analytics/page.tsx`) run these in parallel
  via `Promise.all` inside async Server Components.

### Q36. Are dashboard charts real-time?

- **Not WebSocket real-time.** The page is `force-dynamic`, so every full page load queries
  fresh data.
- The **AI Insights panel auto-refreshes every 30 seconds** via `setInterval` polling
  `GET /api/dashboard/insights` (`app/components/insights/AIInsightsPanel.tsx`), with a
  manual refresh button and a "Live Analysis" badge + "Updated Xs ago" timestamp.
- Everything else updates on navigation/`router.refresh()`.

### Q37. Which chart library did you use?

**Recharts 2** (`recharts ^2.15.4`) for 6 charts in `app/components/chats/`:
- `FeedbackVolumeChart.tsx` — `AreaChart`/`Area` (gradient)
- `SentimentDonutChart.tsx` — `PieChart`/`Pie`/`Cell` donut
- `TopThemesChart.tsx` and `FeedbackChannelsChart.tsx` — `BarChart`/`Bar`
- `ResponseTimeChart.tsx` — `BarChart`/`Bar`
- `ThemeGrowthTracker.tsx` — multi-series `AreaChart`/`Area`
- `PeriodComparisonCard.tsx` is hand-rolled CSS bars (not recharts).

### Q38. Why choose that library?

- **React-native API** and declarative components that match JSX conventions.
- **Lightweight and flexible** — no wrapper/framework needed; responsive containers.
- **Wide variety** of chart types (area/bar/pie) covering all dashboard needs.
- **Customization** via gradients, `Cell` colors, and tooltips is straightforward.
- Familiar enough for rapid iteration (common choice in Next.js apps).

---

# 8. Security

### Q39. How do you protect API routes?

- **Every tenant route authenticates** via `auth()` → `requireWorkspaceUser()` /
  `requireWorkspacePermission()` (`lib/workspaceAuth.ts`), returning 401/403/400.
- **Permission matrix** in `lib/permissions.ts`: e.g. team mutations require `team:manage`
  (ADMIN only); CSV/manual import requires `feedback:import` / `feedback:manual`.
- **Workspace scoping on every query** — `where: { workspaceId }` everywhere;
  `requireSameWorkspaceMember` prevents cross-company team operations.
- **Public routes are limited and intentional**: `/api/register`, `/api/team/invite/accept`
  (token-based), and the GET of `/api/feedback/simulate`.
- **Proxy gate** (`proxy.ts`) additionally blocks unauthenticated page access.
- **Secret keys** are never exposed to the client (see Q17).

### Q40. Where are secrets stored?

- Locally: `.env` (git-ignored). Template: `.env.example`.
- Production: **Vercel environment variables** (project settings) — `AUTH_SECRET`,
  `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `GEMINI_API_KEY`, `NEXT_PUBLIC_APP_URL`, SMTP vars.
- `AUTH_SECRET` is generated with `openssl rand -hex 32`.
- Migrations use the unpooled URL via `prisma.config.ts`; the app uses the pooled URL.

### Q41. How do you validate user input?

- **Zod schemas** in `lib/validations.ts`, parsed by `parseBody()` which returns a 400
  `NextResponse` on failure:
  - `RegisterSchema` (email, password 8–128), `ProfileUpdateSchema`, `CreateWorkspaceSchema`,
    `InviteMemberSchema` (email lowercased/trimmed), `AcceptInviteSchema`,
    `ManualFeedbackSchema` (rating coerced to 1–5 or null, date parsed), `InboxQuerySchema`
    (skip/take coerced + clamped), `AskLoopSchema` (1–2000 chars, trimmed),
    `GenerateReportSchema` (start ≤ end refinement), `UpdateReportSchema`, `ReportsQuerySchema`.
- **Channel allowlist** — manual import only accepts the 5 known channels
  (`app/api/feedback/manual/route.ts:26`).
- **Truncation on write** — content ≤ 10k, channel ≤ 100, labels ≤ 200 (`lib/feedbackImport.ts`).
- **Server-side coercion of query params** via `z.coerce` for pagination.

### Q42. How do you prevent SQL Injection?

- **Prisma ORM with parameterized queries** everywhere — no raw SQL in the app (the only
  `.sql` files are migrations).
- Text search uses Prisma `contains` with `mode: "insensitive"`, which is parameterized
  (`lib/reportsQueries.ts:27`, `lib/askLoop.ts:126`).
- User strings are always passed as data, never interpolated into queries.
- `scripts/check-neon-schema.mjs` only *reads* schema metadata.

### Q43. How do you prevent unauthorized access?

1. **Authentication** (NextAuth JWT + bcrypt passwords + Google OAuth).
2. **Route protection** (proxy + server-component guard + API guards).
3. **Role-based authorization** (`lib/permissions.ts` matrix, enforced server-side).
4. **Tenant isolation** — every read/write is scoped by `workspaceId`; session claims are
   never trusted for `workspaceId` (re-fetched from DB, `lib/workspaceAuth.ts:8`).
5. **Same-workspace verification** for team actions (`requireSameWorkspaceMember`).
6. **Activity gating** — inactive users (`isActive: false`) cannot sign in
   (`lib/auth.ts:28`) and admins can deactivate members (`PATCH /api/team/[userId]/status`).
7. **Defense in depth on envs** — `/api/workspace/seed` is hard-blocked in production (404).

---

# 9. Performance

### Q44. How did you optimize performance?

- **Parallel queries** — dashboard and analytics pages issue 10–18 Prisma calls concurrently
  via `Promise.all` (`lib/dashboardQueries.ts:62`, `lib/analyticsQueries.ts`).
- **Composite indexes** on hot paths — `Feedback @@index([workspaceId, createdAt])`,
  `@@index([workspaceId, sentiment])`, etc. (`prisma/schema.prisma:137`).
- **Limits everywhere** — `take` on recent feedback, top themes, matched rows,
  conversations (50), recent turns (12).
- **Batch inserts in transactions** (25 rows) with a row-by-row fallback
  (`lib/feedbackImport.ts:230`).
- **Heuristic fast-path for large imports** (>40 items skips Gemini).
- **Pagination** — inbox uses `skip`/`take` with infinite scroll; reports use page/pageSize.
- **Streaming** for Ask LOOP so users see the first token quickly.
- **Client-size trimming** — feedback table debounces search (250ms) and the AI insights
  poll only every 30s.
- **`force-dynamic` + no client round-trip** for first paint (server-rendered data).

### Q45. What if one million feedback records exist?

Current design is *ok* for 1M rows but not ideal:

- **Works**: composite indexes keep `workspaceId + createdAt/sentiment` lookups fast;
  counts are O(index) with Postgres; pagination is bounded by `skip/take`.
- **Weak points**:
  1. `skip`/`take` pagination gets slower with deep offsets (see Q46).
  2. `getFeedbackVolumeOverTime` loads **all** `createdAt` rows in the window
     (`lib/analyticsQueries.ts:91`) — that's 1M rows for all-time.
  3. Theme metrics load every `FeedbackTheme` relation into memory
     (`lib/analyticsQueries.ts:137`).
  4. `getAnalyticsSummary` loads every `responseTime`/`satisfaction` value in the window
     instead of aggregating in SQL.
- **What I'd change**: use SQL `GROUP BY`/`AVG`/date_trunc aggregations, count-based
  queries, and add a `date_trunc`-backed day index.

### Q46. How would you paginate results?

For large datasets I would replace **offset/skip** pagination with **keyset (cursor)
pagination**:

```ts
// Keyset on (createdAt, id) — O(log n), stable under inserts
prisma.feedback.findMany({
  where: {
    workspaceId,
    ...(cursor ? { OR: [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: cursor.id } },
    ] } : {}),
  },
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  take: 25, // take + 1 to detect hasMore
})
```

This avoids the "deep offset" cost of `skip: 900_000`. The inbox endpoint already accepts
`skip`/`take` (`InboxQuerySchema`), so switching to cursor keys is a localized change in
`app/api/feedback/inbox/route.ts` + `FeedbackTable.tsx`.

### Q47. How would you cache AI responses?

**Options, in increasing sophistication:**
1. **DB cache table** — keyed by `(workspaceId, promptHash)`; reuse identical Ask LOOP
   questions. The `Embedding` model already exists as a natural home for per-feedback AI
   results, but Gemini results are already stored on `Feedback` itself (sentiment, theme).
2. **In-process LRU** — for hot dashboard/report prompts.
3. **Upstash Redis / Vercel KV** — TTL cache (`key = report:ws:{id}:{period}`) for report
   generation, invalidated when feedback is imported.
4. **Cache the expensive analytics, not the AI** — a materialized day-bucket table for
   sentiment/theme counts so Ask LOOP retrieval and dashboards don't rescan raw rows.
5. **Hedging within a request** — reuse `RetrievedContext` when the same question is asked
   in a conversation (already done implicitly via history).

### Q48. How would you reduce database queries?

- **Parallelize independent reads** (already done in query modules via `Promise.all`).
- **Use `groupBy`/aggregates instead of loading rows** — e.g. `AVG(responseTime)`,
  `date_trunc` for volume, instead of fetching every value
  (`lib/analyticsQueries.ts` currently loads rows for averages).
- **Select only needed columns** (`select:`) — already used in most places.
- **Batch + transactions** — already done for imports and chat messages.
- **Denormalize hot counters** — e.g. a `workspace_stats` table refreshed after imports.
- **N+1 elimination** — replace per-row `resolveThemeId` calls with a batch cache
  (already cached per-batch in `lib/feedbackImport.ts:217`).
- **Persistent connection pooling** via Neon pooled URL (`DATABASE_URL`) rather than a
  connection-per-request.

---

# 10. Deployment

### Q49. Where is the project hosted?

- **Vercel** for the Next.js app (`vercel.json` sets `pnpm install` + `prisma generate &&
  next build`).
- **PostgreSQL**: local for dev; **Neon** (serverless Postgres) is the documented production
  choice with pooled (`DATABASE_URL`) and direct (`DATABASE_URL_UNPOOLED`) URLs.
- Git remote: `https://github.com/its-m4npreet/Loop.git`.

### Q50. How do you configure environment variables?

- `.env` for local (copy of `.env.example`), loaded by Next.js automatically and by
  `dotenv/config` in `prisma.config.ts` and `prisma/seed.ts`.
- Vercel project **Environment Variables** for production (`AUTH_SECRET`, `DATABASE_URL`,
  `DATABASE_URL_UNPOOLED`, `GEMINI_API_KEY`, `NEXT_PUBLIC_APP_URL`, SMTP_*).
- `AUTH_SECRET` from `openssl rand -hex 32`; never committed (`.env` is git-ignored).

### Q51. How do you connect production to PostgreSQL?

- Runtime: `DATABASE_URL` (Neon pooled) → `lib/prisma.ts` creates
  `new PrismaPg({ connectionString: process.env.DATABASE_URL! })`.
- Migrations/DDL: `DATABASE_URL_UNPOOLED` (direct host) → `prisma.config.ts`:
  `const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL`.
- Deploy flow: run `pnpm db:migrate` (`prisma migrate deploy`) against the production
  database (from CI or a one-off job), then deploy the app.

### Q52. What difficulties did you face during deployment?

Evidence in the code of the real pain points:

- **Neon vs local connection mismatch** — troubleshooting table documents shell env
  overriding `.env`; the fix was explicit pooled/unpooled split in `prisma.config.ts`.
- **Stale Prisma client on Vercel/HMR** — "Unknown argument" errors after schema changes;
  mitigated with a version-guarded global singleton (`lib/prisma.ts`) and a friendly import
  error message (`lib/feedbackImport.ts:321`).
- **Model deprecation** — `gemini-2.5-flash` returning 404 for new keys; solved by making
  `GEMINI_MODEL` configurable with documented fallbacks.
- **Seed destructive** — seed wipes tables; production checklist warns never to run
  `db:seed` against prod.
- **SSR + serverless** — forcing dynamic rendering for authenticated pages (`force-dynamic`)
  to avoid stale/cached pages.

---

# 11. Challenges

### Q53. What was the hardest bug?

The **stale Prisma client** problem. After adding Ask LOOP models, the dev server kept a
PrismaClient built from the old generated schema, producing opaque "Unknown argument"
errors during imports. Fix: a version-guarded global singleton (`lib/prisma.ts`) that
disconnects and rebuilds the client when the schema version changes or known models are
missing, plus a user-facing error message in `lib/feedbackImport.ts` telling them to restart
the dev server.

### Q54. What was the biggest technical challenge?

**Multi-tenant security + RAG without a vector DB.** Keeping every query scoped to a
workspace (and every chat conversation scoped to a *user within* a workspace) required the
`requireWorkspaceUser`/`requireWorkspacePermission`/`workspaceScope` discipline, while
retrieval-augmented generation had to work **without an embeddings store** — solved with
regex/stopword-based NL→filter extraction (window, sentiment, keywords) pulling real rows
straight from Postgres (`lib/askLoop.ts`).

### Q55. What feature took the longest?

**Ask LOOP** — it layers three hard things: (1) a retrieval pipeline (date/sentiment/keyword
extraction + SQL), (2) streaming Gemini to the client with a hand-rolled `ReadableStream`
reader and markdown-light renderer, and (3) per-user conversation persistence in Postgres
with full history CRUD. This is visible in its 3 migrations, 4 API routes, 4 lib modules,
and the 581-line client component.

### Q56. If you started again, what would you change?

1. **Start with SQL aggregates** for analytics instead of loading rows into Node for
   averages/buckets — would scale from day one.
2. **Use real embeddings** (e.g. `Embedding` model already exists) + Postgres `pgvector`
   from the start instead of keyword retrieval.
3. **Keyset pagination** for the inbox from the start.
4. **Single, typed API layer** — some routes use `requireWorkspaceUser`, some use `auth()`
   inline; I'd standardize.
5. **Adopt one UI kit / styling system** earlier (mix of Tailwind for landing and colocated
   CSS for dashboard).
6. **Add tests early** — currently no test suite exists; I'd add Vitest + unit tests for
   `csvParse`, `feedbackAnalysis` heuristics, and `askLoop` retrieval.

---

# 12. Improvements

### Q57. What features would you add next?

- **Integrations** (Zendesk, Intercom, Slack, Jira) — the `Feedback` row already models
  `sourceRef` + `channel`, and the README lists integrations as the top ask; the schema's
  `Message.citationsJson` hints at citation support.
- **Email feedback ingestion** — a `POST /api/feedback/ingest` endpoint accepting webhooks/
  email bodies and mapping them to channels.
- **Multilingual analysis** — pass language hints to Gemini; add language column.
- **Predictive analytics** — trend forecasting (volume, churn risk) using stored time series.
- **Team collaboration** — mentions, shared comments on feedback items, assignees.
- **AI-generated action items** — convert report recommendations into trackable tasks.
- **Notification center** — settings toggles exist but are cosmetic
  (`SettingsClient.tsx`); wire them to real saved preferences + the commented-out navbar
  bell.
- **Real RAG with embeddings + pgvector** — the `Embedding` model is already scaffolded.

---

# 13. Scenario Questions

### Q58. Gemini returns invalid JSON. What will you do?

Already handled defensively:

- **Import analysis** (`lib/feedbackAnalysis.ts:141`): strips markdown fences
  (`/```json\n?/gi`), `JSON.parse` in try/catch; on failure **falls back to the keyword
  heuristic**. Field-level sanitization clamps score to [-1,1], aligns score sign with
  sentiment, and clamps confidence to [0,1].
- **Reports** (`lib/ai.ts:130`): same fence-stripping; on parse failure the whole function
  catches and returns the **stats-only report**.
- For Ask LOOP, output is natural language so JSON isn't expected.
- **If I were to harden further**: add a `retry-once-with-repair` (send Gemini the malformed
  JSON and ask it to fix it), or parse with a tolerant parser (e.g. `jsonrepair`).

### Q59. The API rate limit is exceeded.

- `lib/geminiRetry.ts` detects status **429** (and 5xx), reads `errorDetails[].retryDelay`,
  and retries with exponential backoff (5s, 10s, 20s cap) up to 3 attempts.
- After retries are exhausted: feedback analysis → heuristic fallback; reports → stats-only
  fallback; Ask LOOP → inline error message.
- **At a higher level I would**: queue large imports as background jobs (Vercel
  Background Functions / QStash), batch analysis with controlled concurrency (already 4),
  and cache repeated prompts (Q47).

### Q60. A user uploads a 100 MB CSV.

Current behavior:
- Rejected — `MAX_FILE_BYTES = 5MB` returns "File too large. Maximum size is 5 MB."
  (`app/api/feedback/import/route.ts:35`).

If I needed to support big files I would:
- **Stream** the file (e.g. Vercel Blob/S3) instead of buffering in memory.
- **Process in the background** via a queue worker with chunked parsing and resumable
  progress.
- Keep the 5000-row cap or raise it explicitly; report partial progress to the client.

### Q61. The dashboard becomes slow.

Diagnosis + fixes:
- Check the slow queries: `getFeedbackVolumeOverTime` and theme metrics load raw rows
  (`lib/analyticsQueries.ts`).
- **Fix**: move to SQL `date_trunc`/`GROUP BY` aggregates; add a materialized day-bucket
  stats table; ensure composite indexes cover the predicates.
- **Reduce N+1**: batch theme resolution (already cached per batch).
- **Add caching**: revalidate dashboard data at the route/page level, or store computed
  stats.
- **Keyset pagination** for the feedback table.
- **Client**: keep the 30s insight polling, debounce search (already 250ms).

### Q62. The database contains one million feedback entries.

- Indexes cover `workspaceId + createdAt/sentiment/status` — filtered counts and
  windowed queries stay fast.
- Pagination must move from `skip` to **keyset** (Q46).
- Analytics must move from in-memory aggregation to **SQL aggregation** (Q45).
- Long-running report generation over 1M rows should run in the background and store
  `contentJson`.
- `getRecentFeedback` and inbox queries already `take`-limit; keep them bounded.
- Consider **partitioning by workspace** or archival of `ACTIONED` older-than-N-months rows.

### Q63. AI costs become too high.

1. **Reduce usage**:
   - Larger heuristic fast-path (raise the >40-item threshold, or always heuristic for
     bulk CSV and let users opt-in to AI).
   - Cache per-feedback analysis results (already stored on the row) and reuse via the
     `Embedding`/analysis cache instead of re-analyzing.
   - Cap Ask LOOP context and reuse `RetrievedContext` within a conversation.
2. **Cheaper model**: switch `GEMINI_MODEL` to `gemini-3.5-flash-lite`/`gemini-3.1-flash-lite`
   for classification (documented in `.env.example`).
3. **Budget guardrails**: per-workspace monthly AI quota, daily caps, and a usage dashboard
   (track Gemini usage in a table).
4. **Optimize prompts** (already minimal — stats-only for reports, truncated quotes).
5. **Move heavy work to batch/off-peak** background jobs.

---

# Explain LOOP in 60 seconds

> "LOOP turns customer feedback into decisions. Companies get feedback everywhere —
> support tickets, app reviews, surveys, sales notes, community posts — and it piles up
> unread. LOOP brings it all into one place. You add feedback by typing it, uploading a CSV,
> or clicking one button to load realistic sample data. On the way in, the Google Gemini API
> automatically reads every item and tags it: positive, neutral, or negative, a sentiment
> score, a theme like Billing or Performance, and a product area. Now instead of 5,000
> messages, you have a dashboard: volume over time, sentiment mix, top themes, channels, and
> response time — with AI-written insights that refresh every 30 seconds. Want depth? Open a
> theme, generate an executive report, or just ask LOOP a question in plain English — 'what
> is driving the negative sentiment this week?' — and it answers using your actual feedback
> data, streamed to the screen. It's built as a real multi-tenant product: workspaces, three
> roles (Admin, Analyst, Viewer), team invites, per-user chat history, all on Next.js,
> PostgreSQL, Prisma, and Gemini, deployed on Vercel."

---

# Walk through the complete request flow

**End-to-end example: a user signs in, imports a CSV, views analytics, and asks a question.**

1. **Landing** (`app/page.tsx` → `LandingPage`): marketing site.
2. **Sign up** (`app/components/auth-form.tsx`): `POST /api/register` → Zod validate →
   bcrypt hash(12) → `prisma.user.create` → `signIn("credentials")` → JWT cookie set.
3. **Sign in** (`lib/auth.ts` `authorize`): lookup user → check `isActive`/`passwordHash` →
   `bcrypt.compare` → return user; `jwt`/`session` callbacks embed `id` + `role` in the
   session. `proxy.ts` now permits `/dashboard`.
4. **Create workspace** (`app/(dashboard)/workspace/page.tsx` → `POST /api/workspace`):
   `auth()` → user has no workspace → create `Workspace` + set user as ADMIN.
5. **Import CSV** (`ImportFeedbackClient.tsx` → `POST /api/feedback/import`):
   `requireImportUser()` (auth + workspace + `feedback:import`) → parse multipart/raw
   (5MB check, .csv check) → `parseFeedbackCsv` (header aliases, row coercion, row errors) →
   `importFeedbackBatch` → `analyzeFeedbackBatch` (Gemini or heuristics) → 25-row
   `$transaction` inserts → theme `upsert` linking → JSON summary.
6. **Dashboard** (`app/(dashboard)/dashboard/page.tsx`): Server Component, `auth()` guard,
   `Promise.all` over `getDashboardStats`, volume, sentiment, channels, top themes,
   `getRecentFeedback`, `getDashboardInsights` → renders KPIs, Recharts, `AIInsightsPanel`
   (which polls `/api/dashboard/insights` every 30s).
7. **Inbox browse** (`app/(dashboard)/feedback-inbox/page.tsx` → `FeedbackTable`):
   infinite scroll → `GET /api/feedback/inbox?skip&take` → `requireWorkspaceUser` → Prisma
   `findMany`+`count` scoped to workspace → JSON rows appended.
8. **Ask a question** (`AskLoopClient.tsx` → `POST /api/ask-loop/ask`):
   `requireWorkspacePermission("ask_loop:use")` → `ensureConversation` → `getRecentTurns`
   → save user message → `streamAskLoopAnswer`: `retrieveContext` (window/sentiment/keyword
   filters → Prisma queries) → `buildPrompt` (system rules + data snapshot + history) →
   `createGeminiModel().generateContentStream` wrapped in `withStreamRetry` → chunks
   enqueued on a `ReadableStream` with `X-Conversation-Id` header → client reads the stream
   and appends tokens to the last message → full answer persisted with `addMessage`.
9. **Report** (`reports/generate/page.tsx` → `POST /api/reports/generate`): `auth()` →
   Zod validate → query period feedback → `generateVoCReport` (pre-computed stats →
   Gemini JSON → parse/fence-strip → fallback stats-only) → save `contentJson` →
   view in `ReportsListClient` with print-to-PDF.

Every step follows the same spine: **client → typed API route → auth/permission guard →
validated body → Prisma (Postgres) → (optional Gemini with retry + fallback) → JSON/stream.**

---

# Why did you choose your tech stack?

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server Components + route handlers + streaming + Vercel in one deployable |
| UI | React 19, Tailwind 4 + colocated CSS | Modern React; fast styling for landing; custom CSS for product feel |
| Charts | Recharts | Declarative, React-native, covers area/bar/pie needs |
| Auth | NextAuth v5 (JWT) | Standard, provider-rich, stateless, callback-enriched sessions |
| DB | PostgreSQL (Neon) | Relational integrity, enums, multi-tenant FKs, managed serverless hosting |
| ORM | Prisma 7 (pg adapter) | Type-safe queries, migrations-as-code, transactions, easy relations |
| AI | Google Gemini (`gemini-3.6-flash`) | Cheap/free tier, streaming, lightweight SDK, config-driven model |
| Email | Nodemailer/SMTP | Team invites with no external SaaS dependency |
| Language | TypeScript 5 | End-to-end type safety (Prisma + Zod + AI types) |
| Package manager | pnpm | Fast, lockfile tracked, Vercel `installCommand` configured |

---

# How does Gemini integration work?

Three server-only entry points (never in client code):

1. **`lib/geminiClient.ts`** — `createGeminiModel()` builds a `GenerativeModel` from
   `GEMINI_API_KEY` (fallback `ANTHROPIC_API_KEY`) and `GEMINI_MODEL` (default
   `gemini-3.6-flash`). `createGeminiModelOptional()` returns `null` when no key exists.
2. **`lib/geminiRetry.ts`** — `withRetry` (non-streaming) and `withStreamRetry`
   (streaming) wrap calls: retry 429/5xx up to 3× with exponential backoff, honoring the
   provider's `retryDelay`.
3. **Consumers**:
   - `lib/feedbackAnalysis.ts` → per-item JSON classification, heuristic fallback,
     concurrency-4 batch, heuristic fast-path for >40 items.
   - `lib/ai.ts` → VoC reports from pre-computed stats, stats-only fallback.
   - `lib/askLoop.ts` → retrieval-augmented streaming chat grounded in real feedback rows.

---

# How do you manage API keys securely?

- Keys live **only in server-side environment variables** (`.env` / Vercel project env).
- `.env` is git-ignored; `.env.example` ships placeholders.
- The key is consumed in server-only modules; **no `NEXT_PUBLIC_`** variable carries it.
- Client components talk to `/api/*` routes which do the AI calls; users never receive the
  key or any token.
- `AUTH_SECRET` is a separate strong random value (`openssl rand -hex 32`).

---

# Database schema and relationships

See [Q26–Q30](#5-database) for the full model list and details. The relationship graph:

```
Workspace 1─N User (workspaceId, SetNull)
Workspace 1─N Feedback (workspaceId, Cascade)
Workspace 1─N Theme (workspaceId, Cascade, unique name-per-workspace)
Workspace 1─N Report / Invitation / AskLoopConversation / Conversation
User 1─N Feedback.importedBy (SetNull)
Feedback N─M Theme via FeedbackTheme (composite PK, confidence)
User 1─N AskLoopConversation (per-user chat, Cascade)
AskLoopConversation 1─N AskLoopMessage (Cascade)
Feedback 1─1 Embedding (unique feedbackId, Cascade)   // future vector RAG
```

---

# Feedback analysis pipeline

```
Raw feedback (manual / CSV / simulate)
        │
        ▼
lib/csvParse.ts ──▶ structured rows (header aliases, coercion, row errors)
        │
        ▼
lib/feedbackImport.ts (importSingleFeedback / importFeedbackBatch)
        │   validates content/channel, truncates fields
        ▼
lib/feedbackAnalysis.ts
   ├─ >40 items or fast=true  → heuristicAnalyze (keyword sentiment + theme scoring)
   └─ else ──▶ Gemini (generateContent JSON) ──▶ sanitize + clamp
        │   (withRetry: 429/5xx backoff; catch → heuristic fallback)
        ▼
Prisma writes:
   feedback.create (sentiment, score, featureArea, status=NEW)
   theme create-or-resolve (unique [workspaceId,name])
   feedbackTheme.upsert (confidence)
        │
        ▼
Dashboards & analytics recompute from Postgres (no AI on read path)
Ask LOOP / reports reuse the stored sentiment/theme fields for grounding
```

---

# Biggest challenges and how you solved them

1. **Stale Prisma client after schema changes** → version-guarded singleton in
   `lib/prisma.ts` + friendly import error (`lib/feedbackImport.ts:321`).
2. **RAG without a vector DB** → NL→filter extraction (date window, sentiment regex,
   keyword stopwords) + SQL retrieval with "most recent" fallback
   (`lib/askLoop.ts`).
3. **Multi-tenant isolation** → `requireWorkspaceUser`/`requireWorkspacePermission` +
   `workspaceScope` + same-workspace checks; workspaceId always re-read from DB
   (`lib/workspaceAuth.ts`).
4. **Neon pooled vs unpooled connections** → split `DATABASE_URL` / `DATABASE_URL_UNPOOLED`
   and used unpooled for migrations (`prisma.config.ts`).
5. **Gemini model deprecation + rate limits** → config-driven `GEMINI_MODEL`, retry with
   backoff, and graceful heuristics/stats-only fallbacks.
6. **Streaming + persistence race** → load history before saving the new message so it isn't
   duplicated in the prompt (`app/api/ask-loop/ask/route.ts:32`).
7. **Bulk import resilience** → 25-row transactions with row-by-row fallback and per-row
   error capture.

---

# Scaling the application

**Data layer**
- Keyset pagination instead of `skip`/`take` (Q46).
- SQL `GROUP BY`/`date_trunc` aggregates + a materialized day-bucket stats table (Q45/Q61).
- Composite indexes already present; add `created_at`-first indexes for windowed queries.
- Optional: Postgres partitions per workspace, or archival of old `ACTIONED` rows.

**AI layer**
- Background job queue (QStash / Vercel Background Functions) for large imports and report
  generation instead of request-blocking calls.
- Cache retrieval contexts and report results; per-workspace AI budgets (Q63).
- True vector RAG with `pgvector` using the existing `Embedding` model.

**Infra**
- Neon pooling + PgBouncer for connection reuse on serverless.
- Cache hot dashboard reads (Next.js ISR with `revalidate`, or Redis).
- Horizontal scaling is inherent (serverless functions); keep DB queries bounded.

**UX**
- Keep streaming (perceived latency), 30s insight polling, infinite scroll; add
  client-side optimistic updates for mutations.

---

# What would you improve in the next version

1. Real embeddings RAG (pgvector) using the scaffolded `Embedding` model.
2. Background/AI job queue for bulk operations.
3. Standardized API auth layer (one helper everywhere) + OpenAPI/Zod-endpoint docs.
4. Test suite (Vitest): `csvParse`, heuristics, retrieval, permission matrix.
5. Notifications saved to DB (toys are currently cosmetic) + the commented-out navbar bell.
6. Keyset pagination for the feedback inbox.
7. Integrations: Zendesk/Intercom/Slack/Jira webhooks, email ingestion.
8. Usage/billing dashboard for AI spend per workspace.
9. Multilingual analysis and predictive trend forecasting.
10. CI pipeline: lint, typecheck, migrate-check, and preview deploys per PR.

---

*Analysis generated from the LOOP codebase (Next.js 16 · React 19 · Prisma 7 · PostgreSQL ·
NextAuth 5 · Gemini · TypeScript). Key source paths referenced throughout:
`prisma/schema.prisma`, `lib/*`, `app/api/*`, `app/(dashboard)/*`, `proxy.ts`,
`vercel.json`, `prisma.config.ts`.*
