import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { AuthUserSession } from "@/types";

const AUTH_COOKIE_NAME = "jiya_session_token";
const AUTH_SECRET = process.env.AUTH_SECRET || "development_auth_secret_jiya_financial_services_2026_secure_key";
const encodedKey = new TextEncoder().encode(AUTH_SECRET);

export async function createSessionToken(payload: AuthUserSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function verifySessionToken(token: string): Promise<AuthUserSession | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });

    return {
      id: payload.id as string,
      username: payload.username as string,
      name: payload.name as string,
      role: payload.role as "ADMIN" | "EMPLOYEE" | "admin" | "employee",
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<AuthUserSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
