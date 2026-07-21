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
