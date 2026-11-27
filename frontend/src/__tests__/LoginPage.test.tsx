import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AppRoutes } from "../App";
import * as authApi from "../api/auth";
import { ApiError, type UserProfile } from "../api/types";
import { AuthProvider } from "../context/AuthContext";

const mockUser: UserProfile = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "buyer@example.com",
  full_name: "Dana Alimova",
  is_email_verified: false,
  created_at: "2026-11-27T10:00:00Z",
  updated_at: "2026-11-27T10:00:00Z",
};

function renderAt(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  it("displays generic DRF error message on invalid credentials", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockRejectedValueOnce(
      new ApiError(403, "Authentication credentials were not provided."),
    );
    const loginSpy = vi
      .spyOn(authApi, "login")
      .mockRejectedValueOnce(
        ApiError.fromResponse(400, {
          non_field_errors: ["Invalid email or password."],
        }),
      );

    const user = userEvent.setup();
    renderAt("/login");

    await user.type(await screen.findByLabelText(/email/i), "buyer@example.com");
    await user.type(screen.getByLabelText(/password/i), "WrongPassword!");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(loginSpy).toHaveBeenCalledWith({
      email: "buyer@example.com",
      password: "WrongPassword!",
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password.",
    );
  });

  it("submits credentials and navigates to /profile on success", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockRejectedValueOnce(
      new ApiError(403, "Authentication credentials were not provided."),
    );
    const loginSpy = vi.spyOn(authApi, "login").mockResolvedValueOnce(mockUser);

    const user = userEvent.setup();
    renderAt("/login");

    await user.type(await screen.findByLabelText(/email/i), "buyer@example.com");
    await user.type(screen.getByLabelText(/password/i), "StrongPassword123!");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(loginSpy).toHaveBeenCalledWith({
      email: "buyer@example.com",
      password: "StrongPassword123!",
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /your profile/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("buyer@example.com")).toBeInTheDocument();
  });
});
