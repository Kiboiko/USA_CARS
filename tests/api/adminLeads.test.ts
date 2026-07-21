import { describe, it, expect, beforeEach } from "vitest";
import { getDb, resetDb } from "@/lib/db/connection";
import { resetConfigCache } from "@/lib/config";
import { GET as adminLeads } from "@/app/api/admin/leads/route";
import { createLead } from "@/lib/db/leads";
import { authHeader, makeAdminToken } from "../helpers";

let token: string;

beforeEach(async () => {
  resetDb();
  resetConfigCache();
  token = await makeAdminToken(getDb());
});

describe("GET /api/admin/leads", () => {
  it("rejects without a token", async () => {
    const res = await adminLeads(new Request("http://t/api/admin/leads"));
    expect(res.status).toBe(401);
  });

  it("returns leads newest-first for an authenticated admin", async () => {
    createLead(getDb(), { name: "one", contact: "1" });
    createLead(getDb(), { name: "two", contact: "2" });
    const res = await adminLeads(
      new Request("http://t/api/admin/leads", { headers: authHeader(token) }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].name).toBe("two");
  });
});
