"use client"

import { useEffect, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  BookOpen,
  Bot,
  Download,
  FileBarChart,
  FileText,
  FolderOpen,
  History,
  Infinity as LoopMark,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  MessageSquare,
  Plus,
  Send,
  Settings,
  Sparkles,
  Tag,
  Minus,
  ThumbsDown,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react"

type DashboardPreviewProps = {
  compact?: boolean
  /** @deprecated use "ask-loop" */
  variant?: "dashboard" | "ask-loop" | "import"
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: MessageSquare, label: "Feedback Inbox", id: "feedback-inbox" },
  { icon: Download, label: "Import Feedback", id: "import-feedback" },
  { icon: BarChart2, label: "Analytics", id: "analytics" },
  { icon: Tag, label: "Themes", id: "themes" },
  { icon: Bot, label: "Ask LOOP", id: "ask-loop" },
  { icon: FileText, label: "Reports", id: "reports" },
  { icon: Users, label: "Team", id: "team" },
  { icon: Settings, label: "Settings", id: "settings" },
]

const kpis = [
  {
    id: "total-feedback",
    title: "Total Feedback",
    value: "12,847",
    change: "+18%",
    changeType: "positive" as const,
    description: "vs last week",
    icon: MessageSquare,
    color: "#60A5FA",
    bg: "#EFF6FF",
  },
  {
    id: "positive-sentiment",
    title: "Positive Sentiment",
    value: "7,312",
    change: "+12%",
    changeType: "positive" as const,
    description: "vs last week",
    icon: ThumbsUp,
    color: "#22C55E",
    bg: "#F0FDF4",
  },
  {
    id: "negative-sentiment",
    title: "Negative Sentiment",
    value: "2,140",
    change: "-5%",
    changeType: "positive" as const,
    description: "vs last week",
    icon: ThumbsDown,
    color: "#F87171",
    bg: "#FEF2F2",
  },
  {
    id: "neutral-sentiment",
    title: "Neutral Sentiment",
    value: "3,395",
    change: "+3%",
    changeType: "positive" as const,
    description: "vs last week",
    icon: Minus,
    color: "#94A3B8",
    bg: "#F8FAFC",
  },
  {
    id: "active-themes",
    title: "Active Themes",
    value: "24",
    change: "+4%",
    changeType: "positive" as const,
    description: "mentions vs last week",
    icon: Tag,
    color: "#A78BFA",
    bg: "#F5F3FF",
  },
  {
    id: "reports-generated",
    title: "Reports Generated",
    value: "138",
    change: "+22%",
    changeType: "positive" as const,
    description: "vs last week",
    icon: FileText,
    color: "#FB923C",
    bg: "#FFF7ED",
  },
]

const volumePoints = [
  { date: "Jun 27", count: 32 },
  { date: "Jun 28", count: 45 },
  { date: "Jun 29", count: 39 },
  { date: "Jun 30", count: 52 },
  { date: "Jul 1", count: 61 },
  { date: "Jul 2", count: 48 },
  { date: "Jul 3", count: 74 },
]

const sentimentSegs = [
  { name: "Positive", value: 57, color: "#22C55E" },
  { name: "Neutral", value: 26, color: "#94A3B8" },
  { name: "Negative", value: 17, color: "#F87171" },
]

const topThemesBars = [
  { theme: "Billing", mentions: 92 },
  { theme: "Onboarding", mentions: 76 },
  { theme: "Performance", mentions: 55 },
  { theme: "Support", mentions: 44 },
]

const channelBars = [
  { channel: "Email", count: 84 },
  { channel: "In-App", count: 74 },
  { channel: "Chat", count: 55 },
  { channel: "App Store", count: 28 },
]

const themeCards = [
  {
    name: "Billing",
    mentions: "1,842",
    weeklyGrowth: "+18%",
    growthType: "negative" as const,
    color: "#F87171",
    bg: "#FEF2F2",
  },
  {
    name: "Onboarding",
    mentions: "1,527",
    weeklyGrowth: "+34%",
    growthType: "positive" as const,
    color: "#22C55E",
    bg: "#F0FDF4",
  },
  {
    name: "Performance",
    mentions: "1,103",
    weeklyGrowth: "-7%",
    growthType: "positive" as const,
    color: "#FB923C",
    bg: "#FFF7ED",
  },
  {
    name: "Support Quality",
    mentions: "892",
    weeklyGrowth: "+9%",
    growthType: "positive" as const,
    color: "#60A5FA",
    bg: "#EFF6FF",
  },
]

