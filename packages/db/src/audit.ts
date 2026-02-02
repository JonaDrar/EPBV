import { Prisma } from "@prisma/client";
import { prisma } from "./client";

type AuditInput = {
  actorUserId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
  metadata?: Prisma.InputJsonValue | null;
};

export async function logAuditEvent(input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      before: input.before ?? Prisma.JsonNull,
      after: input.after ?? Prisma.JsonNull,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
  });
}
