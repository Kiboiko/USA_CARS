import nodemailer from "nodemailer";
import type { EmailConfig } from "../config";
import type { Lead } from "../db/leads";
import type { Car } from "../db/cars";

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

/** Build a real nodemailer transport from Titan SMTP config. */
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
    `Контакт: ${lead.contact}`,
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
