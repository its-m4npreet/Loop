import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVoCReport } from "@/lib/ai";
import { NextResponse } from "next/server";
import type { FeedbackItem } from "@/lib/ai";
import { GenerateReportSchema, parseBody } from "@/lib/validations";

function parsePeriodDate(value: string, endOfDay: boolean) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(
      endOfDay ? `${value}T23:59:59.999Z` : `${value}T00:00:00.000Z`
    );
  }
  return new Date(value);
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, workspaceId: true },
    });
    if (!user?.workspaceId) {
      return NextResponse.json({ error: "No workspace" }, { status: 400 });
    }

    const result = await parseBody(request, GenerateReportSchema);
    if ("error" in result) return result.error;

    const { title, periodStart: psRaw, periodEnd: peRaw, status, reportType, description } = result.data;

    const styleKey = [title, reportType, description]
      .filter(Boolean)
      .join(" ");

    const periodEnd = peRaw ? parsePeriodDate(peRaw, true) : new Date();
    const periodStart = psRaw
      ? parsePeriodDate(psRaw, false)
      : new Date(periodEnd.getTime() - 7 * 86400000);

    if (status === "DRAFT" || status === "SCHEDULED") {
      const report = await prisma.report.create({
        data: {
          title,
          type: "voc",
          status,
          periodStart,
          periodEnd,
          contentJson: JSON.stringify({
            executiveSummary: `This report is a saved ${status.toLowerCase()} configuration. Running AI analysis is pending.`,
            topThemes: [],
            sentimentAnalysis: { positive: 0, neutral: 0, negative: 0, summary: "" },
            notableQuotes: [],
            recommendations: [],
            generatedAt: new Date().toISOString(),
          }),
          workspaceId: user.workspaceId,
          generatedById: user.id,
        },
      });

      return NextResponse.json({
        id: report.id,
        title: report.title,
        status: report.status,
        createdAt: report.createdAt.toISOString(),
        content: null,
      });
    }

    const feedback = await prisma.feedback.findMany({
      where: {
        workspaceId: user.workspaceId,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      include: {
        themes: {
          include: { theme: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (feedback.length === 0) {
      return NextResponse.json(
        { error: "No feedback found for the selected period" },
        { status: 404 }
      );
    }

    const feedbackItems: FeedbackItem[] = feedback.map((f) => ({
      content: f.content,
      sentiment: f.sentiment,
      channel: f.channel,
      createdAt: f.createdAt.toISOString(),
      themes: f.themes.map((ft) => ft.theme.name),
    }));

    const periodLabel = `${periodStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} – ${periodEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;

    const content = await generateVoCReport(feedbackItems, periodLabel, styleKey || title);

    const report = await prisma.report.create({
      data: {
        title,
        type: "voc",
        status: "COMPLETED",
        periodStart,
        periodEnd,
        contentJson: JSON.stringify(content),
        workspaceId: user.workspaceId,
        generatedById: user.id,
      },
    });

    return NextResponse.json({
      id: report.id,
      title: report.title,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      content,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
