import './dashboard/Dashboard.css'

const shimmer = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

function SkeletonBlock({ height = 20, width = '100%', mb = 16 }: { height?: number | string; width?: number | string; mb?: number }) {
  return (
    <div
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width,
        marginBottom: `${mb}px`,
        borderRadius: '8px',
        background: 'linear-gradient(90deg, var(--color-surface) 25%, var(--color-border) 50%, var(--color-surface) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="stat-card" style={{ cursor: 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBlock height={14} width={100} mb={0} />
        <SkeletonBlock height={36} width={36} mb={0} />
      </div>
      <SkeletonBlock height={28} width={80} mb={8} />
      <SkeletonBlock height={14} width={140} mb={0} />
    </div>
  );
}

function ChartCardSkeleton() {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <SkeletonBlock height={15} width={150} mb={4} />
          <SkeletonBlock height={12} width={100} mb={0} />
        </div>
        <SkeletonBlock height={24} width={70} mb={0} />
      </div>
      <SkeletonBlock height={200} width="100%" mb={0} />
    </div>
  );
}

function ThemeCardSkeleton() {
  return (
    <div className="theme-card" style={{ cursor: 'default' }}>
      <div className="theme-card-header">
        <SkeletonBlock height={40} width={40} mb={0} />
        <SkeletonBlock height={15} width={120} mb={0} />
      </div>
      <div className="theme-card-body">
        <div>
          <SkeletonBlock height={26} width={60} mb={4} />
          <SkeletonBlock height={11} width={80} mb={0} />
        </div>
        <SkeletonBlock height={26} width={80} mb={0} />
      </div>
    </div>
  );
}

function TableSkeleton() {
  const rows = [1, 2, 3, 4, 5];
  return (
    <div className="feedback-table-wrapper">
      <div className="feedback-table-header">
        <div>
          <SkeletonBlock height={15} width={140} mb={4} />
          <SkeletonBlock height={12} width={90} mb={0} />
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <SkeletonBlock height={36} width={220} mb={0} />
          <SkeletonBlock height={36} width={130} mb={0} />
          <SkeletonBlock height={36} width={120} mb={0} />
        </div>
      </div>
      <div className="table-scroll-container">
        <table className="feedback-table">
          <thead>
            <tr>
              {['Customer', 'Feedback', 'Sentiment', 'Status'].map((h) => (
                <th key={h}>
                  <SkeletonBlock height={11} width={60} mb={0} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i}>
                <td>
                  <div className="customer-cell">
                    <SkeletonBlock height={30} width={30} mb={0} />
                    <SkeletonBlock height={13} width={100} mb={0} />
                  </div>
                </td>
                <td><SkeletonBlock height={13} width={200} mb={0} /></td>
                <td><SkeletonBlock height={22} width={70} mb={0} /></td>
                <td><SkeletonBlock height={22} width={60} mb={0} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <SkeletonBlock height={12} width={200} mb={0} />
        <div style={{ display: 'flex', gap: '8px' }}>
          {[1, 2, 3].map((i) => (
            <SkeletonBlock key={i} height={30} width={30} mb={0} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="dashboard-content" style={{ opacity: 0.7 }}>
      <style>{shimmer}</style>

      <div style={{ marginBottom: '24px' }}>
        <SkeletonBlock height={22} width={280} mb={6} />
        <SkeletonBlock height={14} width={360} mb={0} />
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {[1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
      </div>

      <div className="charts-row charts-row-2-col" style={{ marginBottom: '24px' }}>
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>

      <div className="charts-row charts-row-equal" style={{ marginBottom: '24px' }}>
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>

      <div className="insights-panel" style={{ marginBottom: '24px' }}>
        <div className="insights-header">
          <SkeletonBlock height={36} width={36} mb={0} />
          <div>
            <SkeletonBlock height={15} width={120} mb={4} />
            <SkeletonBlock height={12} width={180} mb={0} />
          </div>
          <div style={{ marginLeft: 'auto' }}><SkeletonBlock height={22} width={100} mb={0} /></div>
        </div>
        <div className="insights-grid">
          <div className="insight-card summary" style={{ padding: '16px', border: '1px solid transparent' }}>
            <SkeletonBlock height={24} width={180} mb={8} />
            <SkeletonBlock height={13} width="100%" mb={4} />
            <SkeletonBlock height={13} width="80%" mb={0} />
          </div>
          <div className="insight-card issue" style={{ padding: '16px', border: '1px solid transparent' }}>
            <SkeletonBlock height={24} width={140} mb={8} />
            <SkeletonBlock height={13} width="100%" mb={4} />
            <SkeletonBlock height={13} width="75%" mb={0} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <SkeletonBlock height={15} width={100} mb={0} />
      </div>
      <div className="themes-grid" style={{ marginBottom: '24px' }}>
        {[1, 2].map((i) => <ThemeCardSkeleton key={i} />)}
      </div>

      <TableSkeleton />
    </div>
  );
}
