"use server";

import { findActivity } from "@/app/lib/activities";
import { sendMail } from "@/app/lib/mailer";

export type Answer = "yes" | "no";
export type AnswerResult = { status: "sent" | "error"; message?: string };

/**
 * Server Actions are reachable via direct POST, so this endpoint is throttled
 * per process: nobody gets to flood the inbox with fake answers.
 */
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 20;
let windowStart = 0;
let windowCount = 0;

function withinRateLimit() {
  const now = Date.now();
  if (now - windowStart > RATE_WINDOW_MS) {
    windowStart = now;
    windowCount = 0;
  }
  windowCount += 1;
  return windowCount <= RATE_MAX;
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function formatItalian(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const formatted = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export async function sendAnswer(input: {
  answer: Answer;
  date?: string | null;
  activity?: string | null;
}): Promise<AnswerResult> {
  const answer = input?.answer;
  if (answer !== "yes" && answer !== "no") {
    return { status: "error", message: "Risposta non valida." };
  }

  const date = typeof input?.date === "string" ? input.date : null;
  if (answer === "yes" && (!date || !isValidIsoDate(date))) {
    return { status: "error", message: "Data non valida." };
  }

  const activity = findActivity(input?.activity);
  if (answer === "yes" && !activity) {
    return { status: "error", message: "Scelta non valida." };
  }

  if (!withinRateLimit()) {
    return { status: "error", message: "Troppe risposte, riprova più tardi." };
  }

  const prettyDate = answer === "yes" && date ? formatItalian(date) : null;

  const subject =
    answer === "yes"
      ? `💚 Ha detto SÌ — ${activity?.label} il ${prettyDate}`
      : "💔 Ha detto NO (il giorno più triste della mia vita)";

  const text =
    answer === "yes"
      ? `Ha detto SÌ!\nCosa: ${activity?.icon} ${activity?.label}\nQuando: ${prettyDate} (${date})`
      : "Ha inseguito il pulsante No fino in fondo e ha confermato: è un no.";

  const html = `
    <div style="margin:0;padding:32px;background:#030b08;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
      <div style="max-width:520px;margin:0 auto;background:#071711;border:1px solid ${
        answer === "yes" ? "#a8d38a33" : "#e2657a33"
      };border-radius:20px;padding:32px;color:#f4ead4;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#a8d38a;">
          Grogu Date
        </p>
        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;color:${
          answer === "yes" ? "#a8d38a" : "#e2657a"
        };">
          ${answer === "yes" ? "Ha detto sì 💚" : "Ha detto no 💔"}
        </h1>
        ${
          answer === "yes"
            ? `<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#f4ead4cc;">
                 Ecco cosa le andrebbe di fare, e quando:
               </p>
               <p style="margin:0 0 10px;padding:16px 20px;background:#0f2a1c;border-radius:14px;font-size:20px;font-weight:600;color:#f4ead4;">
                 ${activity?.icon} ${activity?.label}
               </p>
               <p style="margin:0;padding:16px 20px;background:#0f2a1c;border-radius:14px;font-size:20px;font-weight:600;color:#f4ead4;">
                 ${prettyDate}
               </p>
               <p style="margin:16px 0 0;font-size:13px;color:#f4ead499;">Formato ISO: ${date}</p>`
            : `<p style="margin:0;font-size:16px;line-height:1.6;color:#f4ead4cc;">
                 Ha inseguito il pulsante “No” per tre secondi interi e poi ha confermato nel popup.
                 Determinazione notevole. Cuore a pezzi.
               </p>`
        }
      </div>
    </div>
  `;

  const result = await sendMail({ subject, html, text });
  if (!result.ok) {
    return { status: "error", message: "Non riesco a inviare la risposta. Riprova." };
  }

  return { status: "sent" };
}
