import { readFileSync, existsSync } from "node:fs";

/**
 * Minimal .env loader for the CLI scripts (tsx doesn't auto-load .env like
 * Next.js does). Reading the file directly also avoids Git Bash / MSYS
 * mangling POSIX-looking values (e.g. "/uploads") when env is sourced in a
 * shell. Existing process.env values win, so real env overrides the file.
 */
export function loadDotEnv(path = ".env"): void {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Strip surrounding quotes if present (keeps inner \n escapes intact).
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
