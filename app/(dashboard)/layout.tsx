import { auth } from "@/lib/auth"
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

  return <DashboardLayout>{children}</DashboardLayout>
}
