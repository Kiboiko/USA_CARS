// Meta (Facebook) Pixel — id + event helpers.

export const META_PIXEL_ID = "1341376431311145";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

/** Fire the standard "Lead" event (called when a lead form is submitted). */
export function trackLead(): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "Lead");
  }
}

/** Fire a "PageView" (used on client-side route changes). */
export function trackPageView(): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
}
