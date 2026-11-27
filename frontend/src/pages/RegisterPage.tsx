import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ApiError, type FieldErrors } from "../api/types";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    if (password !== confirmPassword) {
      setFieldErrors({
        confirm_password: ["Passwords do not match."],
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
      });
      navigate("/profile", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        if (Object.keys(error.fieldErrors).length > 0) {
          setFieldErrors(error.fieldErrors);
        }
        if (Object.keys(error.fieldErrors).length === 0 || error.status >= 500) {
          setGeneralError(error.detail);
        }
      } else {
        setGeneralError("Unable to create your account right now. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">Create an account</h1>
          <p className="text-sm text-slate-600">
            Join Alyp-Satu to manage your profile and create listing drafts.
          </p>
        </div>

        {generalError && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            {generalError}
          </div>
        )}

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="register-email"
              className="block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="you@example.com"
            />
            {fieldErrors.email?.map((message) => (
              <p key={message} className="mt-1 text-xs text-red-600">
                {message}
              </p>
            ))}
          </div>

          <div>
            <label
              htmlFor="register-full-name"
              className="block text-sm font-medium text-slate-700"
            >
              Full name <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="register-full-name"
              name="full_name"
              type="text"
              autoComplete="name"
              maxLength={150}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              aria-invalid={Boolean(fieldErrors.full_name)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="Aruzhan Bekova"
            />
            {fieldErrors.full_name?.map((message) => (
              <p key={message} className="mt-1 text-xs text-red-600">
                {message}
              </p>
            ))}
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            {fieldErrors.password?.map((message) => (
              <p key={message} className="mt-1 text-xs text-red-600">
                {message}
              </p>
            ))}
          </div>

          <div>
            <label
              htmlFor="register-confirm-password"
              className="block text-sm font-medium text-slate-700"
            >
              Confirm password
            </label>
            <input
              id="register-confirm-password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.confirm_password)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            {fieldErrors.confirm_password?.map((message) => (
              <p key={message} className="mt-1 text-xs text-red-600">
                {message}
              </p>
            ))}
          </div>

          <p className="text-xs text-slate-500">
            Note: In Sprint 01 local development, newly registered accounts start with an
            unverified email and no verification email is sent.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-slate-900 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
