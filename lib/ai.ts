import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Initialize Gemini ──
function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

// ── Types ──
export interface FeedbackItem {
  content: string;
  sentiment: string;
  channel: string;
  createdAt: string;
  themes: string[];
}

export interface VoCReportContent {
  executiveSummary: string;
  topThemes: Array<{ name: string; count: number; trend: string }>;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
    summary: string;
  };
  notableQuotes: Array<{ quote: string; sentiment: string; channel: string }>;
  recommendations: string[];
  generatedAt: string;
}

// ── Pre-compute stats (done in code, not by AI) ──
function preComputeStats(feedbackItems: FeedbackItem[]) {
  const total = feedbackItems.length;

  // Sentiment counts
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  for (const item of feedbackItems) {
    const key = item.sentiment.toLowerCase() as keyof typeof sentimentCounts;
    if (key in sentimentCounts) sentimentCounts[key]++;
  }

  // Theme counts
  const themeCounts = new Map<string, number>();
  for (const item of feedbackItems) {
    for (const theme of item.themes) {
      themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1);
    }
  }
  const topThemes = Array.from(themeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Channel counts
  const channelCounts = new Map<string, number>();
  for (const item of feedbackItems) {
    channelCounts.set(item.channel, (channelCounts.get(item.channel) ?? 0) + 1);
  }

  // Notable quotes (pick a few representative ones)
  const notablePositive = feedbackItems
    .filter((f) => f.sentiment === "POSITIVE")
    .slice(0, 3);
  const notableNegative = feedbackItems
    .filter((f) => f.sentiment === "NEGATIVE")
    .slice(0, 3);

  return {
    total,
    sentimentCounts,
    topThemes,
    channelCounts: Object.fromEntries(channelCounts),
    notablePositive,
    notableNegative,
  };
}

// ── Generate VoC Report ──
export async function generateVoCReport(
  feedbackItems: FeedbackItem[],
  periodLabel: string,
  reportTitle = "Voice of Customer Report"
): Promise<VoCReportContent> {
  const stats = preComputeStats(feedbackItems);
  const generatedAt = new Date().toISOString();

  // Customize prompt instructions based on template style
  let templateInstructions = "";
  if (reportTitle.toLowerCase().includes("weekly")) {
    templateInstructions = "This is a WEEKLY SUMMARY report. Focus your narrative on short-term operational health, weekly volumes, and immediate action items.";
  } else if (reportTitle.toLowerCase().includes("sentiment")) {
    templateInstructions = "This is a SENTIMENT REPORT. Focus your narrative heavily on positive vs negative sentiment shifts, user emotion analysis, and CSAT changes.";
  } else if (reportTitle.toLowerCase().includes("theme")) {
    templateInstructions = "This is a THEME ANALYSIS report. Focus your narrative on product feature categories, bug vs request counts, and area prioritization.";
  } else if (reportTitle.toLowerCase().includes("executive")) {
    templateInstructions = "This is an EXECUTIVE SUMMARY report. Focus your narrative on high-level strategic takeaways, key business metrics, and broad actions for leadership.";
  }

  // Build the prompt with pre-computed stats
  const prompt = `You are a product analytics expert. Generate a Voice-of-Customer report based on the following pre-computed data from customer feedback.

REPORT STYLE: ${templateInstructions}

PERIOD: ${periodLabel}
TOTAL FEEDBACK: ${stats.total}

SENTIMENT BREAKDOWN:
- Positive: ${stats.sentimentCounts.positive} (${Math.round((stats.sentimentCounts.positive / stats.total) * 100)}%)
- Neutral: ${stats.sentimentCounts.neutral} (${Math.round((stats.sentimentCounts.neutral / stats.total) * 100)}%)
- Negative: ${stats.sentimentCounts.negative} (${Math.round((stats.sentimentCounts.negative / stats.total) * 100)}%)

TOP THEMES:
${stats.topThemes.map((t) => `- ${t.name}: ${t.count} mentions`).join("\n")}

CHANNEL DISTRIBUTION:
${Object.entries(stats.channelCounts)
  .map(([ch, cnt]) => `- ${ch}: ${cnt}`)
  .join("\n")}

SAMPLE POSITIVE FEEDBACK:
${stats.notablePositive.map((f) => `- "${f.content}" (${f.channel})`).join("\n")}

SAMPLE NEGATIVE FEEDBACK:
${stats.notableNegative.map((f) => `- "${f.content}" (${f.channel})`).join("\n")}

Generate a JSON response with this exact structure (no markdown fences, just raw JSON):
{
  "executiveSummary": "A 2-3 sentence executive summary of the feedback trends",
  "sentimentSummary": "A sentence about the sentiment distribution and what it means",
  "themeInsights": ["Insight about theme 1", "Insight about theme 2", "Insight about theme 3"],
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2", "Actionable recommendation 3", "Actionable recommendation 4"]
}`;

  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse AI response — strip markdown fences if present
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const aiOutput = JSON.parse(cleaned) as {
      executiveSummary: string;
      sentimentSummary: string;
      themeInsights: string[];
      recommendations: string[];
    };

    return {
      executiveSummary: aiOutput.executiveSummary,
      topThemes: stats.topThemes.map((t) => ({
        name: t.name,
        count: t.count,
        trend: "stable",
      })),
      sentimentAnalysis: {
        positive: stats.sentimentCounts.positive,
        neutral: stats.sentimentCounts.neutral,
        negative: stats.sentimentCounts.negative,
        summary: aiOutput.sentimentSummary,
      },
      notableQuotes: [
        ...stats.notablePositive.map((f) => ({
          quote: f.content,
          sentiment: "positive",
          channel: f.channel,
        })),
        ...stats.notableNegative.map((f) => ({
          quote: f.content,
          sentiment: "negative",
          channel: f.channel,
        })),
      ],
      recommendations: aiOutput.recommendations,
      generatedAt,
    };
  } catch (error) {
    console.error("AI report generation failed, returning stats-only report:", error);

    // Fallback: return pre-computed stats without AI narrative
    return {
      executiveSummary: `This report covers ${stats.total} feedback items from the ${periodLabel}. The sentiment is ${stats.sentimentCounts.positive > stats.sentimentCounts.negative ? "predominantly positive" : "mixed"}.`,
      topThemes: stats.topThemes.map((t) => ({
        name: t.name,
        count: t.count,
        trend: "stable",
      })),
      sentimentAnalysis: {
        positive: stats.sentimentCounts.positive,
        neutral: stats.sentimentCounts.neutral,
        negative: stats.sentimentCounts.negative,
        summary: `Out of ${stats.total} feedback items: ${stats.sentimentCounts.positive} positive, ${stats.sentimentCounts.neutral} neutral, ${stats.sentimentCounts.negative} negative.`,
      },
      notableQuotes: [
        ...stats.notablePositive.map((f) => ({
          quote: f.content,
          sentiment: "positive",
          channel: f.channel,
        })),
        ...stats.notableNegative.map((f) => ({
          quote: f.content,
          sentiment: "negative",
          channel: f.channel,
        })),
      ],
      recommendations: [
        "Review the top themes for actionable improvements",
        "Address negative feedback trends promptly",
        "Continue investing in areas with positive sentiment",
      ],
      generatedAt,
    };
  }
}
