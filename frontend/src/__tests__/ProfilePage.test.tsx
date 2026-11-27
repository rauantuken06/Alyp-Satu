import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AppRoutes } from "../App";
import * as authApi from "../api/auth";
import type { UserProfile } from "../api/types";
import { AuthProvider } from "../context/AuthContext";

const baseUser: UserProfile = {
  id: "44444444-4444-4444-8444-444444444444",
  email: "seller@example.com",
  full_name: "Initial Name",
  is_email_verified: false,
  created_at: "2026-11-27T09:30:00Z",
  updated_at: "2026-11-27T09:30:00Z",
};

function renderProfile() {
  return render(
    <MemoryRouter initialEntries={["/profile"]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("ProfilePage", () => {
  it("displays unverified badge, user details, and updates full_name via PATCH", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValueOnce(baseUser);
    const updateSpy = vi
      .spyOn(authApi, "updateCurrentUser")
      .mockResolvedValueOnce({
        ...baseUser,
        full_name: "Updated Seller",
        updated_at: "2026-11-27T10:00:00Z",
      });

    const user = userEvent.setup();
    renderProfile();

    expect(
      await screen.findByRole("heading", { name: /your profile/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Email unverified")).toBeInTheDocument();
    expect(screen.getByText(baseUser.id)).toBeInTheDocument();
    expect(screen.getByText("seller@example.com")).toBeInTheDocument();

    const fullNameInput = screen.getByLabelText(/full name/i);
    expect(fullNameInput).toHaveValue("Initial Name");

    await user.clear(fullNameInput);
    await user.type(fullNameInput, "Updated Seller");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(updateSpy).toHaveBeenCalledWith({ full_name: "Updated Seller" });
    expect(
      await screen.findByText("Profile updated successfully."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Updated Seller");
  });

  it("logs out and redirects to /login", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValueOnce(baseUser);
    const logoutSpy = vi.spyOn(authApi, "logout").mockResolvedValueOnce();

    const user = userEvent.setup();
    renderProfile();

    await screen.findByRole("heading", { name: /your profile/i });
    await user.click(screen.getByRole("button", { name: /^log out$/i }));

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /^log in$/i }),
      ).toBeInTheDocument();
    });
  });
});
