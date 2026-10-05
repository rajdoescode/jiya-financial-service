import { NextRequest, NextResponse } from "next/server";
import { createEmployeeSchema } from "@/lib/validations";
import { AuthService } from "@/lib/services/auth.service";
import { getSessionUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  try {
    requireRole(user, "admin");
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Only administrators can view employees" } },
      { status: 403 }
    );
  }

  const employees = await AuthService.getAllEmployees();
  return NextResponse.json({ success: true, data: employees });
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
    requireRole(user, "admin");
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Only administrators can create employees" } },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = createEmployeeSchema.safeParse(body);

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

    const res = await AuthService.createEmployee(parsed.data);

    if (!res.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "CREATE_FAILED", message: res.error || "Failed to create employee" },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: res.employee,
    });
  } catch (error) {
    console.error("Create employee API error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
