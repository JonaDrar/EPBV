import { prisma } from "@ebv/db";

function parseConfiguredRecipients() {
  const raw = process.env.NOTIFY_EMAILS;
  if (!raw || raw.trim().length === 0) return [];

  return raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function uniqueEmails(emails: string[]) {
  return Array.from(new Set(emails.map((email) => email.toLowerCase())));
}

export function getNotificationRecipients(fallbackEmail: string) {
  const configured = parseConfiguredRecipients();
  if (configured.length > 0) return uniqueEmails(configured);
  return uniqueEmails([fallbackEmail]);
}

export async function getAdminNotificationRecipients() {
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      active: true,
    },
    select: {
      email: true,
    },
  });

  const adminEmails = uniqueEmails(
    admins.map((admin) => admin.email.trim()).filter(Boolean)
  );
  if (adminEmails.length > 0) return adminEmails;

  return uniqueEmails(parseConfiguredRecipients());
}
