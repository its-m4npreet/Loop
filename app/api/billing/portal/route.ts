import { NextResponse } from "next/server"
import { requireWorkspacePermission } from "@/lib/workspaceAuth"
import { prisma } from "@/lib/prisma"
import { razorpay } from "@/lib/razorpay"
import { logger } from "@/lib/logger"

export async function POST() {
  const auth = await requireWorkspacePermission("settings:manage")
  if ("error" in auth) return auth.error

  const workspace = await prisma.workspace.findUnique({
    where: { id: auth.user.workspaceId },
    select: { razorpaySubscriptionId: true },
  })
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  }

  if (!workspace.razorpaySubscriptionId) {
    return NextResponse.json(
      { error: "No subscription yet. Upgrade from the billing page first." },
      { status: 400 }
    )
  }
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 400 })
  }

  try {
    // Razorpay has no customer-facing billing portal, so the manage action
    // cancels the subscription at the end of the current billing cycle. The
    // plan is downgraded to FREE when the `subscription.cancelled` webhook
    // arrives.
    await razorpay.subscriptions.cancel(workspace.razorpaySubscriptionId, true)
    return NextResponse.json({
      cancelled: true,
      message: "Subscription set to cancel at the end of the current billing cycle.",
    })
  } catch (error) {
    logger.error("Failed to cancel Razorpay subscription", {
      workspaceId: auth.user.workspaceId,
      error,
    })
    return NextResponse.json(
      { error: "Could not cancel the subscription. Please try again." },
      { status: 500 }
    )
  }
}