// Meta (Facebook) Pixel — id + event helpers.

/**
 * Meta Pixel id. Empty = pixel disabled: the base code is not rendered and the
 * event helpers below become no-ops (they already bail out without `fbq`).
 * To switch the pixel back on, paste the id here — nothing else to change.
 */
export const META_PIXEL_ID: string = "1780576339607781";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export interface LeadEventParams {
  /** Car id — sent as content_ids so Meta can attribute the lead to a vehicle. */
  carId?: number | null;
  /** Car title (e.g. "2018 BMW M3 Competition") — sent as content_name. */
  carTitle?: string;
  /** Car price — sent as value (currency USD). */
  value?: number;
}

/**
 * Fire the standard "Lead" event with vehicle context, so each lead in Meta
 * Events Manager shows which car it came from (content_name / content_ids) and
 * its value. Called on successful lead-form submission.
 */
export function trackLead(params: LeadEventParams = {}): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  const data: Record<string, unknown> = { content_type: "vehicle" };
  if (params.carTitle) data.content_name = params.carTitle;
  if (params.carId != null) data.content_ids = [String(params.carId)];
  if (typeof params.value === "number" && params.value > 0) {
    data.value = params.value;
    data.currency = "USD";
  }
  window.fbq("track", "Lead", data);
}

/** Fire a "PageView" (used on client-side route changes). */
export function trackPageView(): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
}
