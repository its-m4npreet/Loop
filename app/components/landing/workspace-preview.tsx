"use client"

import { motion } from "framer-motion"
import { DashboardPreview } from "./dashboard-preview"

export function WorkspacePreview() {
  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            A complete{" "}
            <span className="text-loop-green">intelligence workspace</span>
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Dashboards, analytics, themes, reports, and AI — built for product
            teams that ship.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mt-14"
        >
          <DashboardPreview />
        </motion.div>
      </div>
    </section>
  )
}
