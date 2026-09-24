import type { Metadata } from "next"
import { Navbar } from "@/app/components/landing/navbar"
import { Footer } from "@/app/components/landing/footer"

export const metadata: Metadata = {
  title: "Legal — LOOP",
  description:
    "LOOP privacy policy and terms of service for customer feedback intelligence.",
}

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-16 sm:px-8">{children}</main>
      <Footer />
    </div>
  )
}
