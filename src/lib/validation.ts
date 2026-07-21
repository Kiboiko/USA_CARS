import { z } from "zod";

/**
 * Zod schemas for request bodies. Keeping them here (not inline in routes) makes
 * them independently testable and keeps the API contract from ТЗ §6 in one place.
 */

const currentYear = new Date().getFullYear();

export const leadSchema = z.object({
  car_id: z.coerce.number().int().positive().nullish(),
  name: z.string().trim().min(1, "name is required").max(200),
  contact: z.string().trim().min(1, "contact is required").max(200),
  message: z.string().trim().max(5000).optional().default(""),
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
