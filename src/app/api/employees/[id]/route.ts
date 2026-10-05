import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { getSessionUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { resetEmployeePasswordSchema } from "@/lib/validations";

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

  try {
    requireRole(user, "admin");
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Only administrators can delete employees" } },
      { status: 403 }
    );
  }

  const res = await AuthService.deleteEmployee(params.id);
  if (!res.success) {
    return NextResponse.json(
      { success: false, error: { code: "DELETE_FAILED", message: res.error || "Failed to delete employee" } },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, data: { message: "Employee deleted successfully" } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      { success: false, error: { code: "FORBIDDEN", message: "Only administrators can reset employee password" } },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = resetEmployeePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0]?.message || "Invalid input" },
        },
        { status: 400 }
      );
    }

    const res = await AuthService.resetEmployeePassword(params.id, parsed.data.password);
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: { code: "UPDATE_FAILED", message: res.error || "Failed to reset password" } },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: { message: "Password updated successfully" } });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
