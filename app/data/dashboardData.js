// dashboardData.js
// Centralized mock data for the LOOP Dashboard.
// Replace with API calls without changing component structure.

export const statsData = [
  {
    id: 'total-feedback',
    title: 'Total Feedback',
    value: '12,847',
    change: '+18%',
    changeType: 'positive',
    icon: 'MessageSquare',
    description: 'vs last week',
  },
  {
    id: 'positive-sentiment',
    title: 'Positive Sentiment',
    value: '7,312',
    change: '+12%',
    changeType: 'positive',
    icon: 'ThumbsUp',
    description: 'vs last week',
  },
  {
    id: 'negative-sentiment',
    title: 'Negative Sentiment',
    value: '2,140',
    change: '-5%',
    changeType: 'negative',
    icon: 'ThumbsDown',
    description: 'vs last week',
  },
  {
    id: 'neutral-sentiment',
    title: 'Neutral Sentiment',
    value: '3,395',
    change: '+3%',
    changeType: 'positive',
    icon: 'Minus',
    description: 'vs last week',
  },
  {
    id: 'active-themes',
    title: 'Active Themes',
    value: '24',
    change: '+4',
    changeType: 'positive',
    icon: 'Tag',
    description: 'vs last week',
  },
  {
    id: 'reports-generated',
    title: 'Reports Generated',
    value: '138',
    change: '+22%',
    changeType: 'positive',
    icon: 'FileText',
    description: 'vs last week',
  },
];

export const feedbackVolumeData = [
  { date: 'Jun 27', count: 320 },
  { date: 'Jun 28', count: 450 },
  { date: 'Jun 29', count: 390 },
  { date: 'Jun 30', count: 520 },
  { date: 'Jul 1',  count: 610 },
  { date: 'Jul 2',  count: 480 },
  { date: 'Jul 3',  count: 740 },
];

export const sentimentDistributionData = [
  { name: 'Positive', value: 57, color: '#22C55E' },
  { name: 'Neutral',  value: 26, color: '#94A3B8' },
  { name: 'Negative', value: 17, color: '#F87171' },
];

export const topThemesChartData = [
  { theme: 'Billing',          mentions: 1842 },
  { theme: 'Onboarding',       mentions: 1527 },
  { theme: 'Performance',      mentions: 1103 },
  { theme: 'Support Quality',  mentions: 892  },
  { theme: 'UI/UX',            mentions: 764  },
  { theme: 'Feature Requests', mentions: 631  },
];

export const feedbackChannelsData = [
  { channel: 'Email',       count: 4210 },
  { channel: 'In-App',      count: 3680 },
  { channel: 'Support Chat',count: 2740 },
  { channel: 'Twitter/X',   count: 1520 },
  { channel: 'App Store',   count: 697  },
];

export const aiInsights = {
  weeklySummary:
    'Customer feedback volume increased 18% this week. Billing-related complaints spiked on Tuesday, while onboarding satisfaction improved significantly following last week\'s tutorial update.',
  topIssue: {
    title: 'Billing Complaints Surge',
    detail: 'Billing-related complaints increased by 18% week-over-week, primarily around invoice confusion and failed payment retries.',
    severity: 'high',
  },
  recommendation: {
    title: 'Improve Billing Experience',
    detail:
      'Simplify the invoice UI and add proactive failed-payment notifications. Consider an in-app billing FAQ to reduce support tickets.',
  },
  riskAlert: {
    title: 'Churn Risk Detected',
    detail:
      'Segment of 240 enterprise customers with 3+ negative feedback entries in the past 7 days — at elevated churn risk.',
    severity: 'critical',
  },
  positiveHighlight:
    'Customers strongly appreciate the new onboarding flow. NPS mentions of onboarding improved by 34% this week.',
};

export const topThemesCards = [
  {
    id: 'billing',
    name: 'Billing',
    mentions: 1842,
    weeklyGrowth: '+18%',
    growthType: 'negative',
    color: '#F87171',
    bgColor: '#FEF2F2',
    icon: 'CreditCard',
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    mentions: 1527,
    weeklyGrowth: '+34%',
    growthType: 'positive',
    color: '#22C55E',
    bgColor: '#F0FDF4',
    icon: 'Rocket',
  },
  {
    id: 'performance',
    name: 'Performance',
    mentions: 1103,
    weeklyGrowth: '-7%',
    growthType: 'negative',
    color: '#FB923C',
    bgColor: '#FFF7ED',
    icon: 'Zap',
  },
  {
    id: 'support',
    name: 'Support Quality',
    mentions: 892,
    weeklyGrowth: '+9%',
    growthType: 'positive',
    color: '#60A5FA',
    bgColor: '#EFF6FF',
    icon: 'Headphones',
  },
];

