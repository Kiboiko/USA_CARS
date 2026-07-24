/**
 * Centralised environment/config parsing for the backend (Role 1).
 *
 * Everything that reads from `process.env` goes through here so the rest of the
 * code can be tested by passing explicit config objects instead of mutating the
 * environment.
 */

export interface EmailConfig {
  from: string;
  to: string;
  // SMTP transport (used when resendApiKey is absent).
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  password?: string;
  // Resend HTTP transport (preferred — sends over HTTPS, works where SMTP is blocked).
  resendApiKey?: string;
}

export interface SheetsConfig {
  spreadsheetId: string;
  /** Tab/range to append to, e.g. "Leads!A:E". */
  range: string;
  clientEmail: string;
  /** PEM private key (with real newlines). */
  privateKey: string;
}

export interface AppConfig {
  databasePath: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  uploadDir: string;
  publicUploadPath: string;
  maxUploadBytes: number;
  email: EmailConfig | null;
  sheets: SheetsConfig | null;
}

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v === undefined || v === "" ? undefined : v;
}

function required(name: string): string {
  const v = optional(name);
  if (v === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

function parseEmailConfig(): EmailConfig | null {
  const to = optional("LEADS_EMAIL_TO");

  // Preferred: Resend HTTP API (works even where outbound SMTP is blocked).
  const resendApiKey = optional("RESEND_API_KEY");
  if (resendApiKey) {
    if (!to) return null; // a recipient is required
    return {
      from: optional("EMAIL_FROM") ?? optional("SMTP_FROM") ?? "onboarding@resend.dev",
      to,
      resendApiKey,
    };
  }

  // Fallback: SMTP. If the core secrets are absent the lead flow degrades
  // gracefully (records to DB, skips the email notification).
  const host = optional("SMTP_HOST");
  const user = optional("SMTP_USER");
  const password = optional("SMTP_PASSWORD");
  if (!host || !user || !password) return null;

  const port = Number(optional("SMTP_PORT") ?? "465");
  return {
    host,
    port,
    secure: (optional("SMTP_SECURE") ?? (port === 465 ? "true" : "false")) === "true",
    user,
    password,
    from: optional("SMTP_FROM") ?? user,
    to: to ?? user,
  };
}

function parseSheetsConfig(): SheetsConfig | null {
  const spreadsheetId = optional("GOOGLE_SHEETS_ID");
  const clientEmail = optional("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const rawKey = optional("GOOGLE_PRIVATE_KEY");
  if (!spreadsheetId || !clientEmail || !rawKey) return null;

  return {
    spreadsheetId,
    range: optional("GOOGLE_SHEETS_RANGE") ?? "Leads!A:G",
    clientEmail,
    // Env vars commonly store the key with literal "\n"; normalise to newlines.
    privateKey: rawKey.replace(/\\n/g, "\n"),
  };
}

/** Build the full app config from the current environment. */
export function loadConfig(): AppConfig {
  return {
    databasePath: optional("DATABASE_PATH") ?? "data/app.db",
    jwtSecret: required("JWT_SECRET"),
    jwtExpiresIn: optional("JWT_EXPIRES_IN") ?? "12h",
    uploadDir: optional("UPLOAD_DIR") ?? "public/uploads",
    publicUploadPath: optional("PUBLIC_UPLOAD_PATH") ?? "/uploads",
    maxUploadBytes: Number(optional("MAX_UPLOAD_BYTES") ?? String(5 * 1024 * 1024)),
    email: parseEmailConfig(),
    sheets: parseSheetsConfig(),
  };
}

// Lazily-cached singleton so a single request doesn't re-parse env repeatedly.
let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!cached) cached = loadConfig();
  return cached;
}

/** Test helper: drop the cached config so the next getConfig() re-reads env. */
export function resetConfigCache(): void {
  cached = null;
}
