"use client"
import { DashboardPreview } from "./dashboard-preview"

export function WorkspacePreview() {
  return (
    <section id="ask-loop" className="scroll-mt-20 bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Chat with{" "}
            <span className="text-loop-green">Ask LOOP</span>
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Ask questions, uncover trends, and get instant insights from your
            customer feedback — the same experience as the product chat.
          </p>
        </div>

        <div className="mt-14">
          <DashboardPreview variant="ask-loop" />
        </div>
      </div>
    </section>
  )
}
