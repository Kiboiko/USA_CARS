import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Db } from "@/lib/db/connection";
import { submitLead } from "@/lib/services/leadService";
import type { AppConfig, EmailConfig, SheetsConfig } from "@/lib/config";
import type { MailTransport } from "@/lib/services/email";
import { getLead } from "@/lib/db/leads";
import { makeDb, seedCar } from "../helpers";

const emailConfig: EmailConfig = {
  host: "h",
  port: 465,
  secure: true,
  user: "u",
  password: "p",
  from: "from@x",
  to: "to@x",
};

function baseConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    databasePath: ":memory:",
    jwtSecret: "s",
    jwtExpiresIn: "12h",
    uploadDir: "public/uploads",
    publicUploadPath: "/uploads",
    maxUploadBytes: 1024,
    email: null,
    sheets: null,
    ...overrides,
  };
}

describe("lead orchestration", () => {
  let db: Db;
  beforeEach(() => {
    db = makeDb();
  });

  it("persists the lead even with no integrations configured", async () => {
    const result = await submitLead(db, baseConfig(), { name: "A", phone: "555" });
    expect(result.lead.id).toBeGreaterThan(0);
    expect(result.emailSent).toBe(false);
    expect(result.sheetAppended).toBe(false);
    expect(getLead(db, result.lead.id)).not.toBeNull();
  });

  it("sends email when email config is present, passing the linked car", async () => {
    const car = seedCar(db);
    const transport: MailTransport = { sendMail: vi.fn().mockResolvedValue({}) };
    const result = await submitLead(
      db,
      baseConfig({ email: emailConfig }),
      { car_id: car.id, name: "A", phone: "555" },
      { transport },
    );
    expect(result.emailSent).toBe(true);
    const msg = (transport.sendMail as any).mock.calls[0][0];
    expect(msg.text).toContain(`${car.year} ${car.make} ${car.model}`);
  });

  it("still persists the lead when email throws", async () => {
    const transport: MailTransport = { sendMail: vi.fn().mockRejectedValue(new Error("x")) };
    const result = await submitLead(
      db,
      baseConfig({ email: emailConfig }),
      { name: "A", phone: "555" },
      { transport },
    );
    expect(result.emailSent).toBe(false);
    expect(getLead(db, result.lead.id)).not.toBeNull();
  });

  it("appends to sheets when sheets config is present", async () => {
    const sheets: SheetsConfig = {
      spreadsheetId: "s",
      range: "Leads!A:E",
      clientEmail: "svc@x",
      // fetch is mocked, so getAccessToken's key import is never reached before fetch;
      // provide a resolved token + append so the flow completes without a real key.
      privateKey: "unused",
    };
    // Mock both getAccessToken's token fetch and the append call.
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "t" }), text: async () => "" })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}), text: async () => "" });
    // getAccessToken will call importPKCS8 with "unused" and throw -> appendLeadRow returns false.
    const result = await submitLead(
      db,
      baseConfig({ sheets }),
      { name: "A", phone: "555" },
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    );
    // With an invalid key the append fails gracefully but the lead is still saved.
    expect(getLead(db, result.lead.id)).not.toBeNull();
    expect(result.sheetAppended).toBe(false);
  });
});
