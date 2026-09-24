# LOOP — Production / SaaS Conversion Plan

> Status legend: `[ ]` pending · `[x]` done

---

## Phase 1 — Remove "Simulate" import path ✅ DONE

- [x] Strip `simulate` option from `app/(dashboard)/import-feedback/ImportFeedbackClient.tsx`
      (method card, state/query handling, fetch logic, all "simulated channels" copy)
- [x] Delete `app/api/feedback/simulate/route.ts`
- [x] Delete fixtures: `data/appReviews.json`, `data/supportTickets.json`, `data/surveys.json`
      and the same three files under `public/data/` (both now-empty dirs removed)
- [x] Verify no remaining imports/references to deleted fixtures (`grep simulate`)
      — README updated; `LOOP-Analysis.md` left as historical analysis doc
- [x] Keep: "Download sample CSV" template button and `prisma/seed.ts` (dev-only)
- [x] Verified: `pnpm build` passes (TypeScript clean), no new lint errors
      (remaining lint warnings are pre-existing, tracked for later cleanup)

## Phase 2 — Auth hardening ✅ DONE

- [x] Password reset flow
  - [x] `/auth/forgot-password` page (request reset link)
  - [x] `/auth/reset-password` page (set new password via token)
  - [x] Hashed single-use reset tokens + expiry in DB (`PasswordResetToken` model)
  - [x] Send emails via existing `lib/mail.ts` (Resend preferred, SMTP fallback)
- [x] Email verification on signup (verification link before/at first login)
  - [x] `VerificationToken` used with hashed tokens; `/auth/verify-email` page + `/api/auth/verify-email`
  - [x] Credentials `authorize` requires `emailVerified`; invite-accept sets verified
  - [x] Resend verification email via `/api/auth/resend-verification`
- [x] Rate-limit public auth endpoints (IP-based, reuse `lib/rateLimit.ts`):
  - [x] `POST /api/register`
  - [x] Credentials login (`authorize` path)
- [x] Fix stale JWT sessions: re-check `isActive` + `role` in NextAuth `session`
      callback so deactivation/role changes apply immediately (no 30-day lag)
  - [x] Also added `isActive` checks in `requireWorkspaceUser` + dashboard layout

## Phase 3 — API-key ingestion channel ✅ DONE

- [x] Prisma schema: add `ApiKey` model (hashed key, workspace FK, name,
      lastUsedAt, revokedAt, keyPrefix) + migration
- [x] `POST /api/v1/feedback` public ingest endpoint:
  - [x] API-key authentication (`Authorization: Bearer lk_...`, hashed lookup)
  - [x] Zod validation of payload (channel, content, metadata…)
  - [x] Per-key rate limiting
  - [x] Route through existing AI analysis pipeline (`lib/feedbackAnalysis.ts`)
- [x] `/settings/integrations` page: create / list / revoke keys, curl example
- [x] Add "Integrations" card on Import Feedback page linking to settings

## Phase 4 — Billing (Stripe)

- [ ] Prisma schema: plan enum (FREE / PRO / BUSINESS) + Workspace fields
      (`plan`, `stripeCustomerId`, `stripeSubscriptionId`, usage counters) + migration
- [ ] Stripe integration:
  - [ ] Checkout session route (upgrade/downgrade)
  - [ ] Customer Portal route (manage billing)
  - [ ] Webhook handler: `subscription.created|updated|deleted`,
        `invoice.payment_failed` → sync workspace plan
- [ ] `/pricing` standalone marketing page wired to real plans
- [ ] `/settings/billing` page: current plan, usage meters, invoices, manage button
- [ ] Plan enforcement in expensive routes (free-tier caps):
  - [ ] Ask LOOP messages/mo
  - [ ] Report generations/mo
  - [ ] Feedback imports/mo (+ seats per tier)

## Phase 5 — Onboarding wizard ✅ DONE

- [x] `/onboarding` flow for new signups (incl. Google OAuth users who get no workspace today):
  - [x] Step 1: create / name workspace
  - [x] Step 2: first feedback import (manual / CSV / integrations pointer)
  - [x] Step 3: invite teammates
  - [x] Redirect to dashboard with data visible
- [x] Skip-onboarding flag; route guard so it only shows once

---

## Deferred / later (not started until Phases 1–5 ship)

- Multi-workspace membership (`WorkspaceMember` join table + switcher UI)
- CI pipeline (GitHub Actions: lint → typecheck → build → migrate deploy)
- Test suite (Vitest unit + Playwright smoke)
- HSTS header, `/api/health` endpoint, global `not-found.tsx` / `global-error.tsx`
- Data compliance: workspace data export/delete, retention policy
- Native integrations: App Store / Google Play reviews, Typeform, Zendesk, Intercom
