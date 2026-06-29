import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-loop-gradient">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg shadow-slate-200/60">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome to Loop, {user.name || "User"}!
        </h1>

        <div className="mt-6 space-y-3 text-sm text-slate-600">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="font-medium text-slate-500">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="font-medium text-slate-500">Role</span>
            <span className="capitalize">{user.role.toLowerCase()}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="font-medium text-slate-500">Active</span>
            <span>{user.isActive ? "Yes" : "No"}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="font-medium text-slate-500">Joined</span>
            <span>{user.createdAt.toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
