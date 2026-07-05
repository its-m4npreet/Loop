import { CTABanner } from "./cta-banner"
import { FAQ } from "./faq"
import { Features } from "./features"
import { Footer } from "./footer"
import { Hero } from "./hero"
import { HowItWorks } from "./how-it-works"
import { Navbar } from "./navbar"
import { Pricing } from "./pricing"
import { Testimonials } from "./testimonials"
import { TrustBar } from "./trust-bar"
import { WorkspacePreview } from "./workspace-preview"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <Features />
        <WorkspacePreview />
        <HowItWorks />
        <Testimonials />
        {/* <Pricing /> */}
        <FAQ />
        <CTABanner />
      </main>
      <Footer />
    </div>
  )
}
