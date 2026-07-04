const steps = [
  {
    number: "01",
    title: "Collect Feedback",
    description:
      "Connect support, reviews, surveys, and chats in minutes.",
  },
  {
    number: "02",
    title: "Analyze With AI",
    description:
      "LOOP classifies sentiment, intent, and themes automatically.",
  },
  {
    number: "03",
    title: "Detect Trends",
    description:
      "Spot emerging issues and opportunities before they scale.",
  },
  {
    number: "04",
    title: "Generate Reports",
    description: "Share insights with stakeholders in one click.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Four steps from raw feedback to decisions.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-loop-green"
            >
              <span className="text-sm font-bold text-loop-green">
                {step.number}
              </span>
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
