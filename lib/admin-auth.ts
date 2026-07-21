"use client";

// Client-side admin session. The token comes from POST /api/admin/login and
// is sent as a Bearer header on admin API calls. Route-level protection of the
// admin *API* is Role 1's job (middleware, §6); this is just the UI gate.

import { useEffect, useState } from "react";

const KEY = "usa_cars_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(KEY);
}

/** Reads the token on the client; `ready` guards against SSR/first-paint flash. */
export function useToken(): { token: string | null; ready: boolean } {
  const [token, setTok] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setTok(getToken());
    setReady(true);
  }, []);
  return { token, ready };
}
