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
  const agentId = searchParams.get("agentId");
  const year = searchParams.get("year") || "2026";
  const month = searchParams.get("month") || "09";

  if (!agentId) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "agentId is required" } },
      { status: 400 }
    );
  }

  try {
    const statement = await InvestmentService.getAgentStatement(agentId, year, month);
    return NextResponse.json({ success: true, data: statement });
  } catch (error) {
    console.error("Statement API error:", error);
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: (error as Error).message } },
      { status: 404 }
    );
  }
}
