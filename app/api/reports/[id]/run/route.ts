import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVoCReport } from "@/lib/ai";
import { NextResponse } from "next/server";
import type { FeedbackItem } from "@/lib/ai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const report = await prisma.report.findFirst({
      where: { id, workspaceId: user.workspaceId },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (!report.periodStart || !report.periodEnd) {
      return NextResponse.json({ error: "Report configuration is missing start or end dates." }, { status: 400 });
    }

    // Expand date-only end bounds so the full end day is included
    const periodStart = report.periodStart;
    const periodEnd = new Date(report.periodEnd);
    if (
      periodEnd.getUTCHours() === 0 &&
      periodEnd.getUTCMinutes() === 0 &&
      periodEnd.getUTCSeconds() === 0
    ) {
      periodEnd.setUTCHours(23, 59, 59, 999);
    }

    // Fetch feedbacks for the period
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
        { error: "No feedback found for the selected period to run AI compilation" },
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

    const content = await generateVoCReport(feedbackItems, periodLabel, report.title);

    const updated = await prisma.report.update({
      where: { id: report.id },
      data: {
        status: "COMPLETED",
        contentJson: JSON.stringify(content),
      },
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      content,
    });
  } catch (error) {
    console.error("Compilation error:", error);
    return NextResponse.json(
      { error: "Failed to compile report" },
      { status: 500 }
    );
  }
}
