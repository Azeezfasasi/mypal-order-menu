"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, addWeeks, eachDayOfInterval, format, isBefore, isSameDay, isToday, startOfDay, startOfWeek } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, PlusCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BoatCruisesApi } from "@/services/api/boat-cruises-api";
import type { BoatDayItem, VesselClass } from "@/types/boat-cruise-types";
import { BoatDayCard } from "./BoatDayCard";
import { BoatDayDialog } from "./BoatDayDialog";
import { BoatManualBookingDialog } from "./BoatManualBookingDialog";

const ALL = "all";

/** Boat & Yacht Cruises dashboard (business mobile design): the fleet for the chosen day */
export default function BoatDayView() {
  const [day, setDay] = useState(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [vesselClass, setVesselClass] = useState<string>(ALL);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<BoatDayItem | null>(null);
  const [creating, setCreating] = useState(false);
  const setActive = BoatCruisesApi.useSetBoatActive();
  const setDayAvailability = BoatCruisesApi.useSetDayAvailability();

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const date = format(day, "yyyy-MM-dd");
  const { data, isLoading, isFetching, isError, refetch } = BoatCruisesApi.useDayView({
    date,
    vessel_class: vesselClass === ALL ? undefined : (vesselClass as VesselClass),
    search: search || undefined,
  });
  const items = data?.items ?? [];
  const canBlock = !isBefore(startOfDay(day), startOfDay(new Date()));

  const week = useMemo(() => {
    const start = startOfWeek(day, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [day]);

  const toggleActive = (item: BoatDayItem, is_active: boolean) =>
    setActive.mutate({ id: item.id, is_active }, { onSuccess: () => toast.success(is_active ? `${item.name} is taking bookings` : `${item.name} is paused`) });

  const toggleDay = (item: BoatDayItem) => {
    const blocking = item.available_on_date;
    setDayAvailability.mutate(
      { id: item.id, dates: [date], is_blocked: blocking },
      { onSuccess: () => toast.success(`${item.name} ${blocking ? "blocked" : "opened"} on ${format(day, "d MMM")}`) }
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 md:flex-col md:items-stretch">
        <h1 className="text-2xl font-semibold text-gray-800 md:text-xl">Boat &amp; Yacht Cruises</h1>
        <Button onClick={() => setCreating(true)} className="gap-2 bg-orange-600 hover:bg-orange-700">
          <PlusCircle className="h-4 w-4" /> New Booking
        </Button>
      </div>

      {/* Week strip */}
      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <button type="button" aria-label="Previous week" onClick={() => setDay((d) => addWeeks(d, -1))} className="rounded p-1 text-gray-800 hover:bg-gray-100">
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
          <button type="button" aria-label="Next week" onClick={() => setDay((d) => addWeeks(d, 1))} className="rounded p-1 text-gray-800 hover:bg-gray-100">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-7 text-center">
          {week.map((d) => {
            const selected = isSameDay(d, day);
            return (
              <button key={d.toISOString()} type="button" onClick={() => setDay(d)} aria-pressed={selected} className="flex flex-col items-center gap-2">
                <span className={cn("text-xs uppercase text-gray-500", selected && "font-bold text-gray-900")}>{format(d, "EEE")}</span>
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-base text-gray-900",
                    selected ? "bg-orange-600 font-bold text-white" : "hover:bg-gray-100",
                    !selected && isToday(d) && "font-bold text-orange-600"
                  )}
                >
                  {format(d, "d")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={vesselClass} onValueChange={setVesselClass}>
          <SelectTrigger className="h-10 w-[160px] shrink-0 rounded-lg md:w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Cruises</SelectItem>
            <SelectItem value="YACHT">Yachts</SelectItem>
            <SelectItem value="BOAT">Boats</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search boats and yachts..."
            className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold text-gray-900">{data?.total_bookings ?? 0}</span>
          <span className="text-xs text-gray-500">Bookings on {format(day, "EEE, d MMM")}</span>
        </p>
        <span className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold uppercase text-orange-600">
          {isFetching && !isLoading && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />}
          Live update
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-500">
          Couldn&apos;t load your boats.{" "}
          <button type="button" onClick={() => refetch()} className="font-medium text-orange-600 hover:underline">
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-500">
          {search || vesselClass !== ALL ? "No boats match your filters." : "No published boats yet. Add them from the business admin."}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          {items.map((item) => (
            <BoatDayCard
              key={item.id}
              item={item}
              canBlock={canBlock}
              isToggling={(setActive.isPending && setActive.variables?.id === item.id) || (setDayAvailability.isPending && setDayAvailability.variables?.id === item.id)}
              onToggleActive={(active) => toggleActive(item, active)}
              onToggleDay={() => toggleDay(item)}
              onView={() => setViewing(item)}
            />
          ))}
        </div>
      )}

      <BoatDayDialog
        item={viewing && (items.find((i) => i.id === viewing.id) ?? viewing)}
        date={date}
        canBlock={canBlock}
        onOpenChange={(open) => !open && setViewing(null)}
      />
      <BoatManualBookingDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
