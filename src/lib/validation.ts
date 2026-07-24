import { z } from "zod";
import { isUsPhone } from "./format";

/**
 * Zod schemas for request bodies. Keeping them here (not inline in routes) makes
 * them independently testable and keeps the API contract from ТЗ §6 in one place.
 */

const currentYear = new Date().getFullYear();

/**
 * "Select your interest" options for the lead form (client-provided example).
 * `value` is the slug stored/sent over the API; `label` is what the frontend
 * shows. Role 2 renders <option value={value}>{label}</option>; the placeholder
 * ("Select Your Interest") sends an empty value.
 */
export const INTEREST_OPTIONS = [
  { value: "buy_now", label: "Buy Now" },
  { value: "trade_in", label: "Trade-In" },
  { value: "finance", label: "Finance This Vehicle" },
  { value: "lease", label: "Lease This Vehicle" },
  { value: "test_drive", label: "Schedule a Test Drive" },
  { value: "availability", label: "Ask About Availability" },
] as const;

export type InterestValue = (typeof INTEREST_OPTIONS)[number]["value"];

export const INTEREST_VALUES = INTEREST_OPTIONS.map((o) => o.value) as [
  InterestValue,
  ...InterestValue[],
];

/** Human-readable label for a stored interest slug (empty string if unset/unknown). */
export function interestLabel(value: string | null | undefined): string {
  if (!value) return "";
  return INTEREST_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

const emailField = z
  .string()
  .trim()
  .max(200)
  .optional()
  .default("")
  .refine((v) => v === "" || z.string().email().safeParse(v).success, "invalid email");

export const leadSchema = z
  .object({
    car_id: z.coerce.number().int().positive().nullish(),
    name: z.string().trim().min(1, "name is required").max(200),
    phone: z
      .string()
      .trim()
      .max(50)
      .optional()
      .default("")
      .refine((v) => v === "" || isUsPhone(v), "enter a valid US phone number"),
    email: emailField,
    // Accept a known slug or empty (placeholder not selected).
    interest: z
      .enum(INTEREST_VALUES)
      .or(z.literal(""))
      .optional()
      .default(""),
    message: z.string().trim().max(5000).optional().default(""),
  })
  // At least one way to contact the lead back must be provided.
  .refine((d) => d.phone.length > 0 || d.email.length > 0, {
    message: "phone or email is required",
    path: ["phone"],
  });

export type LeadPayload = z.infer<typeof leadSchema>;

export const carSchema = z.object({
  make: z.string().trim().min(1, "make is required").max(100),
  model: z.string().trim().min(1, "model is required").max(100),
  year: z.coerce
    .number()
    .int()
    .min(1900, "year too small")
    .max(currentYear + 1, "year too large"),
  price: z.coerce.number().int().min(0, "price must be >= 0"),
  mileage: z.coerce.number().int().min(0).optional().default(0),
  description: z.string().trim().max(20000).optional().default(""),
  photos: z.array(z.string().trim().min(1)).max(30).optional().default([]),
});

export type CarPayload = z.infer<typeof carSchema>;

export const loginSchema = z.object({
  username: z.string().trim().min(1, "username is required").max(100),
  password: z.string().min(1, "password is required").max(200),
});

export type LoginPayload = z.infer<typeof loginSchema>;

/** Flatten a ZodError into a single readable message. */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((i) => {
      const path = i.path.join(".");
      return path ? `${path}: ${i.message}` : i.message;
    })
    .join("; ");
}
