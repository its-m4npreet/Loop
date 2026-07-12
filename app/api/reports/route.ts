import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReportsList } from "@/lib/reportsQueries";
import { NextResponse } from "next/server";
import type { ReportStatus } from "../../generated/prisma/client";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    let page = parseInt(searchParams.get("page") || "1", 10);
    let pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(pageSize) || pageSize < 1) pageSize = 10;
    
    const search = searchParams.get("search") || "";
    const status = (searchParams.get("status") || "ALL") as ReportStatus | "ALL";

    const result = await getReportsList(user.workspaceId, {
      page,
      pageSize,
      search,
      status,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
