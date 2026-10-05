import { AuthUserSession } from "@/types";

export type Role = "ADMIN" | "EMPLOYEE" | "admin" | "employee";

export type Permission =
  | "view_dashboard"
  | "record_investment"
  | "delete_investment"
  | "view_statement"
  | "manage_agents"
  | "manage_clients"
  | "manage_employees"
  | "change_admin_password"
  | "backup_restore";

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    "view_dashboard",
    "record_investment",
    "delete_investment",
    "view_statement",
    "manage_agents",
    "manage_clients",
    "manage_employees",
    "change_admin_password",
    "backup_restore",
  ],
  ADMIN: [
    "view_dashboard",
    "record_investment",
    "delete_investment",
    "view_statement",
    "manage_agents",
    "manage_clients",
    "manage_employees",
    "change_admin_password",
    "backup_restore",
  ],
  employee: [
    "view_dashboard",
    "record_investment",
    "delete_investment",
    "view_statement",
    "manage_agents",
    "manage_clients",
  ],
  EMPLOYEE: [
    "view_dashboard",
    "record_investment",
    "delete_investment",
    "view_statement",
    "manage_agents",
    "manage_clients",
  ],
};

export function normalizeRole(role?: string): "admin" | "employee" {
  if (!role) return "employee";
  const r = role.toLowerCase();
  return r === "admin" ? "admin" : "employee";
}

export function hasPermission(role: string, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}

export function requirePermission(
  user: AuthUserSession | null | undefined,
  permission: Permission
): void {
  if (!user) {
    throw new Error("UNAUTHORIZED: Authentication required");
  }
  if (!hasPermission(user.role, permission)) {
    throw new Error(`FORBIDDEN: Missing required permission: ${permission}`);
  }
}

export function requireRole(
  user: AuthUserSession | null | undefined,
  role: "admin" | "employee"
): void {
  if (!user) {
    throw new Error("UNAUTHORIZED: Authentication required");
  }
  if (normalizeRole(user.role) !== role) {
    throw new Error(`FORBIDDEN: Requires ${role} role`);
  }
}
