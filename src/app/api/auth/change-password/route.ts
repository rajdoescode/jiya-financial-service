import { NextRequest, NextResponse } from "next/server";
import { changeAdminPasswordSchema } from "@/lib/validations";
import { AuthService } from "@/lib/services/auth.service";
import { getSessionUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    try {
      requireRole(user, "admin");
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Only administrators can change admin password" },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = changeAdminPasswordSchema.safeParse(body);

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

    const { currentPassword, newPassword } = parsed.data;
    const res = await AuthService.changeAdminPassword(user.username, currentPassword, newPassword);

    if (!res.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "PASSWORD_CHANGE_FAILED", message: res.error || "Failed to change password" },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Password updated successfully" },
    });
  } catch (error) {
    console.error("Change password API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Internal server error" },
      },
      { status: 500 }
    );
  }
}
