"use client"

import { useState, useEffect } from "react"
import {
  BarChart3,
  Bell,
  ChevronDown,
  Download,
  Filter,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react"

type DashboardPreviewProps = {
  compact?: boolean
  variant?: "dashboard" | "import"
}

const dashboardNav = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: MessageSquare, label: "Feedback Inbox", badge: "24" },
  { icon: BarChart3, label: "Analytics" },
  { icon: TrendingUp, label: "Themes" },
  { icon: Sparkles, label: "Ask LOOP" },
  { icon: Download, label: "Reports" },
  { icon: Users, label: "Team" },
  { icon: Settings, label: "Settings" },
]

const importNav = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: MessageSquare, label: "Feedback Inbox", badge: "24" },
  { icon: BarChart3, label: "Analytics" },
  { icon: TrendingUp, label: "Themes" },
  { icon: Sparkles, label: "AI Loop", active: true },
  { icon: Download, label: "Reports" },
  { icon: Users, label: "Team" },
  { icon: Settings, label: "Settings" },
]

const kpis = [
  { label: "Total Feedback", value: "12,356", change: "+18%", positive: true },
  { label: "Positive", value: "72%", change: "+4.2%", positive: true },
  { label: "Negative", value: "18%", change: "-1.5%", positive: false },
  { label: "Neutral", value: "10%", change: "+0.3%", positive: true },
]

const themes = [
  { name: "Onboarding", count: "1240 mentions", color: "text-loop-green bg-emerald-50" },
  { name: "Billing", count: "864 mentions", color: "text-amber-600 bg-amber-50" },
  { name: "Performance", count: "612 mentions", color: "text-red-600 bg-red-50" },
]

const feedbackRows = [
  {
    customer: "Sara M.",
    feedback: "Loving the new dashboard spe...",
    channel: "App Review",
    sentiment: "Positive",
    date: "2h",
  },
  {
    customer: "Liam T.",
    feedback: "Billing page is confusing on...",
    channel: "Support",
    sentiment: "Negative",
    date: "5h",
  },
  {
    customer: "Anya P.",
    feedback: "Onboarding flow is much sm...",
    channel: "Survey",
    sentiment: "Positive",
    date: "1d",
  },
]

