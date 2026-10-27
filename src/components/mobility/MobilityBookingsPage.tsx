"use client";

import { useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Car, Download, Filter, Plus, Search } from "lucide-react";
import { MobilityPagination } from "./MobilityPagination";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/useDebounce";
import { usePdfDownload } from "@/hooks/usePdfDownload";
import { cn } from "@/lib/utils";
import { MobilityApi } from "@/services/api/mobility-api";
import {
  BOOKING_STATUS_LABELS,
  TRIP_TYPE_LABELS,
  type MobilityBooking,
  type MobilityBookingStatus,
  type MobilityCategory,
  type MobilityTripType,
} from "@/types/mobility-types";
import { AddBookingDialog } from "./AddBookingDialog";
import { AssignDriverDialog } from "./AssignDriverDialog";
import { BookingNoteDialog } from "./BookingNoteDialog";
import { BookingsTable } from "./BookingsTable";
import { MobilityCategoryTabs } from "./MobilityCategoryTabs";
import { DarkStatCards } from "./MobilityStatCards";
import { PeriodChips } from "./PeriodChips";
import { VehicleFormDialog } from "./VehicleFormDialog";
import { getPeriodRange, toApiDate, type Period } from "./mobility-utils";
import { useMobilityCategory } from "./use-mobility-category";

// The API's default page size (other sizes are rejected until it parses `limit`)
const PAGE_SIZE = 20;

const HEADINGS: Record<MobilityCategory, { title: string; subtitle: string }> = {
  IN_CITY: { title: "Mobility", subtitle: "Manage all the mobility services your company offers." },
  LUXURY_RENTALS: {
    title: "Luxury Rentals",
    subtitle: "View and manage all luxury rental services that your company offers.",
  },
  HOUSEHOLD_LOGISTICS: {
    title: "Household Logistics",
    subtitle: "View and manage all household logistics services that your company offers.",
  },
};

// In-City Rides filters by trip type; rentals and logistics by status (as in the design).
// The other dimension is under "Filter by".
const TRIP_TABS: (MobilityTripType | "")[] = ["", "ONE_WAY", "ROUND_TRIP", "CHARTER"];
const STATUS_TABS: (MobilityBookingStatus | "")[] = ["", "IN_TRANSIT", "COMPLETED", "CANCELLED", "PENDING_PAYMENT"];

