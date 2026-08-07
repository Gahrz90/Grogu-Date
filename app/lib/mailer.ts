type MailPayload = {
  subject: string;
  html: string;
  text: string;
};

export type MailResult = { ok: boolean; simulated?: boolean; error?: string };

/**
 * Minimal Resend client over `fetch` — no extra dependency to keep the project
 * as light as the joke it serves.
 */
export async function sendMail({ subject, html, text }: MailPayload): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.DATE_MAIL_TO;
  const from = process.env.DATE_MAIL_FROM ?? "Grogu Date <onboarding@resend.dev>";

  if (!apiKey || !to) {
    console.warn(
      `[grogu-date] RESEND_API_KEY o DATE_MAIL_TO non configurate: email non inviata.\n--- ${subject} ---\n${text}`,
    );
    return { ok: true, simulated: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html, text }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[grogu-date] Resend ha risposto ${response.status}: ${await response.text()}`);
      return { ok: false, error: `resend_${response.status}` };
    }

    return { ok: true };
  } catch (error) {
    console.error("[grogu-date] Invio email fallito:", error);
    return { ok: false, error: "network" };
  }
}
