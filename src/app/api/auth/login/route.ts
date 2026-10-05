import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations";
import { AuthService } from "@/lib/services/auth.service";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

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

    const { username, password } = parsed.data;
    const result = await AuthService.authenticate(username, password);

    if (!result.success || !result.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTH_FAILED",
            message: result.error || "Authentication failed",
          },
        },
        { status: 401 }
      );
    }

    const token = await createSessionToken(result.user);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error occurred",
        },
      },
      { status: 500 }
    );
  }
}
