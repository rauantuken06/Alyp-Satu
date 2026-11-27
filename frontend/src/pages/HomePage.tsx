import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-10">
        <div className="max-w-2xl space-y-4">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            Kazakhstan C2C Marketplace
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Buy and sell second-hand goods with confidence on Alyp-Satu
          </h1>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            A trusted marketplace for pre-owned items across Kazakhstan, priced in KZT.
            Sign in to manage your account and prepare your listings for Sprint 01.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  Open Profile
                </Link>
                <span className="text-sm text-slate-600">
                  Signed in as{" "}
                  <strong className="font-medium text-slate-900">
                    {user?.full_name || user?.email}
                  </strong>
                </span>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  Create account
                </Link>
                <Link
                  to="/login"
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="catalog-heading"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 sm:p-8"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="catalog-heading" className="text-lg font-semibold text-slate-900">
              Public Catalog
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Product categories and active listings will appear here once the catalog
              endpoints are connected.
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            Coming soon
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {["Electronics", "Home & Garden", "Clothing & Accessories"].map((label) => (
            <div
              key={label}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-sm font-medium text-slate-800">{label}</p>
              <p className="mt-1 text-xs text-slate-500">
                Active listings will be browsable here in Sprint 01.
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
