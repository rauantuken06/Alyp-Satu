import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AppRoutes } from "../App";
import * as authApi from "../api/auth";
import { ApiError, type UserProfile } from "../api/types";
import { AuthProvider } from "../context/AuthContext";

const authenticatedUser: UserProfile = {
  id: "33333333-3333-4333-8333-333333333333",
  email: "member@example.com",
  full_name: "Aigerim Toleu",
  is_email_verified: false,
  created_at: "2026-11-27T08:00:00Z",
  updated_at: "2026-11-27T08:00:00Z",
};

describe("ProtectedRoute and GuestRoute", () => {
  it("redirects unauthenticated users from /profile to /login without an error banner", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockRejectedValueOnce(
      new ApiError(403, "Authentication credentials were not provided."),
    );

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /^log in$/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders ProfilePage for authenticated users", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValueOnce(authenticatedUser);

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /your profile/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("member@example.com")).toBeInTheDocument();
  });

  it("redirects already-authenticated users from /login to /profile", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValueOnce(authenticatedUser);

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /your profile/i }),
    ).toBeInTheDocument();
  });
});
