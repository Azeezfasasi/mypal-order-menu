"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  startOfWeek,
} from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MobilityApi } from "@/services/api/mobility-api";
import type { MobilityVehicle } from "@/types/mobility-types";
import { AddBookingDialog } from "./AddBookingDialog";
import { EditAvailabilityDialog } from "./EditAvailabilityDialog";
import { MobilityPagination } from "./MobilityPagination";
import { VehicleCard } from "./VehicleCard";
import { VehicleDetailsDialog } from "./VehicleDetailsDialog";
import { VehicleFormDialog } from "./VehicleFormDialog";
import { bookedUnits } from "./mobility-utils";
import { useMobilityCategory } from "./use-mobility-category";

const PAGE_SIZE = 20;
const ALL_SERVICES = "all";
/** The fleet changes as bookings come in, so the list refreshes itself */
const LIVE_REFRESH_MS = 30_000;

/** Fleet cards for the business's mobility category, with availability for the chosen day */
export default function MobilityFleetPage() {
  const category = useMobilityCategory();
  const [day, setDay] = useState(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [service, setService] = useState(ALL_SERVICES);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<MobilityVehicle | null>(null);
  const [editingAvailability, setEditingAvailability] = useState<MobilityVehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState<{ open: boolean; vehicle?: MobilityVehicle }>({ open: false });
  const [addBookingOpen, setAddBookingOpen] = useState(false);
  const updateAvailability = MobilityApi.useUpdateAvailability();

  const { data, isLoading, isFetching } = MobilityApi.useInventory(
    {
      category,
      period: isToday(day) ? "today" : format(day, "yyyy-MM-dd"),
      page,
      limit: PAGE_SIZE,
    },
    { refetchInterval: LIVE_REFRESH_MS }
  );
  const { data: stats } = MobilityApi.useStats(category);

  useEffect(() => {
    setPage(1);
  }, [category, day]);

  const week = useMemo(() => {
    const start = startOfWeek(day, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [day]);

  const services = useMemo(
    () => [...new Set((data?.vehicles ?? []).map((v) => v.vehicle_class).filter(Boolean))].sort(),
    [data]
  );

  // The inventory endpoint has no search or class filter, so both apply to the loaded page
  const vehicles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.vehicles ?? []).filter(
      (v) =>
        (service === ALL_SERVICES || v.vehicle_class === service) &&
        (!q || [v.make, v.model, v.vehicle_class, v.plate_number].some((field) => field.toLowerCase().includes(q)))
    );
  }, [data, search, service]);

  const mostBookedId = useMemo(() => {
    const top = [...(data?.vehicles ?? [])].sort((a, b) => bookedUnits(b) - bookedUnits(a))[0];
    return top && bookedUnits(top) > 0 ? top.id : undefined;
  }, [data]);

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 md:flex-col md:items-stretch">
        <h1 className="text-2xl font-semibold text-gray-800 md:text-xl">Mobility Management</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setVehicleForm({ open: true })} className="gap-2 md:flex-1">
            <PlusCircle className="h-4 w-4" /> Add Vehicle
          </Button>
          <Button onClick={() => setAddBookingOpen(true)} className="gap-2 bg-orange-600 hover:bg-orange-700 md:flex-1">
            <PlusCircle className="h-4 w-4" /> New Booking
          </Button>
        </div>
      </div>

      {/* Week strip */}
      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => setDay((d) => addWeeks(d, -1))}
            className="rounded p-1 text-gray-800 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="flex items-center gap-1 text-lg font-semibold text-gray-900">
                {format(day, "MMMM yyyy")}
                <ChevronDown className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={day}
                defaultMonth={day}
                onSelect={(next) => {
                  if (next) setDay(next);
                  setCalendarOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => setDay((d) => addWeeks(d, 1))}
            className="rounded p-1 text-gray-800 hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-7 text-center">
          {week.map((date) => {
            const selected = isSameDay(date, day);
            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => setDay(date)}
                aria-pressed={selected}
                className="flex flex-col items-center gap-2"
              >
                <span className={cn("text-xs uppercase text-gray-500", selected && "font-bold text-gray-900")}>
                  {format(date, "EEE")}
                </span>
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-base text-gray-900",
                    selected ? "bg-orange-600 font-bold text-white" : "hover:bg-gray-100",
                    !selected && isToday(date) && "font-bold text-orange-600"
                  )}
                >
                  {format(date, "d")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={service} onValueChange={setService}>
          <SelectTrigger className="h-10 w-[160px] shrink-0 rounded-lg md:w-[120px]">
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SERVICES}>All Services</SelectItem>
            {services.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold text-gray-900">{stats?.total_rides ?? 0}</span>
          <span className="text-xs text-gray-500">Total Bookings</span>
        </p>
        <span className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold uppercase text-orange-600">
          {isFetching && !isLoading && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />}
          Live update
        </span>
      </div>

      {/* Fleet */}
      {isLoading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-500">
          {search || service !== ALL_SERVICES ? "No vehicles match your filters." : "No vehicles in your fleet yet."}
          {!search && service === ALL_SERVICES && (
            <button
              type="button"
              onClick={() => setVehicleForm({ open: true })}
              className="ml-1 font-medium text-orange-600 hover:underline"
            >
              Add a vehicle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isMostBooked={vehicle.id === mostBookedId}
              isToggling={updateAvailability.isPending && updateAvailability.variables?.id === vehicle.id}
              onToggleActive={(is_active) => updateAvailability.mutate({ id: vehicle.id, payload: { is_active } })}
              onView={() => setViewing(vehicle)}
              onEditAvailability={() => setEditingAvailability(vehicle)}
              onEditDetails={() => setVehicleForm({ open: true, vehicle })}
            />
          ))}
        </div>
      )}

      {(data?.total ?? 0) > PAGE_SIZE && (
        <MobilityPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <VehicleDetailsDialog
        vehicle={viewing && (data?.vehicles.find((v) => v.id === viewing.id) ?? viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        onEditAvailability={(vehicle) => {
          setViewing(null);
          setEditingAvailability(vehicle);
        }}
        onEditDetails={(vehicle) => {
          setViewing(null);
          setVehicleForm({ open: true, vehicle });
        }}
      />
      <EditAvailabilityDialog
        vehicle={editingAvailability}
        onOpenChange={(open) => !open && setEditingAvailability(null)}
      />
      <VehicleFormDialog
        open={vehicleForm.open}
        vehicle={vehicleForm.vehicle}
        defaultCategory={category}
        onOpenChange={(open) => setVehicleForm((prev) => ({ ...prev, open }))}
      />
      <AddBookingDialog open={addBookingOpen} onOpenChange={setAddBookingOpen} defaultCategory={category} />
    </div>
  );
}