export function DashboardPreview({ compact = false, variant = "dashboard" }: DashboardPreviewProps) {
  const navItems = variant === "import" ? importNav : dashboardNav
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number; value: number } | null>(null)

  const chartPoints = [
    { y: 60, value: 28 },
    { y: 55, value: 36 },
    { y: 45, value: 50 },
    { y: 50, value: 43 },
    { y: 35, value: 64 },
    { y: 40, value: 57 },
    { y: 25, value: 79 },
    { y: 30, value: 71 },
    { y: 20, value: 86 },
    { y: 15, value: 93 },
    { y: 10, value: 100 },
  ]

  const interpolate = (svgX: number) => {
    const step = 300 / (chartPoints.length - 1)
    const index = Math.min(Math.floor(svgX / step), chartPoints.length - 2)
    const t = (svgX - index * step) / step
    return {
      y: chartPoints[index].y + (chartPoints[index + 1].y - chartPoints[index].y) * t,
      value: Math.round(chartPoints[index].value + (chartPoints[index + 1].value - chartPoints[index].value) * t),
    }
  }

  const handleMouseMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const svgX = Math.max(0, Math.min(300, ((e.clientX - rect.left) / rect.width) * 300))
    const { y, value } = interpolate(svgX)
    setHoverPos({ x: svgX, y, value })
  }

  const [donutHover, setDonutHover] = useState<string | null>(null)

  function arcPath(cx: number, cy: number, r: number, a1: number, a2: number) {
    const r1 = (a1 * Math.PI) / 180
    const r2 = (a2 * Math.PI) / 180
    const large = a2 - a1 > 180 ? 1 : 0
    return `M ${(cx + r * Math.cos(r1)).toFixed(2)} ${(cy + r * Math.sin(r1)).toFixed(2)} A ${r} ${r} 0 ${large} 1 ${(cx + r * Math.cos(r2)).toFixed(2)} ${(cy + r * Math.sin(r2)).toFixed(2)}`
  }

  const segs = [
    { k: "Positive", v: "72%", c: "#22c55e" },
    { k: "Neutral", v: "10%", c: "#94a3b8" },
    { k: "Negative", v: "18%", c: "#ef4444" },
  ]

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={`relative z-10 overflow-visible rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 ${
        compact ? "rounded-t-xl rounded-b-none border-b-0" : ""
      }`}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="mx-auto flex h-7 w-48 items-center justify-center rounded-md bg-white text-xs text-slate-400">
          app.loop.ai/{variant === "import" ? "ai-loop" : "dashboard"}
        </div>
      </div>

      <div className="flex min-h-0">
        {/* Sidebar */}
        <aside className="hidden w-44 shrink-0 border-r border-slate-100 bg-slate-50 p-3 sm:block lg:w-48">
          <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
            <div className="h-5 w-5 rounded bg-loop-green" />
            <span className="text-xs font-semibold text-slate-800">Acme Inc.</span>
            <ChevronDown className="ml-auto h-3 w-3 text-slate-400" />
          </div>

          <nav className="mt-4 space-y-0.5">
            {navItems.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                  item.active
                    ? "bg-emerald-50 font-medium text-loop-green"
                    : "text-slate-600"
                }`}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto rounded-full bg-slate-200 px-1.5 text-[10px] font-medium text-slate-600">
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </nav>

          <div className="mt-6 flex items-center gap-2 px-2 py-1.5 text-xs text-slate-500">
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1 p-3 sm:p-4">
          {/* Top bar */}
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate text-xs text-slate-400">
                Search feedback, themes, customers...
              </span>
            </div>
            <Bell className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" />
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-loop-green text-[10px] font-bold text-white">
              JD
            </div>
          </div>

          {/* Header */}
          {variant === "import" ? (
            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  AI Loop Chat
                </h3>
                <p className="text-[10px] text-slate-500 sm:text-xs">
                  Ask questions about your customer feedback data
                </p>
              </div>
              <div className="hidden items-center gap-1.5 sm:flex">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-loop-green bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-loop-green"
                >
                  <Sparkles className="h-3 w-3" />
                  AI Auto-Map
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  Customer Intelligence
                </h3>
                <p className="text-[10px] text-slate-500 sm:text-xs">
                  Live overview · Last 7 days
                </p>
              </div>
              <div className="hidden items-center gap-1.5 sm:flex">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600"
                >
                  <Filter className="h-3 w-3" />
                  Filter
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600"
                >
                  <Download className="h-3 w-3" />
                  Export PDF
                </button>
                <button
                  type="button"
                  className="rounded-md bg-loop-green px-2.5 py-1 text-[10px] font-semibold text-white"
                >
                  Generate Report
                </button>
              </div>
            </div>
          )}

          {variant === "import" ? (
            <>
              <div className="mt-3 flex flex-col gap-3">
                {[
                  { role: "ai", text: "Hello! I'm LOOP AI. I can help you analyze your customer feedback. What would you like to know?" },
                  { role: "user", text: "Show me recent negative feedback trends" },
                  { role: "ai", text: "I found 18% negative sentiment this week — down 1.5% from last week. The top issue is the **billing page UI**, mentioned 38 times. Here's a summary:\n\n• Billing confusion on mobile (14 mentions)\n• Pricing page unclear (12 mentions)\n• Invoice download issues (8 mentions)\n\nWould you like me to generate a report?" },
                ].map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                      msg.role === "ai" ? "bg-loop-green text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                      {msg.role === "ai" ? "AI" : "JD"}
                    </div>
                    <div className={`max-w-[80%] rounded-lg px-2.5 py-1.5 text-[9px] leading-relaxed ${
                      msg.role === "ai" ? "bg-slate-100 text-slate-700" : "bg-loop-green text-white"
                    }`}>
                      {msg.text.split("\n").map((line, j) => (
                        <span key={j}>{line}{j < msg.text.split("\n").length - 1 ? <br /> : null}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <input
                  type="text"
                  placeholder="Ask LOOP AI about your feedback..."
                  className="min-w-0 flex-1 bg-transparent text-[10px] text-slate-700 outline-none placeholder:text-slate-400"
                  readOnly
                />
                <button type="button" className="rounded-md bg-loop-green px-2.5 py-1 text-[9px] font-semibold text-white">
                  Send
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
                {kpis.map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-lg border border-slate-100 p-2 sm:p-2.5"
                  >
                    <p className="text-[10px] text-slate-500">{kpi.label}</p>
                    <div className="mt-0.5 flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-slate-900 sm:text-base">
                        {kpi.value}
                      </span>
                      <span
                        className={`text-[10px] font-medium ${
                          kpi.positive ? "text-loop-green" : "text-red-500"
                        }`}
                      >
                        {kpi.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 grid gap-2 lg:grid-cols-3">
                <div className="relative z-10 overflow-visible rounded-lg border border-slate-100 p-2 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-slate-800 sm:text-xs">
                      Feedback Over Time
                    </p>
                    <div className="flex gap-3 text-[9px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-loop-green" />
                        Positive
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        Negative
                      </span>
                    </div>
                  </div>
                  <div className="relative mt-2 h-16 sm:h-20">
                    <svg
                      viewBox="0 0 300 80"
                      className="h-full w-full"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                        </linearGradient>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.3" />
                        </filter>
                      </defs>
                      <path
                        d="M0,60 L30,55 L60,45 L90,50 L120,35 L150,40 L180,25 L210,30 L240,20 L270,15 L300,10 L300,80 L0,80 Z"
                        fill="url(#chartFill)"
                      />
                      <path
                        d="M0,60 L30,55 L60,45 L90,50 L120,35 L150,40 L180,25 L210,30 L240,20 L270,15 L300,10"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2"
                      />
                      {hoverPos && (
                        <g>
                          <line
                            x1={hoverPos.x}
                            y1={0}
                            x2={hoverPos.x}
                            y2={80}
                            stroke="#22c55e"
                            strokeWidth={1}
                            strokeDasharray="2,2"
                            opacity={0.5}
                          />
                          <circle cx={hoverPos.x} cy={hoverPos.y} r={5} fill="white" stroke="#22c55e" strokeWidth={2} />
                          <circle cx={hoverPos.x} cy={hoverPos.y} r={2} fill="#22c55e" />
                          {hoverPos.y > 25 ? (
                            <g>
                              <rect x={hoverPos.x - 18} y={hoverPos.y - 28} width={36} height={18} rx={4} fill="#22c55e" filter="url(#shadow)" />
                              <polygon points={`${hoverPos.x - 4},${hoverPos.y - 10} ${hoverPos.x + 4},${hoverPos.y - 10} ${hoverPos.x},${hoverPos.y - 6}`} fill="#22c55e" />
                              <text x={hoverPos.x} y={hoverPos.y - 16} textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">{hoverPos.value}</text>
                            </g>
                          ) : (
                            <g>
                              <rect x={hoverPos.x - 18} y={hoverPos.y + 10} width={36} height={18} rx={4} fill="#22c55e" filter="url(#shadow)" />
                              <polygon points={`${hoverPos.x - 4},${hoverPos.y + 6} ${hoverPos.x + 4},${hoverPos.y + 6} ${hoverPos.x},${hoverPos.y + 10}`} fill="#22c55e" />
                              <text x={hoverPos.x} y={hoverPos.y + 22} textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">{hoverPos.value}</text>
                            </g>
                          )}
                        </g>
                      )}
                    </svg>
                    <div
                      className="absolute inset-0 cursor-pointer"
                      onPointerMove={handleMouseMove}
                      onPointerLeave={() => setHoverPos(null)}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-100 p-2">
                  <p className="text-[10px] font-semibold text-slate-800 sm:text-xs">
                    Sentiment Distribution
                  </p>
                  <div className="relative mt-2 flex items-center justify-center">
                    <svg viewBox="0 0 36 36" className="h-16 w-16 sm:h-20 sm:w-20">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                      <path
                        d={arcPath(18, 18, 14, -90, -90 + 259.2)}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="4"
                        strokeLinecap="butt"
                        pathLength="100"
                        strokeDasharray="100"
                        strokeDashoffset={mounted ? 0 : 100}
                        className="cursor-pointer"
                        style={{ transition: "stroke-dashoffset 0.8s ease-out 50ms, opacity 0.15s" }}
                        opacity={!donutHover || donutHover === "Positive" ? 1 : 0.3}
                        onPointerEnter={() => setDonutHover("Positive")}
                        onPointerLeave={() => setDonutHover(null)}
                      />
                      <path
                        d={arcPath(18, 18, 14, -90 + 259.2, -90 + 259.2 + 64.8)}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="4"
                        strokeLinecap="butt"
                        pathLength="100"
                        strokeDasharray="100"
                        strokeDashoffset={mounted ? 0 : 100}
                        className="cursor-pointer"
                        style={{ transition: "stroke-dashoffset 0.6s ease-out 450ms, opacity 0.15s" }}
                        opacity={!donutHover || donutHover === "Negative" ? 1 : 0.3}
                        onPointerEnter={() => setDonutHover("Negative")}
                        onPointerLeave={() => setDonutHover(null)}
                      />
                      <path
                        d={arcPath(18, 18, 14, -90 + 259.2 + 64.8, 270)}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="4"
                        strokeLinecap="butt"
                        pathLength="100"
                        strokeDasharray="100"
                        strokeDashoffset={mounted ? 0 : 100}
                        className="cursor-pointer"
                        style={{ transition: "stroke-dashoffset 0.4s ease-out 750ms, opacity 0.15s" }}
                        opacity={!donutHover || donutHover === "Neutral" ? 1 : 0.3}
                        onPointerEnter={() => setDonutHover("Neutral")}
                        onPointerLeave={() => setDonutHover(null)}
                      />
                    </svg>
                    {donutHover && (
                      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-white/90 px-1 py-0.5 text-[10px] font-bold shadow-sm">
                        {segs.find((s) => s.k === donutHover)?.v}
                      </div>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5 text-[9px] text-slate-500">
                    {segs.map((s) => (
                      <p
                        key={s.k}
                        className={`cursor-pointer transition-opacity duration-150 ${
                          !donutHover || donutHover === s.k ? "opacity-100" : "opacity-40"
                        }`}
                        onPointerEnter={() => setDonutHover(s.k)}
                        onPointerLeave={() => setDonutHover(null)}
                      >
                        ● {s.k} {s.v}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {!compact && (
              <div className="mt-2 grid gap-2 lg:grid-cols-3">
                <div className="space-y-2 lg:col-span-2">
                  <div className="grid grid-cols-3 gap-2">
                    {themes.map((theme) => (
                      <div
                        key={theme.name}
                        className="rounded-lg border border-slate-100 p-2"
                      >
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-medium ${theme.color}`}
                        >
                          {theme.name}
                        </span>
                        <p className="mt-1 text-[10px] text-slate-600">
                          {theme.count}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-slate-100 p-2">
                    <p className="mb-2 text-[10px] font-semibold text-slate-800">
                      Recent Feedback
                    </p>
                    <table className="w-full text-[9px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-slate-400">
                          <th className="pb-1 font-medium">Customer</th>
                          <th className="pb-1 font-medium">Feedback</th>
                          <th className="hidden pb-1 font-medium sm:table-cell">
                            Channel
                          </th>
                          <th className="pb-1 font-medium">Sentiment</th>
                          <th className="pb-1 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feedbackRows.map((row) => (
                          <tr
                            key={row.customer}
                            className="border-b border-slate-50 text-slate-600"
                          >
                            <td className="py-1.5 font-medium text-slate-800">
                              {row.customer}
                            </td>
                            <td className="max-w-[80px] truncate py-1.5">
                              {row.feedback}
                            </td>
                            <td className="hidden py-1.5 sm:table-cell">
                              {row.channel}
                            </td>
                            <td className="py-1.5">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[8px] font-medium ${
                                  row.sentiment === "Positive"
                                    ? "bg-emerald-50 text-loop-green"
                                    : "bg-red-50 text-red-600"
                                }`}
                              >
                                {row.sentiment}
                              </span>
                            </td>
                            <td className="py-1.5 text-slate-400">{row.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-loop-green" />
                    <p className="text-[10px] font-semibold text-slate-800">
                      AI Insights
                    </p>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-[9px] font-semibold text-slate-700">
                        Weekly Summary
                      </p>
                      <p className="text-[9px] leading-relaxed text-slate-600">
                        Positive sentiment up 4.2%, driven by new onboarding flow.
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-700">
                        Top Issue
                      </p>
                      <p className="text-[9px] leading-relaxed text-slate-600">
                        Mobile billing UI flagged 38 times this week.
                      </p>
                    </div>
                    <div>
                      <p className="flex items-center gap-1 text-[9px] font-semibold text-slate-700">
                        <Lightbulb className="h-3 w-3" />
                        Recommended
                      </p>
                      <p className="text-[9px] leading-relaxed text-slate-600">
                        Ship new tooltip on the billing screen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
