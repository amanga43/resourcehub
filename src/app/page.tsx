/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import AppAlert, { type AlertVariant } from "@/components/AppAlert";
import AppShell from "@/components/AppShell";
import {
  Plus,
  RefreshCw,
  Search,
  Building2,
  Car,
  Laptop,
  Briefcase,
  Box,
  Users,
  MapPin,
  CheckCircle2,
  CalendarCheck,
  ChevronDown,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
  Filter,
  X,
  ShieldCheck,
} from "lucide-react";

type Resource = {
  id: string;
  name: string;
  type: string;
  location: string | null;
  capacity: number;
  description: string | null;
  is_active: boolean;
};

type Reservation = {
  id: string;
  resource_id: string;
  status: string;
};

const initialForm = {
  name: "",
  type: "Meeting Room",
  location: "",
  capacity: "1",
  description: "",
};

const RESOURCE_TYPES = [
  "All",
  "Meeting Room",
  "Conference Room",
  "Equipment",
  "Vehicle",
  "Workspace",
  "Other",
] as const;

// Curated high-resolution professional architectural and workspace photography
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

export function getResourceImage(type: string): string {
  const t = type.toLowerCase();
  for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
    if (t.includes(key)) return url;
  }
  return CATEGORY_IMAGES["other"];
}

