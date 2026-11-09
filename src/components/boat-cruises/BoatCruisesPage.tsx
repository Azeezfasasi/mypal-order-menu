"use client";

import { useState } from "react";
import { Loader2, PlusCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BoatCruisesApi } from "@/services/api/boat-cruises-api";
import { useBoatNav } from "./boat-nav";
import { BoatAvailabilityGrid } from "./BoatAvailabilityGrid";
import { BoatBookingsList } from "./BoatBookingsList";
import { BoatBookingStatusBadge } from "./BoatBookingStatusBadge";
import { BoatManualBookingDialog } from "./BoatManualBookingDialog";
import { BoatReviews } from "./BoatReviews";
import { formatDay, formatTime, toIsoDay } from "./boat-utils";

export const BOAT_TABS = [
  { id: "availability", label: "Availability & Inventory" },
  { id: "bookings", label: "Bookings" },
  { id: "reviews", label: "Reviews" },
] as const;

export type BoatTab = (typeof BOAT_TABS)[number]["id"];

/** Boat & Yacht Cruises: availability grid, bookings and reviews */
export function BoatCruisesPage({ initialTab = "availability" }: { initialTab?: BoatTab }) {
  const [tab, setTab] = useState<BoatTab>(initialTab);
  const [creating, setCreating] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{BOAT_TABS.find((t) => t.id === tab)?.label}</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFeedOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[13px] font-semibold text-red-600"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live
          </button>
          <Button onClick={() => setCreating(true)} className="gap-2 bg-orange-600 text-white hover:bg-orange-700">
            <PlusCircle className="h-4 w-4" /> New Booking
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {BOAT_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg border px-5 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "border-orange-200 bg-orange-50 text-orange-600" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "availability" && <BoatAvailabilityGrid />}
      {tab === "bookings" && <BoatBookingsList />}
      {tab === "reviews" && <BoatReviews />}

      <BoatManualBookingDialog open={creating} onOpenChange={setCreating} />
      {feedOpen && <LiveFeed onClose={() => setFeedOpen(false)} />}
    </div>
  );
}

/** "Live" / "Show feed": the next cruises coming up */
function LiveFeed({ onClose }: { onClose: () => void }) {
  const nav = useBoatNav();
  const today = toIsoDay(new Date());
  const { data, isLoading } = BoatCruisesApi.useBookings({ from: today, limit: 30, sort: "start_asc" });
  const upcoming = (data?.items ?? []).filter((b) => b.status === "CONFIRMED" || b.status === "CHECKED_IN" || b.status === "PENDING");

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm">
      <aside
        onClick={(e) => e.stopPropagation()}
        className="absolute right-[1dvh] top-[1dvh] flex h-[98dvh] w-[400px] flex-col rounded-[20px] bg-white p-5 sm:right-0 sm:w-full"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Live Reservations</h2>
          <button type="button" aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto">
          {isLoading ? (
            <Loader2 className="mx-auto mt-10 h-5 w-5 animate-spin text-gray-400" />
          ) : upcoming.length === 0 ? (
            <p className="mt-10 text-center text-sm text-gray-500">No upcoming cruises.</p>
          ) : (
            upcoming.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  onClose();
                  nav.openBooking(b.id);
                }}
                className="w-full rounded-xl border border-gray-200 p-3 text-left hover:border-orange-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-gray-900">{b.boat?.name}</span>
                  <BoatBookingStatusBadge status={b.status} />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {formatDay(b.booking_date, { weekday: "short", day: "numeric", month: "short" })} · {formatTime(b.start_time)} – {formatTime(b.end_time)}
                </p>
                <p className="text-xs text-gray-500">
                  {b.reserver?.name ?? "Guest"} · {b.guests?.total ?? "—"} guests
                </p>
              </button>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
