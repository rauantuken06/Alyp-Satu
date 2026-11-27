import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AppRoutes } from "../App";
import * as authApi from "../api/auth";
import { ApiError, type UserProfile } from "../api/types";
import { AuthProvider } from "../context/AuthContext";

const registeredUser: UserProfile = {
  id: "22222222-2222-4222-8222-222222222222",
  email: "new.seller@example.com",
  full_name: "Nurlan Sadykov",
  is_email_verified: false,
  created_at: "2026-11-27T10:15:00Z",
  updated_at: "2026-11-27T10:15:00Z",
};

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("RegisterPage", () => {
  it("validates password confirmation mismatch before calling API", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockRejectedValueOnce(
      new ApiError(403, "Authentication credentials were not provided."),
    );
    const registerSpy = vi.spyOn(authApi, "register");

    const user = userEvent.setup();
    renderRegister();

    await user.type(await screen.findByLabelText(/^email$/i), "seller@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "StrongPassword123!");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "DifferentPassword123!",
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("submits payload and redirects to /profile on success", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockRejectedValueOnce(
      new ApiError(403, "Authentication credentials were not provided."),
    );
    const registerSpy = vi
      .spyOn(authApi, "register")
      .mockResolvedValueOnce(registeredUser);

    const user = userEvent.setup();
    renderRegister();

    await user.type(
      await screen.findByLabelText(/^email$/i),
      "new.seller@example.com",
    );
    await user.type(screen.getByLabelText(/full name/i), "Nurlan Sadykov");
    await user.type(screen.getByLabelText(/^password$/i), "StrongPassword123!");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "StrongPassword123!",
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(registerSpy).toHaveBeenCalledWith({
      email: "new.seller@example.com",
      full_name: "Nurlan Sadykov",
      password: "StrongPassword123!",
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /your profile/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Email unverified")).toBeInTheDocument();
  });

  it("renders backend field validation errors", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockRejectedValueOnce(
      new ApiError(403, "Authentication credentials were not provided."),
    );
    vi.spyOn(authApi, "register").mockRejectedValueOnce(
      ApiError.fromResponse(400, {
        email: ["A user with this email already exists."],
        password: ["This password is too common."],
      }),
    );

    const user = userEvent.setup();
    renderRegister();

    await user.type(await screen.findByLabelText(/^email$/i), "dup@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password");
    await user.type(screen.getByLabelText(/confirm password/i), "password");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText("A user with this email already exists."),
    ).toBeInTheDocument();
    expect(screen.getByText("This password is too common.")).toBeInTheDocument();
  });
});
