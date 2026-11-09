"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BoatCruisesApi } from "@/services/api/boat-cruises-api";
import {
  BOAT_BOOKING_SOURCE_LABELS,
  BOAT_BOOKING_STATUS_LABELS,
  type BoatBookingSource,
  type BoatBookingsParams,
  type BoatBookingStatus,
} from "@/types/boat-cruise-types";
import { useBoatNav } from "./boat-nav";
import { BoatBookingStatusBadge } from "./BoatBookingStatusBadge";
import { BoatsPagination } from "./BoatsPagination";
import { formatDay, formatDuration, formatNaira, formatTime } from "./boat-utils";

const PAGE_SIZE = 10;
const ALL = "all";
const STATUSES: BoatBookingStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"];
const SOURCES: BoatBookingSource[] = ["MOBILE", "WALK_IN", "PHONE_CALL", "WEBSITE", "OTA"];

export function BoatBookingsList() {
  const nav = useBoatNav();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [source, setSource] = useState<string>(ALL);
  const [boatId, setBoatId] = useState<string>(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<NonNullable<BoatBookingsParams["sort"]>>("start_desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: boats } = BoatCruisesApi.useBoats({ page: 1, limit: 100 });
  const { data, isLoading, isFetching, isError, refetch } = BoatCruisesApi.useBookings({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: status === ALL ? undefined : (status as BoatBookingStatus),
    source: source === ALL ? undefined : (source as BoatBookingSource),
    listing_id: boatId === ALL ? undefined : boatId,
    from: from || undefined,
    to: to || undefined,
    sort,
  });
  const bookings = data?.items ?? [];
  const pick = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-3 xl:grid-cols-3 md:grid-cols-1">
        <div className="relative col-span-2 xl:col-span-3 md:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Ticket ID or guest name" className="pl-9" />
        </div>
        <Select value={status} onValueChange={pick(setStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {BOAT_BOOKING_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={pick(setSource)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All sources</SelectItem>
            {SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {BOAT_BOOKING_SOURCE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={boatId} onValueChange={pick(setBoatId)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All boats</SelectItem>
            {(boats?.items ?? []).map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="start_desc">Cruise date: latest first</SelectItem>
            <SelectItem value="start_asc">Cruise date: soonest first</SelectItem>
            <SelectItem value="created_desc">Newest bookings</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
        Cruise date from
        <Input type="date" value={from} onChange={(e) => pick(setFrom)(e.target.value)} className="w-40" />
        to
        <Input type="date" value={to} min={from || undefined} onChange={(e) => pick(setTo)(e.target.value)} className="w-40" />
        {(from || to) && (
          <button type="button" onClick={() => { setFrom(""); setTo(""); setPage(1); }} className="text-orange-600 hover:underline">
            Clear dates
          </button>
        )}
      </div>

      <div className={cn("overflow-x-auto rounded-xl border border-gray-200 bg-white", isFetching && !isLoading && "opacity-70")}>
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-gray-50 text-xs font-medium text-gray-600">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Boat</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Guests</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-400">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-500">
                  Couldn&apos;t load bookings.{" "}
                  <button type="button" onClick={() => refetch()} className="font-medium text-orange-600 hover:underline">
                    Try again
                  </button>
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-500">
                  No bookings match these filters.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} onClick={() => nav.openBooking(b.id)} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-semibold text-orange-700">{b.reference}</p>
                    <p className="text-xs text-gray-400">{b.ota_name || (b.source ? BOAT_BOOKING_SOURCE_LABELS[b.source] : "")}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{b.reserver?.name ?? "—"}</p>
                    <p className="text-xs text-gray-500">{b.reserver?.phone || b.reserver?.email || ""}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    {b.boat?.name ?? "—"}
                    {b.boat?.boat_type && <span className="block text-xs text-gray-400">{b.boat.boat_type}</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDay(b.booking_date)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {formatTime(b.start_time)} – {formatTime(b.end_time)}
                    {b.duration_minutes ? <span className="block text-xs text-gray-400">{formatDuration(b.duration_minutes)}</span> : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{b.guests?.total ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">{formatNaira(b.total_amount)}</td>
                  <td className="px-4 py-3">
                    <BoatBookingStatusBadge status={b.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.meta.totalPages > 1 && <BoatsPagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />}
    </div>
  );
}
