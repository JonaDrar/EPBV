import { NextRequest, NextResponse } from "next/server";
import { logAuditEvent } from "@ebv/db";
import {
  clearSessionCookie,
  getAuthFromRequest,
  revokeSessionByToken,
  SESSION_COOKIE_NAME,
} from "@ebv/auth";
import { buildAuditMetadata } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await revokeSessionByToken(token);
  }

  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);

  if (auth?.user) {
    await logAuditEvent({
      actorUserId: auth.user.id,
      entityType: "AUTH",
      entityId: auth.user.id,
      action: "LOGOUT",
      before: null,
      after: null,
      metadata: buildAuditMetadata(req),
    });
  }

  return res;
}
