// Meta (Facebook) Pixel — id, advanced matching, and event helpers.

/**
 * Meta Pixel id. Empty = pixel disabled: the base code is not rendered and the
 * event helpers below become no-ops (they already bail out without `fbq`).
 * To switch the pixel back on, paste the id here — nothing else to change.
 */
export const META_PIXEL_ID: string = "2129720331271665";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

/** The pixel is configured and its script has loaded. */
function pixel(): ((...args: unknown[]) => void) | null {
  if (!META_PIXEL_ID) return null;
  if (typeof window === "undefined") return null;
  return typeof window.fbq === "function" ? window.fbq : null;
}

/* -------------------------------------------------------- advanced matching */

/** Contact details the visitor typed into the lead form. */
export interface UserData {
  name?: string;
  phone?: string;
  email?: string;
}

/**
 * Normalise the visitor's details the way Meta expects them.
 *
 * The pixel hashes every value with SHA-256 in the browser, so nothing
 * readable leaves the page — but a hash only matches if both sides normalised
 * the input identically first. Meta's rules: trim and lowercase everything,
 * phone numbers as digits with the country code, no formatting.
 */
export function buildMatching(user: UserData): Record<string, string> {
  const data: Record<string, string> = {};

  const email = (user.email ?? "").trim().toLowerCase();
  if (email) data.em = email;

  const digits = (user.phone ?? "").replace(/\D/g, "");
  // The form only accepts US numbers, so 10 digits means the "1" was left off.
  const phone = digits.length === 10 ? `1${digits}` : digits;
  if (phone) data.ph = phone;

  const parts = (user.name ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length > 0) data.fn = parts[0];
  if (parts.length > 1) data.ln = parts[parts.length - 1];

  return data;
}

/**
 * Re-init the pixel with the visitor's details, per Meta's instructions to
 * pass advanced matching as the third argument of `fbq('init', …)`.
 *
 * The base code in the root layout inits without it because there is nothing
 * to pass on page load — the site has no accounts, so a visitor is anonymous
 * until they fill in the lead form. This runs the moment they do. `init` sends
 * no event of its own; the details ride along with every event fired after it,
 * starting with the Lead and Purchase below.
 */
export function identify(user: UserData): void {
  const fbq = pixel();
  if (!fbq) return;
  const data = buildMatching(user);
  if (Object.keys(data).length === 0) return;
  fbq("init", META_PIXEL_ID, data);
}

/* ------------------------------------------------------------------ events */

/** Vehicle context shared by the car-level events. */
export interface CarEventParams {
  /** Car id — sent as content_ids so Meta can attribute the event to a vehicle. */
  carId?: number | null;
  /** Car title (e.g. "2018 BMW M3 Competition") — sent as content_name. */
  carTitle?: string;
  /** Car price — sent as value (currency USD). */
  value?: number;
}

export interface LeadEventParams extends CarEventParams {
  /** Contact details, used for advanced matching before the events are sent. */
  user?: UserData;
}

/** content_type / content_name / content_ids / value / currency for a car. */
function carPayload(params: CarEventParams): Record<string, unknown> {
  const data: Record<string, unknown> = { content_type: "vehicle" };
  if (params.carTitle) data.content_name = params.carTitle;
  if (params.carId != null) data.content_ids = [String(params.carId)];
  if (typeof params.value === "number" && params.value > 0) {
    data.value = params.value;
    data.currency = "USD";
  }
  return data;
}

/**
 * Report a successful lead-form submission — the one conversion this site has.
 *
 * It goes out as two standard events with the same vehicle context and price:
 * "Lead", and "Purchase", which the client asked for so campaigns can optimise
 * on it and on its value. Nothing is bought on the site — cars are sold at the
 * showroom — so the Purchase value is the price of the car enquired about.
 * Meta expects value and currency on every Purchase; all listings are priced,
 * and carPayload adds both whenever the price is positive.
 */
export function trackLeadSubmission(params: LeadEventParams = {}): void {
  const fbq = pixel();
  if (!fbq) return;
  if (params.user) identify(params.user);
  fbq("track", "Lead", carPayload(params));
  fbq("track", "Purchase", carPayload(params));
}

/**
 * Fire "ViewContent" when a visitor opens a car listing, carrying that car's
 * price. This is what puts every car's value in front of Meta — a lead only
 * reports the handful of cars people actually enquire about.
 */
export function trackViewContent(params: CarEventParams): void {
  const fbq = pixel();
  if (!fbq) return;
  fbq("track", "ViewContent", carPayload(params));
}

/** Fire a "PageView" (used on client-side route changes). */
export function trackPageView(): void {
  const fbq = pixel();
  if (!fbq) return;
  fbq("track", "PageView");
}
