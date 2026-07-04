import { Star } from "lucide-react"

const testimonials = [
  {
    quote:
      "LOOP collapsed a week of feedback triage into a morning. We finally ship what customers actually ask for.",
    initials: "MC",
    name: "Mira Chen",
    role: "Head of Product · Northwind",
  },
  {
    quote:
      "The theme detection is uncanny. We caught a churn signal three weeks before it hit our dashboards.",
    initials: "DO",
    name: "Daniel Okafor",
    role: "VP Customer Experience · Fluxly",
  },
  {
    quote:
      "Ask LOOP is the closest thing to a research assistant we've ever had. Cited, fast, accurate.",
    initials: "PR",
    name: "Priya Raman",
    role: "Director of Research · Lumen",
  },
]

export function Testimonials() {
  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Loved by product teams
        </h2>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-loop-green"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-loop-green text-loop-green"
                  />
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-loop-green">
                  {item.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
