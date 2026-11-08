"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, addWeeks, eachDayOfInterval, format, isBefore, isSameDay, isToday, startOfDay, startOfWeek } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BeachHousesApi } from "@/services/api/beach-houses-api";
import { STAY_OPTION_LABELS, type DayViewItem, type StayOption } from "@/types/beach-house-types";
import { BeachHouseDayCard } from "./BeachHouseDayCard";
import { ListingDayDialog } from "./ListingDayDialog";

const ALL = "all";
/** Bookings come in all day, so the list refreshes itself */
const LIVE_REFRESH_MS = 30_000;

/** Beach Houses "Edit by day": each listing's availability and bookings for the chosen day */
export default function BeachHousesDayView() {
  const [day, setDay] = useState(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [packageType, setPackageType] = useState<string>(ALL);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<DayViewItem | null>(null);
  const setAvailability = BeachHousesApi.useSetAvailability();

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const date = format(day, "yyyy-MM-dd");
  const { data, isLoading, isFetching, isError, refetch } = BeachHousesApi.useDayView(
    { date, package_type: packageType === ALL ? undefined : (packageType as StayOption), search: search || undefined },
    { refetchInterval: LIVE_REFRESH_MS }
  );
  const items = data?.items ?? [];
  const canToggle = !isBefore(startOfDay(day), startOfDay(new Date()));

  const week = useMemo(() => {
    const start = startOfWeek(day, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [day]);

  const toggle = (item: DayViewItem, available: boolean) =>
    setAvailability.mutate(
      { listingId: item.id, dates: [date], is_blocked: !available },
      { onSuccess: () => toast.success(available ? `${item.name} is open on ${format(day, "d MMM")}` : `${item.name} is blocked on ${format(day, "d MMM")}`) }
    );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-gray-800 md:text-xl">Beach Houses</h1>

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
        <Select value={packageType} onValueChange={setPackageType}>
          <SelectTrigger className="h-10 w-[180px] shrink-0 rounded-lg md:w-[165px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Beach Houses</SelectItem>
            {Object.entries(STAY_OPTION_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search here..."
            className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Edit by day</h2>
          <p className="text-xs text-gray-500">
            {format(day, "EEE, d MMMM")} · {data?.total_units ?? 0} {data?.total_units === 1 ? "unit" : "units"} total
          </p>
        </div>
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
          Couldn&apos;t load your beach houses.{" "}
          <button type="button" onClick={() => refetch()} className="font-medium text-orange-600 hover:underline">
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-500">
          {search || packageType !== ALL ? "No beach houses match your filters." : "No published beach houses yet. Add them from the business admin."}
        </div>
      ) : (
        <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-1", isFetching && !isLoading && "opacity-80")}>
          {items.map((item) => (
            <BeachHouseDayCard
              key={item.id}
              item={item}
              canToggle={canToggle}
              isToggling={setAvailability.isPending && setAvailability.variables?.listingId === item.id}
              onToggle={(available) => toggle(item, available)}
              onView={() => setViewing(item)}
            />
          ))}
        </div>
      )}

      <ListingDayDialog
        item={viewing && (items.find((i) => i.id === viewing.id) ?? viewing)}
        date={date}
        canToggle={canToggle}
        onOpenChange={(open) => !open && setViewing(null)}
      />
    </div>
  );
}
