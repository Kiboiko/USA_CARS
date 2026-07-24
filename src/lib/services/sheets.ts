import { SignJWT, importPKCS8 } from "jose";
import type { SheetsConfig } from "../config";
import type { Lead } from "../db/leads";
import type { Car } from "../db/cars";
import { interestLabel } from "../validation";

/**
 * Google Sheets integration (ТЗ §2.2 / §4): append one row per lead.
 *
 * Implemented against the Sheets REST API directly (service-account JWT →
 * OAuth2 access token → values.append) so the only dependency is `jose`. The
 * token fetch and API call are done via `fetch`, which is injectable for tests.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

export type FetchLike = typeof fetch;

/** Build the OAuth2 access token from a service-account key (RS256 assertion). */
export async function getAccessToken(config: SheetsConfig, fetchImpl: FetchLike): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(config.privateKey, "RS256");
  const assertion = await new SignJWT({ scope: SHEETS_SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(config.clientEmail)
    .setSubject(config.clientEmail)
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const res = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(`Google token request failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google token response missing access_token");
  return data.access_token;
}

export function buildLeadRow(lead: Lead, car: Car | null): string[] {
  const carLabel = car
    ? `${car.year} ${car.make} ${car.model}`
    : lead.car_id
      ? `#${lead.car_id}`
      : "";
  // Columns: date | name | phone | email | interest | car | message  (range A:G)
  return [
    lead.created_at,
    lead.name,
    // Leading apostrophe forces Google Sheets to store the phone as text — a
    // leading "+" would otherwise be read as a formula. Sheets hides the quote.
    lead.phone ? `'${lead.phone}` : "",
    lead.email ?? "",
    interestLabel(lead.interest),
    carLabel,
    lead.message ?? "",
  ];
}

/** Append a single row to the configured spreadsheet range. */
export async function appendRow(
  config: SheetsConfig,
  row: string[],
  fetchImpl: FetchLike = fetch,
): Promise<void> {
  const token = await getAccessToken(config, fetchImpl);
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}` +
    `/values/${encodeURIComponent(config.range)}:append?valueInputOption=USER_ENTERED`;

  const res = await fetchImpl(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ values: [row] }),
  });
  if (!res.ok) {
    throw new Error(`Google Sheets append failed: ${res.status} ${await res.text()}`);
  }
}

/**
 * Append a lead row, swallowing/ logging failures so Sheets outages never break
 * lead submission (ТЗ §2.2). Returns true on success.
 */
export async function appendLeadRow(
  config: SheetsConfig,
  lead: Lead,
  car: Car | null,
  fetchImpl: FetchLike = fetch,
): Promise<boolean> {
  try {
    await appendRow(config, buildLeadRow(lead, car), fetchImpl);
    return true;
  } catch (err) {
    console.error("Failed to append lead to Google Sheets:", err);
    return false;
  }
}
