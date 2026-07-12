# Reports & Analytics Implementation Walkthrough

This document records the current project state, active changes, database schema, and pending tasks on the `feature/reports-analytics` branch to allow a new session or assistant to resume work seamlessly.

---

## 1. Environment & Setup

* **Current Branch:** `feature/reports-analytics`
* **Logical Path:** `B:\zidio-web-development\Loop`
* **Supabase Connection Configuration (in [.env](file:///b:/zidio-web-development/Loop/.env)):**
  * `DATABASE_URL`: Transaction pooler (port 6543) with `pgbouncer=true`.
  * `DIRECT_URL`: Session pooler (port 5432) for running migrations.
  * **OAuth & AI:** Google OAuth client credentials and Anthropic Claude key placeholders are fully set up.
* **Prisma 7 Configuration (in [prisma.config.ts](file:///b:/zidio-web-development/Loop/prisma.config.ts)):**
  * The migration datasource URL is set to dynamically fall back: `url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"]`. This ensures local workers without a connection pooler can still run migrations.

---

## 2. Relational Database Schema ([schema.prisma](file:///b:/zidio-web-development/Loop/prisma/schema.prisma))

We have defined the models required for both domains, matching the project spec:
* `FeedbackStatus`: Enum of `NEW`, `REVIEWED`, `ACTIONED`.
* `Feedback`: Customer comments, channel, sentiment, status, response time, satisfaction, and workspace scoping.
* `Theme`: Named category tags.
* `FeedbackTheme`: Join table mapping feedback to themes with confidence score.
* `Report`: Scoped reports list (completed, draft, scheduled) with type and metadata.

---

## 3. Database Seeding ([seed.ts](file:///b:/zidio-web-development/Loop/prisma/seed.ts))

* Generates 500 feedback items distributed over the last 90 days.
* Correlates customer satisfaction (CSAT) with sentiment weights for realistic visual charts.
* Seeds 7 reports in the database history.
* Registered in `package.json` under `"prisma": { "seed": "tsx prisma/seed.ts" }`. Run it using `npx prisma db seed`.

---

## 4. Query Helper APIs

We have created two dynamic query helper files to pull records server-side:
1. [analyticsQueries.ts](file:///b:/zidio-web-development/Loop/lib/analyticsQueries.ts): Calculates total feedback, resolution rate, average response time, CSAT, sentiment trends, channel volume, response distributions, theme growth, and period comparisons.
2. [reportsQueries.ts](file:///b:/zidio-web-development/Loop/lib/reportsQueries.ts): Fetches report list history and report counters.

---

## 5. UI Integration

* **Analytics Page ([page.tsx](file:///b:/zidio-web-development/Loop/app/(dashboard)/analytics/page.tsx)):** Scopes data requests and passes live Prisma arrays to charting components in parallel.
* **Reports Page ([page.tsx](file:///b:/zidio-web-development/Loop/app/(dashboard)/reports/page.tsx)):** Connects statistics and handles pagination/search using [ReportsListClient.tsx](file:///b:/zidio-web-development/Loop/app/(dashboard)/reports/ReportsListClient.tsx).

---

## 6. Critical Bugs / Open Issues to Resolve

When starting the next conversation, please address these issues immediately:

1. **Purity Compile Error in `ThemeGrowthTracker.tsx` (React 19 rule):**
   * *Issue:* `Math.random()` is called inside the component rendering lifecycle to add noise to sparklines, throwing a compiler error.
   * *Fix:* Implement a simple deterministic hash generator based on the theme name and array index to generate stable, pure visual noise without calling `Math.random`.
2. **Tenant Isolation Bug in Queries:**
   * *Issue:* All query helper functions in `lib/analyticsQueries.ts` and `lib/reportsQueries.ts` currently filter by `userId` (e.g. `where: { userId }`).
   * *Fix:* Change the argument to `workspaceId` and filter by `workspaceId: workspaceId`. Scoping to `workspaceId` is a non-negotiable security requirement of Zidio multi-tenancy.
3. **TypeScript `any` Lint Errors:**
   * *Issue:* `any` type annotations are forbidden by current ESLint settings.
   * *Fix:* Remove explicit `any` in [team/page.tsx](file:///b:/zidio-web-development/Loop/app/(dashboard)/team/page.tsx) (map parameter can be inferred) and define types using `Prisma.ReportWhereInput` in `lib/reportsQueries.ts`.
