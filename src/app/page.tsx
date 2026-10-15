
"use client";

import { useEffect, useState } from "react";
import AppAlert from "@/components/AppAlert";

type Resource = {
  id: string;
  name: string;
  type: string;
  location: string | null;
  capacity: number;
  description: string | null;
  is_active: boolean;
};

const initialForm = {
  name: "",
  type: "Meeting Room",
  location: "",
  capacity: "1",
  description: "",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

type AlertVariant = "success" | "error" | "confirm";

export default function Home() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);

  const [alert, setAlert] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: AlertVariant;
  }>({
    open: false,
    title: "",
    message: "",
    variant: "success",
  });

  function showAlert(
    title: string,
    message: string,
    variant: AlertVariant
  ) {
    setAlert({
      open: true,
      title,
      message,
      variant,
    });
  }

  function closeAlert() {
    setAlert((previous) => ({
      ...previous,
      open: false,
    }));
  }

  async function loadResources() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/resources", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load resources."
        );
      }

      setResources(data.resources);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Could not load resources. Please try again.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadResources();
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          capacity: Number(form.capacity),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to create resource."
        );
      }

      setForm(initialForm);

      showAlert(
        "Resource Added Successfully",
        `${form.name.trim()} has been registered in ResourceHub.`,
        "success"
      );

      await loadResources();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";

      showAlert(
        "Unable to Add Resource",
        errorMessage,
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  const activeCount = resources.filter(
    (resource) => resource.is_active
  ).length;

  const inactiveCount = resources.length - activeCount;

  return (
    <main className="min-h-screen bg-slate-50/80 text-slate-900">
      {/* Custom alert dialog */}
      <AppAlert
        open={alert.open}
        title={alert.title}
        message={alert.message}
        variant={alert.variant}
        onClose={closeAlert}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h7" />
              </svg>
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">
                ResourceHub
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Resource Reservation Management
              </p>
            </div>
          </a>

          <a
            href="/reservations"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 sm:px-4"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="16" rx="3" />
              <path d="M16 3v4M8 3v4M3 10h18" />
            </svg>
            <span className="hidden sm:inline">Manage Reservations</span>
            <span className="sm:hidden">Reservations</span>
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Page heading */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-indigo-600">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            Management Overview
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Resource Management
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Manage your organization's resources and keep everything
                organized in one place.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5 text-indigo-600"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </span>
              Resource overview
            </div>
          </div>
        </section>

        {/* Summary cards */}
        <section
          aria-label="Resource statistics"
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Resources
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                  {loading ? "—" : resources.length}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  All registered resources
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="8" height="8" rx="2" />
                  <rect x="13" y="3" width="8" height="5" rx="2" />
                  <rect x="13" y="10" width="8" height="11" rx="2" />
                  <rect x="3" y="13" width="8" height="8" rx="2" />
                </svg>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active Resources
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-emerald-600">
                  {loading ? "—" : activeCount}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Currently enabled
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8 12 2.5 2.5L16 9" />
                </svg>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:col-span-2 sm:p-6 lg:col-span-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Inactive Resources
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-700">
                  {loading ? "—" : inactiveCount}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Currently disabled
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 9l6 6M15 9l-6 6" />
                </svg>
              </div>
            </div>
          </article>
        </section>

        {/* Resource creation form */}
        <section className="mb-10 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Add New Resource
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Register a room, piece of equipment, or other resource.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="text-sm font-semibold text-slate-700"
                >
                  Resource Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="name"
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="e.g. Meeting Room C"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="text-sm font-semibold text-slate-700"
                >
                  Resource Type <span className="text-rose-500">*</span>
                </label>
                <select
                  id="type"
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value })
                  }
                  className={inputClass}
                >
                  <option>Meeting Room</option>
                  <option>Conference Room</option>
                  <option>Equipment</option>
                  <option>Vehicle</option>
                  <option>Workspace</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="text-sm font-semibold text-slate-700"
                >
                  Location
                </label>
                <input
                  id="location"
                  maxLength={150}
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="e.g. Floor 3, Building A"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="capacity"
                  className="text-sm font-semibold text-slate-700"
                >
                  Capacity <span className="text-rose-500">*</span>
                </label>
                <input
                  id="capacity"
                  type="number"
                  required
                  min="1"
                  max="100000"
                  step="1"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: e.target.value })
                  }
                  className={inputClass}
                />
                <p className="mt-2 text-xs text-slate-400">
                  Number of people or units the resource can accommodate.
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="text-sm font-semibold text-slate-700"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                maxLength={5000}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Add any useful details about this resource..."
                className={`${inputClass} resize-y`}
              />
              <p className="mt-2 text-xs text-slate-400">
                Optional. Maximum 5,000 characters.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                Fields marked with * are required.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Saving resource...
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add Resource
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Registered resources */}
        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">
                Registered Resources
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                View the resources available in your system.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadResources()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 sm:self-auto"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                aria-hidden="true"
              >
                <path d="M20 7v5h-5M4 17v-5h5" />
                <path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" />
              </svg>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="h-5 w-2/3 rounded bg-slate-100" />
                  <div className="mt-4 h-4 w-1/3 rounded bg-slate-100" />
                  <div className="mt-7 h-4 w-full rounded bg-slate-100" />
                  <div className="mt-3 h-4 w-4/5 rounded bg-slate-100" />
                  <div className="mt-3 h-4 w-3/5 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {!loading && error && resources.length === 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
              <p className="font-semibold text-rose-800">
                Resources could not be loaded
              </p>
              <p className="mt-2 text-sm text-rose-600">{error}</p>
              <button
                type="button"
                onClick={() => void loadResources()}
                className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm ring-1 ring-rose-200 hover:bg-rose-100"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && resources.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              </div>
              <h4 className="mt-4 font-semibold text-slate-900">
                No resources yet
              </h4>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Add your first resource using the form above. It will appear
                here after it has been saved.
              </p>
            </div>
          )}

          {!loading && resources.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource) => (
                <article
                  key={resource.id}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/50 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-5 w-5"
                          aria-hidden="true"
                        >
                          {resource.type.toLowerCase().includes("room") ? (
                            <>
                              <rect
                                x="3"
                                y="4"
                                width="18"
                                height="16"
                                rx="2"
                              />
                              <path d="M9 20V9h6v11M9 13h6" />
                            </>
                          ) : resource.type.toLowerCase().includes("vehicle") ? (
                            <>
                              <path d="M5 17h14l1-6-2-5H6l-2 5 1 6Z" />
                              <path d="M4 12h16M7 17v2m10-2v2" />
                              <circle cx="7.5" cy="15" r="1" />
                              <circle cx="16.5" cy="15" r="1" />
                            </>
                          ) : (
                            <>
                              <rect
                                x="4"
                                y="3"
                                width="16"
                                height="18"
                                rx="2"
                              />
                              <path d="M8 7h8M8 11h8M8 15h4" />
                            </>
                          )}
                        </svg>
                      </div>

                      <div className="min-w-0">
                        <h4 className="break-words font-bold text-slate-900">
                          {resource.name}
                        </h4>
                        <p className="mt-1 text-sm font-medium text-indigo-600">
                          {resource.type}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        resource.is_active
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10"
                          : "bg-slate-100 text-slate-600 ring-1 ring-slate-500/10"
                      }`}
                    >
                      {resource.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="my-5 border-t border-slate-100" />

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                        aria-hidden="true"
                      >
                        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Location
                        </p>
                        <p className="mt-1 break-words text-sm text-slate-700">
                          {resource.location || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                        aria-hidden="true"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="10" cy="7" r="4" />
                        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Capacity
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {resource.capacity}{" "}
                          {resource.capacity === 1 ? "unit" : "units"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Description
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                        {resource.description || "No description available."}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
          ResourceHub · Resource Reservation Management System
        </footer>
      </div>
    </main>
  );
}
