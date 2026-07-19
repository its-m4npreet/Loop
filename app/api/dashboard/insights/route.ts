import { NextResponse } from "next/server"
import { requireWorkspaceUser } from "@/lib/workspaceAuth"
import { getDashboardInsights } from "@/lib/dashboardQueries"

export async function GET() {
  const authResult = await requireWorkspaceUser()
  if ("error" in authResult) return authResult.error

  const { workspaceId } = authResult.user
  const insights = await getDashboardInsights(workspaceId)

  return NextResponse.json({
    insights,
    updatedAt: new Date().toISOString(),
  })
}
