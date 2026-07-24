import { loadDotEnv } from "./_env";
import { loadConfig } from "../src/lib/config";
import { createMailTransport, buildLeadEmail } from "../src/lib/services/email";
import type { Lead } from "../src/lib/db/leads";

/**
 * Verifies the email notification (Titan SMTP) end-to-end: connects, authenticates
 * and sends one test lead-notification message. Run: npm run email:test
 */
async function main(): Promise<void> {
  loadDotEnv();
  process.env.JWT_SECRET ??= "test-only";

  const cfg = loadConfig();
  if (!cfg.email) {
    console.error(
      "❌ Email is not configured.\n" +
        "   Resend: set RESEND_API_KEY and LEADS_EMAIL_TO in .env.\n" +
        "   Or SMTP: set SMTP_HOST, SMTP_USER, SMTP_PASSWORD.",
    );
    process.exit(1);
  }

  if (cfg.email.resendApiKey) {
    console.log("Provider    : Resend (HTTPS API)");
  } else {
    console.log(
      "Provider    : SMTP",
      cfg.email.host,
      "port",
      cfg.email.port,
      cfg.email.secure ? "(SSL)" : "(STARTTLS)",
    );
  }
  console.log("From        :", cfg.email.from);
  console.log("Notify to   :", cfg.email.to);
  console.log("Sending a test notification…\n");

  const sampleLead: Lead = {
    id: 0,
    car_id: null,
    name: "TEST — email integration",
    phone: "+1 (212) 555-0134",
    email: "test@example.com",
    interest: "buy_now",
    message: "This is a test notification from scripts/test-email.ts — safe to ignore.",
    created_at: new Date().toISOString(),
  };

  try {
    const transport = createMailTransport(cfg.email);
    await transport.sendMail(buildLeadEmail(cfg.email, sampleLead, null));
    console.log(`✅ Sent — check the inbox of ${cfg.email.to}.`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ Send failed:\n  ", msg);
    if (/Resend API error 401|Unauthorized|invalid api key/i.test(msg)) {
      console.error("\n  → Resend rejected the API key. Check RESEND_API_KEY.");
    }
    if (/Resend API error 403|not verified|domain|testing emails/i.test(msg)) {
      console.error(
        "\n  → Resend: without a verified domain you can only send from onboarding@resend.dev\n" +
          "    to the email you signed up with. Sign up with " + cfg.email.to + ", or verify a domain.",
      );
    }
    if (/EAUTH|535|authentication|Username and Password/i.test(msg)) {
      console.error("\n  → SMTP auth rejected. Check SMTP_USER and SMTP_PASSWORD (app password).");
    }
    if (/ECONNECTION|ETIMEDOUT|ENOTFOUND|ESOCKET|getaddrinfo|socket/i.test(msg)) {
      console.error("\n  → Cannot reach the mail server (this network may block SMTP — Resend uses HTTPS).");
    }
    process.exit(1);
  }
}

main();
