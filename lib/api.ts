// Client/server API helpers. Every network call the frontend makes goes
// through here, so switching from the mock routes to Role 1's real backend
// is a single env change (NEXT_PUBLIC_API_BASE_URL) — no page edits.

import type {
  CarDetail,
  CarInput,
  CarListItem,
  Lead,
  LeadInput,
  LeadOptionsResponse,
  LoginInput,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/** Build an absolute URL when a base is configured, else a same-origin path. */
export function apiUrl(path: string): string {
  return BASE ? `${BASE.replace(/\/$/, "")}${path}` : path;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    // Always talk to the API fresh; the app is data-driven.
    cache: "no-store",
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ---- Public endpoints (TZ §6) ----

export function getCars(): Promise<CarListItem[]> {
  return request<CarListItem[]>("/api/cars");
}

export function getCar(id: number | string): Promise<CarDetail> {
  return request<CarDetail>(`/api/cars/${id}`);
}

export function postLead(body: LeadInput): Promise<{ ok: true }> {
  return request<{ ok: true }>("/api/leads", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Interest dropdown options for the lead form. */
export function getLeadOptions(): Promise<LeadOptionsResponse> {
  return request<LeadOptionsResponse>("/api/lead-options");
}

// ---- Admin endpoints (TZ §6) ----

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function login(body: LoginInput): Promise<{ token: string }> {
  return request<{ token: string }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function adminGetCars(token: string): Promise<CarDetail[]> {
  return request<CarDetail[]>("/api/admin/cars", { headers: authHeaders(token) });
}

export function adminCreateCar(token: string, body: CarInput): Promise<CarDetail> {
  return request<CarDetail>("/api/admin/cars", {
    method: "POST",
    body: JSON.stringify(body),
    headers: authHeaders(token),
  });
}

export function adminUpdateCar(
  token: string,
  id: number,
  body: CarInput,
): Promise<CarDetail> {
  return request<CarDetail>(`/api/admin/cars/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: authHeaders(token),
  });
}

export function adminDeleteCar(token: string, id: number): Promise<void> {
  return request<void>(`/api/admin/cars/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export function adminGetLeads(token: string): Promise<Lead[]> {
  return request<Lead[]>("/api/admin/leads", { headers: authHeaders(token) });
}

export async function adminUpload(token: string, file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  return request<{ url: string }>("/api/admin/upload", {
    method: "POST",
    body: form,
    headers: authHeaders(token),
  });
}
