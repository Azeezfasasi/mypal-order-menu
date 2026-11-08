"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BeachHouseBookingsApi } from "@/services/api/beach-house-bookings-api";
import { BeachHousesApi } from "@/services/api/beach-houses-api";
import type { ScheduledExperience } from "@/types/beach-house-types";
import { formatNaira, priceUnitLabel } from "./beach-house-utils";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { formatDay, toIsoDay } from "./booking-utils";

const ALL = "all";

export function ExperienceScheduleTab() {
  const [from, setFrom] = useState(() => toIsoDay(new Date()));
  const [to, setTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return toIsoDay(d);
  });
  const [experienceId, setExperienceId] = useState(ALL);

  const { data: experiences } = BeachHousesApi.useExperiences({ page: 1, limit: 100 });
  const { data, isLoading, isFetching, isError, refetch } = BeachHouseBookingsApi.useExperienceSchedule({
    from,
    to,
    experience_id: experienceId === ALL ? undefined : experienceId,
  });

  const groups = useMemo(() => {
    const map = new Map<string, ScheduledExperience[]>();
    for (const item of data ?? []) {
      const key = item.date.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
        From
        <Input type="date" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} className="w-40" />
        to
        <Input type="date" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} className="w-40" />
        <Select value={experienceId} onValueChange={setExperienceId}>
          <SelectTrigger className="w-64 md:w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All experiences</SelectItem>
            {(experiences?.items ?? []).map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={cn("space-y-4", isFetching && !isLoading && "opacity-70")}>
        {isLoading ? (
          <div className="flex justify-center py-16 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : isError ? (
          <p className="py-16 text-center text-gray-500">
            Couldn&apos;t load the schedule.{" "}
            <button type="button" onClick={() => refetch()} className="font-medium text-orange-600 hover:underline">
              Try again
            </button>
          </p>
        ) : groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
            <CalendarClock className="mx-auto mb-2 h-6 w-6 text-gray-300" />
            No experiences booked in this period.
          </div>
        ) : (
          groups.map(([day, items]) => (
            <section key={day} className="rounded-xl border border-gray-200 bg-white">
              <h3 className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-900">
                {formatDay(day, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </h3>
              <ul className="divide-y divide-gray-100">
                {items.map((item, i) => (
                  <li key={`${item.booking.id}-${item.experience.id}-${i}`}>
                    <Link href={`/beach-houses/bookings/${item.booking.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-gray-50 md:flex-col md:items-start">
                      <div>
                        <p className="flex flex-wrap items-center gap-2 font-medium text-gray-900">
                          {item.experience.name}
                          {item.date_is_flexible && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700" title="The guest didn't pick a day, so the check-in date is used">
                              Flexible date
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} × {priceUnitLabel(item.price_unit)} · {item.booking.guest?.name ?? "Guest"} · {item.booking.listing?.name ?? ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-orange-700">{item.booking.reservation_id}</span>
                        <BookingStatusBadge status={item.booking.status} />
                        <span className="w-24 text-right font-semibold text-gray-900">{formatNaira(item.total)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
