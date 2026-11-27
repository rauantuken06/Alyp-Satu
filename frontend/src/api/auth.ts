import { apiRequest } from "./client";
import type {
  CsrfResponse,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  UserProfile,
} from "./types";

export function fetchCsrf(): Promise<CsrfResponse> {
  return apiRequest<CsrfResponse>("/api/v1/auth/csrf/", {
    method: "GET",
  });
}

export function register(payload: RegisterPayload): Promise<UserProfile> {
  return apiRequest<UserProfile>("/api/v1/auth/register/", {
    method: "POST",
    body: payload,
  });
}

export function login(payload: LoginPayload): Promise<UserProfile> {
  return apiRequest<UserProfile>("/api/v1/auth/login/", {
    method: "POST",
    body: payload,
  });
}

export function logout(): Promise<void> {
  return apiRequest<void>("/api/v1/auth/logout/", {
    method: "POST",
  });
}

export function getCurrentUser(): Promise<UserProfile> {
  return apiRequest<UserProfile>("/api/v1/auth/me/", {
    method: "GET",
  });
}

export function updateCurrentUser(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  return apiRequest<UserProfile>("/api/v1/auth/me/", {
    method: "PATCH",
    body: payload,
  });
}