export default function MobilityBookingsPage() {
  const category = useMobilityCategory();
  const [period, setPeriod] = useState<Period>("today");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [tripType, setTripType] = useState<MobilityTripType | "">("");
  const [status, setStatus] = useState<MobilityBookingStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim(), 400);

  const [addBookingOpen, setAddBookingOpen] = useState(false);
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<MobilityBooking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MobilityBooking | null>(null);
  const [noteTarget, setNoteTarget] = useState<MobilityBooking | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);
  const { downloadPdf, isDownloading } = usePdfDownload();

  const range = period === "custom" ? customRange : getPeriodRange(period);
  const { data: stats, isLoading: statsLoading } = MobilityApi.useStats(category);
  const { data, isLoading, isFetching } = MobilityApi.useBookings({
    category,
    trip_type: tripType || undefined,
    status: status || undefined,
    search: debouncedSearch || undefined,
    from_date: range?.from ? toApiDate(range.from) : undefined,
    to_date: range?.to ? toApiDate(range.to) : range?.from ? toApiDate(range.from) : undefined,
    page,
    limit: PAGE_SIZE,
  });
  const bookings = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  // Filters change the result set, so start from the first page
  useEffect(() => {
    setPage(1);
  }, [category, period, customRange, tripType, status, debouncedSearch]);

  const usesTripTabs = category === "IN_CITY";
  const heading = HEADINGS[category];
  const hasFilters = period !== "all" || !!tripType || !!status || !!search;

  const viewAll = () => {
    setPeriod("all");
    setCustomRange(undefined);
    setTripType("");
    setStatus("");
    setSearch("");
  };

  const showPendingRequests = () => {
    setPeriod("all");
    setTripType("");
    setStatus("PENDING_PAYMENT");
  };

  return (
    <div className="space-y-6 md:space-y-4">
      <div className="flex items-start justify-between gap-4 md:flex-col">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 md:text-2xl">{heading.title}</h1>
          <p className="mt-1 text-sm text-gray-600">{heading.subtitle}</p>
        </div>
        <Button
          variant="outline"
          onClick={showPendingRequests}
          className="h-11 gap-2 border-orange-200 bg-orange-50 px-6 text-orange-700 hover:bg-orange-100 md:w-full"
        >
          <Car className="h-4 w-4" />
          Manage Ride Requests
        </Button>
      </div>

      <MobilityCategoryTabs />

      <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-stretch">
        <PeriodChips
          value={period}
          customRange={customRange}
          onChange={(next, nextRange) => {
            setPeriod(next);
            if (nextRange) setCustomRange(nextRange);
          }}
        />
        <div className="flex gap-3 md:grid md:grid-cols-2">
          <Button onClick={() => setAddBookingOpen(true)} className="gap-2 bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4" /> Create Booking
          </Button>
          <Button onClick={() => setAddVehicleOpen(true)} className="gap-2 bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4" /> Add Vehicle
          </Button>
        </div>
      </div>

      <DarkStatCards
        isLoading={statsLoading}
        stats={[
          { label: "Total Rides", value: stats?.total_rides ?? 0 },
          { label: "Active Booking", value: stats?.active_bookings ?? 0 },
          { label: "Ongoing Rides", value: stats?.ongoing_rides ?? 0 },
          { label: "Completed Rides", value: stats?.completed_rides ?? 0 },
        ]}
      />

      <div className="rounded-xl bg-red-50/60 p-2">
        <div className="grid grid-flow-col auto-cols-fr gap-3 overflow-x-auto md:gap-2">
          {(usesTripTabs ? TRIP_TABS : STATUS_TABS).map((tab) => {
            const active = usesTripTabs ? tripType === tab : status === tab;
            const label = !tab
              ? "All Rides"
              : usesTripTabs
                ? TRIP_TYPE_LABELS[tab as MobilityTripType]
                : `${BOOKING_STATUS_LABELS[tab as MobilityBookingStatus]} Rides`;
            return (
              <button
                key={tab || "all"}
                type="button"
                onClick={() =>
                  usesTripTabs ? setTripType(tab as MobilityTripType | "") : setStatus(tab as MobilityBookingStatus | "")
                }
                className={cn(
                  "flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-orange-600 text-white" : "bg-red-100/70 text-gray-600 hover:bg-red-100"
                )}
              >
                {!tab && <Car className="h-4 w-4" />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-3 p-4 md:flex-col md:items-stretch">
          <div className="relative w-full max-w-sm md:max-w-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by booking ID, rider, or plate..."
              className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <div className="flex gap-2 md:grid md:grid-cols-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter by
                  {(usesTripTabs ? status : tripType) && <span className="h-2 w-2 rounded-full bg-orange-500" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2">
                <p className="px-2 pb-1 pt-1 text-xs font-medium uppercase text-gray-400">
                  {usesTripTabs ? "Status" : "Trip type"}
                </p>
                {(usesTripTabs ? STATUS_TABS : TRIP_TABS).map((option) => {
                  const active = usesTripTabs ? status === option : tripType === option;
                  return (
                    <button
                      key={option || "all"}
                      type="button"
                      onClick={() =>
                        usesTripTabs
                          ? setStatus(option as MobilityBookingStatus | "")
                          : setTripType(option as MobilityTripType | "")
                      }
                      className={cn(
                        "block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50",
                        active && "font-medium text-orange-600"
                      )}
                    >
                      {!option
                        ? "All"
                        : usesTripTabs
                          ? BOOKING_STATUS_LABELS[option as MobilityBookingStatus]
                          : TRIP_TYPE_LABELS[option as MobilityTripType]}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              className="gap-2"
              disabled={isDownloading || bookings.length === 0}
              onClick={() =>
                downloadPdf(tableRef.current, {
                  filename: `${heading.title.toLowerCase().replace(/\s+/g, "-")}-bookings.pdf`,
                  orientation: "landscape",
                  margin: 0.3,
                })
              }
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "Preparing…" : "Download PDF"}
            </Button>
            <Button onClick={viewAll} disabled={!hasFilters} className="bg-[#1d4f7c] hover:bg-[#163d61]">
              View all
            </Button>
          </div>
        </div>

        <div ref={tableRef} className={cn(isFetching && !isLoading && "opacity-70 transition-opacity")}>
          <BookingsTable
            bookings={bookings}
            isLoading={isLoading}
            emptyMessage={hasFilters ? "No bookings match these filters." : "No bookings yet."}
            onAssignDriver={setAssignTarget}
            onCancel={setCancelTarget}
            onAddNote={setNoteTarget}
          />
        </div>

        {(data?.total ?? 0) > PAGE_SIZE && (
          <MobilityPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="rounded-none border-x-0 border-b-0"
          />
        )}
      </div>

      <AddBookingDialog open={addBookingOpen} onOpenChange={setAddBookingOpen} defaultCategory={category} />
      <VehicleFormDialog open={addVehicleOpen} onOpenChange={setAddVehicleOpen} defaultCategory={category} />
      <AssignDriverDialog booking={assignTarget} onOpenChange={(open) => !open && setAssignTarget(null)} />
      <BookingNoteDialog booking={cancelTarget} mode="cancel" onOpenChange={(open) => !open && setCancelTarget(null)} />
      <BookingNoteDialog booking={noteTarget} mode="note" onOpenChange={(open) => !open && setNoteTarget(null)} />
    </div>
  );
}
