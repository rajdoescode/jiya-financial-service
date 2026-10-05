import { NextRequest, NextResponse } from "next/server";
import { InvestmentService } from "@/lib/services/investment.service";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId") || undefined;
  const type = searchParams.get("type") || undefined;
  const year = searchParams.get("year") || undefined;
  const month = searchParams.get("month") || undefined;

  const stats = await InvestmentService.getDashboardStats({
    agentId,
    type,
    year,
    month,
  });

  return NextResponse.json({ success: true, data: stats });
}
