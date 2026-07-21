import { describe, it, expect, afterEach } from "vitest";
import { loadConfig } from "@/lib/config";

/**
 * These tests mutate process.env directly and always call loadConfig() (not the
 * cached getConfig()) so they don't fight the global singleton.
 */
const ENV_KEYS = [
  "DATABASE_PATH",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM",
  "LEADS_EMAIL_TO",
  "GOOGLE_SHEETS_ID",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "GOOGLE_SHEETS_RANGE",
];

const saved: Record<string, string | undefined> = {};
for (const k of ENV_KEYS) saved[k] = process.env[k];

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("config", () => {
  it("throws when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;
    expect(() => loadConfig()).toThrow(/JWT_SECRET/);
  });

  it("applies sensible defaults", () => {
    process.env.JWT_SECRET = "x";
    delete process.env.DATABASE_PATH;
    delete process.env.JWT_EXPIRES_IN;
    const cfg = loadConfig();
    expect(cfg.databasePath).toBe("data/app.db");
    expect(cfg.jwtExpiresIn).toBe("12h");
    expect(cfg.email).toBeNull();
    expect(cfg.sheets).toBeNull();
  });

  it("returns null email config when secrets are incomplete", () => {
    process.env.JWT_SECRET = "x";
    process.env.SMTP_HOST = "smtp.titan.email";
    // user/password missing
    expect(loadConfig().email).toBeNull();
  });

  it("builds email config and infers secure from port 465", () => {
    process.env.JWT_SECRET = "x";
    process.env.SMTP_HOST = "smtp.titan.email";
    process.env.SMTP_USER = "u@x";
    process.env.SMTP_PASSWORD = "pw";
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_FROM;
    delete process.env.LEADS_EMAIL_TO;
    const cfg = loadConfig();
    expect(cfg.email).toEqual({
      host: "smtp.titan.email",
      port: 465,
      secure: true,
      user: "u@x",
      password: "pw",
      from: "u@x",
      to: "u@x",
    });
  });

  it("normalises escaped newlines in the Google private key", () => {
    process.env.JWT_SECRET = "x";
    process.env.GOOGLE_SHEETS_ID = "s";
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "svc@x";
    process.env.GOOGLE_PRIVATE_KEY = "line1\\nline2";
    const cfg = loadConfig();
    expect(cfg.sheets!.privateKey).toBe("line1\nline2");
    expect(cfg.sheets!.range).toBe("Leads!A:G");
  });
});
