import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import DashboardLayout from '../dashboard/DashboardLayout'

export const dynamic = 'force-dynamic'

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/api/auth")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true },
  })

  return (
    <DashboardLayout
      userName={user?.name ?? session.user.name}
      userEmail={user?.email ?? session.user.email}
      userImage={user?.image ?? null}
    >
      {children}
    </DashboardLayout>
  )
}
