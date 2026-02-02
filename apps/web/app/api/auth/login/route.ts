import { NextRequest, NextResponse } from "next/server";
import { prisma, logAuditEvent } from "@ebv/db";
import {
  createSession,
  getRequestIp,
  getRequestUserAgent,
  setSessionCookie,
  verifyPassword,
} from "@ebv/auth";
import { buildAuditMetadata } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.toLowerCase?.().trim?.();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const { token, expiresAt } = await createSession({
    userId: user.id,
    ip: getRequestIp(req),
    userAgent: getRequestUserAgent(req),
  });

  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, token, expiresAt);

  await logAuditEvent({
    actorUserId: user.id,
    entityType: "AUTH",
    entityId: user.id,
    action: "LOGIN",
    before: null,
    after: { email: user.email },
    metadata: buildAuditMetadata(req),
  });

  return res;
}
