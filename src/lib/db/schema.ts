/**
 * Database schema (draft schema from ТЗ §3).
 *
 * Kept as a single SQL string so it can be applied both at runtime (first-run
 * bootstrap) and in tests against an in-memory database.
 */
export const SCHEMA_SQL = /* sql */ `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cars (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  make        TEXT    NOT NULL,
  model       TEXT    NOT NULL,
  year        INTEGER NOT NULL,
  price       INTEGER NOT NULL,
  mileage     INTEGER NOT NULL DEFAULT 0,
  description TEXT    NOT NULL DEFAULT '',
  photos      TEXT    NOT NULL DEFAULT '[]', -- JSON array of photo URLs
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  car_id     INTEGER REFERENCES cars(id) ON DELETE SET NULL,
  name       TEXT    NOT NULL,
  phone      TEXT    NOT NULL DEFAULT '',
  email      TEXT    NOT NULL DEFAULT '',
  interest   TEXT    NOT NULL DEFAULT '', -- slug from INTEREST_OPTIONS, '' = not selected
  message    TEXT    NOT NULL DEFAULT '',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_car_id     ON leads(car_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_cars_created_at  ON cars(created_at);
`;
