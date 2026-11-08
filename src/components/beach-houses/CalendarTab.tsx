"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BeachHouseBookingsApi } from "@/services/api/beach-house-bookings-api";
import { BeachHousesApi } from "@/services/api/beach-houses-api";
import { STAY_OPTION_LABELS, type CalendarDay } from "@/types/beach-house-types";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { formatDay, guestsSummary, stayDates, toIsoDay } from "./booking-utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export function CalendarTab() {
  const today = toIsoDay(new Date());
  const { data: listings, isLoading: loadingListings } = BeachHousesApi.useListings({ page: 1, limit: 100 });
  const [listingId, setListingId] = useState("");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [focusDay, setFocusDay] = useState<string | null>(null);

  // Pick the first accommodation once the list loads
  useEffect(() => {
    if (!listingId && listings?.items.length) setListingId(listings.items[0].id);
  }, [listings, listingId]);

  const month = monthKey(cursor);
  const { data: calendar, isLoading, isFetching } = BeachHouseBookingsApi.useCalendar(listingId || undefined, month);
  const setAvailability = BeachHouseBookingsApi.useSetAvailability();

  useEffect(() => {
    setSelected([]);
    setFocusDay(null);
  }, [listingId, month]);

  const byDate = useMemo(() => new Map((calendar?.days ?? []).map((d) => [d.date.slice(0, 10), d])), [calendar]);

  // Monday-first grid with leading blanks
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7;
    return [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => toIsoDay(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))),
    ];
  }, [cursor]);

  const toggle = (day: string) => {
    setFocusDay(day);
    if (day < today) return;
    setSelected((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const apply = (is_blocked: boolean) =>
    setAvailability.mutate(
      { listingId, dates: [...selected].sort(), is_blocked },
      {
        onSuccess: () => {
          toast.success(`${selected.length} day${selected.length === 1 ? "" : "s"} ${is_blocked ? "blocked" : "opened"}`);
          setSelected([]);
        },
      }
    );

  const shift = (n: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));
  const isCurrentMonth = month <= monthKey(new Date());

  if (!loadingListings && !listings?.items.length) {
    return <p className="py-16 text-center text-gray-500">Add an accommodation to manage its availability.</p>;
  }

  return (
    <div className="grid grid-cols-[1fr_340px] gap-6 xl:grid-cols-1">
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Select value={listingId} onValueChange={setListingId}>
            <SelectTrigger className="w-72 md:w-full">
              <SelectValue placeholder="Choose accommodation" />
            </SelectTrigger>
            <SelectContent>
              {(listings?.items ?? []).map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.apartment_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shift(-1)} disabled={isCurrentMonth} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="w-36 text-center font-semibold text-gray-900">
              {cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </span>
            <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className={cn("relative", isFetching && !isLoading && "opacity-70")}>
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-gray-500">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1.5">
            {cells.map((day, i) =>
              day ? (
                <DayCell
                  key={day}
                  day={day}
                  info={byDate.get(day)}
                  past={day < today}
                  isToday={day === today}
                  selected={selected.includes(day)}
                  focused={focusDay === day}
                  onClick={() => toggle(day)}
                />
              ) : (
                <div key={`blank-${i}`} />
              )
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <Legend className="border-emerald-200 bg-emerald-50" label="Open" />
          <Legend className="border-amber-200 bg-amber-50" label="Partly booked" />
          <Legend className="border-blue-200 bg-blue-50" label="Fully booked" />
          <Legend className="border-gray-300 bg-gray-200" label="Blocked" />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
          <span className="mr-auto text-sm text-gray-600">
            {selected.length ? `${selected.length} day${selected.length === 1 ? "" : "s"} selected` : "Click future days to select them"}
          </span>
          {selected.length > 0 && (
            <Button variant="ghost" onClick={() => setSelected([])} disabled={setAvailability.isPending}>
              Clear
            </Button>
          )}
          <Button variant="outline" onClick={() => apply(false)} disabled={!selected.length || setAvailability.isPending} className="gap-1.5">
            <Unlock className="h-4 w-4" /> Open
          </Button>
          <Button onClick={() => apply(true)} disabled={!selected.length || setAvailability.isPending} className="gap-1.5 bg-gray-900 text-white hover:bg-gray-800">
            {setAvailability.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Block
          </Button>
        </div>
      </div>

      <DayPanel listingId={listingId} day={focusDay} />
    </div>
  );
}

function DayCell({
  day,
  info,
  past,
  isToday,
  selected,
  focused,
  onClick,
}: {
  day: string;
  info?: CalendarDay;
  past: boolean;
  isToday: boolean;
  selected: boolean;
  focused: boolean;
  onClick: () => void;
}) {
  const full = info && !info.is_blocked && !info.day_access_available && !info.overnight_available;
  const partial = info && !info.is_blocked && !full && info.bookings > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-20 flex-col items-start justify-between rounded-lg border p-2 text-left transition md:h-14 md:p-1",
        info?.is_blocked
          ? "border-gray-300 bg-gray-200 text-gray-500"
          : full
            ? "border-blue-200 bg-blue-50"
            : partial
              ? "border-amber-200 bg-amber-50"
              : "border-emerald-200 bg-emerald-50/60",
        past && "opacity-50",
        focused && "ring-2 ring-gray-400",
        selected && "ring-2 ring-orange-500"
      )}
    >
      <span className={cn("text-sm font-semibold", isToday ? "rounded-full bg-orange-600 px-1.5 text-white" : "text-gray-900")}>{Number(day.slice(8))}</span>
      <span className="text-[11px] leading-tight text-gray-600 md:hidden">
        {info?.is_blocked ? (
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3" /> Blocked
          </span>
        ) : info?.bookings ? (
          `${info.bookings} booking${info.bookings === 1 ? "" : "s"}`
        ) : (
          ""
        )}
      </span>
    </button>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-3 w-3 rounded border", className)} /> {label}
    </span>
  );
}

function DayPanel({ listingId, day }: { listingId: string; day: string | null }) {
  const { data, isLoading } = BeachHouseBookingsApi.useListingDay(listingId || undefined, day ?? undefined);

  return (
    <div className="h-fit rounded-xl border border-gray-200 bg-white p-5">
      {!day ? (
        <p className="py-10 text-center text-sm text-gray-500">Select a day to see its bookings.</p>
      ) : isLoading || !data ? (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900">{formatDay(day, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h3>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {data.is_blocked ? (
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-gray-700">Blocked</span>
              ) : (
                <>
                  <Availability on={data.day_access_available} label="Day access" />
                  <Availability on={data.overnight_available} label="Overnight" />
                </>
              )}
            </div>
          </div>
          {data.bookings.length === 0 ? (
            <p className="text-sm text-gray-500">No bookings on this day.</p>
          ) : (
            <ul className="space-y-2">
              {data.bookings.map((b) => (
                <li key={b.id}>
                  <Link href={`/beach-houses/bookings/${b.id}`} className="block rounded-lg border border-gray-200 p-3 hover:border-orange-300 hover:bg-orange-50/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-orange-700">{b.reservation_id}</span>
                      <BookingStatusBadge status={b.status} />
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-900">{b.guest?.name ?? "—"}</p>
                    <p className="text-xs text-gray-500">
                      {b.package_title || STAY_OPTION_LABELS[b.package_type]} · {stayDates(b)} · {guestsSummary(b.guests)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Availability({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5", on ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700")}>
      {label}: {on ? "available" : "booked"}
    </span>
  );
}
