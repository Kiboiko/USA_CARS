import nodemailer from "nodemailer";
import type { EmailConfig } from "../config";
import type { Lead } from "../db/leads";
import type { Car } from "../db/cars";
import { interestLabel } from "../validation";

/**
 * Email notification for new leads via Titan SMTP (ТЗ §2.2 / §4).
 *
 * The transport is abstracted behind `MailTransport` so tests can inject a fake
 * that captures messages instead of opening a real SMTP connection.
 */

export interface MailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
}

export interface MailTransport {
  sendMail(message: MailMessage): Promise<unknown>;
}

export type FetchLike = typeof fetch;

/** Build a nodemailer SMTP transport from config. */
export function createSmtpTransport(config: EmailConfig): MailTransport {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
  });
  return {
    sendMail: (message) => transporter.sendMail(message),
  };
}

/**
 * Build a Resend HTTP transport. Sends over HTTPS (api.resend.com), so it works
 * in networks that block outbound SMTP. `fetchImpl` is injectable for tests.
 */
export function createResendTransport(
  config: EmailConfig,
  fetchImpl: FetchLike = fetch,
): MailTransport {
  return {
    async sendMail(message: MailMessage) {
      const res = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${config.resendApiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: message.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
      });
      if (!res.ok) {
        throw new Error(`Resend API error ${res.status}: ${await res.text()}`);
      }
      return res.json();
    },
  };
}

/** Pick the transport based on config: Resend if an API key is set, else SMTP. */
export function createMailTransport(config: EmailConfig): MailTransport {
  return config.resendApiKey ? createResendTransport(config) : createSmtpTransport(config);
}

export function buildLeadEmail(config: EmailConfig, lead: Lead, car: Car | null): MailMessage {
  const carLine = car
    ? `${car.year} ${car.make} ${car.model} (id ${car.id}, $${car.price})`
    : lead.car_id
      ? `car #${lead.car_id}`
      : "—";

  const text = [
    "Новая заявка с сайта:",
    "",
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone || "—"}`,
    `Email: ${lead.email || "—"}`,
    `Интерес: ${interestLabel(lead.interest) || "—"}`,
    `Машина: ${carLine}`,
    `Сообщение: ${lead.message || "—"}`,
    `Дата: ${lead.created_at}`,
  ].join("\n");

  return {
    from: config.from,
    to: config.to,
    subject: `Новая заявка${car ? `: ${car.make} ${car.model}` : ""}`,
    text,
  };
}

/**
 * Send a lead-notification email. Returns true if sent, false if it failed —
 * email problems must never break the lead-submission flow (ТЗ §2.2).
 */
export async function sendLeadEmail(
  transport: MailTransport,
  config: EmailConfig,
  lead: Lead,
  car: Car | null,
): Promise<boolean> {
  try {
    await transport.sendMail(buildLeadEmail(config, lead, car));
    return true;
  } catch (err) {
    console.error("Failed to send lead email:", err);
    return false;
  }
}
