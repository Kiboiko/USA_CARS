import { describe, it, expect, beforeEach } from "vitest";
import type { Db } from "@/lib/db/connection";
import { createLead, getLead, listLeads } from "@/lib/db/leads";
import { makeDb, seedCar } from "../helpers";

describe("leads repository", () => {
  let db: Db;
  beforeEach(() => {
    db = makeDb();
  });

  it("creates a lead linked to a car with all fields", () => {
    const car = seedCar(db);
    const lead = createLead(db, {
      car_id: car.id,
      name: "Ann",
      phone: "+1 555",
      email: "ann@x.io",
      interest: "buy_now",
      message: "hi",
    });
    expect(lead.id).toBeGreaterThan(0);
    expect(lead.car_id).toBe(car.id);
    const stored = getLead(db, lead.id)!;
    expect(stored.name).toBe("Ann");
    expect(stored.phone).toBe("+1 555");
    expect(stored.email).toBe("ann@x.io");
    expect(stored.interest).toBe("buy_now");
  });

  it("defaults phone/email/interest/message to empty strings", () => {
    const lead = createLead(db, { name: "Bob", phone: "555" });
    expect(lead.car_id).toBeNull();
    expect(lead.email).toBe("");
    expect(lead.interest).toBe("");
    expect(lead.message).toBe("");
  });

  it("sets car_id to null when the referenced car is deleted (ON DELETE SET NULL)", () => {
    const car = seedCar(db);
    const lead = createLead(db, { car_id: car.id, name: "C", email: "c@x.io" });
    db.prepare("DELETE FROM cars WHERE id = ?").run(car.id);
    expect(getLead(db, lead.id)!.car_id).toBeNull();
  });

  it("lists leads newest-first", () => {
    const l1 = createLead(db, { name: "one", phone: "1" });
    const l2 = createLead(db, { name: "two", phone: "2" });
    const list = listLeads(db);
    expect(list.map((l) => l.id)).toEqual([l2.id, l1.id]);
  });

  it("returns null for a missing lead", () => {
    expect(getLead(db, 404)).toBeNull();
  });
});
