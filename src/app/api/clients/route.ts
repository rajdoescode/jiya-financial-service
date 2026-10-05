import { NextRequest, NextResponse } from "next/server";
import { clientSchema } from "@/lib/validations";
import { ClientService } from "@/lib/services/client.service";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const clients = await ClientService.getAllClients();
  return NextResponse.json({ success: true, data: clients });
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
    const parsed = clientSchema.safeParse(body);

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

    const client = await ClientService.createClient(parsed.data);
    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    console.error("Create client API error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
