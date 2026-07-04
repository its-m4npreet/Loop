import Link from "next/link"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    description: "For small teams getting started.",
    cta: "Request Demo",
    href: "/auth/signup",
    popular: false,
    features: [
      "Up to 1,000 feedback items",
      "Basic sentiment & themes",
      "2 integrations",
      "Email support",
    ],
  },
  {
    name: "Professional",
    price: "$99",
    period: "/mo",
    description: "For growing product teams.",
    cta: "Request Demo",
    href: "/auth/signup",
    popular: true,
    features: [
      "Unlimited feedback",
      "Advanced AI insights",
      "All integrations",
      "Ask LOOP AI",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations at scale.",
    cta: "Contact Sales",
    href: "/auth/signup",
    popular: false,
    features: [
      "SSO & SCIM",
      "Custom AI models",
      "Dedicated CSM",
      "SLA & DPA",
      "Onboarding",
    ],
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Start free. Scale when you&apos;re ready.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-xl border bg-white p-6 ${
                plan.popular
                  ? "border-loop-green shadow-lg shadow-emerald-100"
                  : "border-slate-200"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-loop-green px-3 py-0.5 text-xs font-semibold text-white uppercase">
                  Most Popular
                </span>
              )}

              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-slate-500">{plan.period}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600">{plan.description}</p>

              <Link
                href={plan.href}
                className="mt-6 block rounded-lg bg-loop-green py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-loop-green-dark"
              >
                {plan.cta}
              </Link>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-loop-green" />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
