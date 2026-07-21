"use client";

// Client-side admin session. The token comes from POST /api/admin/login and
// is sent as a Bearer header on admin API calls. Route-level protection of the
// admin *API* is Role 1's job (middleware, §6); this is just the UI gate.

import { useEffect, useState } from "react";

const KEY = "usa_cars_admin_token";
// Fired whenever the token changes in this tab so subscribers (useToken) can
// re-read it. Cross-tab changes arrive via the native "storage" event.
const TOKEN_EVENT = "usa-cars-admin-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

function notify(): void {
  window.dispatchEvent(new Event(TOKEN_EVENT));
}

export function setToken(token: string): void {
  window.localStorage.setItem(KEY, token);
  notify();
}

export function clearToken(): void {
  window.localStorage.removeItem(KEY);
  notify();
}

/**
 * Reads the token on the client and stays in sync with it. `ready` guards
 * against the SSR/first-paint flash (token is unknown until we've read
 * localStorage). Subscribes to same-tab changes (setToken/clearToken) and
 * cross-tab changes (the "storage" event), so logging in updates every mounted
 * consumer — including the admin layout's route guard — without a full reload.
 */
export function useToken(): { token: string | null; ready: boolean } {
  const [token, setTok] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setTok(getToken());
    sync();
    setReady(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) sync();
    };
    window.addEventListener(TOKEN_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(TOKEN_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return { token, ready };
}
