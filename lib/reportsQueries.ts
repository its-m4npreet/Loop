import { prisma } from "./prisma";
import type { ReportStatus } from "../app/generated/prisma/client";

// ── Types ──
export interface ReportsListOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ReportStatus | "ALL";
}

// ── 1. Reports List (paginated + searchable) ──
export async function getReportsList(workspaceId: string, options: ReportsListOptions = {}) {
  const { page = 1, pageSize = 10, search, status } = options;
  const skip = (page - 1) * pageSize;

  const where: {
    workspaceId: string;
    status?: ReportStatus;
    title?: { contains: string; mode: "insensitive" };
  } = { workspaceId };

  if (status && status !== "ALL") {
    where.status = status;
  }
  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        createdAt: true,
        generatedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.report.count({ where }),
  ]);

  return {
    reports: reports.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      periodStart: r.periodStart?.toISOString() ?? null,
      periodEnd: r.periodEnd?.toISOString() ?? null,
      generatedByName: r.generatedBy?.name ?? "System",
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ── 2. Reports Stats ──
export async function getReportsStats(workspaceId: string) {
  const [total, completed, draft, scheduled] = await Promise.all([
    prisma.report.count({ where: { workspaceId } }),
    prisma.report.count({ where: { workspaceId, status: "COMPLETED" } }),
    prisma.report.count({ where: { workspaceId, status: "DRAFT" } }),
    prisma.report.count({ where: { workspaceId, status: "SCHEDULED" } }),
  ]);

  return { total, completed, draft, scheduled };
}

// ── 3. Single Report ──
export async function getReportById(workspaceId: string, reportId: string) {
  const report = await prisma.report.findFirst({
    where: { id: reportId, workspaceId },
    include: {
      generatedBy: { select: { name: true, email: true } },
    },
  });

  if (!report) return null;

  return {
    ...report,
    createdAt: report.createdAt.toISOString(),
    periodStart: report.periodStart?.toISOString() ?? null,
    periodEnd: report.periodEnd?.toISOString() ?? null,
  };
}
