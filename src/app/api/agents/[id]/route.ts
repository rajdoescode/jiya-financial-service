import { NextRequest, NextResponse } from "next/server";
import { agentSchema } from "@/lib/validations";
import { AgentService } from "@/lib/services/agent.service";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(
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

  const agent = await AgentService.getAgentById(params.id);
  if (!agent) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Agent not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: agent });
}

export async function PUT(
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
    const body = await req.json();
    const parsed = agentSchema.partial().safeParse(body);

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

    const updated = await AgentService.updateAgent(params.id, parsed.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Agent not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update agent API error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

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

  const success = await AgentService.deleteAgent(params.id);
  if (!success) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Agent not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: { message: "Agent deleted successfully" } });
}
