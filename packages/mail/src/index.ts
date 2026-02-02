export type SendMailInput = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
};

export type SendMailResult = {
  ok: boolean;
  id?: string;
  error?: string;
};

function normalizeTo(to: string | string[]) {
  return Array.isArray(to) ? to : [to];
}

export async function sendTransactionalEmail(
  input: SendMailInput
): Promise<SendMailResult> {
  const provider = process.env.MAIL_PROVIDER ?? "resend";
  const from = process.env.MAIL_FROM ?? "no-reply@local";

  if (provider !== "resend") {
    console.warn("MAIL_PROVIDER no soportado, usando consola");
    console.log("MAIL (simulado)", { from, ...input });
    return { ok: true, id: "console" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY no configurada");
    return { ok: false, error: "RESEND_API_KEY no configurada" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: normalizeTo(input.to),
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { ok: false, error: `Resend error: ${res.status} ${errorText}` };
    }

    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}
