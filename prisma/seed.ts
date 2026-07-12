import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ── Deterministic PRNG (Mulberry32) ──
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((rand() * (max - min) + min).toFixed(decimals));
}

// ── Theme definitions ──
const THEMES = [
  { name: "Billing", description: "Payment, invoices, and pricing issues", color: "#F87171" },
  { name: "Onboarding", description: "First-time user experience and setup", color: "#22C55E" },
  { name: "Performance", description: "Speed, loading, and reliability", color: "#FB923C" },
  { name: "Support Quality", description: "Customer service interactions", color: "#60A5FA" },
  { name: "UI/UX", description: "Interface design and usability", color: "#A78BFA" },
  { name: "Feature Requests", description: "New feature ideas and suggestions", color: "#FBBF24" },
  { name: "Security", description: "Data privacy and account security", color: "#F472B6" },
];

// ── Channel definitions ──
const CHANNELS = ["Support Ticket", "App Store", "NPS Survey", "Sales Call", "Community Post"];

// ── Customer names ──
const FIRST_NAMES = [
  "Aisha", "Marcus", "Priya", "Tom", "Sara", "David", "Emma", "Raj", "Lena", "James",
  "Yuki", "Carlos", "Fatima", "Oliver", "Mei", "Hassan", "Sophie", "Andre", "Nadia", "Ben",
  "Chen", "Maria", "Kofi", "Elena", "Dmitri", "Amara", "Felix", "Zara", "Liam", "Ava",
];
const LAST_NAMES = [
  "Patel", "Johnson", "Sharma", "Williams", "Kim", "Chen", "Rodriguez", "Kapoor", "Fischer", "O'Brien",
  "Tanaka", "Santos", "Ali", "Wright", "Zhang", "Ibrahim", "Martin", "Silva", "Petrov", "Okafor",
];

// ── Feedback templates by sentiment ──
const POSITIVE_FEEDBACK = [
  "The new dashboard is gorgeous and finally fast. Huge improvement.",
  "Love the new export feature, saved me an hour today.",
  "Support team responded quickly and resolved my issue within the hour. Excellent service.",
  "The new onboarding tutorial is amazing! Got my team up and running in under 30 minutes.",
  "Integration with Slack is brilliant. Saved hours of manual reporting every week.",
  "Great product overall. Would love to see more customization options for reports.",
  "Your customer service is outstanding. Best experience I've had with any SaaS tool.",
  "The recent performance updates made a huge difference — everything loads instantly now.",
  "Really impressed with the analytics dashboard. It gives us exactly the insights we need.",
  "The mobile app works perfectly. Love being able to check feedback on the go.",
  "CSV import was painless — imported 5,000 records without a single error.",
  "The theme clustering feature is incredibly accurate. Saves us hours of manual tagging.",
  "Your onboarding emails were super helpful. Made the transition seamless.",
  "The search functionality is lightning fast. Finding specific feedback takes seconds now.",
  "Love the new dark mode! Much easier on the eyes during late-night sessions.",
  "The API documentation is excellent. Integration with our tools was straightforward.",
  "The weekly digest report is exactly what our leadership team needs. Very well formatted.",
  "Pricing is fair for what you get. Happy to renew our annual subscription.",
  "The role-based access control is perfect for our team structure.",
  "Your product has completely changed how we handle customer feedback. Game changer.",
];

const NEGATIVE_FEEDBACK = [
  "The billing page is really confusing. I was charged twice and can't find a way to get a refund.",
  "Onboarding took forever — I couldn't figure out how to invite my team.",
  "Dashboard loads very slowly when we have more than 500 records. Please optimize performance.",
  "Invoice PDF doesn't render correctly in Firefox. Works fine in Chrome though.",
  "UI feels a bit dated compared to competitors. Needs a refresh especially on mobile.",
  "Support response took 3 days. Completely unacceptable for a paid plan.",
  "Billing page keeps timing out when I try to download an invoice.",
  "The app crashes frequently on iOS. Had to force quit it multiple times today.",
  "Export to PDF is broken — the formatting is completely messed up.",
  "Can't figure out how to change my subscription plan. The settings page is confusing.",
  "Data isn't syncing properly between the web and mobile apps.",
  "The search feature returns irrelevant results half the time.",
  "We've been waiting 6 weeks for the SSO feature. This was promised months ago.",
  "The charts don't update in real time. Have to refresh the page constantly.",
  "Security concern: received someone else's notification email with their data.",
  "The CSV import failed silently — no error message, just lost 2,000 records.",
  "Mobile performance is terrible. Takes 10+ seconds to load the inbox.",
  "Theme detection is wrong most of the time. Tagged a billing complaint as 'UI/UX'.",
  "The API rate limits are too restrictive for our use case.",
  "Customer data export doesn't include all fields. Missing critical information.",
];

