export default function TermsPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1 className="mb-2 text-3xl font-bold text-slate-900">
        Terms of Service
      </h1>
      <p className="text-sm text-slate-500">Last updated: August 2026</p>

      <p className="mt-8 text-slate-600">
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of LOOP
        (the &quot;Service&quot;). By using the Service, you agree to these Terms.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        1. Your Account
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-600">
        <li>You must be at least 13 years old to use the Service.</li>
        <li>
          You are responsible for maintaining the confidentiality of your
          credentials and for all activity under your account.
        </li>
        <li>
          You must provide accurate account information and keep it current.
        </li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        2. Acceptable Use
      </h2>
      <p className="mt-3 text-slate-600">
        You agree not to: misuse or attempt to gain unauthorized access to the
        Service; upload unlawful, infringing, or harmful content; attempt to
        disrupt or overload our systems; scrape or reverse-engineer the
        Service; or use it to violate any applicable law.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        3. Your Content
      </h2>
      <p className="mt-3 text-slate-600">
        You retain ownership of the feedback data you upload. You grant us a
        limited license to store, process, and transmit that data solely to
        provide the Service. You represent that you have the rights to upload
        and share any content you submit.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        4. AI-Generated Content
      </h2>
      <p className="mt-3 text-slate-600">
        The Service uses AI to generate summaries and insights. AI outputs are
        provided as-is, may be incomplete or inaccurate, and should be reviewed
        before acting on them. AI outputs do not constitute professional advice.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        5. Fees and Payment
      </h2>
      <p className="mt-3 text-slate-600">
        Paid plans are billed in advance on the terms agreed at purchase.
        Prices may change with notice. Fees are non-refundable except where
        required by law.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        6. Termination
      </h2>
      <p className="mt-3 text-slate-600">
        You may stop using the Service at any time. We may suspend or terminate
        access for violations of these Terms. On termination, you may export
        your data during a reasonable wind-down period.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        7. Disclaimers and Liability
      </h2>
      <p className="mt-3 text-slate-600">
        The Service is provided &quot;as is&quot; without warranties of any kind. To the
        maximum extent permitted by law, our total liability arising from the
        Service is limited to the amounts you paid us in the twelve (12) months
        preceding the claim.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        8. Changes
      </h2>
      <p className="mt-3 text-slate-600">
        We may update these Terms from time to time. We will post the updated
        Terms here with a revised date. Continued use of the Service after
        changes constitutes acceptance.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">9. Contact</h2>
      <p className="mt-3 text-slate-600">
        Questions about these Terms? Contact us at{" "}
        <a
          href="mailto:legal@loop.app"
          className="font-medium text-emerald-600 hover:underline"
        >
          legal@loop.app
        </a>
        .
      </p>
    </article>
  )
}
