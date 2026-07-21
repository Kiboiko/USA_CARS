import { INTEREST_OPTIONS } from "@/lib/validation";
import { json } from "@/lib/http";

// GET /api/lead-options → { interests: [{ value, label }] }
// Lets the frontend (Role 2) build the "Select your interest" dropdown from the
// same source of truth the backend validates against.
export function GET(): Response {
  return json({ interests: INTEREST_OPTIONS });
}