const NEUTRAL_FEEDBACK = [
  "It does the job, but the mobile experience needs work.",
  "Works exactly as expected. Nothing surprising, does the job.",
  "Could you add bulk import for historical feedback? That would be helpful for our team.",
  "Average experience. Not bad, not great. Room for improvement.",
  "Would be nice to have more chart types in the analytics dashboard.",
  "The product works fine for basic use cases but lacks advanced features.",
  "Decent tool for the price. Would recommend for small teams.",
  "Feature request: it would be great to have a Jira integration.",
  "The documentation is adequate but could use more real-world examples.",
  "We're evaluating this against 2 other tools. The feature set is comparable.",
  "Prospect wants SSO before they'll sign — third time this month.",
  "The notifications system could be more customizable.",
  "Requested a demo for the enterprise plan. Waiting to hear back.",
  "The reporting features cover the basics but nothing innovative.",
  "Looking forward to the upcoming theme management improvements mentioned in the roadmap.",
];

// ── Map themes to likely sentiments ──
const THEME_SENTIMENT_WEIGHTS: Record<string, { pos: number; neu: number; neg: number }> = {
  Billing:             { pos: 0.15, neu: 0.20, neg: 0.65 },
  Onboarding:          { pos: 0.50, neu: 0.25, neg: 0.25 },
  Performance:         { pos: 0.25, neu: 0.20, neg: 0.55 },
  "Support Quality":   { pos: 0.45, neu: 0.20, neg: 0.35 },
  "UI/UX":             { pos: 0.30, neu: 0.30, neg: 0.40 },
  "Feature Requests":  { pos: 0.20, neu: 0.55, neg: 0.25 },
  Security:            { pos: 0.15, neu: 0.25, neg: 0.60 },
};

type SentimentType = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

function pickSentiment(theme: string): SentimentType {
  const w = THEME_SENTIMENT_WEIGHTS[theme] ?? { pos: 0.33, neu: 0.34, neg: 0.33 };
  const r = rand();
  if (r < w.pos) return "POSITIVE";
  if (r < w.pos + w.neu) return "NEUTRAL";
  return "NEGATIVE";
}

function pickFeedbackContent(sentiment: SentimentType): string {
  switch (sentiment) {
    case "POSITIVE": return pick(POSITIVE_FEEDBACK);
    case "NEGATIVE": return pick(NEGATIVE_FEEDBACK);
    default: return pick(NEUTRAL_FEEDBACK);
  }
}

function sentimentScore(sentiment: SentimentType): number {
  switch (sentiment) {
    case "POSITIVE": return randFloat(0.3, 1.0);
    case "NEGATIVE": return randFloat(-1.0, -0.3);
    default: return randFloat(-0.2, 0.2);
  }
}

function satisfaction(sentiment: SentimentType): number {
  switch (sentiment) {
    case "POSITIVE": return randFloat(3.5, 5.0);
    case "NEGATIVE": return randFloat(1.0, 2.5);
    default: return randFloat(2.5, 3.5);
  }
}

