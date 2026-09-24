import { NextResponse } from "next/server"
import { planFromPlanId, verifyRazorpayWebhook } from "@/lib/razorpay"
import { prisma, type Plan } from "@/lib/prisma"
import { logger } from "@/lib/logger"

interface RazorpaySubscriptionEntity {
  id: string
  plan_id: string
  customer_id: string | null
  status: string
  notes?: Record<string, string | number>
}

const ACTIVE_EVENTS = new Set([
  "subscription.activated",
  "subscription.charged",
  "subscription.resumed",
])

const INACTIVE_EVENTS = new Set([
  "subscription.cancelled",
  "subscription.paused",
  "subscription.halted",
  "subscription.completed",
  "subscription.expired",
])

export async function POST(req: Request) {
  const signature = req.headers.get("x-razorpay-signature")
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 })
  }

  const payload = await req.text()

  if (!verifyRazorpayWebhook(payload, signature, secret)) {
    logger.warn("Razorpay webhook signature verification failed")
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  let event: { event?: string; payload?: Record<string, { entity?: RazorpaySubscriptionEntity }> }
  try {
    event = JSON.parse(payload)
  } catch (error) {
    logger.warn("Razorpay webhook payload is not valid JSON", { error })
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const eventType = event.event
  if (!eventType || !event.payload) {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 })
  }

  try {
    const entity = event.payload.subscription?.entity
    if (entity && (ACTIVE_EVENTS.has(eventType) || INACTIVE_EVENTS.has(eventType))) {
      await syncSubscription(entity, ACTIVE_EVENTS.has(eventType))
    }
  } catch (error) {
    logger.error("Razorpay webhook handling failed", { type: eventType, error })
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function findWorkspace(entity: RazorpaySubscriptionEntity) {
  const workspaceId = entity.notes?.workspaceId
  if (workspaceId) {
    const byId = await prisma.workspace.findUnique({
      where: { id: String(workspaceId) },
      select: { id: true },
    })
    if (byId) return byId
  }
  if (entity.customer_id) {
    return await prisma.workspace.findFirst({
      where: { razorpayCustomerId: entity.customer_id },
      select: { id: true },
    })
  }
  return null
}

async function syncSubscription(entity: RazorpaySubscriptionEntity, isActive: boolean) {
  const workspace = await findWorkspace(entity)
  if (!workspace) {
    logger.warn("Razorpay subscription for unknown workspace", { subscriptionId: entity.id })
    return
  }

  const plan = planFromPlanId(entity.plan_id)

  const data: {
    razorpaySubscriptionId: string
    razorpayCustomerId?: string
    plan?: Plan
  } = { razorpaySubscriptionId: entity.id }

  if (entity.customer_id) data.razorpayCustomerId = entity.customer_id

  if (isActive) {
    if (plan) data.plan = plan
  } else {
    data.plan = "FREE"
  }

  await prisma.workspace.update({
    where: { id: workspace.id },
    data,
  })

  logger.info("Synced Razorpay subscription", {
    workspaceId: workspace.id,
    subscriptionId: entity.id,
    status: entity.status,
  })
}