import { NextResponse } from "next/server"
import { requireWorkspacePermission } from "@/lib/workspaceAuth"
import { prisma } from "@/lib/prisma"
import { razorpay, planIdForPlan } from "@/lib/razorpay"
import { CheckoutSchema, parseBody } from "@/lib/validations"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  const auth = await requireWorkspacePermission("settings:manage")
  if ("error" in auth) return auth.error

  const result = await parseBody(req, CheckoutSchema)
  if ("error" in result) return result.error
  const { plan } = result.data

  const planId = planIdForPlan(plan)
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || !planId || !keyId) {
    return NextResponse.json(
      {
        error: "Checkout is not configured for this plan yet. Please contact support.",
      },
      { status: 400 }
    )
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: auth.user.workspaceId },
    select: { id: true },
  })
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  }

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12,
      customer_notify: 1,
      notes: { workspaceId: workspace.id, plan },
    })
    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId,
    })
  } catch (error) {
    logger.error("Failed to start Razorpay subscription checkout", {
      workspaceId: workspace.id,
      plan,
      error,
    })
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    )
  }
}