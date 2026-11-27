export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CsrfResponse {
  detail: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  full_name: string;
}

export type FieldErrors = Record<string, string[]>;

function toStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : null))
      .filter((item): item is string => item !== null);
  }
  return [];
}

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;
  readonly fieldErrors: FieldErrors;
  readonly raw: unknown;

  constructor(
    status: number,
    detail: string,
    fieldErrors: FieldErrors = {},
    raw: unknown = null,
  ) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
    this.raw = raw;
  }

  static fromResponse(
    status: number,
    body: unknown,
    fallbackMessage = "Request failed. Please try again.",
  ): ApiError {
    const fieldErrors: FieldErrors = {};
    let detail = "";

    if (Array.isArray(body)) {
      const messages = toStringArray(body);
      if (messages[0]) {
        detail = messages[0];
      }
    } else if (body !== null && typeof body === "object") {
      const record = body as Record<string, unknown>;

      if (typeof record.detail === "string" && record.detail.trim()) {
        detail = record.detail;
      }

      const nonField = toStringArray(record.non_field_errors);
      if (!detail && nonField[0]) {
        detail = nonField[0];
      }

      for (const [key, value] of Object.entries(record)) {
        if (key === "detail" || key === "non_field_errors") {
          continue;
        }
        const messages = toStringArray(value);
        if (messages.length > 0) {
          fieldErrors[key] = messages;
        }
      }
    }

    if (!detail) {
      const firstFieldMessages = Object.values(fieldErrors)[0];
      detail =
        firstFieldMessages && firstFieldMessages[0]
          ? firstFieldMessages[0]
          : fallbackMessage;
    }

    return new ApiError(status, detail, fieldErrors, body);
  }
}