export const recentFeedbackData = [
  {
    id: 1,
    customer: 'Aisha Patel',
    feedback: 'The billing page is really confusing. I was charged twice and can\'t find a way to get a refund.',
    channel: 'Email',
    theme: 'Billing',
    sentiment: 'Negative',
    status: 'Open',
    time: '2m ago',
  },
  {
    id: 2,
    customer: 'Marcus Johnson',
    feedback: 'The new onboarding tutorial is amazing! Got my team up and running in under 30 minutes.',
    channel: 'In-App',
    theme: 'Onboarding',
    sentiment: 'Positive',
    status: 'Resolved',
    time: '15m ago',
  },
  {
    id: 3,
    customer: 'Priya Sharma',
    feedback: 'Dashboard loads very slowly when we have more than 500 records. Please optimize performance.',
    channel: 'Support Chat',
    theme: 'Performance',
    sentiment: 'Negative',
    status: 'In Progress',
    time: '1h ago',
  },
  {
    id: 4,
    customer: 'Tom Williams',
    feedback: 'Great product overall. Would love to see more customization options for reports.',
    channel: 'Email',
    theme: 'Feature Requests',
    sentiment: 'Positive',
    status: 'Open',
    time: '2h ago',
  },
  {
    id: 5,
    customer: 'Sara Kim',
    feedback: 'Support team responded quickly and resolved my issue within the hour. Excellent service.',
    channel: 'Support Chat',
    theme: 'Support Quality',
    sentiment: 'Positive',
    status: 'Resolved',
    time: '3h ago',
  },
  {
    id: 6,
    customer: 'David Chen',
    feedback: 'UI feels a bit dated compared to competitors. Needs a refresh especially on mobile.',
    channel: 'Twitter/X',
    theme: 'UI/UX',
    sentiment: 'Negative',
    status: 'Open',
    time: '4h ago',
  },
  {
    id: 7,
    customer: 'Emma Rodriguez',
    feedback: 'Works exactly as expected. Nothing surprising, does the job.',
    channel: 'App Store',
    theme: 'General',
    sentiment: 'Neutral',
    status: 'Resolved',
    time: '5h ago',
  },
  {
    id: 8,
    customer: 'Raj Kapoor',
    feedback: 'Integration with Slack is brilliant. Saved hours of manual reporting every week.',
    channel: 'In-App',
    theme: 'Onboarding',
    sentiment: 'Positive',
    status: 'Open',
    time: '6h ago',
  },
  {
    id: 9,
    customer: 'Lena Fischer',
    feedback: 'Invoice PDF doesn\'t render correctly in Firefox. Works fine in Chrome though.',
    channel: 'Email',
    theme: 'Billing',
    sentiment: 'Negative',
    status: 'In Progress',
    time: '8h ago',
  },
  {
    id: 10,
    customer: 'James O\'Brien',
    feedback: 'Could you add bulk import for historical feedback? That would be super helpful for our team.',
    channel: 'Support Chat',
    theme: 'Feature Requests',
    sentiment: 'Neutral',
    status: 'Open',
    time: '10h ago',
  },
];

export const notifications = [
  {
    id: 1,
    type: 'success',
    icon: 'CheckCircle',
    title: 'CSV imported successfully',
    detail: '2,340 new feedback entries added.',
    time: '5m ago',
    read: false,
  },
  {
    id: 2,
    type: 'info',
    icon: 'FileText',
    title: 'Weekly report generated',
    detail: 'Your weekly insights report is ready to download.',
    time: '1h ago',
    read: false,
  },
  {
    id: 3,
    type: 'warning',
    icon: 'AlertTriangle',
    title: 'Billing complaints increased',
    detail: 'Billing theme is up 18% — action may be required.',
    time: '3h ago',
    read: true,
  },
  {
    id: 4,
    type: 'info',
    icon: 'Users',
    title: 'New team member joined',
    detail: 'Priya Sharma joined your workspace.',
    time: '1d ago',
    read: true,
  },
];

export const quickActions = [
  {
    id: 'add-feedback',
    label: 'Add Feedback',
    description: 'Manually enter a customer feedback entry',
    icon: 'PlusCircle',
    color: '#22C55E',
    bgColor: '#F0FDF4',
  },
  {
    id: 'upload-csv',
    label: 'Upload CSV',
    description: 'Import feedback in bulk via CSV file',
    icon: 'Upload',
    color: '#60A5FA',
    bgColor: '#EFF6FF',
  },
  {
    id: 'ask-loop',
    label: 'Ask LOOP',
    description: 'Chat with your AI feedback assistant',
    icon: 'Bot',
    color: '#A78BFA',
    bgColor: '#F5F3FF',
  },
  {
    id: 'generate-report',
    label: 'Generate Report',
    description: 'Create an AI-powered insights report',
    icon: 'BarChart2',
    color: '#FB923C',
    bgColor: '#FFF7ED',
  },
];
