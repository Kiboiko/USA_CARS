import { describe, it, expect } from "vitest";
import {
  leadSchema,
  carSchema,
  loginSchema,
  formatZodError,
  interestLabel,
  INTEREST_OPTIONS,
} from "@/lib/validation";

describe("validation schemas", () => {
  describe("leadSchema", () => {
    it("accepts a full valid lead and trims fields", () => {
      const parsed = leadSchema.parse({
        car_id: "5",
        name: "  Ann ",
        phone: " +1 (212) 555-0134 ",
        email: " a@x.io ",
        interest: "buy_now",
        message: " hi ",
      });
      expect(parsed).toEqual({
        car_id: 5,
        name: "Ann",
        phone: "+1 (212) 555-0134",
        email: "a@x.io",
        interest: "buy_now",
        message: "hi",
      });
    });

    it("accepts a lead with only a phone (email optional)", () => {
      const parsed = leadSchema.parse({ name: "A", phone: "2125550134" });
      expect(parsed.email).toBe("");
      expect(parsed.interest).toBe("");
      expect(parsed.message).toBe("");
      expect(parsed.car_id == null).toBe(true);
    });

    it("rejects a phone that is not a valid US number", () => {
      const res = leadSchema.safeParse({ name: "A", phone: "555-12" });
      expect(res.success).toBe(false);
      if (!res.success) expect(formatZodError(res.error)).toMatch(/US phone/);
    });

    it("accepts common US phone formats", () => {
      for (const phone of [
        "2125550134",
        "212-555-0134",
        "(212) 555-0134",
        "+1 (212) 555-0134",
        "1 212 555 0134",
        "212.555.0134",
      ]) {
        expect(leadSchema.safeParse({ name: "A", phone }).success).toBe(true);
      }
    });

    it("accepts a lead with only an email", () => {
      expect(leadSchema.safeParse({ name: "A", email: "a@x.io" }).success).toBe(true);
    });

    it("rejects a lead with neither phone nor email", () => {
      const res = leadSchema.safeParse({ name: "A" });
      expect(res.success).toBe(false);
      if (!res.success) expect(formatZodError(res.error)).toMatch(/phone or email/);
    });

    it("rejects an empty name", () => {
      expect(leadSchema.safeParse({ name: "", phone: "2125550134" }).success).toBe(false);
    });

    it("rejects an invalid email format", () => {
      expect(leadSchema.safeParse({ name: "A", email: "not-an-email" }).success).toBe(false);
    });

    it("rejects an unknown interest value", () => {
      expect(
        leadSchema.safeParse({ name: "A", phone: "2125550134", interest: "bogus" }).success,
      ).toBe(false);
    });

    it("accepts an empty interest (placeholder not selected)", () => {
      expect(leadSchema.safeParse({ name: "A", phone: "2125550134", interest: "" }).success).toBe(true);
    });

    it("rejects non-positive car_id", () => {
      expect(leadSchema.safeParse({ car_id: 0, name: "a", phone: "2125550134" }).success).toBe(false);
    });
  });

  describe("interest options", () => {
    it("maps every slug to its label and unknown/empty to ''", () => {
      for (const opt of INTEREST_OPTIONS) {
        expect(interestLabel(opt.value)).toBe(opt.label);
      }
      expect(interestLabel("")).toBe("");
      expect(interestLabel(null)).toBe("");
      expect(interestLabel("unknown")).toBe("unknown");
    });
  });

  describe("carSchema", () => {
    it("coerces numeric strings and applies defaults", () => {
      const parsed = carSchema.parse({ make: "Ford", model: "F", year: "2020", price: "1000" });
      expect(parsed.year).toBe(2020);
      expect(parsed.price).toBe(1000);
      expect(parsed.mileage).toBe(0);
      expect(parsed.photos).toEqual([]);
      expect(parsed.sold).toBe(false);
    });

    it("accepts an explicit sold flag", () => {
      const parsed = carSchema.parse({
        make: "Ford",
        model: "F",
        year: 2020,
        price: 1000,
        sold: true,
      });
      expect(parsed.sold).toBe(true);
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
