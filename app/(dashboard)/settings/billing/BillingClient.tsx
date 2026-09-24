'use client'

import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import CheckoutButton from '@/app/components/billing/CheckoutButton'

type Limits = { askLoop: number; reports: number; imports: number; seats: number }
type Used = { askLoop: number; reports: number; imports: number; seats: number }

interface BillingClientProps {
  plan: string
  planLabel: string
  limits: Limits
  used: Used
  subscribed: boolean
  canManage: boolean
}

const card = 'bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden'

function formatLimit(limit: number): string {
  if (limit >= 1_000_000) return 'Unlimited'
  return limit.toLocaleString('en-US')
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const unlimited = limit >= 1_000_000
  const pct = !unlimited && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const full = !unlimited && used >= limit

  return (
    <div className={card}>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-900">{label}</span>
          <span className={`text-sm ${full ? 'font-semibold text-red-600' : 'text-slate-500'}`}>
            {unlimited ? formatLimit(limit) : `${used.toLocaleString('en-US')} / ${formatLimit(limit)}`}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${full ? 'bg-red-500' : 'bg-loop-green'}`}
            style={{ width: unlimited ? '100%' : `${Math.max(pct, used > 0 ? 2 : 0)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function ManageButton() {
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function cancelSubscription() {
    if (busy) return
    if (!window.confirm('Cancel your subscription? You will keep your current plan until the end of this billing cycle.')) return
    setBusy(true)
    setNotice(null)
    setError(null)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.cancelled) {
        setNotice(data.message ?? 'Subscription cancelled.')
      } else {
        setError(data.error ?? 'Could not cancel the subscription. Please try again.')
      }
    } catch {
      setError('Could not cancel the subscription. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span>
      <button
        type="button"
        onClick={cancelSubscription}
        disabled={busy}
        className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-55"
      >
        {busy ? 'Cancelling…' : 'Cancel subscription'}
      </button>
      {notice && <p className="mt-2 text-xs text-loop-green">{notice}</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </span>
  )
}

export default function BillingClient({
  plan,
  planLabel,
  limits,
  used,
  subscribed,
  canManage,
}: BillingClientProps) {
  return (
    <div className="w-full flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Billing</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your plan and track monthly usage.
        </p>
      </div>

      <div className={card}>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {planLabel}
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {plan}
                  </span>
                </p>
                <p className="mt-1 text-[13px] text-slate-500">
                  {subscribed
                    ? 'Active subscription. Billing is managed through Razorpay.'
                    : 'Free plan. Upgrade anytime to lift your monthly limits.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {canManage ? (
                subscribed ? (
                  <ManageButton />
                ) : (
                  <>
                    <CheckoutButton plan="PRO" label="Upgrade to Professional" />
                    <CheckoutButton
                      plan="BUSINESS"
                      label="Contact for Business"
                      variant="outline"
                    />
                  </>
                )
              ) : (
                <p className="max-w-xs text-center text-xs text-slate-500 sm:text-right">
                  Plan changes are managed by workspace admins. Ask an admin to
                  upgrade or manage the subscription.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[13px] font-bold text-slate-500 uppercase tracking-[0.4px]">
          Usage this month
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Meter label="Ask LOOP messages" used={used.askLoop} limit={limits.askLoop} />
          <Meter label="Report generations" used={used.reports} limit={limits.reports} />
          <Meter label="Feedback imports" used={used.imports} limit={limits.imports} />
        </div>
      </div>

      <div className={card}>
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Team seats</p>
              <p className="mt-1 text-[13px] text-slate-500">
                Active members count toward your plan&apos;s seat limit.
              </p>
            </div>
            <span className="shrink-0 text-sm text-slate-500">
              {used.seats.toLocaleString('en-US')} / {formatLimit(limits.seats)}
            </span>
          </div>
          {!canManage && (
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              Only admins can change or remove members.
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Usage counters reset automatically at the start of each month.
      </p>
    </div>
  )
}