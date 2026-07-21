import { describe, it, expect, vi } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { buildLeadRow, getAccessToken, appendRow, appendLeadRow } from "@/lib/services/sheets";
import type { SheetsConfig } from "@/lib/config";
import type { Lead } from "@/lib/db/leads";
import type { Car } from "@/lib/db/cars";

// A real RSA key so jose can actually sign the service-account assertion.
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

const config: SheetsConfig = {
  spreadsheetId: "sheet123",
  range: "Leads!A:E",
  clientEmail: "svc@project.iam.gserviceaccount.com",
  privateKey: pem,
};

const lead: Lead = {
  id: 1,
  car_id: 5,
  name: "Ann",
  phone: "+1 555",
  email: "ann@x.io",
  interest: "finance",
  message: "hi",
  created_at: "2026-07-21 10:00:00",
};

const car: Car = {
  id: 5,
  make: "Ford",
  model: "Mustang",
  year: 2019,
  price: 32900,
  mileage: 41000,
  description: "",
  photos: [],
  created_at: "",
  updated_at: "",
};

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe("sheets service", () => {
  it("builds a row with human-readable car label and interest", () => {
    expect(buildLeadRow(lead, car)).toEqual([
      "2026-07-21 10:00:00",
      "Ann",
      "+1 555",
      "ann@x.io",
      "Finance This Vehicle",
      "2019 Ford Mustang",
      "hi",
    ]);
  });

  it("builds a row with car_id fallback and empty message/interest", () => {
    expect(buildLeadRow({ ...lead, message: "", interest: "" }, null)).toEqual([
      "2026-07-21 10:00:00",
      "Ann",
      "+1 555",
      "ann@x.io",
      "",
      "#5",
      "",
    ]);
  });

  it("obtains an access token from the OAuth endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ access_token: "tok-abc" }));
    const token = await getAccessToken(config, fetchMock as unknown as typeof fetch);
    expect(token).toBe("tok-abc");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://oauth2.googleapis.com/token");
    expect((init as RequestInit).method).toBe("POST");
    expect(String((init as RequestInit).body)).toContain("assertion=");
  });

  it("throws when the token endpoint returns an error", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "bad" }, false, 400));
    await expect(getAccessToken(config, fetchMock as unknown as typeof fetch)).rejects.toThrow(
      /token request failed/,
    );
  });

  it("throws when token response lacks access_token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    await expect(getAccessToken(config, fetchMock as unknown as typeof fetch)).rejects.toThrow(
      /missing access_token/,
    );
  });

  it("appends a row: token call then values.append with bearer auth", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok-1" }))
      .mockResolvedValueOnce(jsonResponse({ updates: {} }));
    await appendRow(config, ["a", "b"], fetchMock as unknown as typeof fetch);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1];
    expect(String(url)).toContain("/values/Leads!A%3AE:append");
    expect(String(url)).toContain("valueInputOption=USER_ENTERED");
    expect((init as RequestInit).headers).toMatchObject({ authorization: "Bearer tok-1" });
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({ values: [["a", "b"]] });
  });

  it("throws when the append call fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok-1" }))
      .mockResolvedValueOnce(jsonResponse({ error: "nope" }, false, 403));
    await expect(appendRow(config, ["a"], fetchMock as unknown as typeof fetch)).rejects.toThrow(
      /append failed/,
    );
  });

  it("appendLeadRow returns true on success", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok-1" }))
      .mockResolvedValueOnce(jsonResponse({ updates: {} }));
    expect(await appendLeadRow(config, lead, car, fetchMock as unknown as typeof fetch)).toBe(true);
  });

  it("appendLeadRow returns false (never throws) on failure", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));
    expect(await appendLeadRow(config, lead, car, fetchMock as unknown as typeof fetch)).toBe(false);
  });
});
