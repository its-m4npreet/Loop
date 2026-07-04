import { Check, Play, Sparkles } from "lucide-react"
import Link from "next/link"
import { DashboardPreview } from "./dashboard-preview"
import { RequestDemoButton } from "./request-demo-button"

const trustItems = [
  "No credit card required",
  "Personalized walkthrough",
  "Cancel anytime",
]

const stats = [
  { value: "10K+", label: "Companies" },
  { value: "2M+", label: "Feedback Processed" },
  { value: "99.9%", label: "Accuracy" },
]

export function Hero() {
  return (
    <section className="bg-white pt-12 pb-0 sm:pt-16">
      <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-loop-green bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
          <Sparkles className="h-4 w-4 text-loop-green" />
          AI Powered Customer Intelligence
        </div>

        <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
          Turn Customer Feedback Into Better{" "}
          <span className="text-loop-green">Product Decisions</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Analyze customer feedback from support tickets, app reviews, surveys,
          emails, and conversations. Discover trends, sentiment, recurring
          issues, and AI-generated insights from one intelligent platform.
        </p>

        <div className="mx-auto mt-10 max-w-xl rounded-2xl  px-8 py-4 ">
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <RequestDemoButton />
            <Link
              href=""
              className="inline-flex items-center gap-2 rounded-xl border border-loop-green bg-transparent px-8 py-4 text-sm font-semibold text-loop-green transition-colors hover:bg-emerald-50"
            >
              <Play className="h-4 w-4" />
              Watch Demo
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center divide-x divide-slate-200 text-xs text-slate-600">
            {trustItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-4 first:pl-0 last:pr-0"
              >
                <Check className="h-3.5 w-3.5 text-loop-green" strokeWidth={2.5} />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-3 gap-6 border-t border-slate-100 pt-10">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs font-medium tracking-widest text-slate-400 uppercase">
          Trusted by product teams worldwide
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6 lg:px-8">
        <DashboardPreview compact />
      </div>
    </section>
  )
}
