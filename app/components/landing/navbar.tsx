import Link from "next/link"
import { LoopLogo } from "../loop-logo"
import { RequestDemoButton } from "./request-demo-button"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: "#faq" },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/">
          <LoopLogo variant="landing" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <RequestDemoButton variant="outline" size="sm" />
      </div>
    </header>
  )
}
