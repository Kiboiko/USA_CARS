// Small display helpers shared across pages.

export function formatPrice(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usd);
}

export function formatMileage(mi: number): string {
  return `${new Intl.NumberFormat("en-US").format(mi)} mi`;
}

export function carTitle(c: { year: number; make: string; model: string }): string {
  return `${c.year} ${c.make} ${c.model}`;
}

/**
 * US / NANP phone number. Accepts common formats with an optional +1 / 1
 * country code and space / dot / dash / paren separators, e.g.
 *   +1 (212) 555-0134 · (212) 555-0134 · 212-555-0134 · 2125550134
 * Enforces NANP rules: area code and exchange must start with 2–9.
 */
export const US_PHONE_RE =
  /^(?:\+?1[\s.-]?)?\(?[2-9]\d{2}\)?[\s.-]?[2-9]\d{2}[\s.-]?\d{4}$/;

export function isUsPhone(phone: string): boolean {
  return US_PHONE_RE.test(phone.trim());
}

/**
 * Rough "$X/mo est." finance figure like dealership sites show — for display
 * only. Assumes ~10% down, 7.9% APR, 72 months. Not a real quote.
 */
export function estMonthly(
  price: number,
  { downPct = 0.1, apr = 0.079, months = 72 } = {},
): number {
  const principal = price * (1 - downPct);
  const r = apr / 12;
  const payment = r === 0 ? principal / months : (principal * r) / (1 - (1 + r) ** -months);
  return Math.round(payment);
}
