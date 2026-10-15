/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppAlert, { type AlertVariant } from "@/components/AppAlert";
import AppShell from "@/components/AppShell";
import {
  CalendarRange,
  CalendarCheck,
  CalendarX2,
  Clock,
  User,
  FileText,
  Building2,
  Search,
  RefreshCw,
  Plus,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar as CalendarIcon,
} from "lucide-react";

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
  resource_type?: string;
  reserved_by: string;
  purpose: string;
  start_at: string;
  end_at: string;
  status: string;
};

const emptyForm = {
  resource_id: "",
  reserved_by: "",
  purpose: "",
  start_at: "",
  end_at: "",
};

const CATEGORY_IMAGES: Record<string, string> = {
  "meeting room":
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  "conference room":
    "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80",
  equipment:
    "https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80",
  vehicle:
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
  workspace:
    "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80",
  other:
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
};

function getResourceImage(type: string): string {
  const t = type.toLowerCase();
  for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
    if (t.includes(key)) return url;
  }
  return CATEGORY_IMAGES["other"];
}

function ReservationsContent() {
  const searchParams = useSearchParams();
  const preselectedResourceId = searchParams.get("resourceId");

  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [pendingCancelReservation, setPendingCancelReservation] = useState<Reservation | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "cancelled">("all");

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

  function showAlert(title: string, message: string, variant: AlertVariant) {
    setAlert({
      open: true,
      title,
      message,
      variant,
    });
  }

  function closeAlert() {
    setAlert((prev) => ({ ...prev, open: false }));
    setPendingCancelReservation(null);
  }

  async function fetchReservationsData() {
    const [resourceResponse, reservationResponse] = await Promise.all([
      fetch("/api/resources", { cache: "no-store" }),
      fetch("/api/reservations", { cache: "no-store" }),
    ]);

    const resourceData = await resourceResponse.json();
    const reservationData = await reservationResponse.json();

    if (!resourceResponse.ok || !resourceData.success) {
      throw new Error(resourceData.message || "Unable to load resources.");
    }

    if (!reservationResponse.ok || !reservationData.success) {
      throw new Error(reservationData.message || "Unable to load reservations.");
    }

    const activeList: Resource[] = resourceData.resources.filter(
      (r: Resource) => r.is_active
    );

    return {
      activeList,
      reservations: reservationData.reservations,
    };
  }

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchReservationsData();
      setResources(data.activeList);
      setReservations(data.reservations);

      setForm((current) => {
        if (current.resource_id && data.activeList.some((r: Resource) => r.id === current.resource_id)) {
          return current;
        }
        if (preselectedResourceId && data.activeList.some((r: Resource) => r.id === preselectedResourceId)) {
          return { ...current, resource_id: preselectedResourceId };
        }
        return {
          ...current,
          resource_id: data.activeList[0]?.id || "",
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load reservation data."
      );
    } finally {
      setLoading(false);
    }
  }, [preselectedResourceId]);

  useEffect(() => {
    let isMounted = true;

    fetchReservationsData()
      .then((data) => {
        if (!isMounted) return;
        setResources(data.activeList);
        setReservations(data.reservations);

        setForm((current) => {
          if (current.resource_id && data.activeList.some((r: Resource) => r.id === current.resource_id)) {
            return current;
          }
          if (preselectedResourceId && data.activeList.some((r: Resource) => r.id === preselectedResourceId)) {
            return { ...current, resource_id: preselectedResourceId };
          }
          return {
            ...current,
            resource_id: data.activeList[0]?.id || "",
          };
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(
          err instanceof Error ? err.message : "Unable to load reservation data."
        );
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [preselectedResourceId]);

  // Calculate duration string helper
  const durationLabel = useMemo(() => {
    if (!form.start_at || !form.end_at) return null;
    const start = new Date(form.start_at).getTime();
    const end = new Date(form.end_at).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return null;

    const diffMinutes = Math.round((end - start) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours > 0 && minutes > 0) return `${hours} hr ${minutes} min`;
    if (hours > 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
    return `${minutes} minutes`;
  }, [form.start_at, form.end_at]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!form.start_at || !form.end_at) {
        throw new Error("Both start and end dates/times are required.");
      }

      const startDate = new Date(form.start_at);
      const endDate = new Date(form.end_at);

      if (endDate <= startDate) {
        throw new Error("End date and time must be later than start date and time.");
      }

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          start_at: startDate.toISOString(),
          end_at: endDate.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create reservation.");
      }

      // Reset form but retain selected resource
      setForm((current) => ({
        ...emptyForm,
        resource_id: current.resource_id,
      }));

      await refreshData();

      showAlert(
        "Reservation Confirmed",
        "Your reservation has been recorded in the schedule. Overlapping bookings will be safely prevented.",
        "success"
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong while booking the resource.";
      showAlert("Reservation Failed", errorMessage, "error");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelClick(reservation: Reservation) {
    setPendingCancelReservation(reservation);
    showAlert(
      "Confirm Cancellation",
      `Are you sure you want to cancel the reservation for "${reservation.resource_name}" booked by ${reservation.reserved_by}? The time slot will become available for others.`,
      "confirm"
    );
  }

  async function confirmCancelAction() {
    if (!pendingCancelReservation || cancelling) return;
    const targetId = pendingCancelReservation.id;

    setCancelling(true);
    try {
      const response = await fetch(`/api/reservations/${targetId}`, {
        method: "PATCH",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not cancel the reservation.");
      }

      closeAlert();
      await refreshData();

      showAlert(
        "Reservation Cancelled",
        "The booking status has been updated to cancelled.",
        "success"
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong while cancelling the reservation.";
      showAlert("Cancellation Failed", errorMessage, "error");
    } finally {
      setCancelling(false);
    }
  }

  function formatDateOnly(value: string) {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTimeOnly(value: string) {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatDurationBetween(startStr: string, endStr: string) {
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return "";
    const diffMinutes = Math.round((end - start) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  }

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const matchesSearch =
        searchQuery === "" ||
        r.resource_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reserved_by.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.purpose.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchQuery, statusFilter]);

  const confirmedCount = reservations.filter((r) => r.status === "confirmed").length;
  const cancelledCount = reservations.filter((r) => r.status === "cancelled").length;

  return (
    <AppShell activeTab="reservations">
      <AppAlert
        open={alert.open}
        title={alert.title}
        message={alert.message}
        variant={alert.variant}
        onClose={closeAlert}
        onConfirm={confirmCancelAction}
        isProcessing={cancelling}
        confirmText="Yes, Cancel Booking"
        cancelText="Keep Booking"
      />

      {/* Page Header */}
      <section className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-blue-600">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Scheduling Engine
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0b1528] sm:text-3xl">
              Reservation Management
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 sm:max-w-2xl">
              Schedule active resources, review organizational booking logs, and safely release
              time slots with double-booking prevention.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refreshData()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-indigo-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
              <span>{loading ? "Syncing..." : "Refresh"}</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-indigo-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Resource Catalog</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Soft Pastel & Lightly Tinted KPI Summary Cards */}
      <section aria-label="Reservation Summary" className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Bookings - Pastel Blue */}
        <article className="rounded-2xl border border-blue-150/80 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 p-5 shadow-2xs transition hover:border-blue-300 hover:shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-blue-800">
                Total Bookings
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#0b1528]">
                {loading ? "—" : reservations.length}
              </p>
              <p className="mt-1.5 text-xs text-blue-600/90 font-medium">All registered bookings</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/25">
              <CalendarRange className="h-5 w-5" />
            </div>
          </div>
        </article>

        {/* Confirmed - Pastel Emerald */}
        <article className="rounded-2xl border border-emerald-150/80 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 p-5 shadow-2xs transition hover:border-emerald-300 hover:shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-800">
                Confirmed / Active
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-700">
                {loading ? "—" : confirmedCount}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Active schedules</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/25">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
        </article>

        {/* Cancelled - Muted Pastel Red */}
        <article className="rounded-2xl border border-rose-150/80 bg-gradient-to-br from-rose-50/70 via-white to-pink-50/40 p-5 shadow-2xs transition hover:border-rose-300 hover:shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-rose-800">
                Cancelled
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-rose-700">
                {loading ? "—" : cancelledCount}
              </p>
              <p className="mt-1.5 text-xs text-rose-600/90 font-medium">Released slots</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm shadow-rose-500/25">
              <CalendarX2 className="h-5 w-5" />
            </div>
          </div>
        </article>

        {/* Available Resources - Pastel Lavender/Teal */}
        <article className="rounded-2xl border border-indigo-150/80 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/40 p-5 shadow-2xs transition hover:border-indigo-300 hover:shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-800">
                Available Resources
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-indigo-700">
                {loading ? "—" : resources.length}
              </p>
              <p className="mt-1.5 text-xs text-indigo-600/90 font-medium">Ready to reserve</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/25">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
        </article>
      </section>

      {/* Reservation Creation Card */}
      <section className="mb-10 overflow-hidden rounded-2xl border border-indigo-150 bg-white shadow-2xs">
        <div className="border-b border-indigo-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
              <Plus className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Create a New Reservation
              </h2>
              <p className="text-xs text-slate-500">
                Select a resource and pick your desired date and time window.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6">
          {resources.length === 0 && !loading && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">No active resources available</p>
                <p className="mt-1 text-amber-700">
                  You need to register at least one active resource in the catalog before you can
                  book.
                </p>
                <Link
                  href="/"
                  className="mt-2.5 inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-4"
                >
                  <span>Go to Resource Catalog</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {/* Resource Selector */}
            <div>
              <label htmlFor="resource_id" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Select Resource <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-2">
                <select
                  id="resource_id"
                  required
                  value={form.resource_id}
                  onChange={(e) => setForm({ ...form, resource_id: e.target.value })}
                  disabled={loading || resources.length === 0 || saving}
                  className="w-full rounded-xl border border-indigo-200/80 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value="">— Select an available resource —</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type}) {r.location ? `· ${r.location}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reserved By */}
            <div>
              <label htmlFor="reserved_by" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Reserved By (Your Name) <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-2">
                <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-blue-500/70" />
                <input
                  id="reserved_by"
                  type="text"
                  required
                  maxLength={120}
                  value={form.reserved_by}
                  onChange={(e) => setForm({ ...form, reserved_by: e.target.value })}
                  placeholder="e.g. Maya Chen"
                  disabled={saving}
                  className="w-full rounded-xl border border-indigo-200/80 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Purpose */}
            <div className="md:col-span-2">
              <label htmlFor="purpose" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Reservation Purpose <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-2">
                <FileText className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-blue-500/70" />
                <input
                  id="purpose"
                  type="text"
                  required
                  maxLength={250}
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder="e.g. Strategic Planning Meeting & Architecture Review"
                  disabled={saving}
                  className="w-full rounded-xl border border-indigo-200/80 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Start Date & Time */}
            <div>
              <label htmlFor="start_at" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Start Date &amp; Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-2">
                <input
                  id="start_at"
                  type="datetime-local"
                  required
                  value={form.start_at}
                  onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                  disabled={saving}
                  className="w-full rounded-xl border border-indigo-200/80 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div>
              <label htmlFor="end_at" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                End Date &amp; Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-2">
                <input
                  id="end_at"
                  type="datetime-local"
                  required
                  min={form.start_at || undefined}
                  value={form.end_at}
                  onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                  disabled={saving}
                  className="w-full rounded-xl border border-indigo-200/80 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Duration Indicator */}
          {durationLabel && (
            <div className="flex items-center gap-2 rounded-xl bg-blue-50/80 border border-blue-200/60 px-4 py-2.5 text-xs font-medium text-blue-900">
              <Clock className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Calculated Booking Duration: <strong className="font-bold text-blue-700">{durationLabel}</strong></span>
            </div>
          )}

          {/* Conflict Guard Notice with Teal Accent */}
          <div className="rounded-xl border border-teal-200/70 bg-teal-50/60 p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
            <div className="text-xs text-teal-900 leading-relaxed">
              <span className="font-bold text-teal-950">Double-Booking Guard: </span>
              ResourceHub automatically checks for overlapping reservations. If another confirmed
              booking conflicts with your requested time window, your request will be safely rejected
              with a clear notification.
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-indigo-100">
            <span className="text-xs text-slate-500">
              Fields with <span className="text-rose-500">*</span> are mandatory.
            </span>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setForm(emptyForm)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
              <button
                type="submit"
                disabled={saving || loading || resources.length === 0}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Booking Reservation...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm Reservation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Reservation History Section */}
      <section aria-label="Reservation History">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#0b1528]">
              Reservation History
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Complete audit log of confirmed and cancelled bookings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-blue-500/70" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name, resource, purpose..."
                className="rounded-xl border border-indigo-200/80 bg-white pl-9 pr-3.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-2xs w-60 sm:w-72"
              />
            </div>

            {/* Status Pills */}
            <div className="inline-flex rounded-xl border border-indigo-200/80 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  statusFilter === "all"
                    ? "bg-blue-50 text-blue-800 font-semibold"
                    : "text-slate-600 hover:text-blue-600"
                }`}
              >
                All ({reservations.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("confirmed")}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  statusFilter === "confirmed"
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-slate-600 hover:text-emerald-700"
                }`}
              >
                Confirmed ({confirmedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("cancelled")}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  statusFilter === "cancelled"
                    ? "bg-rose-50 text-rose-700 font-semibold"
                    : "text-slate-600 hover:text-rose-700"
                }`}
              >
                Cancelled ({cancelledCount})
              </button>
            </div>
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && reservations.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-indigo-100 bg-white p-5 shadow-2xs flex items-center justify-between"
              >
                <div className="space-y-2 w-1/3">
                  <div className="h-4 w-3/4 rounded bg-indigo-50" />
                  <div className="h-3 w-1/2 rounded bg-indigo-50" />
                </div>
                <div className="space-y-2 w-1/4">
                  <div className="h-3.5 w-3/4 rounded bg-indigo-50" />
                  <div className="h-3 w-1/2 rounded bg-indigo-50" />
                </div>
                <div className="h-7 w-20 rounded-full bg-indigo-50" />
              </div>
            ))}
          </div>
        )}

        {/* Error Notice */}
        {!loading && error && reservations.length === 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center">
            <p className="text-sm font-semibold text-rose-800">
              Unable to load reservation data
            </p>
            <p className="mt-1 text-xs text-rose-600">{error}</p>
            <button
              type="button"
              onClick={() => void refreshData()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-700 shadow-2xs ring-1 ring-rose-200 hover:bg-rose-50"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}

        {/* Empty History State */}
        {!loading && !error && reservations.length === 0 && (
          <div className="rounded-2xl border border-dashed border-indigo-200 bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-600/15">
              <CalendarRange className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              No reservations yet
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
              Create your first booking using the schedule form above. Your upcoming and past
              reservations will be cataloged here.
            </p>
          </div>
        )}

        {/* Search Empty State */}
        {!loading && !error && reservations.length > 0 && filteredReservations.length === 0 && (
          <div className="rounded-2xl border border-indigo-100 bg-white p-10 text-center">
            <Search className="mx-auto h-8 w-8 text-indigo-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              No matching bookings
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              No reservation matches your search query or status filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-4"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Ultra-Neat Desktop Reservation Table */}
        {!loading && filteredReservations.length > 0 && (
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-indigo-150/90 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 border-collapse">
                <thead className="border-b border-indigo-100 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/90 text-xs uppercase tracking-wider text-slate-700 font-semibold">
                  <tr>
                    <th scope="col" className="px-6 py-4 w-[34%]">
                      Resource &amp; Purpose
                    </th>
                    <th scope="col" className="px-6 py-4 w-[20%]">
                      Reserved By
                    </th>
                    <th scope="col" className="px-6 py-4 w-[26%]">
                      Schedule Window
                    </th>
                    <th scope="col" className="px-6 py-4 w-[12%]">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-4 text-right w-[8%]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50/90">
                  {filteredReservations.map((reservation) => {
                    const isConfirmed = reservation.status === "confirmed";
                    const duration = formatDurationBetween(
                      reservation.start_at,
                      reservation.end_at
                    );

                    return (
                      <tr
                        key={reservation.id}
                        className="transition duration-150 hover:bg-blue-50/30"
                      >
                        {/* Column 1: Resource & Purpose */}
                        <td className="px-6 py-4.5 align-middle">
                          <div className="flex items-start gap-3">
                            <img
                              src={getResourceImage(reservation.resource_type || "meeting room")}
                              alt={reservation.resource_name}
                              className="h-11 w-13 rounded-xl object-cover shrink-0 border border-indigo-150 shadow-2xs mt-0.5"
                              loading="lazy"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-[#0b1528] text-sm">
                                  {reservation.resource_name}
                                </span>
                                {reservation.resource_type && (
                                  <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-200/50">
                                    {reservation.resource_type}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-slate-500 leading-normal line-clamp-1 max-w-xs">
                                {reservation.purpose}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Reserved By */}
                        <td className="px-6 py-4.5 align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-bold text-white shadow-2xs">
                              {reservation.reserved_by.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-slate-800">
                              {reservation.reserved_by}
                            </span>
                          </div>
                        </td>

                        {/* Column 3: Schedule Window */}
                        <td className="px-6 py-4.5 align-middle">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0b1528]">
                              <CalendarIcon className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                              <span>{formatDateOnly(reservation.start_at)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pl-5">
                              <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>
                                {formatTimeOnly(reservation.start_at)} – {formatTimeOnly(reservation.end_at)}
                              </span>
                              {duration && (
                                <span className="ml-1 inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200/60">
                                  {duration}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Column 4: Status */}
                        <td className="px-6 py-4.5 align-middle">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isConfirmed
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/25"
                                : "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isConfirmed ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            {isConfirmed ? "Confirmed" : "Cancelled"}
                          </span>
                        </td>

                        {/* Column 5: Action */}
                        <td className="px-6 py-4.5 text-right align-middle">
                          {isConfirmed ? (
                            <button
                              type="button"
                              onClick={() => handleCancelClick(reservation)}
                              className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-2xs transition hover:bg-rose-50 hover:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                            >
                              Cancel
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium italic">Released</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reservations Mobile / Tablet Cards */}
        {!loading && filteredReservations.length > 0 && (
          <div className="lg:hidden space-y-3">
            {filteredReservations.map((reservation) => {
              const isConfirmed = reservation.status === "confirmed";
              const duration = formatDurationBetween(
                reservation.start_at,
                reservation.end_at
              );

              return (
                <article
                  key={reservation.id}
                  className="rounded-2xl border border-indigo-150 bg-white p-5 shadow-2xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getResourceImage(reservation.resource_type || "meeting room")}
                        alt={reservation.resource_name}
                        className="h-11 w-13 rounded-xl object-cover shrink-0 border border-indigo-150 shadow-2xs"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[#0b1528] text-base truncate">
                            {reservation.resource_name}
                          </h3>
                          {reservation.resource_type && (
                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-200/50 shrink-0">
                              {reservation.resource_type}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 truncate">
                          Booked by <span className="font-semibold text-slate-700">{reservation.reserved_by}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        isConfirmed
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/25"
                          : "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isConfirmed ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      {isConfirmed ? "Confirmed" : "Cancelled"}
                    </span>
                  </div>

                  <div className="rounded-xl bg-blue-50/40 p-3 text-xs space-y-2 border border-blue-100/60">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-500 font-medium">Date:</span>
                      <span className="font-semibold text-[#0b1528]">
                        {formatDateOnly(reservation.start_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-500 font-medium">Window:</span>
                      <span className="font-medium text-slate-800">
                        {formatTimeOnly(reservation.start_at)} – {formatTimeOnly(reservation.end_at)}
                      </span>
                    </div>
                    {duration && (
                      <div className="flex items-center justify-between text-slate-600 pt-1.5 border-t border-blue-100/80">
                        <span className="text-slate-500 font-medium">Duration:</span>
                        <span className="font-semibold text-blue-700">{duration}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      Purpose
                    </p>
                    <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                      {reservation.purpose}
                    </p>
                  </div>

                  {isConfirmed && (
                    <div className="pt-3 border-t border-indigo-50 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleCancelClick(reservation)}
                        className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        Cancel Reservation
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function ReservationsLoadingSkeleton() {
  return (
    <AppShell activeTab="reservations">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-indigo-100" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-indigo-50/70" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-white border border-indigo-100" />
      </div>
    </AppShell>
  );
}

export default function ReservationsPage() {
  return (
    <Suspense fallback={<ReservationsLoadingSkeleton />}>
      <ReservationsContent />
    </Suspense>
  );
}
