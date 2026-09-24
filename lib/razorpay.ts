import Razorpay from "razorpay"
import { type Plan } from "@/lib/prisma"

// Constructed with placeholders so routes can import `razorpay` types safely
// even before env vars are configured. Real calls short-circuit via explicit
// key checks in the routes.
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_missing",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "missing",
})

export function isRazorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_WEBHOOK_SECRET
  )
}

export function planIdForPlan(plan: Plan): string | null {
  if (plan === "PRO") return process.env.RAZORPAY_PLAN_PRO ?? null
  if (plan === "BUSINESS") return process.env.RAZORPAY_PLAN_BUSINESS ?? null
  return null
}

export function planFromPlanId(planId: string | null | undefined): Plan | null {
  if (!planId) return null
  if (planId === process.env.RAZORPAY_PLAN_PRO) return "PRO"
  if (planId === process.env.RAZORPAY_PLAN_BUSINESS) return "BUSINESS"
  return null
}

export function verifyRazorpayWebhook(payload: string, signature: string, secret: string): boolean {
  return Razorpay.validateWebhookSignature(payload, signature, secret)
}