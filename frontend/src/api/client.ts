import { ApiError } from "./types";

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const CSRF_ENDPOINT = "/api/v1/auth/csrf/";

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined" || !document.cookie) {
    return null;
  }

  const cookies = document.cookie.split(";");
  for (const rawCookie of cookies) {
    const trimmed = rawCookie.trim();
    if (!trimmed) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const cookieName = trimmed.slice(0, separatorIndex);
    if (cookieName === name) {
      const cookieValue = trimmed.slice(separatorIndex + 1);
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

export function getCsrfToken(): string | null {
  return getCookie("csrftoken");
}

export async function ensureCsrfCookie(): Promise<string | null> {
  const existing = getCsrfToken();
  if (existing) {
    return existing;
  }

  const response = await fetch(CSRF_ENDPOINT, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    throw ApiError.fromResponse(
      response.status,
      body,
      "Failed to initialize CSRF protection.",
    );
  }

  return getCsrfToken();
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  let serializedBody: string | undefined;
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    serializedBody = JSON.stringify(options.body);
  }

  if (MUTATING_METHODS.has(method)) {
    let csrfToken = getCsrfToken();
    if (!csrfToken) {
      csrfToken = await ensureCsrfCookie();
    }
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }
  }

  const response = await fetch(path, {
    method,
    credentials: "include",
    headers,
    body: serializedBody,
    signal: options.signal,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  let parsedBody: unknown = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      parsedBody = await response.json();
    } catch {
      parsedBody = null;
    }
  }

  if (!response.ok) {
    throw ApiError.fromResponse(response.status, parsedBody);
  }

  return parsedBody as T;
}
