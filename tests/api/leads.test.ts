import { describe, it, expect, beforeEach } from "vitest";
import { getDb, resetDb } from "@/lib/db/connection";
import { resetConfigCache } from "@/lib/config";
import { POST as postLead } from "@/app/api/leads/route";
import { listLeads } from "@/lib/db/leads";
import { jsonRequest, seedCar } from "../helpers";

beforeEach(() => {
  resetDb();
  resetConfigCache();
});

describe("POST /api/leads", () => {
  it("accepts a valid lead with all form fields and stores it", async () => {
    const car = seedCar(getDb());
    const res = await postLead(
      jsonRequest("http://t/api/leads", "POST", {
        car_id: car.id,
        name: "Ann",
        phone: "+1 555",
        email: "ann@x.io",
        interest: "test_drive",
        message: "interested",
      }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });

    const leads = listLeads(getDb());
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      name: "Ann",
      car_id: car.id,
      phone: "+1 555",
      email: "ann@x.io",
      interest: "test_drive",
    });
  });

  it("accepts a lead with only a phone and no car", async () => {
    const res = await postLead(
      jsonRequest("http://t/api/leads", "POST", { name: "Bob", phone: "555" }),
    );
    expect(res.status).toBe(201);
    expect(listLeads(getDb())[0].car_id).toBeNull();
  });

  it("returns 400 when neither phone nor email is given", async () => {
    const res = await postLead(jsonRequest("http://t/api/leads", "POST", { name: "Bob" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toHaveProperty("error");
    expect(listLeads(getDb())).toHaveLength(0);
  });

  it("returns 400 for an invalid interest value", async () => {
    const res = await postLead(
      jsonRequest("http://t/api/leads", "POST", { name: "Bob", phone: "1", interest: "bogus" }),
    );
    expect(res.status).toBe(400);
    expect(listLeads(getDb())).toHaveLength(0);
  });

  it("returns 400 for malformed JSON", async () => {
    const req = new Request("http://t/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    const res = await postLead(req);
    expect(res.status).toBe(400);
  });
});
