import type { Db } from "../db/connection";
import type { AppConfig } from "../config";
import { createLead, type Lead, type LeadInput } from "../db/leads";
import { getCar } from "../db/cars";
import {
  createSmtpTransport,
  sendLeadEmail,
  type MailTransport,
} from "./email";
import { appendLeadRow, type FetchLike } from "./sheets";

/**
 * Orchestrates lead submission (ТЗ §2.2):
 *   1. persist to DB (must succeed — errors propagate)
 *   2. send email notification (best-effort)
 *   3. append to Google Sheets (best-effort)
 *
 * Steps 2 & 3 never throw: a failing integration is reported in the result but
 * the lead is still considered accepted once it is in the database.
 */

export interface LeadDeliveryResult {
  lead: Lead;
  emailSent: boolean;
  sheetAppended: boolean;
}

/** Overridable side-effects, injected by tests. */
export interface LeadServiceDeps {
  transport?: MailTransport | null;
  fetchImpl?: FetchLike;
}

export async function submitLead(
  db: Db,
  config: AppConfig,
  input: LeadInput,
  deps: LeadServiceDeps = {},
): Promise<LeadDeliveryResult> {
  const lead = createLead(db, input);
  const car = lead.car_id ? getCar(db, lead.car_id) : null;

  let emailSent = false;
  if (config.email) {
    const transport = deps.transport ?? createSmtpTransport(config.email);
    emailSent = await sendLeadEmail(transport, config.email, lead, car);
  }

  let sheetAppended = false;
  if (config.sheets) {
    sheetAppended = await appendLeadRow(config.sheets, lead, car, deps.fetchImpl ?? fetch);
  }

  return { lead, emailSent, sheetAppended };
}
