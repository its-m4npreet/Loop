export default function PrivacyPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1 className="mb-2 text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="text-sm text-slate-500">Last updated: August 2026</p>

      <p className="mt-8 text-slate-600">
        This Privacy Policy explains how LOOP (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) collects,
        uses, and protects information when you use our customer feedback
        intelligence product (the &quot;Service&quot;).
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        1. Information We Collect
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-600">
        <li>
          <strong>Account information.</strong> Name, email address, and
          password (or sign-in provider account) when you register or are
          invited to a workspace.
        </li>
        <li>
          <strong>Workspace data.</strong> Customer feedback you import or
          enter, team members, reports, and your Ask LOOP conversations.
        </li>
        <li>
          <strong>Usage data.</strong> Pages visited, features used, and
          diagnostic logs used to operate and improve the Service.
        </li>        <li>
          <strong>Technical data.</strong> IP address, browser type, and device
          information for security and performance monitoring.
        </li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        2. How We Use Information
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-600">
        <li>Provide, maintain, and secure the Service.</li>
        <li>
          Analyze feedback using AI models to surface themes, sentiment, and
          insights.
        </li>
        <li>Send service notifications, such as team invitations.</li>
        <li>Respond to support requests and prevent abuse or fraud.</li>
        <li>Comply with legal obligations.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        3. AI Processing
      </h2>
      <p className="mt-3 text-slate-600">
        Feedback content you provide may be processed by third-party AI model
        providers (for example, Google Gemini) to generate summaries, themes,
        and recommendations. We transmit only the feedback data needed for the
        requested analysis. You are responsible for ensuring you have the right
        to share the feedback data you upload with the Service.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        4. Sharing and Disclosure
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-600">
        <li>
          <strong>Within your workspace.</strong> Data is shared with other
          members of your workspace according to their roles.
        </li>
        <li>
          <strong>Service providers.</strong> We use trusted sub-processors for
          hosting, databases, email delivery, and rate limiting. They may access
          data only as needed to provide their services.
        </li>
        <li>
          <strong>Legal requirements.</strong> We may disclose information when
          required by law or to protect our or others&apos; rights.
        </li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        5. Data Retention and Security
      </h2>
      <p className="mt-3 text-slate-600">
        We retain data for as long as your account is active or as needed to
        provide the Service. We use encryption in transit and at rest,
        access controls, and other safeguards. No method of transmission or
        storage is fully secure; we cannot guarantee absolute security.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        6. Your Rights
      </h2>
      <p className="mt-3 text-slate-600">
        Depending on your location, you may have rights to access, correct,
        export, or delete your data, and to object to certain processing.
        Contact us to exercise these rights.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        7. Children
      </h2>
      <p className="mt-3 text-slate-600">
        The Service is not directed at children under 13 (or the applicable age
        of consent in your jurisdiction), and we do not knowingly collect their
        data.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        8. Contact
      </h2>
      <p className="mt-3 text-slate-600">
        If you have questions about this Privacy Policy, contact us at{" "}
        <a
          href="mailto:privacy@loop.app"
          className="font-medium text-emerald-600 hover:underline"
        >
          privacy@loop.app
        </a>
        .
      </p>
    </article>
  )
}
