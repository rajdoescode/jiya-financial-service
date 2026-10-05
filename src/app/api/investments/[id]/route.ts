import { NextRequest, NextResponse } from "next/server";
import { InvestmentService } from "@/lib/services/investment.service";
import { getSessionUser } from "@/lib/auth/session";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const success = await InvestmentService.deleteInvestment(params.id);
  if (!success) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Investment record not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { message: "Investment record deleted successfully" },
  });
}
