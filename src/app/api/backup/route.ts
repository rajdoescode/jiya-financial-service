import { NextRequest, NextResponse } from "next/server";
import { BackupService } from "@/lib/services/backup.service";
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
      { success: false, error: { code: "FORBIDDEN", message: "Only administrators can export backup data" } },
      { status: 403 }
    );
  }

  const data = await BackupService.exportData();
  return NextResponse.json({ success: true, data });
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
      { success: false, error: { code: "FORBIDDEN", message: "Only administrators can restore backup data" } },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    if (!body || (!body.agents && !body.clients && !body.investments)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_BACKUP", message: "Invalid backup file structure" } },
        { status: 400 }
      );
    }

    const res = await BackupService.restoreData(body);
    return NextResponse.json({ success: true, data: res });
  } catch (error) {
    console.error("Backup restore error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
