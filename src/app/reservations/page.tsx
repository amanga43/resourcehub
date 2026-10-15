
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppAlert from "@/components/AppAlert";

type Resource = {
  id: string;
  name: string;
  type: string;
  location: string | null;
  is_active: boolean;
};

type Reservation = {
  id: string;
  resource_id: string;
  resource_name: string;
  reserved_by: string;
  purpose: string;
  start_at: string;
  end_at: string;
  status: string;
};

type AlertVariant = "success" | "error" | "confirm";

const emptyForm = {
  resource_id: "",
  reserved_by: "",
  purpose: "",
  start_at: "",
  end_at: "",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

export default function ReservationsPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(
    null
  );

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

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [resourceResponse, reservationResponse] = await Promise.all([
        fetch("/api/resources", { cache: "no-store" }),
        fetch("/api/reservations", { cache: "no-store" }),
      ]);

      const resourceData = await resourceResponse.json();
      const reservationData = await reservationResponse.json();

      if (!resourceResponse.ok || !resourceData.success) {
        throw new Error(
          resourceData.message || "Unable to load resources."
        );
      }

      if (!reservationResponse.ok || !reservationData.success) {
        throw new Error(
          reservationData.message || "Unable to load reservations."
        );
      }

      const activeResources: Resource[] =
        resourceData.resources.filter(
          (resource: Resource) => resource.is_active
        );

      setResources(activeResources);
      setReservations(reservationData.reservations);

      setForm((current) => ({
        ...current,
        resource_id: activeResources.some(
          (resource) => resource.id === current.resource_id
        )
          ? current.resource_id
          : activeResources[0]?.id || "",
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load reservation data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (
        !form.start_at ||
        !form.end_at ||
        new Date(form.end_at) <= new Date(form.start_at)
      ) {
        throw new Error(
          "End date and time must be later than the start date and time."
        );
      }

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          start_at: new Date(form.start_at).toISOString(),
          end_at: new Date(form.end_at).toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to create reservation."
        );
      }

      setForm((current) => ({
        ...emptyForm,
        resource_id: current.resource_id,
      }));

      await loadData();

      showAlert(
        "Reservation Created Successfully",
        "Your reservation has been saved. You can view its details in Reservation History.",
        "success"
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the reservation.";

      showAlert(
        "Reservation Could Not Be Created",
        errorMessage,
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel(id: string) {
    setPendingCancelId(id);

    showAlert(
      "Cancel This Reservation?",
      "Are you sure you want to cancel this reservation? This action will mark the reservation as cancelled.",
      "confirm"
    );
  }

  function dismissAlert() {
    closeAlert();
    setPendingCancelId(null);
  }

  async function confirmCancel() {
    const id = pendingCancelId;

    if (!id || cancelling) return;

    closeAlert();
    setPendingCancelId(null);
    setCancelling(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not cancel the reservation."
        );
      }

      await loadData();

      showAlert(
        "Reservation Cancelled",
        "The reservation has been cancelled successfully.",
        "success"
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong while cancelling the reservation.";

      showAlert(
        "Cancellation Failed",
        errorMessage,
        "error"
      );
    } finally {
      setCancelling(false);
    }
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const confirmedCount = reservations.filter(
    (reservation) => reservation.status === "confirmed"
  ).length;

  const cancelledCount = reservations.filter(
    (reservation) => reservation.status === "cancelled"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50/80 text-slate-900">
      {/* Custom application alert */}
      <AppAlert
        open={alert.open}
        title={alert.title}
        message={alert.message}
        variant={alert.variant}
        onClose={dismissAlert}
        onConfirm={confirmCancel}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
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
              <h1 className="truncate text-xl font-bold tracking-tight">
                ResourceHub
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Resource Reservation Management
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 sm:px-4"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="8" height="8" rx="2" />
              <rect x="13" y="3" width="8" height="5" rx="2" />
              <rect x="13" y="10" width="8" height="11" rx="2" />
              <rect x="3" y="13" width="8" height="8" rx="2" />
            </svg>
            <span className="hidden sm:inline">Resource Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Page heading */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-indigo-600">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            Booking Management
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Reservations
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Schedule resources, manage your bookings, and keep track of
            reservation status in one place.
          </p>
        </section>

        {/* Summary cards */}
        <section
          aria-label="Reservation statistics"
          className="mb-8 grid gap-4 sm:grid-cols-3"
        >
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Reservations
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : reservations.length}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  All recorded bookings
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
                  <rect x="3" y="5" width="18" height="16" rx="3" />
                  <path d="M16 3v4M8 3v4M3 10h18" />
                </svg>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Confirmed
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-emerald-600">
                  {loading ? "—" : confirmedCount}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Active reservations
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

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Cancelled
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-600">
                  {loading ? "—" : cancelledCount}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Cancelled bookings
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

        {/* Resource loading error */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <span className="font-bold" aria-hidden="true">
              !
            </span>
            <div>
              <p className="font-semibold">
                Unable to load reservation data
              </p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => void loadData()}
                className="mt-3 font-semibold underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Create reservation */}
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
                <h3 className="text-lg font-bold">
                  Create a Reservation
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Select a resource and enter your booking details.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
            {resources.length === 0 && !loading && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">
                  No active resources available
                </p>
                <p className="mt-1">
                  Add an active resource on the dashboard before creating
                  a reservation.
                </p>
                <Link
                  href="/"
                  className="mt-3 inline-flex font-semibold underline underline-offset-4"
                >
                  Go to Resource Dashboard
                </Link>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="resource"
                  className="text-sm font-semibold text-slate-700"
                >
                  Select Resource <span className="text-rose-500">*</span>
                </label>
                <select
                  id="resource"
                  required
                  value={form.resource_id}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      resource_id: event.target.value,
                    })
                  }
                  disabled={loading || resources.length === 0 || saving}
                  className={inputClass}
                >
                  <option value="">Choose a resource</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name} — {resource.type}
                      {resource.location ? ` (${resource.location})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="reserved_by"
                  className="text-sm font-semibold text-slate-700"
                >
                  Your Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="reserved_by"
                  required
                  maxLength={120}
                  value={form.reserved_by}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      reserved_by: event.target.value,
                    })
                  }
                  placeholder="Enter the name of the person booking"
                  disabled={saving}
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="purpose"
                  className="text-sm font-semibold text-slate-700"
                >
                  Reservation Purpose <span className="text-rose-500">*</span>
                </label>
                <input
                  id="purpose"
                  required
                  maxLength={250}
                  value={form.purpose}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      purpose: event.target.value,
                    })
                  }
                  placeholder="e.g. Project team meeting"
                  disabled={saving}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="start_at"
                  className="text-sm font-semibold text-slate-700"
                >
                  Start Date and Time <span className="text-rose-500">*</span>
                </label>
                <input
                  id="start_at"
                  type="datetime-local"
                  required
                  value={form.start_at}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      start_at: event.target.value,
                    })
                  }
                  disabled={saving}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="end_at"
                  className="text-sm font-semibold text-slate-700"
                >
                  End Date and Time <span className="text-rose-500">*</span>
                </label>
                <input
                  id="end_at"
                  type="datetime-local"
                  required
                  value={form.end_at}
                  min={form.start_at || undefined}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      end_at: event.target.value,
                    })
                  }
                  disabled={saving}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="rounded-xl bg-indigo-50/70 p-4">
              <p className="text-sm font-medium text-indigo-900">
                Before you book
              </p>
              <p className="mt-1 text-sm leading-6 text-indigo-700">
                Check your selected resource and time range. The system
                will reject a reservation that overlaps an existing
                confirmed booking for the same resource.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                Fields marked with * are required.
              </p>

              <button
                type="submit"
                disabled={saving || loading || resources.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Creating Reservation...
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
                    Create Reservation
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Reservation history */}
        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                Reservation History
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                View and manage confirmed and cancelled bookings.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
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

          {loading && reservations.length === 0 && (
            <div className="space-y-4">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="h-5 w-1/3 rounded bg-slate-100" />
                  <div className="mt-4 h-4 w-1/4 rounded bg-slate-100" />
                  <div className="mt-6 h-4 w-2/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {!loading && reservations.length === 0 && !error && (
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
                  <rect x="3" y="5" width="18" height="16" rx="3" />
                  <path d="M16 3v4M8 3v4M3 10h18M12 13v4M10 15h4" />
                </svg>
              </div>
              <h4 className="mt-4 font-semibold text-slate-900">
                No reservations yet
              </h4>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first reservation using the form above. Your
                booking history will appear here.
              </p>
            </div>
          )}

          {reservations.length > 0 && (
            <div className="space-y-4">
              {reservations.map((reservation) => {
                const isConfirmed = reservation.status === "confirmed";

                return (
                  <article
                    key={reservation.id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-5 w-5"
                            aria-hidden="true"
                          >
                            <rect
                              x="3"
                              y="4"
                              width="18"
                              height="17"
                              rx="3"
                            />
                            <path d="M16 2v4M8 2v4M3 9h18M8 13h3M8 17h7" />
                          </svg>
                        </div>

                        <div className="min-w-0">
                          <h4 className="break-words text-lg font-bold text-slate-900">
                            {reservation.resource_name}
                          </h4>
                          <p className="mt-1 break-words text-sm text-slate-500">
                            Reserved by{" "}
                            <span className="font-medium text-slate-700">
                              {reservation.reserved_by}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            isConfirmed
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10"
                              : "bg-slate-100 text-slate-600 ring-1 ring-slate-500/10"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isConfirmed
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {isConfirmed ? "Confirmed" : "Cancelled"}
                        </span>

                        {isConfirmed && (
                          <button
                            type="button"
                            disabled={cancelling}
                            onClick={() => handleCancel(reservation.id)}
                            className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {cancelling ? "Processing..." : "Cancel"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="my-5 border-t border-slate-100" />

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="mt-0.5 h-5 w-5 shrink-0 text-slate-400"
                          aria-hidden="true"
                        >
                          <path d="M12 8v4l3 2" />
                          <circle cx="12" cy="12" r="9" />
                        </svg>
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Start Date &amp; Time
                          </p>
                          <p className="mt-1 break-words text-sm font-medium text-slate-700">
                            {formatDate(reservation.start_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="mt-0.5 h-5 w-5 shrink-0 text-slate-400"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            End Date &amp; Time
                          </p>
                          <p className="mt-1 break-words text-sm font-medium text-slate-700">
                            {formatDate(reservation.end_at)}
                          </p>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Purpose
                        </p>
                        <p className="mt-1 break-words text-sm leading-6 text-slate-700">
                          {reservation.purpose}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
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
