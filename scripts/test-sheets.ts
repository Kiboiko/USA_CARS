import { loadDotEnv } from "./_env";
import { loadConfig } from "../src/lib/config";
import { appendRow } from "../src/lib/services/sheets";

/**
 * Verifies the Google Sheets integration end-to-end: reads the service-account
 * credentials from .env, requests an access token, and appends one test row.
 * Run: npm run sheets:test
 */
async function main(): Promise<void> {
  loadDotEnv();
  process.env.JWT_SECRET ??= "test-only";

  const cfg = loadConfig();
  if (!cfg.sheets) {
    console.error(
      "❌ Google Sheets is not configured.\n" +
        "   Set these in .env: GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY",
    );
    process.exit(1);
  }

  console.log("Spreadsheet ID :", cfg.sheets.spreadsheetId);
  console.log("Range          :", cfg.sheets.range);
  console.log("Service account:", cfg.sheets.clientEmail);
  console.log("Appending a test row…\n");

  try {
    await appendRow(cfg.sheets, [
      new Date().toISOString(),
      "TEST LEAD",
      "+1 (555) 000-0000",
      "test@example.com",
      "Buy Now",
      "Integration test",
      "This row was written by scripts/test-sheets.ts — safe to delete.",
    ]);
    console.log("✅ Success — check the spreadsheet, a new row should appear.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ Append failed:\n  ", msg);
    if (/403|permission|PERMISSION_DENIED/i.test(msg)) {
      console.error(
        "\n  → Most likely the sheet is not shared with the service account.\n" +
          "    Share it (Editor) with: " + cfg.sheets.clientEmail,
      );
    }
    if (/API has not been used|SERVICE_DISABLED|Sheets API/i.test(msg)) {
      console.error("\n  → Enable the Google Sheets API in the Cloud project.");
    }
    if (/Unable to|invalid_grant|DECODER|PEM|private key/i.test(msg)) {
      console.error(
        "\n  → GOOGLE_PRIVATE_KEY looks malformed. Keep it on ONE line with \\n escapes,\n" +
          "    including the BEGIN/END lines.",
      );
    }
    process.exit(1);
  }
}

main();
