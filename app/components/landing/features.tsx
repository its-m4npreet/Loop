import {
  Activity,
  FileText,
  LineChart,
  MessageSquare,
  Search,
  Sparkles,
} from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "AI Feedback Classification",
    description:
      "Auto-categorize every signal into themes, intents, and impact in real time.",
  },
  {
    icon: Activity,
    title: "Sentiment Analysis",
    description:
      "Understand how customers feel across channels, segments, and releases.",
  },
  {
    icon: Search,
    title: "Theme Detection",
    description:
      "Surface recurring topics, complaints, and requests as they emerge.",
  },
  {
    icon: LineChart,
    title: "Trend Monitoring",
    description:
      "Track shifts week-over-week with anomaly alerts on critical themes.",
  },
  {
    icon: MessageSquare,
    title: "Ask LOOP AI",
    description:
      "Chat with all your feedback. Get answers cited from real customer voice.",
  },
  {
    icon: Sparkles,
    title: "Smart Reports",
    description:
      "One-click executive reports built from the insights that move metrics.",
  },
]

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to{" "}
            <span className="text-loop-green">understand your customers</span>
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Transform customer feedback into business growth using AI.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-loop-green"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                <feature.icon className="h-5 w-5 text-loop-green" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
