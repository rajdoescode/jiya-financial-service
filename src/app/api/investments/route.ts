import { NextRequest, NextResponse } from "next/server";
import { investmentSchema } from "@/lib/validations";
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

  const investments = await InvestmentService.getAllInvestments({
    agentId,
    type,
    year,
    month,
  });

  return NextResponse.json({ success: true, data: investments });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const parsed = investmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.errors[0]?.message || "Invalid input",
          },
        },
        { status: 400 }
      );
    }

    const investment = await InvestmentService.createInvestment(parsed.data);
    return NextResponse.json({ success: true, data: investment });
  } catch (error) {
    console.error("Create investment API error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
