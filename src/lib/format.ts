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
