import { logAuditEvent } from "@ebv/db";
import { sendTransactionalEmail, SendMailInput } from "@ebv/mail";

export async function sendMailWithAudit(input: {
  mail: SendMailInput;
  actorUserId?: string | null;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
}) {
  const result = await sendTransactionalEmail(input.mail);

  await logAuditEvent({
    actorUserId: input.actorUserId ?? null,
    entityType: input.entityType,
    entityId: input.entityId,
    action: result.ok ? "MAIL_SENT" : "MAIL_FAILED",
    before: null,
    after: {
      to: input.mail.to,
      subject: input.mail.subject,
      provider: process.env.MAIL_PROVIDER ?? "resend",
      id: result.id ?? null,
      error: result.error ?? null,
    },
    metadata: input.metadata,
  });

  return result;
}