const feedbackRows = [
  {
    customer: "Aisha Patel",
    feedback: "The billing page is really confusing...",
    channel: "Email",
    theme: "Billing",
    sentiment: "Negative",
    status: "Open",
    time: "2m ago",
  },
  {
    customer: "Marcus Johnson",
    feedback: "Onboarding tutorial made setup easy.",
    channel: "In-App",
    theme: "Onboarding",
    sentiment: "Positive",
    status: "Resolved",
    time: "18m ago",
  },
  {
    customer: "Sofia Reyes",
    feedback: "App freezes when exporting reports.",
    channel: "Support Chat",
    theme: "Performance",
    sentiment: "Negative",
    status: "In Progress",
    time: "1h ago",
  },
]

const askSuggestions = [
  {
    icon: TrendingUp,
    text: "What are the top feedback themes this week?",
    color: "#22C55E",
    bg: "#F0FDF4",
  },
  {
    icon: AlertTriangle,
    text: "Are there any negative sentiment spikes?",
    color: "#F87171",
    bg: "#FEF2F2",
  },
  {
    icon: Lightbulb,
    text: "What improvements do customers want most?",
    color: "#A78BFA",
    bg: "#F5F3FF",
  },
  {
    icon: Sparkles,
    text: "Summarize recent feedback for me",
    color: "#FB923C",
    bg: "#FFF7ED",
  },
]

function arcPath(cx: number, cy: number, r: number, a1: number, a2: number) {
  const r1 = (a1 * Math.PI) / 180
  const r2 = (a2 * Math.PI) / 180
  const large = a2 - a1 > 180 ? 1 : 0
  return `M ${(cx + r * Math.cos(r1)).toFixed(2)} ${(cy + r * Math.sin(r1)).toFixed(2)} A ${r} ${r} 0 ${large} 1 ${(cx + r * Math.cos(r2)).toFixed(2)} ${(cy + r * Math.sin(r2)).toFixed(2)}`
}

