import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { hasPermission, type Role } from '@/lib/permissions'
import { decryptApiKey } from '@/lib/apiKeys'
import IntegrationsClient from './IntegrationsClient'

export default async function IntegrationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, workspaceId: true },
  })
  if (!user) redirect('/api/auth')

  const canManage = hasPermission(user.role as Role, 'settings:manage')
  const hasWorkspace = !!user.workspaceId

  let keys: Awaited<ReturnType<typeof loadKeys>> = []
  if (hasWorkspace && canManage) {
    keys = await loadKeys(user.workspaceId!)
  }

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "https://your-app.example.com"

  return (
    <>
      <IntegrationsClient
        canManage={canManage && hasWorkspace}
        initialKeys={keys}
        apiBaseUrl={apiBaseUrl}
      />
      {hasWorkspace && !canManage && (
        <div className="w-full mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-500 leading-relaxed flex items-center justify-between gap-3">
          <span>
            API keys are managed by workspace admins. Ask an admin to create or
            revoke a key for your team.
          </span>
          <Link
            href="/settings"
            className="text-green-600 font-semibold whitespace-nowrap shrink-0 hover:underline"
          >
            Back to Settings
          </Link>
        </div>
      )}
    </>
  )
}

async function loadKeys(workspaceId: string) {
  const rows = await prisma.apiKey.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      keyCiphertext: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return rows.map((k) => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    // Decrypt the full key so it can be displayed/copied in the list.
    // Revoked or legacy keys (no ciphertext) expose null.
    rawKey:
      k.keyCiphertext && !k.revokedAt ? decryptApiKey(k.keyCiphertext) : null,
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    revokedAt: k.revokedAt?.toISOString() ?? null,
    createdAt: k.createdAt.toISOString(),
  }))
}