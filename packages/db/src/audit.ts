import { prisma } from "./client";

type AuditInput = {
  actorUserId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown> | null;
};

export async function logAuditEvent(input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      before: input.before ?? null,
      after: input.after ?? null,
      metadata: input.metadata ?? null,
    },
  });
}
