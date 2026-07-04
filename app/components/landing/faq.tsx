"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"

const faqs = [
  {
    question: "What sources can LOOP analyze?",
    answer:
      "Support tickets, app reviews, NPS/CSAT surveys, sales calls, emails, social, and any custom source via API.",
  },
  {
    question: "How accurate is the AI?",
    answer:
      "LOOP achieves 99.9% classification accuracy on sentiment and themes, validated against human-labeled datasets across industries.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. We use enterprise-grade encryption, SOC 2 compliance, and offer SSO, SCIM, and DPA for Enterprise customers.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. There are no long-term contracts on Starter or Professional plans. Cancel with one click from your settings.",
  },
  {
    question: "Do you offer onboarding?",
    answer:
      "Professional plans include guided setup. Enterprise customers receive a dedicated CSM and custom onboarding program.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="faq" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Frequently asked questions
        </h2>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index

            return (
              <div
                key={faq.question}
                className="rounded-xl border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-slate-900 sm:text-base">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 pb-4">
                    <p className="pt-3 text-sm leading-relaxed text-slate-600">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
