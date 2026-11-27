import { describe, expect, it, vi } from "vitest";

import { apiRequest } from "../api/client";
import { ApiError } from "../api/types";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiRequest client", () => {
  it("attaches credentials: include on GET without X-CSRFToken", async () => {
    document.cookie = "csrftoken=existing-token; path=/";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ status: "ok" }));

    const result = await apiRequest<{ status: string }>("/api/v1/health/");

    expect(result).toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/v1/health/");
    expect(init?.credentials).toBe("include");
    const headers = new Headers(init?.headers);
    expect(headers.get("X-CSRFToken")).toBeNull();
  });

  it("attaches credentials: include and X-CSRFToken on mutating requests", async () => {
    document.cookie = "csrftoken=cookie-csrf-123; path=/";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ full_name: "Updated" }));

    await apiRequest("/api/v1/auth/me/", {
      method: "PATCH",
      body: { full_name: "Updated" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/v1/auth/me/");
    expect(init?.method).toBe("PATCH");
    expect(init?.credentials).toBe("include");
    const headers = new Headers(init?.headers);
    expect(headers.get("X-CSRFToken")).toBe("cookie-csrf-123");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("bootstraps CSRF cookie via GET /api/v1/auth/csrf/ when missing before mutating call", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(async () => {
        document.cookie = "csrftoken=bootstrapped-token; path=/";
        return jsonResponse({ detail: "CSRF cookie set." });
      })
      .mockResolvedValueOnce(jsonResponse({ id: "u1" }));

    await apiRequest("/api/v1/auth/login/", {
      method: "POST",
      body: { email: "buyer@example.com", password: "StrongPassword123!" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/auth/csrf/");
    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe("include");

    const loginInit = fetchMock.mock.calls[1]?.[1];
    expect(loginInit?.credentials).toBe("include");
    const loginHeaders = new Headers(loginInit?.headers);
    expect(loginHeaders.get("X-CSRFToken")).toBe("bootstrapped-token");
  });

  it("uses rotated csrftoken cookie on subsequent mutating requests", async () => {
    document.cookie = "csrftoken=initial-token; path=/";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(async () => {
        document.cookie = "csrftoken=rotated-token; path=/";
        return jsonResponse({ id: "u1" });
      })
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await apiRequest("/api/v1/auth/login/", {
      method: "POST",
      body: { email: "buyer@example.com", password: "StrongPassword123!" },
    });
    await apiRequest("/api/v1/auth/logout/", { method: "POST" });

    const firstHeaders = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    const secondHeaders = new Headers(fetchMock.mock.calls[1]?.[1]?.headers);
    expect(firstHeaders.get("X-CSRFToken")).toBe("initial-token");
    expect(secondHeaders.get("X-CSRFToken")).toBe("rotated-token");
  });

  it("parses DRF field errors and non_field_errors into ApiError", async () => {
    document.cookie = "csrftoken=token-123; path=/";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse(
        {
          email: ["A user with this email already exists."],
          password: ["This password is too short."],
        },
        400,
      ),
    );

    await expect(
      apiRequest("/api/v1/auth/register/", {
        method: "POST",
        body: { email: "dup@example.com", password: "123" },
      }),
    ).rejects.toSatisfy((error: unknown) => {
      return (
        error instanceof ApiError &&
        error.status === 400 &&
        error.fieldErrors.email?.[0] === "A user with this email already exists." &&
        error.fieldErrors.password?.[0] === "This password is too short."
      );
    });
  });
});
