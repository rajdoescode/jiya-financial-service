import { NextRequest, NextResponse } from "next/server";
import { ClientService } from "@/lib/services/client.service";
import { getSessionUser } from "@/lib/auth/session";

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
    const updated = await ClientService.updateClient(params.id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Client not found" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: (error as Error).message } },
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

  const success = await ClientService.deleteClient(params.id);
  if (!success) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Client not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: { message: "Client deleted successfully" } });
}
