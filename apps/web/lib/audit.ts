import { NextRequest } from "next/server";

export function buildAuditMetadata(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = req.headers.get("user-agent");
  return {
    ip,
    userAgent,
    path: req.nextUrl.pathname,
    method: req.method,
  };
}
