import { createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@ebv/db";
import { SESSION_COOKIE_NAME } from "@ebv/auth";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.deleteMany({ where: { tokenHash: session.tokenHash } });
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
