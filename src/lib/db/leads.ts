import type { Db } from "./connection";

export interface Lead {
  id: number;
  car_id: number | null;
  name: string;
  contact: string;
  message: string;
  created_at: string;
}

export interface LeadInput {
  car_id?: number | null;
  name: string;
  contact: string;
  message?: string;
}

/** Insert a lead and return the created row. */
export function createLead(db: Db, input: LeadInput): Lead {
  const result = db
    .prepare("INSERT INTO leads (car_id, name, contact, message) VALUES (?, ?, ?, ?)")
    .run(input.car_id ?? null, input.name, input.contact, input.message ?? "");
  const created = getLead(db, Number(result.lastInsertRowid));
  if (!created) throw new Error("Failed to load lead after insert");
  return created;
}

export function getLead(db: Db, id: number): Lead | null {
  const row = db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as Lead | undefined;
  return row ?? null;
}

/** List all leads, newest first (admin view — ТЗ §6). */
export function listLeads(db: Db): Lead[] {
  return db
    .prepare("SELECT * FROM leads ORDER BY created_at DESC, id DESC")
    .all() as unknown as Lead[];
}
