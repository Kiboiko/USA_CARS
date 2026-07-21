import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/lead-options/route";
import { INTEREST_OPTIONS } from "@/lib/validation";

describe("GET /api/lead-options", () => {
  it("returns the interest options for the frontend dropdown", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.interests).toEqual(INTEREST_OPTIONS);
    expect(body.interests[0]).toEqual({ value: "buy_now", label: "Buy Now" });
  });
});
