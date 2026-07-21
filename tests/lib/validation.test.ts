import { describe, it, expect } from "vitest";
import { leadSchema, carSchema, loginSchema, formatZodError } from "@/lib/validation";

describe("validation schemas", () => {
  describe("leadSchema", () => {
    it("accepts a valid lead and trims fields", () => {
      const parsed = leadSchema.parse({ car_id: "5", name: "  Ann ", contact: "a@x", message: " hi " });
      expect(parsed).toEqual({ car_id: 5, name: "Ann", contact: "a@x", message: "hi" });
    });

    it("defaults message to empty and allows nullish car_id", () => {
      const parsed = leadSchema.parse({ name: "A", contact: "c" });
      expect(parsed.message).toBe("");
      expect(parsed.car_id == null).toBe(true);
    });

    it("rejects empty name/contact", () => {
      expect(leadSchema.safeParse({ name: "", contact: "c" }).success).toBe(false);
      expect(leadSchema.safeParse({ name: "a", contact: "  " }).success).toBe(false);
    });

    it("rejects non-positive car_id", () => {
      expect(leadSchema.safeParse({ car_id: 0, name: "a", contact: "c" }).success).toBe(false);
    });
  });

  describe("carSchema", () => {
    it("coerces numeric strings and applies defaults", () => {
      const parsed = carSchema.parse({ make: "Ford", model: "F", year: "2020", price: "1000" });
      expect(parsed.year).toBe(2020);
      expect(parsed.price).toBe(1000);
      expect(parsed.mileage).toBe(0);
      expect(parsed.photos).toEqual([]);
    });

    it("rejects out-of-range years", () => {
      expect(carSchema.safeParse({ make: "a", model: "b", year: 1800, price: 1 }).success).toBe(false);
      expect(
        carSchema.safeParse({ make: "a", model: "b", year: 3000, price: 1 }).success,
      ).toBe(false);
    });

    it("rejects negative price", () => {
      expect(carSchema.safeParse({ make: "a", model: "b", year: 2020, price: -1 }).success).toBe(false);
    });

    it("rejects missing make/model", () => {
      expect(carSchema.safeParse({ model: "b", year: 2020, price: 1 }).success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("accepts valid credentials", () => {
      expect(loginSchema.parse({ username: " a ", password: "p" })).toEqual({ username: "a", password: "p" });
    });
    it("rejects empty credentials", () => {
      expect(loginSchema.safeParse({ username: "", password: "p" }).success).toBe(false);
      expect(loginSchema.safeParse({ username: "a", password: "" }).success).toBe(false);
    });
  });

  it("formatZodError produces a readable message with field paths", () => {
    const result = carSchema.safeParse({ make: "", model: "b", year: 2020, price: 1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = formatZodError(result.error);
      expect(msg).toContain("make");
    }
  });
});
