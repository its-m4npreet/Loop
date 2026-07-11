import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Plus, Search } from 'lucide-react'

import ThemeCard, { type Theme } from '../../components/cards/ThemeCard'
import TopThemesChart from '../../components/chats/TopThemesChart'
import './page.css'

const themesData: Theme[] = [
  { id: '1', name: 'UI / UX', icon: 'Monitor', color: '#60A5FA', bgColor: '#EFF6FF', mentions: 1248, weeklyGrowth: '+16%', growthType: 'positive' as const },
  { id: '2', name: 'Pricing', icon: 'DollarSign', color: '#22C55E', bgColor: '#F0FDF4', mentions: 892, weeklyGrowth: '+9%', growthType: 'positive' as const },
  { id: '3', name: 'Customer Support', icon: 'Headphones', color: '#A78BFA', bgColor: '#F5F3FF', mentions: 712, weeklyGrowth: '-3%', growthType: 'negative' as const },
  { id: '4', name: 'Performance', icon: 'Zap', color: '#F59E0B', bgColor: '#FFFBEB', mentions: 561, weeklyGrowth: '+22%', growthType: 'positive' as const },
  { id: '5', name: 'Features', icon: 'Layers', color: '#F97316', bgColor: '#FFF7ED', mentions: 445, weeklyGrowth: '+11%', growthType: 'positive' as const },
  { id: '6', name: 'Mobile App', icon: 'Smartphone', color: '#3B82F6', bgColor: '#EFF6FF', mentions: 378, weeklyGrowth: '-8%', growthType: 'negative' as const },
];

export default async function ThemesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })
  if (!user) redirect("/api/auth")

  return (
    <>
    <div className="page-header">
      <div>
        <h1 className="page-title">Themes</h1>
        <p className="page-subtitle">Track trending topics and themes across all feedback.</p>
      </div>
      <div className="page-header-actions">
        <button className="btn-secondary" id="search-themes-btn">
          <Search size={15} />
          Search Themes
        </button>
        <button className="btn-primary" id="add-theme-btn">
          <Plus size={15} />
          Add Theme
        </button>
      </div>
    </div>

    <div className="themes-grid" style={{ marginBottom: '24px' }}>
      {themesData.slice(0, 4).map((theme) => (
        <ThemeCard key={theme.id} theme={theme as Theme} />
      ))}
    </div>

    <div className="section-title">Trending Themes</div>
    <div className="charts-row charts-row-equal mb-6">
      <TopThemesChart />
      <div className="themes-grid" style={{ marginBottom: 0 }}>
        {themesData.slice(4).map((theme) => (
          <ThemeCard key={theme.id} theme={theme as Theme} />
        ))}
      </div>
    </div>
    </>
  )
}
