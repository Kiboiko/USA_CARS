import { describe, it, expect, beforeEach } from "vitest";
import type { Db } from "@/lib/db/connection";
import { createLead, getLead, listLeads } from "@/lib/db/leads";
import { makeDb, seedCar } from "../helpers";

describe("leads repository", () => {
  let db: Db;
  beforeEach(() => {
    db = makeDb();
  });

  it("creates a lead linked to a car", () => {
    const car = seedCar(db);
    const lead = createLead(db, { car_id: car.id, name: "Ann", contact: "ann@x.io", message: "hi" });
    expect(lead.id).toBeGreaterThan(0);
    expect(lead.car_id).toBe(car.id);
    expect(getLead(db, lead.id)!.name).toBe("Ann");
  });

  it("creates a lead without a car (car_id null) and default message", () => {
    const lead = createLead(db, { name: "Bob", contact: "555" });
    expect(lead.car_id).toBeNull();
    expect(lead.message).toBe("");
  });

  it("sets car_id to null when the referenced car is deleted (ON DELETE SET NULL)", () => {
    const car = seedCar(db);
    const lead = createLead(db, { car_id: car.id, name: "C", contact: "c" });
    db.prepare("DELETE FROM cars WHERE id = ?").run(car.id);
    expect(getLead(db, lead.id)!.car_id).toBeNull();
  });

  it("lists leads newest-first", () => {
    const l1 = createLead(db, { name: "one", contact: "1" });
    const l2 = createLead(db, { name: "two", contact: "2" });
    const list = listLeads(db);
    expect(list.map((l) => l.id)).toEqual([l2.id, l1.id]);
  });

  it("returns null for a missing lead", () => {
    expect(getLead(db, 404)).toBeNull();
  });
});
