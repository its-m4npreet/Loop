import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/api/auth")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    redirect("/api/auth")
  }

  // Pass authenticated user context to the React Dashboard Client component
  return (
    <DashboardClient
      user={{
        name: user.name || "User",
        email: user.email,
        role: user.role,
        avatar: user.name
          ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : "JD",
      }}
    />
  )
}