function feedbackStatus(): "NEW" | "REVIEWED" | "ACTIONED" {
  const r = rand();
  if (r < 0.5) return "NEW";
  if (r < 0.8) return "REVIEWED";
  return "ACTIONED";
}

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Clean existing data ──
  await prisma.feedbackTheme.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.report.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();
  console.log("  ✓ Cleaned existing data");

  // ── Create workspace ──
  const workspace = await prisma.workspace.create({
    data: { name: "Acme Corp" },
  });
  console.log(`  ✓ Created workspace: ${workspace.name} (${workspace.id})`);

  // ── Create users ──
  const adminHash = await hash("Admin123!", 12);
  const analystHash = await hash("Analyst123!", 12);
  const viewerHash = await hash("Viewer123!", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@acme.test",
      passwordHash: adminHash,
      role: "ADMIN",
      workspaceId: workspace.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Analyst User",
      email: "analyst@acme.test",
      passwordHash: analystHash,
      role: "USER",
      workspaceId: workspace.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Viewer User",
      email: "viewer@acme.test",
      passwordHash: viewerHash,
      role: "USER",
      workspaceId: workspace.id,
    },
  });
  console.log("  ✓ Created 3 users (admin, analyst, viewer)");

  // ── Create themes ──
  const themes = await Promise.all(
    THEMES.map((t) =>
      prisma.theme.create({
        data: {
          name: t.name,
          description: t.description,
          color: t.color,
          workspaceId: workspace.id,
        },
      })
    )
  );
  console.log(`  ✓ Created ${themes.length} themes`);

  // ── Create feedback (500 items over 90 days) ──
  const now = new Date();
  const feedbackData = [];

  for (let i = 0; i < 500; i++) {
    const daysAgo = randInt(0, 89);
    const hoursOffset = randInt(0, 23);
    const createdAt = new Date(now.getTime() - daysAgo * 86400000 - hoursOffset * 3600000);

    const primaryTheme = pick(themes);
    const sentiment = pickSentiment(primaryTheme.name);
    const content = pickFeedbackContent(sentiment);

    feedbackData.push({
      content,
      channel: pick(CHANNELS),
      sourceRef: `REF-${String(i + 1).padStart(4, "0")}`,
      customerLabel: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      sentiment,
      sentimentScore: sentimentScore(sentiment),
      status: feedbackStatus(),
      responseTime: randInt(5, 480),
      satisfaction: satisfaction(sentiment),
      createdAt,
      workspaceId: workspace.id,
      _primaryThemeId: primaryTheme.id,
      _secondaryThemeIds: rand() > 0.5
        ? [pick(themes.filter((t) => t.id !== primaryTheme.id)).id]
        : [],
    });
  }

  // Batch create feedback
  const createdFeedback = [];
  for (const fd of feedbackData) {
    const { _primaryThemeId, _secondaryThemeIds, ...data } = fd;
    const fb = await prisma.feedback.create({ data });
    createdFeedback.push({ id: fb.id, primaryThemeId: _primaryThemeId, secondaryThemeIds: _secondaryThemeIds });
  }
  console.log(`  ✓ Created ${createdFeedback.length} feedback items`);

  // ── Create FeedbackTheme joins ──
  const joins = [];
  for (const fb of createdFeedback) {
    joins.push({
      feedbackId: fb.id,
      themeId: fb.primaryThemeId,
      confidence: randFloat(0.7, 1.0),
    });
    for (const themeId of fb.secondaryThemeIds) {
      joins.push({
        feedbackId: fb.id,
        themeId,
        confidence: randFloat(0.4, 0.7),
      });
    }
  }
  await prisma.feedbackTheme.createMany({ data: joins });
  console.log(`  ✓ Created ${joins.length} feedback-theme associations`);

  // ── Create sample reports ──
  const reportData = [
    { title: "Weekly Feedback Summary — Jul 7–13", type: "summary", status: "COMPLETED" as const, daysAgo: 0 },
    { title: "Monthly Sentiment Report — June 2026", type: "sentiment", status: "COMPLETED" as const, daysAgo: 12 },
    { title: "Q2 Product Insights", type: "insights", status: "COMPLETED" as const, daysAgo: 14 },
    { title: "Customer Pain Points Analysis", type: "themes", status: "COMPLETED" as const, daysAgo: 18 },
    { title: "Competitive Analysis", type: "analysis", status: "DRAFT" as const, daysAgo: 24 },
    { title: "Weekly Feedback Summary — Jun 30–Jul 6", type: "summary", status: "COMPLETED" as const, daysAgo: 7 },
    { title: "Scheduled Monthly Report — July 2026", type: "summary", status: "SCHEDULED" as const, daysAgo: -2 },
  ];

  for (const r of reportData) {
    const createdAt = new Date(now.getTime() - r.daysAgo * 86400000);
    const periodEnd = new Date(createdAt);
    const periodStart = new Date(periodEnd.getTime() - 7 * 86400000);

    await prisma.report.create({
      data: {
        title: r.title,
        type: r.type,
        status: r.status,
        periodStart,
        periodEnd,
        contentJson: r.status === "COMPLETED"
          ? JSON.stringify({
              summary: `This report covers feedback from ${periodStart.toLocaleDateString()} to ${periodEnd.toLocaleDateString()}.`,
              topThemes: ["Billing", "Onboarding", "Performance"],
              sentimentBreakdown: { positive: 57, neutral: 26, negative: 17 },
              totalFeedback: randInt(60, 120),
              recommendations: [
                "Investigate billing complaints — up 18% this period",
                "Continue investing in onboarding improvements",
                "Monitor performance metrics for regression",
              ],
            })
          : null,
        createdAt,
        workspaceId: workspace.id,
        generatedById: admin.id,
      },
    });
  }
  console.log(`  ✓ Created ${reportData.length} sample reports`);

  console.log("\n✅ Seed complete!\n");
  console.log("  Demo credentials:");
  console.log("  ────────────────────────────────────");
  console.log("  Admin:   admin@acme.test   / Admin123!");
  console.log("  Analyst: analyst@acme.test / Analyst123!");
  console.log("  Viewer:  viewer@acme.test  / Viewer123!");
  console.log("  ────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
