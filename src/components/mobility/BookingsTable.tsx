"use client";

import { useRouter } from "next/navigation";
import { Car, Loader2 } from "lucide-react";
import type { MobilityBooking } from "@/types/mobility-types";
import { BookingActionsMenu } from "./BookingActionsMenu";
import { BookingStatusBadge, TripTypeBadge } from "./MobilityBadges";
import { bookingDate, bookingTime, formatDate, formatNaira, initials, vehicleName } from "./mobility-utils";

interface BookingsTableProps {
  bookings: MobilityBooking[];
  isLoading: boolean;
  emptyMessage: string;
  onAssignDriver: (booking: MobilityBooking) => void;
  onCancel: (booking: MobilityBooking) => void;
  onAddNote: (booking: MobilityBooking) => void;
}

const HEADERS = [
  "Vehicle",
  "Booking ID",
  "Rider",
  "Trip Type",
  "Pickup",
  "Destination",
  "Chauffeur",
  "Amount",
  "Date",
  "Time",
  "Status",
  "",
];

export function BookingsTable({
  bookings,
  isLoading,
  emptyMessage,
  onAssignDriver,
  onCancel,
  onAddNote,
}: BookingsTableProps) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1150px] text-left text-sm">
        <thead className="bg-gray-50 text-xs font-medium text-gray-600">
          <tr>
            {HEADERS.map((header, i) => (
              <th key={header || i} className="whitespace-nowrap px-3 py-3 first:pl-5">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td colSpan={HEADERS.length} className="py-16 text-center text-gray-400">
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              </td>
            </tr>
          ) : bookings.length === 0 ? (
            <tr>
              <td colSpan={HEADERS.length} className="py-16 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            bookings.map((booking) => {
              const image = booking.vehicle?.gallery_images[0];
              return (
                <tr
                  key={booking.id}
                  onClick={() => router.push(`/mobility/bookings/${booking.id}`)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="px-3 py-3 pl-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 text-gray-400">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Car className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{vehicleName(booking.vehicle)}</p>
                        <p className="text-xs text-gray-500">
                          {[booking.vehicle?.plate_number, booking.vehicle?.seat_count && `${booking.vehicle.seat_count} Seater`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-blue-700">{booking.reference}</td>
                  <td className="px-3 py-3">
                    <p className="whitespace-nowrap font-semibold text-gray-900">{booking.rider_name}</p>
                    {booking.rider_phone && <p className="whitespace-nowrap text-xs text-gray-500">{booking.rider_phone}</p>}
                  </td>
                  <td className="px-3 py-3">
                    <TripTypeBadge tripType={booking.trip_type} />
                  </td>
                  <td className="max-w-[160px] px-3 py-3">
                    <p className="truncate text-gray-800">{booking.pickup_location?.address ?? "—"}</p>
                    {booking.pickup_location?.city && <p className="text-xs text-gray-500">{booking.pickup_location.city}</p>}
                  </td>
                  <td className="max-w-[160px] px-3 py-3">
                    <p className="truncate text-gray-800">{booking.dropoff_location?.address ?? "—"}</p>
                    {booking.dropoff_location?.city && <p className="text-xs text-gray-500">{booking.dropoff_location.city}</p>}
                  </td>
                  <td className="px-3 py-3">
                    {booking.driver ? (
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600">
                          {initials(booking.driver.full_name)}
                        </span>
                        <span className="whitespace-nowrap text-gray-800">{booking.driver.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-orange-600">{formatNaira(booking.amount)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-800">{formatDate(bookingDate(booking), "MMM d")}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-800">{bookingTime(booking)}</td>
                  <td className="px-3 py-3">
                    <BookingStatusBadge status={booking.status} />
                  </td>
                  <td className="px-3 py-3 pr-5" onClick={(e) => e.stopPropagation()}>
                    <BookingActionsMenu
                      booking={booking}
                      onAssignDriver={onAssignDriver}
                      onCancel={onCancel}
                      onAddNote={onAddNote}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
