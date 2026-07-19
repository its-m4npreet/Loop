import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReportById } from "@/lib/reportsQueries";
import { NextResponse } from "next/server";
import { UpdateReportSchema, parseBody } from "@/lib/validations";

export async function GET(
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
      select: { workspaceId: true },
    });
    if (!user?.workspaceId) {
      return NextResponse.json({ error: "No workspace" }, { status: 400 });
    }

    const resolvedParams = await params;
    if (!resolvedParams?.id) {
      return NextResponse.json({ error: "Missing report ID" }, { status: 400 });
    }
    const report = await getReportById(user.workspaceId, resolvedParams.id);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("GET report details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch report details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
      select: { workspaceId: true },
    });
    if (!user?.workspaceId) {
      return NextResponse.json({ error: "No workspace" }, { status: 400 });
    }

    const { id } = await params;

    const result = await parseBody(request, UpdateReportSchema);
    if ("error" in result) return result.error;

    const report = await prisma.report.findFirst({
      where: { id, workspaceId: user.workspaceId },
    });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot modify completed reports" }, { status: 400 });
    }

    const { title, periodStart, periodEnd } = result.data;
    const data: { title?: string; periodStart?: Date; periodEnd?: Date } = {};
    if (title) data.title = title;
    if (periodStart) data.periodStart = new Date(periodStart);
    if (periodEnd) data.periodEnd = new Date(periodEnd);

    const updated = await prisma.report.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH report details error:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}
