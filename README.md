# LOOP

**AI-powered Voice-of-Customer intelligence.**

LOOP turns customer feedback from support tickets, app reviews, surveys, sales notes, and community posts into themes, sentiment, trends, reports, and chat answers — so product and CX teams can act on what customers actually say.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Demo accounts](#demo-accounts)
- [Roles & permissions](#roles--permissions)
- [Application modules](#application-modules)
- [Ask LOOP](#ask-loop)
- [AI & external services](#ai--external-services)
- [Scripts](#scripts)
- [Development notes](#development-notes)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Features

| Area | What you get |
|------|----------------|
| **Landing** | Marketing site with product story, features, pricing, and CTA |
| **Auth** | Email/password + Google OAuth (NextAuth v5) |
| **Workspaces** | Multi-tenant workspaces; users belong to one active workspace |
| **Dashboard** | KPI cards, volume/sentiment charts, themes, quick actions, AI insights |
| **Feedback Inbox** | Browse, filter, and review feedback items |
| **Import Feedback** | Manual entry, CSV upload, and simulated sample data with AI analysis |
| **Analytics** | Period comparison, channels, response time, theme growth |
| **Themes** | Recurring topics with colors, counts, and trends |
| **Ask LOOP** | Chat over workspace feedback (retrieval + Gemini streaming) |
| **Reports** | Generate and browse AI-written VoC / executive reports |
| **Team** | Invite members, assign roles, activate/deactivate, remove |
| **Settings & Profile** | Workspace and personal preferences |

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | [Next.js](https://nextjs.org) **16** (App Router) |
| UI | React **19**, Tailwind CSS **4**, custom CSS modules/pages |
| Charts | Recharts |
| Icons | Lucide React |
| Auth | [NextAuth.js](https://authjs.dev) **v5** (JWT sessions) + Prisma adapter patterns |
| Database | PostgreSQL |
| ORM | [Prisma](https://www.prisma.io) **7** (`@prisma/adapter-pg`) |
| AI | Google Gemini (`@google/generative-ai`) — model **`gemini-3.5-flash`** |
| Email | Nodemailer (team invites) |
| Package manager | **pnpm** (lockfile + Vercel `installCommand`) |
| Language | TypeScript **5** |

Generated Prisma client output: `app/generated/prisma` (do not edit by hand; run `pnpm db:generate` after schema changes).

---

## Project structure

```
loop/
├── app/
│   ├── (dashboard)/          # Authenticated product UI
│   │   ├── dashboard/
│   │   ├── feedback-inbox/
│   │   ├── import-feedback/
│   │   ├── analytics/
│   │   ├── themes/
│   │   ├── ask-loop/
│   │   ├── reports/
│   │   ├── team/
│   │   ├── settings/
│   │   ├── profile/
│   │   └── workspace/
│   ├── api/                  # Route handlers (auth, feedback, ask-loop, team, …)
│   ├── auth/                 # Sign-in / sign-up / invite pages
│   ├── components/           # Shared UI (sidebar, charts, landing, upload, …)
│   ├── generated/prisma/     # Prisma client (generated)
│   └── globals.css
├── lib/                      # Domain logic, queries, auth helpers, AI
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── data/ & public/data/      # Sample JSON for import/simulation
├── scripts/                  # Ops helpers (e.g. schema check)
├── proxy.ts                  # Route protection (session cookie gate)
├── prisma.config.ts          # Prisma 7 datasource / migrate config
└── package.json
```

---

## Prerequisites

- **Node.js** 20+ recommended  
- **pnpm** (`npm i -g pnpm`)  
- **PostgreSQL** (local, or hosted e.g. Neon)  
- **Gemini API key** for Ask LOOP, import analysis, and reports  
- Optional: Google OAuth credentials, SMTP for invite emails  

---

## Getting started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd loop
pnpm install
```

`postinstall` runs `prisma generate` automatically.

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your database URL, `AUTH_SECRET`, and `GEMINI_API_KEY` (see [Environment variables](#environment-variables)).

Generate an auth secret:

```bash
openssl rand -hex 32
```

### 3. Database setup

Ensure Postgres is running and the database exists (e.g. `loop`).

```bash
# Apply all migrations
pnpm db:migrate

# Optional: load demo workspace, users, themes, feedback, reports
pnpm db:seed
```

For local schema iteration (creates migrations interactively):

```bash
pnpm db:migrate:dev
```

### 4. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development server |
| `pnpm build` | `prisma generate` + production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint |

---

## Environment variables

Copy from `.env.example`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Postgres connection (app runtime; can be pooled) |
| `DATABASE_URL_UNPOOLED` | Recommended | Direct URL for migrations/DDL (Neon: non-pooler host) |
| `AUTH_SECRET` | Yes | NextAuth secret (`openssl rand -hex 32`) |
| `AUTH_GOOGLE_ID` | Optional | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Optional | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | Yes (invites) | Public app origin, e.g. `http://localhost:3000` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Optional | Team invite emails |
| `GEMINI_API_KEY` | Yes (AI features) | Google AI Studio / Gemini API key |
| `ANTHROPIC_API_KEY` | Fallback only | Accepted as alternate env name in some AI helpers; Gemini client is used |

**Local Postgres example:**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/loop?schema=public"
DATABASE_URL_UNPOOLED="postgresql://postgres:password@localhost:5432/loop?schema=public"
```

**Neon:** set pooled URL on `DATABASE_URL` and direct (unpooled) URL on `DATABASE_URL_UNPOOLED`. Migrations use the unpooled URL via `prisma.config.ts`.

---

## Database

### Models (high level)

| Model | Purpose |
|-------|---------|
| `Workspace` | Tenant container |
| `User` | Auth identity, role, workspace membership |
| `Account` / `Session` / `VerificationToken` | Auth providers & sessions |
| `Feedback` | Customer feedback rows (channel, sentiment, status, import metadata) |
| `Theme` / `FeedbackTheme` | Topics and feedback↔theme links |
| `Report` | Generated report documents |
| `Invitation` | Team invites (token, role, expiry) |
| `AskLoopConversation` / `AskLoopMessage` | Per-user Ask LOOP chat history |
| `Embedding` / `Conversation` / `Message` | Schema support for RAG / alternate chat models |

### Migrations

```
prisma/migrations/
  20260712142554_init_with_feedback_models/
  20260715170219_feedback_import_fields/
  20260718103600_add_ask_loop_and_rag_models/
```

```bash
pnpm db:status      # migration status
pnpm db:migrate     # deploy pending migrations (CI / prod / local)
pnpm db:generate    # regenerate client only
```

After pulling schema changes: **migrate** your DB and **regenerate** the client if generate did not run via install/build.

---

## Demo accounts

After `pnpm db:seed` (workspace **Acme Corp**):

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@acme.test` | `Admin123!` |
| Analyst | `analyst@acme.test` | `Analyst123!` |
| Viewer | `viewer@acme.test` | `Viewer123!` |

Seed also creates themes, sample feedback, and sample reports. **It wipes existing seed-related tables** before inserting — do not run against production data you care about.

---

## Roles & permissions

Defined in `lib/permissions.ts`:

| Permission | Admin | Analyst | Viewer |
|------------|:-----:|:-------:|:------:|
| `dashboard:view` | ✓ | ✓ | ✓ |
| `feedback:import` | ✓ | ✓ | |
| `feedback:manual` | ✓ | ✓ | |
| `feedback:review` | ✓ | ✓ | |
| `ask_loop:use` | ✓ | ✓ | ✓ |
| `reports:generate` | ✓ | ✓ | |
| `reports:view` | ✓ | ✓ | ✓ |
| `team:manage` | ✓ | | |
| `settings:manage` | ✓ | | |

API routes use `requireWorkspacePermission(...)` from `lib/workspaceAuth.ts`.

Dashboard routes are also gated by `proxy.ts` (session cookie required).

---

## Application modules

### Dashboard (`/dashboard`)

Workspace overview: volume, sentiment mix, top themes, response metrics, period comparison, AI insights panel, quick actions.

### Feedback Inbox (`/feedback-inbox`)

Table of feedback with filters (status, sentiment, channel, search). Statuses: `NEW`, `REVIEWED`, `ACTIONED`.

### Import Feedback (`/import-feedback`)

- Manual feedback entry  
- CSV upload (parsed in `lib/csvParse.ts`)  
- Simulate / sample data from JSON fixtures  
- AI analysis on import (`lib/feedbackAnalysis.ts` → sentiment, themes, feature area)

Channels include: Support Ticket, App Review, Survey Response, Community Post, Sales Call Note.

### Analytics (`/analytics`)

Deeper charts: volume over time, channels, response time, sentiment, theme growth, period comparison.

### Themes (`/themes`)

Theme inventory for the workspace (name, color, description, linked feedback).

### Reports (`/reports`, `/reports/generate`)

List past reports; generate new ones via Gemini grounded on workspace feedback (`lib/ai.ts`, `lib/reportsQueries.ts`).

### Team (`/team`)

Invite by email, copy invite links, change roles, deactivate/remove users (Admin).

### Settings & Profile

Workspace settings and personal profile/avatar.

---

## Ask LOOP

**Route:** `/ask-loop`  
**APIs:**

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/ask-loop/ask` | Stream an answer; create/continue conversation |
| `GET` | `/api/ask-loop/conversations` | List current user’s conversations |
| `GET` | `/api/ask-loop/conversations/[id]` | Load messages |
| `DELETE` | `/api/ask-loop/conversations/[id]` | Delete conversation |

### How answers work

1. Authenticate user and resolve workspace.  
2. Ensure a conversation owned by **this user + workspace** (create if needed).  
3. Retrieve relevant feedback from Postgres (date window, optional sentiment, keywords) — lightweight RAG without a vector DB (`lib/askLoop.ts`).  
4. Build a prompt with system rules + data snapshot + recent turns.  
5. Stream Gemini (`gemini-3.5-flash`) to the client; persist user + assistant messages.

### History storage

- Stored in **PostgreSQL** (`AskLoopConversation`, `AskLoopMessage`).  
- **Per user** within a workspace — not shared with teammates.  
- List is scoped: `where: { workspaceId, userId }` (latest 50).  
- UI: **New chat** + **History** popup (not a permanent left sidebar).  
- UI markdown-light rendering for headings, lists, bold/italic/code.

---

## AI & external services

| Feature | Model / service | Code |
|---------|-----------------|------|
| Ask LOOP chat | `gemini-3.5-flash` | `lib/askLoop.ts` |
| Feedback analysis on import | `gemini-3.5-flash` | `lib/feedbackAnalysis.ts` |
| Report generation | `gemini-3.5-flash` | `lib/ai.ts` |
| Team invite email | SMTP (Nodemailer) | `lib/mail.ts` |
| Google sign-in | Google OAuth | `lib/auth.ts` |

If the model ID is retired by Google, update the string in those three `lib/*` files (and retest streaming + batch analysis).

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `pnpm dev` | Next.js dev server |
| Build | `pnpm build` | Generate Prisma client + build |
| Start | `pnpm start` | Production server |
| Lint | `pnpm lint` | ESLint |
| Migrate (deploy) | `pnpm db:migrate` | `prisma migrate deploy` |
| Migrate (dev) | `pnpm db:migrate:dev` | `prisma migrate dev` |
| Status | `pnpm db:status` | Migration status |
| Seed | `pnpm db:seed` | Demo data |
| Generate | `pnpm db:generate` | `prisma generate` |
| Schema check | `node scripts/check-neon-schema.mjs` | List public tables/enums (uses `DATABASE_URL*`) |

---

## Development notes

- **Package manager:** Prefer **pnpm** to match the lockfile and Vercel config.  
- **Prisma client:** Import from `@/lib/prisma` (singleton + HMR version guard). After model changes, regenerate and restart the dev server so the global client is not stale.  
- **Auth pages:** Sign-in UI at `/api/auth` (custom); NextAuth handlers under `/api/auth/[...nextauth]`.  
- **Route protection:** `proxy.ts` redirects unauthenticated users on dashboard paths to `/api/auth`.  
- **Styling:** Global tokens in `app/globals.css`; many dashboard pages use colocated `page.css` files. Tailwind preflight may reset lists — Ask LOOP answer CSS restores list markers.  
- **Import fixtures:** Sample JSON under `data/` and `public/data/` (app reviews, support tickets, surveys).

---

## Deployment

### Vercel

`vercel.json`:

```json
{
  "installCommand": "pnpm install",
  "buildCommand": "prisma generate && next build"
}
```

1. Set all required env vars in the Vercel project (including `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AUTH_SECRET`, `GEMINI_API_KEY`, `NEXT_PUBLIC_APP_URL`).  
2. Run migrations against the production DB (`pnpm db:migrate` from CI or a one-off job with prod URLs).  
3. Deploy.  

Do **not** run `db:seed` on production unless you intentionally want demo data (seed deletes existing rows).

### Production checklist

- [ ] Strong `AUTH_SECRET`  
- [ ] HTTPS app URL in `NEXT_PUBLIC_APP_URL`  
- [ ] Migrations applied  
- [ ] Gemini key with access to `gemini-3.5-flash` (or updated model id)  
- [ ] Google OAuth redirect URIs if using Google login  
- [ ] SMTP configured if invite emails are required  

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| `prisma.*.findMany` is undefined | Run `pnpm db:generate` and restart `pnpm dev` |
| Table does not exist | Run `pnpm db:migrate` against the same DB as `.env` |
| Neon vs local mismatch | Confirm which URL is active; shell env can override `.env` |
| Ask LOOP 404 model error | Model id may be deprecated; update to a current Gemini model (see `lib/askLoop.ts`) |
| Ask LOOP empty / wrong answers | Ensure workspace has feedback; seed or import data |
| Auth redirect loop | Check `AUTH_SECRET` and session cookies; open `/api/auth` |
| Google login fails | Verify OAuth client IDs and authorized redirect URIs |
| Invite email not sent | Verify SMTP env; links still may work if accept flow is used without email |

Local Postgres + schema inspection (SSL off for local):

```bash
# Windows PowerShell example — point env at local, then migrate
$env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/loop?schema=public"
$env:DATABASE_URL_UNPOOLED = $env:DATABASE_URL
pnpm db:migrate
```

---

## License

Private project (`"private": true` in `package.json`). All rights reserved unless otherwise stated by the repository owner.

---

## Summary

LOOP is a full-stack VoC product: ingest feedback, analyze with Gemini, explore analytics/themes, generate reports, collaborate in a workspace with roles, and **Ask LOOP** in natural language with **private, per-user** chat history backed by Postgres.
)
