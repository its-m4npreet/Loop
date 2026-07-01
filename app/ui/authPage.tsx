import { AuthForm } from "../components/auth-form";
import { LoopLogo } from "../components/loop-logo";

const features = [
  "Multi-channel feedback in one inbox",
  "Sentiment & theme detection on every message",
  "Ask LOOP — grounded answers from your real data",
];

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-loop-gradient">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        {/* Left — marketing */}
        <div className=" hidden lg:flex flex-1 flex-col justify-between px-6 py-1 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
          <LoopLogo />

          <div className="my-8 max-w-xl sm:my-12 lg:my-0 hidden lg:block">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              Close the loop on every piece of customer feedback.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:mt-6 sm:text-base lg:text-lg">
              LOOP ingests support tickets, app reviews, NPS surveys and sales
              notes, then uses AI to surface the themes that matter — so your
              team always knows what to build next.
            </p>
            <ul className="mt-6 space-y-2 sm:mt-8 sm:space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-loop-green" />
                  <span className="text-sm text-slate-700 sm:text-base">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 text-xs text-slate-400 sm:mt-0 hidden sm:block">
            © LOOP · Voice of Customer Platform
          </p>
        </div>

        {/* Right — auth card */}
        <div className="flex flex-1 items-center justify-center sm:px-8 sm:py-10 lg:px-16">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
