import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

export function CTABanner() {
  return (
    <section className="relative overflow-hidden bg-slate-50 py-20 sm:py-24">
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-100/60 blur-3xl" />
      <div className="absolute right-[-10%] top-[-10%] h-40 w-40 rounded-full bg-loop-green/10 blur-2xl" />
      <div className="absolute bottom-[-10%] left-[-10%] h-40 w-40 rounded-full bg-emerald-100/50 blur-2xl" />

      <div className="relative mx-auto max-w-3xl px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-14 text-center shadow-lg shadow-slate-200/60 sm:px-12 lg:py-16">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
            Ready to turn customer feedback into{" "}
            <span className="text-loop-green">business growth</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-slate-500 sm:text-base">
            Join 10,000+ teams using LOOP to ship what customers actually want.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-loop-green px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-200/70 transition-all hover:bg-loop-green-dark active:scale-[0.98]"
            >
              Request Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-loop-green" strokeWidth={2.5} />
              No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-loop-green" strokeWidth={2.5} />
              Free 14-day trial
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-loop-green" strokeWidth={2.5} />
              Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