function PreviewSidebar({ activeId }: { activeId: string }) {
  return (
    <aside className="hidden w-44 shrink-0 border-r border-slate-100 bg-white p-0 sm:flex sm:flex-col lg:w-48">
      <div className="flex h-11 items-center gap-2 border-b border-slate-100 px-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-loop-green to-emerald-600 text-white shadow-sm shadow-emerald-200">
          <LoopMark className="h-3.5 w-3.5" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[11px] font-extrabold tracking-tight text-slate-900">
            LOOP
          </p>
          <p className="truncate text-[8px] font-medium tracking-wider text-slate-400 uppercase">
            AI Intelligence
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-hidden px-2 py-3">
        <p className="mb-1.5 px-2 text-[8px] font-semibold tracking-wider text-slate-400 uppercase">
          Main Menu
        </p>
        {navItems.map((item) => {
          const active = item.id === activeId
          return (
            <div
              key={item.id}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] ${
                active
                  ? "bg-emerald-50 font-semibold text-loop-green"
                  : "text-slate-600"
              }`}
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
          )
        })}

        <div className="my-2 border-t border-slate-100" />

        <p className="mb-1.5 px-2 text-[8px] font-semibold tracking-wider text-slate-400 uppercase">
          Workspace
        </p>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 text-[10px] font-medium text-slate-700">
          <FolderOpen className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="truncate">Acme Product</span>
        </div>
      </nav>

      <div className="border-t border-slate-100 px-2 py-2">
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] text-slate-500">
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </div>
      </div>
    </aside>
  )
}

function PreviewTopBar() {
  return (
    <div className="flex items-center justify-end gap-2 border-b border-slate-100 pb-2.5">
      <div className="hidden items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 sm:inline-flex">
        <Upload className="h-3 w-3" />
        Import
      </div>
      <div className="hidden items-center gap-1.5 rounded-md bg-loop-green px-2 py-1 text-[10px] font-semibold text-white sm:inline-flex">
        <FileBarChart className="h-3 w-3" />
        Generate Report
      </div>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-loop-green text-[10px] font-bold text-white">
        JD
      </div>
    </div>
  )
}

function volumePath() {
  const max = Math.max(...volumePoints.map((p) => p.count))
  const w = 300
  const h = 70
  const step = w / (volumePoints.length - 1)
  const points = volumePoints.map((p, i) => {
    const x = i * step
    const y = h - (p.count / max) * (h - 8) - 4
    return { x, y }
  })
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
  const area = `${line} L${w},${h} L0,${h} Z`
  return { line, area, points }
}

export function DashboardPreview({
  compact = false,
  variant = "dashboard",
}: DashboardPreviewProps) {
  const isAskLoop = variant === "ask-loop" || variant === "import"
  const activeNav = isAskLoop ? "ask-loop" : "dashboard"
  const [donutHover, setDonutHover] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const { line, area } = volumePath()
  const maxTheme = Math.max(...topThemesBars.map((t) => t.mentions))
  const maxChannel = Math.max(...channelBars.map((c) => c.count))

  // Donut arcs from -90° (top), positive 57%, neutral 26%, negative 17%
  const posEnd = -90 + 57 * 3.6
  const neuEnd = posEnd + 26 * 3.6

  return (
    <div
      className={`relative z-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 ${
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
        <div className="mx-auto flex h-7 w-52 items-center justify-center rounded-md bg-white text-xs text-slate-400">
          app.loop.ai/{isAskLoop ? "ask-loop" : "dashboard"}
        </div>
      </div>

      <div className="flex min-h-0">
        <PreviewSidebar activeId={activeNav} />

        <div className="min-w-0 flex-1 p-3 sm:p-4">
          <PreviewTopBar />

          {isAskLoop ? (
            <div className="mt-3 flex min-h-[320px] flex-col">
              {/* Ask LOOP toolbar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-loop-green text-white">
                    <LoopMark className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                  <span className="text-xs font-extrabold tracking-tight text-slate-900 sm:text-sm">
                    Ask LOOP
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md bg-loop-green px-2 py-1 text-[10px] font-semibold text-white"
                    onClick={() => setShowChat(false)}
                  >
                    <Plus className="h-3 w-3" />
                    New chat
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600"
                  >
                    <History className="h-3 w-3" />
                    History
                    <span className="rounded-full bg-slate-100 px-1.5 text-[9px] font-bold text-slate-500">
                      3
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-xl border border-slate-100 bg-slate-50/50">
                {!showChat ? (
                  <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 text-center">
                    <div className="mb-3 flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-loop-green text-white shadow-md shadow-emerald-200">
                        <LoopMark className="h-7 w-7" strokeWidth={2.5} />
                      </div>
                      <span className="text-sm font-extrabold tracking-tight text-slate-900">
                        LOOP
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                      Hello! I&apos;m LOOP AI
                    </h3>
                    <p className="mt-1 max-w-sm text-[10px] text-slate-500 sm:text-xs">
                      Ask me anything about your feedback data. Here are some
                      suggestions:
                    </p>
                    <div className="mt-4 grid w-full max-w-lg gap-2 sm:grid-cols-2">
                      {askSuggestions.map((s) => (
                        <button
                          key={s.text}
                          type="button"
                          className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left transition-colors hover:border-loop-green"
                          onClick={() => setShowChat(true)}
                        >
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                            style={{ background: s.bg, color: s.color }}
                          >
                            <s.icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-[9px] leading-snug font-medium text-slate-700 sm:text-[10px]">
                            {s.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-3 overflow-hidden p-3">
                    <div className="flex flex-row-reverse gap-2">
                      <div className="max-w-[80%] rounded-lg bg-loop-green px-2.5 py-1.5 text-[10px] text-white">
                        What are the top feedback themes this week?
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-loop-green text-white">
                        <LoopMark className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </div>
                      <div className="max-w-[85%] rounded-lg bg-white px-2.5 py-2 text-[10px] leading-relaxed text-slate-700 shadow-sm ring-1 ring-slate-100">
                        <p className="font-semibold text-slate-900">
                          Top themes this week
                        </p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-3.5">
                          <li>
                            <strong>Billing</strong> — 1,842 mentions (+18%)
                          </li>
                          <li>
                            <strong>Onboarding</strong> — 1,527 mentions (+34%)
                          </li>
                          <li>
                            <strong>Performance</strong> — 1,103 mentions (−7%)
                          </li>
                        </ul>
                        <p className="mt-1.5 text-slate-600">
                          Billing complaints spiked mid-week around invoice
                          clarity. Want a full report?
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 border-t border-slate-100 bg-white p-2.5">
                  <input
                    type="text"
                    readOnly
                    placeholder="Ask LOOP about your feedback data…"
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-700 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg bg-loop-green px-2.5 py-2 text-[10px] font-semibold text-white"
                    onClick={() => setShowChat(true)}
                  >
                    <Send className="h-3 w-3" />
                    Ask
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Dashboard page header */}
              <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                    Customer Intelligence Dashboard
                  </h3>
                  <p className="mt-0.5 max-w-md text-[10px] leading-snug text-slate-500 sm:text-xs">
                    Monitor customer feedback, AI insights, sentiment and trends
                    in real time.
                  </p>
                </div>
                <div className="hidden items-center gap-1.5 sm:flex">
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600">
                    <Upload className="h-3 w-3" />
                    Import Feedback
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-loop-green px-2.5 py-1 text-[10px] font-semibold text-white">
                    <FileBarChart className="h-3 w-3" />
                    Generate Report
                  </span>
                </div>
              </div>

              {/* KPI stats — 6 cards like real dashboard */}
              <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
                {(compact ? kpis.slice(0, 4) : kpis).map((kpi) => (
                  <div
                    key={kpi.id}
                    className="rounded-lg border border-slate-100 bg-white p-2 sm:p-2.5"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-[9px] font-medium text-slate-500 sm:text-[10px]">
                        {kpi.title}
                      </p>
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                        style={{ background: kpi.bg, color: kpi.color }}
                      >
                        <kpi.icon className="h-3 w-3" />
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-extrabold text-slate-900 sm:text-base">
                      {kpi.value}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-0.5 text-[9px] font-semibold ${
                          kpi.changeType === "positive"
                            ? "text-loop-green"
                            : "text-red-500"
                        }`}
                      >
                        {kpi.changeType === "positive" ? (
                          <TrendingUp className="h-2.5 w-2.5" />
                        ) : (
                          <TrendingDown className="h-2.5 w-2.5" />
                        )}
                        {kpi.change}
                      </span>
                      <span className="truncate text-[8px] text-slate-400">
                        {kpi.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts row: volume + sentiment */}
              <div className="mt-2 grid gap-2 lg:grid-cols-3">
                <div className="rounded-lg border border-slate-100 p-2 lg:col-span-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-800 sm:text-xs">
                        Feedback Volume Over Time
                      </p>
                      <p className="text-[9px] text-slate-400">Last 7 days</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-semibold text-loop-green">
                      ↑ 18% this week
                    </span>
                  </div>
                  <div className="mt-2 h-16 sm:h-20">
                    <svg
                      viewBox="0 0 300 70"
                      className="h-full w-full"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id="previewVolFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#22c55e"
                            stopOpacity="0.2"
                          />
                          <stop
                            offset="100%"
                            stopColor="#22c55e"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      <path d={area} fill="url(#previewVolFill)" />
                      <path
                        d={line}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-100 p-2">
                  <p className="text-[10px] font-semibold text-slate-800 sm:text-xs">
                    Sentiment Distribution
                  </p>
                  <p className="text-[9px] text-slate-400">This week</p>
                  <div className="relative mt-1 flex items-center gap-2">
                    <svg viewBox="0 0 36 36" className="h-14 w-14 shrink-0 sm:h-16 sm:w-16">
                      <circle
                        cx="18"
                        cy="18"
                        r="12"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="5"
                      />
                      <path
                        d={arcPath(18, 18, 12, -90, posEnd)}
                        fill="none"
                        stroke="#22C55E"
                        strokeWidth="5"
                        pathLength="100"
                        strokeDasharray="100"
                        strokeDashoffset={mounted ? 0 : 100}
                        style={{
                          transition: "stroke-dashoffset 0.8s ease-out",
                          opacity:
                            !donutHover || donutHover === "Positive" ? 1 : 0.3,
                        }}
                        className="cursor-pointer"
                        onPointerEnter={() => setDonutHover("Positive")}
                        onPointerLeave={() => setDonutHover(null)}
                      />
                      <path
                        d={arcPath(18, 18, 12, posEnd, neuEnd)}
                        fill="none"
                        stroke="#94A3B8"
                        strokeWidth="5"
                        pathLength="100"
                        strokeDasharray="100"
                        strokeDashoffset={mounted ? 0 : 100}
                        style={{
                          transition: "stroke-dashoffset 0.6s ease-out 0.2s",
                          opacity:
                            !donutHover || donutHover === "Neutral" ? 1 : 0.3,
                        }}
                        className="cursor-pointer"
                        onPointerEnter={() => setDonutHover("Neutral")}
                        onPointerLeave={() => setDonutHover(null)}
                      />
                      <path
                        d={arcPath(18, 18, 12, neuEnd, 270)}
                        fill="none"
                        stroke="#F87171"
                        strokeWidth="5"
                        pathLength="100"
                        strokeDasharray="100"
                        strokeDashoffset={mounted ? 0 : 100}
                        style={{
                          transition: "stroke-dashoffset 0.5s ease-out 0.35s",
                          opacity:
                            !donutHover || donutHover === "Negative" ? 1 : 0.3,
                        }}
                        className="cursor-pointer"
                        onPointerEnter={() => setDonutHover("Negative")}
                        onPointerLeave={() => setDonutHover(null)}
                      />
                    </svg>
                    <div className="min-w-0 flex-1 space-y-1 text-[9px]">
                      {sentimentSegs.map((s) => (
                        <div
                          key={s.name}
                          className={`flex items-center gap-1.5 transition-opacity ${
                            !donutHover || donutHover === s.name
                              ? "opacity-100"
                              : "opacity-40"
                          }`}
                          onPointerEnter={() => setDonutHover(s.name)}
                          onPointerLeave={() => setDonutHover(null)}
                        >
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: s.color }}
                          />
                          <span className="truncate text-slate-500">{s.name}</span>
                          <span className="ml-auto font-semibold text-slate-700">
                            {s.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Second chart row: top themes + channels */}
              {!compact && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-100 p-2">
                    <p className="text-[10px] font-semibold text-slate-800 sm:text-xs">
                      Top Themes
                    </p>
                    <p className="text-[9px] text-slate-400">By mention volume</p>
                    <div className="mt-2 space-y-1.5">
                      {topThemesBars.map((t, i) => (
                        <div key={t.theme} className="flex items-center gap-2">
                          <span className="w-16 shrink-0 truncate text-[9px] text-slate-600">
                            {t.theme}
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(t.mentions / maxTheme) * 100}%`,
                                background: [
                                  "#22C55E",
                                  "#16A34A",
                                  "#4ADE80",
                                  "#86EFAC",
                                ][i],
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-100 p-2">
                    <p className="text-[10px] font-semibold text-slate-800 sm:text-xs">
                      Feedback by Channel
                    </p>
                    <p className="text-[9px] text-slate-400">
                      Across all platforms
                    </p>
                    <div className="mt-2 flex h-16 items-end gap-1.5 sm:h-20">
                      {channelBars.map((c) => (
                        <div
                          key={c.channel}
                          className="flex min-w-0 flex-1 flex-col items-center gap-1"
                        >
                          <div
                            className="w-full rounded-t-sm bg-loop-green/80"
                            style={{
                              height: `${(c.count / maxChannel) * 100}%`,
                              minHeight: 6,
                            }}
                          />
                          <span className="w-full truncate text-center text-[8px] text-slate-400">
                            {c.channel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Insights + themes + table (full preview only) */}
              {!compact && (
                <>
                  <div className="mt-2 rounded-lg border border-slate-100 p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-loop-green">
                        <Bot className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold text-slate-800 sm:text-xs">
                          AI Insights
                        </p>
                        <p className="text-[9px] text-slate-400">
                          Powered by your workspace data
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-semibold text-loop-green">
                        <span className="h-1.5 w-1.5 rounded-full bg-loop-green" />
                        Live Analysis
                      </span>
                    </div>
                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        {
                          icon: BookOpen,
                          label: "Weekly Summary",
                          detail:
                            "Feedback volume +18%. Billing complaints spiked; onboarding improved after the tutorial update.",
                          type: "summary",
                        },
                        {
                          icon: AlertCircle,
                          label: "Top Issue",
                          title: "Billing Complaints Surge",
                          detail:
                            "Up 18% WoW — invoice confusion and failed payment retries.",
                          type: "issue",
                        },
                        {
                          icon: Lightbulb,
                          label: "Recommendation",
                          title: "Improve Billing Experience",
                          detail:
                            "Simplify invoice UI and add proactive payment notifications.",
                          type: "recommendation",
                        },
                        {
                          icon: AlertTriangle,
                          label: "Risk Alert",
                          title: "Churn Risk Detected",
                          detail:
                            "240 enterprise accounts with 3+ negative entries this week.",
                          type: "risk",
                        },
                        {
                          icon: ThumbsUp,
                          label: "Positive Highlight",
                          detail:
                            "Onboarding NPS mentions improved 34% after the new flow.",
                          type: "positive",
                        },
                      ].map((card) => (
                        <div
                          key={card.label}
                          className="rounded-md border border-slate-100 bg-slate-50/80 p-2"
                        >
                          <div className="flex items-center gap-1.5">
                            <card.icon className="h-3 w-3 text-loop-green" />
                            <span className="text-[8px] font-semibold tracking-wide text-slate-500 uppercase">
                              {card.label}
                            </span>
                          </div>
                          {"title" in card && card.title && (
                            <p className="mt-1 text-[9px] font-semibold text-slate-800">
                              {card.title}
                            </p>
                          )}
                          <p className="mt-0.5 text-[9px] leading-relaxed text-slate-600">
                            {card.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="mb-1.5 text-[10px] font-semibold text-slate-800 sm:text-xs">
                      Top Themes
                    </p>
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                      {themeCards.map((theme) => (
                        <div
                          key={theme.name}
                          className="rounded-lg border border-slate-100 p-2"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="flex h-5 w-5 items-center justify-center rounded-md"
                              style={{
                                background: theme.bg,
                                color: theme.color,
                              }}
                            >
                              <Tag className="h-3 w-3" />
                            </span>
                            <span className="truncate text-[10px] font-semibold text-slate-800">
                              {theme.name}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm font-bold text-slate-900">
                            {theme.mentions}
                          </p>
                          <p className="text-[8px] text-slate-400">mentions</p>
                          <p
                            className={`mt-1 inline-flex items-center gap-0.5 text-[9px] font-semibold ${
                              theme.growthType === "positive"
                                ? "text-loop-green"
                                : "text-red-500"
                            }`}
                          >
                            {theme.growthType === "positive" ? (
                              <TrendingUp className="h-2.5 w-2.5" />
                            ) : (
                              <TrendingDown className="h-2.5 w-2.5" />
                            )}
                            {theme.weeklyGrowth} this week
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 rounded-lg border border-slate-100 p-2">
                    <p className="mb-2 text-[10px] font-semibold text-slate-800 sm:text-xs">
                      Recent Feedback
                    </p>
                    <table className="w-full text-[9px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-slate-400">
                          <th className="pb-1.5 font-medium">Customer</th>
                          <th className="pb-1.5 font-medium">Feedback</th>
                          <th className="hidden pb-1.5 font-medium sm:table-cell">
                            Channel
                          </th>
                          <th className="hidden pb-1.5 font-medium md:table-cell">
                            Theme
                          </th>
                          <th className="pb-1.5 font-medium">Sentiment</th>
                          <th className="hidden pb-1.5 font-medium sm:table-cell">
                            Status
                          </th>
                          <th className="pb-1.5 font-medium">Time</th>
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
                            <td className="max-w-[100px] truncate py-1.5">
                              {row.feedback}
                            </td>
                            <td className="hidden py-1.5 sm:table-cell">
                              {row.channel}
                            </td>
                            <td className="hidden py-1.5 md:table-cell">
                              {row.theme}
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
                            <td className="hidden py-1.5 sm:table-cell">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-medium text-slate-600">
                                {row.status}
                              </span>
                            </td>
                            <td className="py-1.5 text-slate-400">{row.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
