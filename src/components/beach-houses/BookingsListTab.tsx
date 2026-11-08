"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MobilityPagination as WalletPagination } from "@/components/mobility/MobilityPagination";
import { cn } from "@/lib/utils";
import { BeachHouseBookingsApi } from "@/services/api/beach-house-bookings-api";
import { BeachHousesApi } from "@/services/api/beach-houses-api";
import {
  BOOKING_SOURCE_LABELS,
  BOOKING_STATUS_LABELS,
  DEPOSIT_STATUS_LABELS,
  STAY_OPTION_LABELS,
  type BookingsParams,
  type BookingStatus,
  type StayOption,
} from "@/types/beach-house-types";
import { formatNaira } from "./beach-house-utils";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { DEPOSIT_STYLES, guestsSummary, stayDates } from "./booking-utils";

const PAGE_SIZE = 10;
const ALL = "all";
// Expired = unpaid, hidden by the API unless asked for
const STATUS_FILTERS: BookingStatus[] = ["Pending", "Confirmed", "CheckedIn", "Completed", "Cancelled", "NoShow"];

export function BookingsListTab() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [packageType, setPackageType] = useState<string>(ALL);
  const [listingId, setListingId] = useState<string>(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<NonNullable<BookingsParams["sort"]>>("check_in_desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: listings } = BeachHousesApi.useListings({ page: 1, limit: 100 });
  const { data, isLoading, isFetching, isError, refetch } = BeachHouseBookingsApi.useBookings({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: status === ALL ? undefined : (status as BookingStatus),
    package_type: packageType === ALL ? undefined : (packageType as StayOption),
    listing_id: listingId === ALL ? undefined : listingId,
    from: from || undefined,
    to: to || undefined,
    sort,
  });
  const bookings = data?.items ?? [];
  const reset = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-3 xl:grid-cols-3 md:grid-cols-1">
        <div className="relative col-span-2 xl:col-span-3 md:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Reservation ID, guest name or email" className="pl-9" />
        </div>
        <Select value={status} onValueChange={reset(setStatus)}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {BOOKING_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={packageType} onValueChange={reset(setPackageType)}>
          <SelectTrigger>
            <SelectValue placeholder="Stay type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All stay types</SelectItem>
            {Object.entries(STAY_OPTION_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={listingId} onValueChange={reset(setListingId)}>
          <SelectTrigger>
            <SelectValue placeholder="Accommodation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All accommodations</SelectItem>
            {(listings?.items ?? []).map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.apartment_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="check_in_desc">Check-in: latest first</SelectItem>
            <SelectItem value="check_in_asc">Check-in: soonest first</SelectItem>
            <SelectItem value="created_desc">Newest bookings</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
        Check-in from
        <Input type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} className="w-40" />
        to
        <Input type="date" value={to} min={from || undefined} onChange={(e) => reset(setTo)(e.target.value)} className="w-40" />
        {(from || to) && (
          <button type="button" onClick={() => { setFrom(""); setTo(""); setPage(1); }} className="text-orange-600 hover:underline">
            Clear dates
          </button>
        )}
      </div>

      <div className={cn("overflow-x-auto rounded-xl border border-gray-200 bg-white", isFetching && !isLoading && "opacity-70")}>
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-gray-50 text-xs font-medium text-gray-600">
            <tr>
              <th className="px-4 py-3">Reservation</th>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Accommodation</th>
              <th className="px-4 py-3">Stay</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Guests</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Deposit</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-gray-400">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-gray-500">
                  Couldn&apos;t load bookings.{" "}
                  <button type="button" onClick={() => refetch()} className="font-medium text-orange-600 hover:underline">
                    Try again
                  </button>
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-gray-500">
                  No bookings match these filters.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} onClick={() => router.push(`/beach-houses/bookings/${b.id}`)} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-semibold text-orange-700">{b.reservation_id}</p>
                    <p className="text-xs text-gray-400">{b.source ? BOOKING_SOURCE_LABELS[b.source] : ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{b.guest?.name ?? "—"}</p>
                    <p className="text-xs text-gray-500">{b.guest?.email || b.guest?.phone || ""}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    {b.listing?.name ?? "—"}
                    {b.listing?.area && <span className="block text-xs text-gray-400">{b.listing.area}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {b.package_title || STAY_OPTION_LABELS[b.package_type]}
                    {b.experiences_count ? (
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-orange-600">
                        <Sparkles className="h-3 w-3" /> {b.experiences_count} experience{b.experiences_count === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {stayDates(b)}
                    {b.package_type === "DAY_ACCESS" && b.start_time && (
                      <span className="block text-xs text-gray-400">
                        {b.start_time} – {b.end_time}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{guestsSummary(b.guests)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">{formatNaira(b.total)}</td>
                  <td className={cn("whitespace-nowrap px-4 py-3 text-xs font-medium", b.deposit_status ? DEPOSIT_STYLES[b.deposit_status] : "text-gray-400")}>
                    {b.deposit_status ? DEPOSIT_STATUS_LABELS[b.deposit_status] : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <BookingStatusBadge status={b.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.meta.totalPages > 1 && <WalletPagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />}
    </div>
  );
}
