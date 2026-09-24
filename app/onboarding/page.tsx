import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import OnboardingWizard from "./OnboardingWizard"

import "./onboarding.css"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, workspaceId: true, skipOnboarding: true },
  })
  if (!user) redirect("/api/auth")

  if (user.workspaceId || user.skipOnboarding) redirect("/dashboard")

  return (
    <div className="onboarding-page">
      <div className="onboarding-header">
        <span className="onboarding-logo">LOOP</span>
        <span className="onboarding-logo-tag">AI Intelligence</span>
      </div>
      <OnboardingWizard userName={user.name} />
    </div>
  )
}