// @ts-ignore - bcryptjs has no bundled types in this project
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ebv/db";

type Role = "ADMIN" | "INTERNAL";
type User = {
  id: string;
  email: string;
  role: Role;
  active: boolean;
  passwordHash: string;
  name?: string | null;
};

export const SESSION_COOKIE_NAME = "ebv_session";
export const SESSION_MAX_DAYS = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(input: {
  userId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: input.userId,
      tokenHash,
      expiresAt,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    },
  });

  return { token, expiresAt };
}

export async function revokeSessionByToken(token: string) {
  const tokenHash = hashToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}

export async function getAuthFromRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.deleteMany({ where: { tokenHash } });
    return null;
  }

  return { session, user: session.user } as { session: typeof session; user: User };
}

export function setSessionCookie(
  res: NextResponse,
  token: string,
  expiresAt: Date
) {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export function requireRole(
  auth: { user: User } | null,
  roles: Role[]
) {
  if (!auth) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!auth.user.active) {
    return NextResponse.json({ error: "Usuario inactivo" }, { status: 403 });
  }
  if (!roles.includes(auth.user.role)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }
  return null;
}

export function getRequestIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.ip ??
    null
  );
}

export function getRequestUserAgent(req: NextRequest) {
  return req.headers.get("user-agent");
}
