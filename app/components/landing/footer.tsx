import Link from "next/link"
import { Infinity } from "lucide-react"
import { FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6"

const footerLinks = {
  Product: ["Features", "Pricing", "Integrations", "Changelog"],
  Resources: ["Documentation", "Blog", "Guides", "API"],
  Company: ["About", "Contact", "Careers", "Partners"],
  Legal: ["Privacy Policy", "Terms", "Security", "DPA"],
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-10 sm:gap-y-10 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <Infinity className="h-7 w-7 text-loop-green" strokeWidth={2.5} />
              <span className="text-lg font-bold tracking-tight text-slate-900">
                LOOP
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
              AI customer feedback intelligence for product teams that ship.
            </p>
            <div className="mt-5 flex gap-3">
              {[
                { Icon: FaLinkedin, label: "LinkedIn" },
                { Icon: FaGithub, label: "GitHub" },
                { Icon: FaXTwitter, label: "Twitter" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading} className="min-w-0">
              <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
                {heading}
              </h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-3 border-t border-slate-200 pt-8 text-center sm:grid-cols-2 sm:text-left">
          <p className="text-sm text-slate-400 sm:text-left">
            © 2026 LOOP, Inc. All rights reserved.
          </p>
          <p className="text-sm text-slate-400 sm:text-right">
            Made for product teams worldwide.
          </p>
        </div>
      </div>
    </footer>
  )
}
