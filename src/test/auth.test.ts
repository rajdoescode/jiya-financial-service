// @vitest-environment node
import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import {
  hasPermission,
  requirePermission,
  requireRole,
  normalizeRole,
} from "@/lib/auth/permissions";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import {
  loginSchema,
  createEmployeeSchema,
  changeAdminPasswordSchema,
  agentSchema,
  investmentSchema,
} from "@/lib/validations";
import { AuthUserSession } from "@/types";

describe("Authentication & RBAC Test Suite", () => {
  it("hashes and verifies passwords securely using bcrypt", async () => {
    const rawPass = "admin123";
    const hash = await bcrypt.hash(rawPass, 10);
    expect(hash).not.toBe(rawPass);

    const matches = await bcrypt.compare(rawPass, hash);
    expect(matches).toBe(true);

    const wrongMatches = await bcrypt.compare("wrongpass", hash);
    expect(wrongMatches).toBe(false);
  });

  it("creates and verifies signed JWT session tokens", async () => {
    const user: AuthUserSession = {
      id: "admin",
      username: "admin",
      name: "Administrator",
      role: "admin",
    };

    const token = await createSessionToken(user);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.username).toBe("admin");
    expect(verified?.role).toBe("admin");
  });

  it("rejects invalid or tampered session tokens", async () => {
    const verified = await verifySessionToken("invalid.tampered.token");
    expect(verified).toBeNull();
  });

  it("enforces RBAC permissions correctly for Admin and Employee", () => {
    // Admin permissions
    expect(hasPermission("admin", "view_dashboard")).toBe(true);
    expect(hasPermission("admin", "record_investment")).toBe(true);
    expect(hasPermission("admin", "manage_employees")).toBe(true);
    expect(hasPermission("admin", "change_admin_password")).toBe(true);
    expect(hasPermission("admin", "backup_restore")).toBe(true);

    // Employee permissions
    expect(hasPermission("employee", "view_dashboard")).toBe(true);
    expect(hasPermission("employee", "record_investment")).toBe(true);
    expect(hasPermission("employee", "manage_employees")).toBe(false);
    expect(hasPermission("employee", "change_admin_password")).toBe(false);
    expect(hasPermission("employee", "backup_restore")).toBe(false);
  });

  it("handles requirePermission and requireRole assertions", () => {
    const adminUser: AuthUserSession = {
      id: "admin",
      username: "admin",
      name: "Admin",
      role: "admin",
    };

    const employeeUser: AuthUserSession = {
      id: "emp1",
      username: "emp1",
      name: "Employee 1",
      role: "employee",
    };

    // requireRole
    expect(() => requireRole(adminUser, "admin")).not.toThrow();
    expect(() => requireRole(employeeUser, "admin")).toThrow(/Requires admin role/);

    // requirePermission
    expect(() => requirePermission(adminUser, "manage_employees")).not.toThrow();
    expect(() => requirePermission(employeeUser, "manage_employees")).toThrow(
      /Missing required permission/
    );

    // Unauthenticated
    expect(() => requireRole(null, "admin")).toThrow(/Authentication required/);
    expect(() => requirePermission(null, "view_dashboard")).toThrow(
      /Authentication required/
    );
  });

  it("normalizes roles properly", () => {
    expect(normalizeRole("ADMIN")).toBe("admin");
    expect(normalizeRole("admin")).toBe("admin");
    expect(normalizeRole("EMPLOYEE")).toBe("employee");
    expect(normalizeRole("employee")).toBe("employee");
    expect(normalizeRole(undefined)).toBe("employee");
  });
});

describe("Validation Schemas Suite", () => {
  it("validates login schema", () => {
    expect(loginSchema.safeParse({ username: "admin", password: "123" }).success).toBe(true);
    expect(loginSchema.safeParse({ username: "", password: "123" }).success).toBe(false);
    expect(loginSchema.safeParse({ username: "admin", password: "" }).success).toBe(false);
  });

  it("validates create employee schema", () => {
    expect(
      createEmployeeSchema.safeParse({
        name: "Rahul Sharma",
        username: "rahul101",
        password: "password123",
      }).success
    ).toBe(true);

    // Username with invalid special chars
    expect(
      createEmployeeSchema.safeParse({
        name: "Rahul Sharma",
        username: "rahul@#$",
        password: "password123",
      }).success
    ).toBe(false);

    // Password too short (< 4 chars)
    expect(
      createEmployeeSchema.safeParse({
        name: "Rahul",
        username: "rahul101",
        password: "123",
      }).success
    ).toBe(false);
  });

  it("validates change admin password schema and password matching", () => {
    expect(
      changeAdminPasswordSchema.safeParse({
        currentPassword: "oldPassword",
        newPassword: "newSecretPass",
        confirmPassword: "newSecretPass",
      }).success
    ).toBe(true);

    expect(
      changeAdminPasswordSchema.safeParse({
        currentPassword: "oldPassword",
        newPassword: "newSecretPass",
        confirmPassword: "differentPass",
      }).success
    ).toBe(false);
  });

  it("validates agent schema and commission rates bounds", () => {
    expect(
      agentSchema.safeParse({
        name: "Agent 007",
        phone: "9820011223",
        rates: {
          SIP: 1.5,
          Lumpsum: 1.0,
          "Change of Broker": 0.5,
          Switch: 0.5,
        },
      }).success
    ).toBe(true);

    // Negative rate rejected
    expect(
      agentSchema.safeParse({
        name: "Agent 007",
        rates: {
          SIP: -1.0,
          Lumpsum: 1.0,
          "Change of Broker": 0.5,
          Switch: 0.5,
        },
      }).success
    ).toBe(false);
  });

  it("validates investment schema", () => {
    expect(
      investmentSchema.safeParse({
        clientId: "C1",
        agentId: "A1",
        type: "SIP",
        amount: 25000,
        rate: 1.5,
        date: "2026-09-05",
        scheme: "SBI Bluechip",
      }).success
    ).toBe(true);

    // Invalid date format
    expect(
      investmentSchema.safeParse({
        clientId: "C1",
        agentId: "A1",
        type: "SIP",
        amount: 25000,
        rate: 1.5,
        date: "05/09/2026",
      }).success
    ).toBe(false);

    // Non-positive amount
    expect(
      investmentSchema.safeParse({
        clientId: "C1",
        agentId: "A1",
        type: "SIP",
        amount: -100,
        rate: 1.5,
        date: "2026-09-05",
      }).success
    ).toBe(false);
  });
});
