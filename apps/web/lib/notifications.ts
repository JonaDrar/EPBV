export function getNotificationRecipients(fallbackEmail: string) {
  const raw = process.env.NOTIFY_EMAILS;
  if (raw && raw.trim().length > 0) {
    return raw.split(",").map((email) => email.trim()).filter(Boolean);
  }
  return [fallbackEmail];
}
