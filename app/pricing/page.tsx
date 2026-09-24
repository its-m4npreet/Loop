import Link from "next/link"
import { Check } from "lucide-react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PLANS } from "@/lib/plans"
import { hasPermission, type Role } from "@/lib/permissions"
import CheckoutButton from "@/app/components/billing/CheckoutButton"

export const metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for your feedback intelligence.",
}

export default async function PricingPage() {
  const session = await auth()
  let canManage = false
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, workspaceId: true },
    })
    canManage = Boolean(user?.workspaceId && hasPermission(user.role as Role, "settings:manage"))
  }

  const plans = [
    {
      ...PLANS.FREE,
      plan: "FREE" as const,
      popular: false,
    },
    {
      ...PLANS.PRO,
      plan: "PRO" as const,
      popular: true,
    },
    {
      ...PLANS.BUSINESS,
      plan: "BUSINESS" as const,
      popular: false,
    },
  ]

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
            Start free. Scale when you&apos;re ready. Every plan includes
            sentiment analysis, AI theme detection, and a shared team workspace.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((item) => {
            const price =
              item.monthlyPriceCents === 0
                ? "$0"
                : item.monthlyPriceCents
                  ? `$${item.monthlyPriceCents / 100}`
                  : "Custom"

            return (
              <div
                key={item.plan}
                className={`relative flex flex-col rounded-xl border bg-white p-6 ${
                  item.popular
                    ? "border-loop-green shadow-lg shadow-emerald-100"
                    : "border-slate-200"
                }`}
              >
                {item.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-loop-green px-3 py-0.5 text-xs font-semibold text-white uppercase">
                    Most Popular
                  </span>
                )}

                <h2 className="text-lg font-bold text-slate-900">{item.label}</h2>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">{price}</span>
                  {item.monthlyPriceCents !== null && (
                    <span className="text-sm text-slate-500">/mo</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.blurb}</p>

                <div className="mt-6">
                  {canManage ? (
                    item.plan === "FREE" ? (
                      <Link
                        href="/settings/billing"
                        className="block rounded-lg border border-slate-300 bg-white py-2.5 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        View your plan
                      </Link>
                    ) : item.plan === "BUSINESS" ? (
                      <CheckoutButton
                        plan="BUSINESS"
                        label="Contact for Business"
                        variant="outline"
                      />
                    ) : (
                      <CheckoutButton
                        plan="PRO"
                        label="Choose Professional"
                        variant="primary"
                      />
                    )
                  ) : (
                    <Link
                      href="/auth/signup"
                      className={`block rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                        item.popular
                          ? "bg-loop-green text-white hover:bg-loop-green-dark"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {item.plan === "FREE" ? "Get started free" : "Get started"}
                    </Link>
                  )}
                </div>

                <ul className="mt-6 space-y-3">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-loop-green" />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          Need something custom?{" "}
          <a
            href="mailto:sales@loop.example.com"
            className="font-semibold text-loop-green hover:underline"
          >
            Talk to sales
          </a>
          .
        </p>
      </div>
    </main>
  )
}