export default function Home() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
  }

  async function fetchResourcesAndReservations() {
    const [resResources, resReservations] = await Promise.all([
      fetch("/api/resources", { cache: "no-store" }),
      fetch("/api/reservations", { cache: "no-store" }),
    ]);

    const dataResources = await resResources.json();
    const dataReservations = await resReservations.json();

    if (!resResources.ok || !dataResources.success) {
      throw new Error(dataResources.message || "Unable to load resources.");
    }

    return {
      resources: dataResources.resources,
      reservations:
        resReservations.ok && dataReservations.success
          ? dataReservations.reservations
          : [],
    };
  }

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchResourcesAndReservations();
      setResources(data.resources);
      setReservations(data.reservations);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Could not load resources. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchResourcesAndReservations()
      .then((data) => {
        if (!isMounted) return;
        setResources(data.resources);
        setReservations(data.reservations);
      })
      .catch((err) => {
        if (!isMounted) return;
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Could not load resources. Please try again.";
        setError(errorMessage);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          capacity: Number(form.capacity),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create resource.");
      }

      setForm(initialForm);
      setIsFormOpen(false);

      showAlert(
        "Resource Created",
        `"${form.name.trim()}" has been successfully added to the catalog and is ready for reservations.`,
        "success"
      );

      await refreshData();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong while adding the resource.";
      showAlert("Creation Failed", errorMessage, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(resource: Resource) {
    setTogglingId(resource.id);
    try {
      const response = await fetch(`/api/resources/${resource.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !resource.is_active }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update resource status.");
      }

      showAlert(
        "Availability Status Updated",
        `"${resource.name}" has been marked as ${
          !resource.is_active
            ? "Active (now available for booking)"
            : "Offline / Inactive (future reservations will be blocked)"
        }.`,
        "success"
      );

      await refreshData();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Could not update resource status.";
      showAlert("Status Update Failed", errorMessage, "error");
    } finally {
      setTogglingId(null);
    }
  }

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      const matchesSearch =
        searchQuery === "" ||
        res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (res.location && res.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (res.description && res.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        selectedType === "All" ||
        res.type.toLowerCase() === selectedType.toLowerCase();

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" ? res.is_active : !res.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [resources, searchQuery, selectedType, selectedStatus]);

  // Statistics
  const activeCount = resources.filter((r) => r.is_active).length;
  const inactiveCount = resources.length - activeCount;
  const confirmedReservationsCount = reservations.filter(
    (r) => r.status === "confirmed"
  ).length;

  function getResourceIcon(type: string) {
    const t = type.toLowerCase();
    if (t.includes("room") || t.includes("conference")) {
      return <Building2 className="h-4 w-4" />;
    }
    if (t.includes("vehicle") || t.includes("car") || t.includes("van")) {
      return <Car className="h-4 w-4" />;
    }
    if (t.includes("equipment") || t.includes("hardware") || t.includes("laptop")) {
      return <Laptop className="h-4 w-4" />;
    }
    if (t.includes("desk") || t.includes("workspace")) {
      return <Briefcase className="h-4 w-4" />;
    }
    return <Box className="h-4 w-4" />;
  }

  return (
    <AppShell
      activeTab="resources"
      actionButton={
        <button
          type="button"
          onClick={() => setIsFormOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 sm:px-4 sm:text-sm"
        >
          {isFormOpen ? (
            <>
              <X className="h-4 w-4" />
              <span>Close Form</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Add Resource</span>
            </>
          )}
        </button>
      }
    >
      <AppAlert
        open={alert.open}
        title={alert.title}
        message={alert.message}
        variant={alert.variant}
        onClose={closeAlert}
      />

      {/* Spotlight Feature Banner with Proper Architectural Imagery */}
      <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c162c] via-[#101d3a] to-[#16274e] text-white shadow-xl shadow-slate-950/10 border border-[#1e2f54]">
        <div className="grid md:grid-cols-12 items-center gap-6 p-6 sm:p-8 lg:p-10">
          <div className="md:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 border border-blue-400/25 px-3 py-1 text-xs font-semibold text-blue-300">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>Premium Resource Scheduling</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Reserve Executive Spaces &amp; High-Tech Assets
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Seamlessly book modern conference halls, collaborative meeting hubs, and equipment
              with automated overlap detection and real-time availability.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/reservations"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 shadow-md shadow-blue-600/30 transition duration-150"
              >
                <CalendarCheck className="h-4 w-4" />
                <span>Reserve a Slot</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsFormOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 border border-white/15 transition duration-150"
              >
                <Plus className="h-4 w-4" />
                <span>Register New Asset</span>
              </button>
            </div>

            <div className="flex items-center gap-6 pt-3 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Instant Confirmation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <span>Zero Double-Booking</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80"
                alt="Modern executive corporate office and meeting space"
                className="w-full h-56 sm:h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-white drop-shadow-sm flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-blue-400" />
                  Headquarters Executive Wing
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 text-white font-bold text-[10px] px-2 py-0.5 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Available Now
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Metric Summary Cards */}
      <section aria-label="Catalog Summary" className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Resources */}
        <article className="rounded-2xl border border-blue-150/80 bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/40 p-5 shadow-2xs transition hover:border-blue-300 hover:shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">
                Total Catalog
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#0b1528]">
                {loading ? "—" : resources.length}
              </p>
              <p className="mt-1.5 text-xs text-blue-700/80 font-medium">
                {new Set(resources.map((r) => r.type)).size || 0} distinct categories
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/25">
              <Box className="h-5 w-5" />
            </div>
          </div>
        </article>

        {/* Card 2: Active Resources */}
        <article className="rounded-2xl border border-emerald-150/80 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 p-5 shadow-2xs transition hover:border-emerald-300 hover:shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Available &amp; Active
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-700">
                {loading ? "—" : activeCount}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>
                  {resources.length > 0
                    ? `${Math.round((activeCount / resources.length) * 100)}% available to reserve`
                    : "No assets"}
                </span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/25">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </article>

        {/* Card 3: Inactive Resources */}
        <article className="rounded-2xl border border-rose-150/80 bg-gradient-to-br from-rose-50/80 via-white to-pink-50/40 p-5 shadow-2xs transition hover:border-rose-300 hover:shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-800">
                Offline / Inactive
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-rose-700">
                {loading ? "—" : inactiveCount}
              </p>
              <p className="mt-1.5 text-xs text-rose-700/80 font-medium">Slots disabled</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm shadow-rose-500/25">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
        </article>

        {/* Card 4: Active Bookings */}
        <article className="rounded-2xl border border-indigo-150/80 bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/40 p-5 shadow-2xs transition hover:border-indigo-300 hover:shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-800">
                Active Bookings
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-indigo-700">
                {loading ? "—" : confirmedReservationsCount}
              </p>
              <p className="mt-1.5 text-xs text-indigo-700/80 font-medium">
                {reservations.length} total recorded
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/25">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
        </article>
      </section>

      {/* Expandable Add Resource Card */}
      {isFormOpen && (
        <section className="mb-8 overflow-hidden rounded-2xl border border-blue-200/90 bg-white shadow-md shadow-blue-900/5">
          <div className="border-b border-indigo-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Register New Resource
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Enter asset specs, capacity, and location.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-indigo-50 hover:text-slate-700 transition"
                aria-label="Close form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Resource Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Executive Boardroom 4A (Floor 4)"
                  className="mt-1.5 w-full rounded-xl border border-indigo-150 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Category Type <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <select
                    id="type"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full appearance-none rounded-xl border border-indigo-150 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 pr-10"
                  >
                    <option>Meeting Room</option>
                    <option>Conference Room</option>
                    <option>Equipment</option>
                    <option>Vehicle</option>
                    <option>Workspace</option>
                    <option>Other</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Location / Facility
                </label>
                <div className="relative mt-1.5">
                  <MapPin className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="location"
                    type="text"
                    maxLength={150}
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Headquarters, Wing B, 3rd Floor"
                    className="w-full rounded-xl border border-indigo-150 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="capacity" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Capacity / Units <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <Users className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="capacity"
                    type="number"
                    required
                    min="1"
                    max="100000"
                    step="1"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full rounded-xl border border-indigo-150 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Resource Details &amp; Amenities
              </label>
              <textarea
                id="description"
                rows={3}
                maxLength={5000}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Include amenities (4K display, video conferencing, whiteboard, seating specs)..."
                className="mt-1.5 w-full resize-y rounded-xl border border-indigo-150 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3 border-t border-indigo-100">
              <span className="text-xs text-slate-500">
                Fields with <span className="text-rose-500">*</span> are mandatory.
              </span>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setForm(initialForm);
                    setIsFormOpen(false);
                  }}
                  className="flex-1 sm:flex-none rounded-xl border border-indigo-150 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Saving Resource...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Save Resource</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* Unified Toolbar */}
      <section className="mb-6 space-y-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Integrated Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-blue-500/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, location, or amenities..."
              className="w-full rounded-xl border border-indigo-150 bg-white pl-10 pr-14 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2 text-[11px] font-medium text-slate-400 hover:text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>

          {/* Right Controls: Status & View Toggle */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Status Segmented Control */}
            <div className="inline-flex rounded-xl border border-indigo-150 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setSelectedStatus("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedStatus === "all"
                    ? "bg-blue-50 text-blue-800 font-bold"
                    : "text-slate-600 hover:text-blue-600"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus("active")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedStatus === "active"
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "text-slate-600 hover:text-emerald-700"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus("inactive")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedStatus === "inactive"
                    ? "bg-rose-50 text-rose-700 font-bold"
                    : "text-slate-600 hover:text-rose-700"
                }`}
              >
                Inactive
              </button>
            </div>

            {/* View Switcher */}
            <div className="inline-flex rounded-xl border border-indigo-150 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid view"
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-400 hover:text-blue-600"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="List view"
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-400 hover:text-blue-600"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills & Count Indicator */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mr-1 shrink-0">
              <Filter className="h-3 w-3 text-blue-600" /> Filter:
            </span>
            {RESOURCE_TYPES.map((type) => {
              const isActive = selectedType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`shrink-0 rounded-lg px-3 py-1 text-xs font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20 font-semibold"
                      : "bg-white text-slate-600 border border-indigo-150 hover:bg-indigo-50 hover:text-blue-700"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-medium text-slate-400 shrink-0 hidden sm:inline">
            Showing <strong>{filteredResources.length}</strong> of {resources.length}
          </span>
        </div>
      </section>

      {/* Main Resource Catalog View */}
      <section aria-label="Resource List">
        {/* Loading Skeletons */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-indigo-100 bg-white overflow-hidden shadow-2xs"
              >
                <div className="h-44 w-full bg-indigo-50/80" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-3/4 rounded bg-indigo-50" />
                  <div className="h-3.5 w-1/3 rounded bg-indigo-50" />
                  <div className="space-y-2 pt-2">
                    <div className="h-3.5 w-full rounded bg-indigo-50" />
                    <div className="h-3.5 w-4/5 rounded bg-indigo-50" />
                  </div>
                  <div className="pt-3 flex justify-between border-t border-indigo-50">
                    <div className="h-4 w-20 rounded bg-indigo-50" />
                    <div className="h-7 w-20 rounded-lg bg-indigo-50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && resources.length === 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <Box className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-rose-900">
              Failed to load resources
            </h3>
            <p className="mt-1 text-xs text-rose-700 max-w-md mx-auto">{error}</p>
            <button
              type="button"
              onClick={() => void refreshData()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-rose-700 shadow-2xs ring-1 ring-rose-200 hover:bg-rose-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry Connection
            </button>
          </div>
        )}

        {/* Empty State: No resources */}
        {!loading && !error && resources.length === 0 && (
          <div className="rounded-2xl border border-dashed border-indigo-200 bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-600/15">
              <Building2 className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              No resources in catalog
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
              Get started by adding your first resource, meeting room, or piece of equipment.
              It will instantly be available for reservation scheduling.
            </p>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Add First Resource
            </button>
          </div>
        )}

        {/* Empty State: Search filter */}
        {!loading && !error && resources.length > 0 && filteredResources.length === 0 && (
          <div className="rounded-2xl border border-indigo-150 bg-white p-10 text-center">
            <Search className="mx-auto h-8 w-8 text-indigo-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              No matching resources found
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              No resources match your filter criteria or search query.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedType("All");
                setSelectedStatus("all");
              }}
              className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-4"
            >
              Reset all filters
            </button>
          </div>
        )}

        {/* Ultra-Neat Card Grid with High-Resolution Imagery */}
        {!loading && filteredResources.length > 0 && viewMode === "grid" && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => {
              const photoUrl = getResourceImage(resource.type);

              return (
                <article
                  key={resource.id}
                  className="group flex flex-col justify-between rounded-2xl border border-indigo-150/90 bg-white overflow-hidden shadow-2xs transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
                >
                  <div>
                    {/* Visual Photo Header with Badge Overlay */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      <img
                        src={photoUrl}
                        alt={`${resource.name} photo`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

                      {/* Overlaid Badges */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-blue-800 shadow-sm border border-white/60">
                          {getResourceIcon(resource.type)}
                          <span>{resource.type}</span>
                        </span>

                        <button
                          type="button"
                          disabled={togglingId === resource.id}
                          onClick={() => void handleToggleStatus(resource)}
                          title={`Click to mark as ${resource.is_active ? "Offline / Inactive" : "Active"}`}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-md shadow-sm transition hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer ${
                            resource.is_active
                              ? "bg-emerald-500/90 text-white hover:bg-emerald-600"
                              : "bg-rose-500/90 text-white hover:bg-rose-600"
                          }`}
                        >
                          {togglingId === resource.id ? (
                            <span className="h-2 w-2 animate-spin rounded-full border border-white border-t-transparent" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                          <span>{resource.is_active ? "Active" : "Offline"}</span>
                        </button>
                      </div>

                      {/* Location Badge Overlaid on Bottom of Photo */}
                      {resource.location && (
                        <div className="absolute bottom-2.5 left-3 flex items-center gap-1 text-[11px] text-white/90 drop-shadow-md font-medium">
                          <MapPin className="h-3 w-3 text-blue-300 shrink-0" />
                          <span className="truncate max-w-[200px]">{resource.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content Body */}
                    <div className="p-5">
                      <h3 className="text-base font-bold text-[#0b1528] group-hover:text-blue-600 transition">
                        {resource.name}
                      </h3>

                      {/* Metadata Chips */}
                      <div className="mt-2.5 flex items-center gap-2 text-xs">
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50/70 px-2.5 py-1 text-slate-700 border border-blue-100/70 font-semibold">
                          <Users className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>
                            Capacity: {resource.capacity} {resource.capacity === 1 ? "person" : "people"}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-2">
                        {resource.description || "No specific instructions or amenities provided."}
                      </p>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-5 pb-5 pt-0">
                    <div className="pt-3 border-t border-indigo-50 flex items-center justify-between">
                      <button
                        type="button"
                        disabled={togglingId === resource.id}
                        onClick={() => void handleToggleStatus(resource)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <span>{resource.is_active ? "Set to Offline" : "Set to Active"}</span>
                      </button>

                      {resource.is_active ? (
                        <Link
                          href={`/reservations?resourceId=${encodeURIComponent(resource.id)}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white shadow-2xs"
                        >
                          <span>Reserve</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-150">Offline</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Ultra-Neat Table View (with Image Thumbnails) */}
        {!loading && filteredResources.length > 0 && viewMode === "table" && (
          <div className="overflow-hidden rounded-2xl border border-indigo-150/90 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 border-collapse">
                <thead className="border-b border-indigo-100 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/90 text-xs uppercase tracking-wider text-slate-700 font-semibold">
                  <tr>
                    <th scope="col" className="px-6 py-4 w-[38%]">
                      Resource &amp; Amenities
                    </th>
                    <th scope="col" className="px-6 py-4 w-[18%]">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-4 w-[20%]">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-4 w-[10%]">
                      Capacity
                    </th>
                    <th scope="col" className="px-6 py-4 w-[12%]">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-4 text-right w-[10%]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50/90">
                  {filteredResources.map((resource) => {
                    const photoUrl = getResourceImage(resource.type);

                    return (
                      <tr
                        key={resource.id}
                        className="transition duration-150 hover:bg-blue-50/30"
                      >
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <img
                              src={photoUrl}
                              alt={resource.name}
                              className="h-12 w-14 rounded-xl object-cover shrink-0 border border-indigo-100 shadow-2xs"
                              loading="lazy"
                            />
                            <div>
                              <p className="font-bold text-[#0b1528] text-sm">{resource.name}</p>
                              {resource.description && (
                                <p className="text-xs text-slate-500 truncate max-w-sm mt-0.5">
                                  {resource.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/50">
                            {resource.type}
                          </span>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                            <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span>{resource.location || "—"}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                            <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span>{resource.capacity}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <button
                            type="button"
                            disabled={togglingId === resource.id}
                            onClick={() => void handleToggleStatus(resource)}
                            title={`Click to switch to ${resource.is_active ? "Offline / Inactive" : "Active"}`}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer ${
                              resource.is_active
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/25 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 hover:bg-rose-100"
                            }`}
                          >
                            {togglingId === resource.id ? (
                              <span className="h-1.5 w-1.5 animate-spin rounded-full border border-current border-t-transparent" />
                            ) : (
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  resource.is_active ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                              />
                            )}
                            <span>{resource.is_active ? "Active" : "Inactive"}</span>
                          </button>
                        </td>

                        <td className="px-6 py-4 text-right align-middle">
                          <div className="flex items-center justify-end gap-2">
                            {resource.is_active ? (
                              <Link
                                href={`/reservations?resourceId=${encodeURIComponent(resource.id)}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                              >
                                <span>Reserve</span>
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            ) : (
                              <button
                                type="button"
                                disabled={togglingId === resource.id}
                                onClick={() => void handleToggleStatus(resource)}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-emerald-600 hover:text-white cursor-pointer disabled:opacity-50"
                              >
                                {togglingId === resource.id ? "Updating..." : "Activate"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
