import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  META_PIXEL_ID,
  buildMatching,
  identify,
  trackLead,
  trackPageView,
  trackViewContent,
} from "@/lib/fbq";

// The helpers talk to the global `fbq` the Meta base code installs on window.
// Tests run in node, so we stand one up ourselves and read back the calls.
type Call = unknown[];
const calls: Call[] = [];

beforeEach(() => {
  calls.length = 0;
  (globalThis as { window?: unknown }).window = {
    fbq: (...args: unknown[]) => {
      calls.push(args);
    },
  };
});

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  vi.restoreAllMocks();
});

describe("META_PIXEL_ID", () => {
  it("is the pixel the client provided", () => {
    expect(META_PIXEL_ID).toBe("28353475247627159");
  });
});

describe("buildMatching", () => {
  it("lowercases and trims the email", () => {
    expect(buildMatching({ email: "  John.Smith@Example.COM " }).em).toBe(
      "john.smith@example.com",
    );
  });

  it("reduces a formatted US phone to digits with the country code", () => {
    expect(buildMatching({ phone: "+1 (212) 555-0134" }).ph).toBe("12125550134");
    expect(buildMatching({ phone: "(212) 555-0134" }).ph).toBe("12125550134");
    expect(buildMatching({ phone: "212.555.0134" }).ph).toBe("12125550134");
  });

  it("leaves a number that already carries a country code alone", () => {
    expect(buildMatching({ phone: "+44 20 7946 0958" }).ph).toBe("442079460958");
  });

  it("splits the name into first and last, lowercased", () => {
    expect(buildMatching({ name: "  John  Smith " })).toMatchObject({
      fn: "john",
      ln: "smith",
    });
  });

  it("sends only a first name when that is all there is", () => {
    const data = buildMatching({ name: "Cher" });
    expect(data.fn).toBe("cher");
    expect(data.ln).toBeUndefined();
  });

  it("takes the last word as the surname for a middle name", () => {
    expect(buildMatching({ name: "Ana Maria Ruiz" })).toMatchObject({
      fn: "ana",
      ln: "ruiz",
    });
  });

  it("omits fields it has nothing for", () => {
    expect(buildMatching({})).toEqual({});
    expect(buildMatching({ email: "   ", phone: "abc", name: " " })).toEqual({});
  });
});

describe("identify", () => {
  it("re-inits the pixel with normalised matching data", () => {
    identify({ name: "John Smith", phone: "(212) 555-0134", email: "J@X.IO" });
    expect(calls).toEqual([
      [
        "init",
        META_PIXEL_ID,
        { em: "j@x.io", ph: "12125550134", fn: "john", ln: "smith" },
      ],
    ]);
  });

  it("stays quiet when there is nothing to match on", () => {
    identify({});
    expect(calls).toEqual([]);
  });
});

describe("trackLead", () => {
  it("sends vehicle context and the car price", () => {
    trackLead({ carId: 32, carTitle: "2022 Ram 1500 TRX", value: 59990 });
    expect(calls).toEqual([
      [
        "track",
        "Lead",
        {
          content_type: "vehicle",
          content_name: "2022 Ram 1500 TRX",
          content_ids: ["32"],
          value: 59990,
          currency: "USD",
        },
      ],
    ]);
  });

  it("identifies the visitor before the event so the Lead carries the match", () => {
    trackLead({
      carId: 1,
      carTitle: "Car",
      value: 100,
      user: { name: "Ann Lee", phone: "2125550134", email: "a@x.io" },
    });
    expect(calls.map((c) => c[0])).toEqual(["init", "track"]);
    expect(calls[0][2]).toMatchObject({ em: "a@x.io", ph: "12125550134" });
  });

  it("drops value and currency when the price is missing or zero", () => {
    trackLead({ carId: 7, carTitle: "Car", value: 0 });
    trackLead({ carId: 7, carTitle: "Car" });
    for (const call of calls) {
      expect(call[2]).not.toHaveProperty("value");
      expect(call[2]).not.toHaveProperty("currency");
    }
  });
});

describe("trackViewContent", () => {
  it("reports the car and its price on the listing page", () => {
    trackViewContent({ carId: 29, carTitle: "2021 Audi RS5", value: 54900 });
    expect(calls).toEqual([
      [
        "track",
        "ViewContent",
        {
          content_type: "vehicle",
          content_name: "2021 Audi RS5",
          content_ids: ["29"],
          value: 54900,
          currency: "USD",
        },
      ],
    ]);
  });
});

describe("without the pixel script", () => {
  it("every helper is a no-op rather than a crash", () => {
    (globalThis as { window?: unknown }).window = {}; // fbevents.js blocked
    expect(() => {
      identify({ email: "a@x.io" });
      trackLead({ carId: 1, value: 10 });
      trackViewContent({ carId: 1, value: 10 });
      trackPageView();
    }).not.toThrow();
    expect(calls).toEqual([]);
  });

  it("survives server-side rendering, where there is no window at all", () => {
    delete (globalThis as { window?: unknown }).window;
    expect(() => {
      trackPageView();
      trackLead({ carId: 1 });
    }).not.toThrow();
  });
});
