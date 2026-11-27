import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { updateCurrentUser } from "../api/auth";
import { ApiError, type FieldErrors } from "../api/types";
import { useAuth } from "../context/AuthContext";

function formatUtcTimestamp(isoTimestamp: string): string {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    return isoTimestamp;
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(parsed);
}

export function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setFullName(user?.full_name ?? "");
  }, [user?.full_name]);

  if (!user) {
    return null;
  }

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const updated = await updateCurrentUser({ full_name: fullName.trim() });
      setUser(updated);
      setFullName(updated.full_name);
      setSuccessMessage("Profile updated successfully.");
    } catch (error) {
      if (error instanceof ApiError) {
        if (Object.keys(error.fieldErrors).length > 0) {
          setFieldErrors(error.fieldErrors);
        } else {
          setGeneralError(error.detail);
        }
      } else {
        setGeneralError("Could not save changes. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    setGeneralError(null);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setGeneralError("Could not log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-900">Your Profile</h1>
            <p className="text-sm text-slate-600">{user.email}</p>
          </div>

          {user.is_email_verified ? (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
              Email verified
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
              Email unverified
            </span>
          )}
        </div>

        {!user.is_email_verified && (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900">
            Email verification is not enabled in Sprint 01. Your account remains fully
            usable in local development while verification is deferred to a later sprint.
          </p>
        )}

        <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-6 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Member since
            </dt>
            <dd className="mt-1 text-slate-800">
              {formatUtcTimestamp(user.created_at)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Account ID
            </dt>
            <dd className="mt-1 break-all font-mono text-xs text-slate-500">
              {user.id}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <h2 className="text-base font-semibold text-slate-900">Profile details</h2>
        <p className="mt-1 text-sm text-slate-600">
          Update your display name. Your email address and verification status are
          read-only.
        </p>

        {generalError && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            {generalError}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800"
          >
            {successMessage}
          </div>
        )}

        <form
          onSubmit={(event) => void handleUpdateProfile(event)}
          className="mt-5 space-y-4"
        >
          <div>
            <label
              htmlFor="profile-email"
              className="block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={user.email}
              readOnly
              disabled
              className="mt-1 block w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>

          <div>
            <label
              htmlFor="profile-full-name"
              className="block text-sm font-medium text-slate-700"
            >
              Full name
            </label>
            <input
              id="profile-full-name"
              name="full_name"
              type="text"
              maxLength={150}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              aria-invalid={Boolean(fieldErrors.full_name)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="Enter your full name"
            />
            {fieldErrors.full_name?.map((message) => (
              <p key={message} className="mt-1 text-xs text-red-600">
                {message}
              </p>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>

            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
