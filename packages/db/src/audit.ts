import { prisma } from "./client";

type AuditInput = {
  actorUserId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
};

function toJsonSafe(value: unknown) {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

export async function logAuditEvent(input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      before: toJsonSafe(input.before) as any,
      after: toJsonSafe(input.after) as any,
      metadata: toJsonSafe(input.metadata) as any,
    },
  });
}
