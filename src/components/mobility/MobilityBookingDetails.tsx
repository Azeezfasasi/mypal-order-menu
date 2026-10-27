"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Car,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Repeat,
  Star,
  StickyNote,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobilityApi } from "@/services/api/mobility-api";
import {
  BOOKING_SOURCE_LABELS,
  VEHICLE_FEATURE_LABELS,
  type MobilityBooking,
  type MobilityLocation,
} from "@/types/mobility-types";
import { AssignDriverDialog } from "./AssignDriverDialog";
import { BookingNoteDialog } from "./BookingNoteDialog";
import { BookingStatusBadge, TripTypeBadge } from "./MobilityBadges";
import { canCancel, formatDate, formatNaira, initials, NEXT_STATUS, vehicleName } from "./mobility-utils";

const mapsUrl = (location: MobilityLocation) =>
  location.latitude && location.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;

const telHref = (phone: string) => `tel:${phone.replace(/\s+/g, "")}`;
const whatsappHref = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

export default function MobilityBookingDetails({ id }: { id: string }) {
  const { data: booking, isLoading, isError } = MobilityApi.useBooking(id);
  const update = MobilityApi.useUpdateBookingStatus();
  const [assignTarget, setAssignTarget] = useState<MobilityBooking | null>(null);
  const [noteTarget, setNoteTarget] = useState<MobilityBooking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MobilityBooking | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="py-24 text-center">
        <p className="text-gray-600">This booking couldn&apos;t be loaded.</p>
        <Link href="/mobility/bookings" className="mt-2 inline-block text-sm font-medium text-orange-600 hover:underline">
          Back to bookings
        </Link>
      </div>
    );
  }

  const next = NEXT_STATUS[booking.status];
  const isOpen = canCancel(booking.status);
  const vehicle = booking.vehicle;
  const isCharter = booking.trip_type === "CHARTER";
  const addOnsTotal = booking.add_ons.reduce((sum, addOn) => sum + (addOn.amount ?? 0), 0);

  return (
    <div className="space-y-6 pb-24">
      <Link href="/mobility/bookings" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to Bookings
      </Link>

      <div className="flex items-start justify-between gap-4 md:flex-col">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
            <TripTypeBadge tripType={booking.trip_type} />
          </div>
          <p className="mt-1 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{booking.reference}</span>
            {booking.created_at && <> · Booked on {formatDate(booking.created_at, "MMM d, yyyy • h:mm a")}</>}
            {booking.source && (
              <> via {booking.source === "OTA" && booking.ota_name ? booking.ota_name : BOOKING_SOURCE_LABELS[booking.source] ?? booking.source}</>
            )}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} className="px-3 py-1 text-sm" />
      </div>

      <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6 lg:grid-cols-1">
        <div className="space-y-6">
          {/* Vehicle */}
          <Card>
            <div className="flex gap-4 md:flex-col">
              <div className="flex h-32 w-48 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-300 md:w-full">
                {vehicle?.gallery_images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vehicle.gallery_images[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Car className="h-10 w-10" />
                )}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-gray-900">
                  {[vehicle?.vehicle_class, vehicleName(vehicle)].filter(Boolean).join(" · ")}
                </p>
                {vehicle?.plate_number && (
                  <p className="text-sm text-gray-600">
                    Plate Number: <span className="font-medium text-blue-700">{vehicle.plate_number}</span>
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {vehicle?.seat_count && <Chip>{vehicle.seat_count} Seater</Chip>}
                  {vehicle?.features.map((feature) => (
                    <Chip key={feature}>{VEHICLE_FEATURE_LABELS[feature] ?? feature}</Chip>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Rider */}
          <Card title="Rider Information">
            <div className="flex items-center gap-4">
              <Avatar name={booking.rider_name} />
              <div className="min-w-0 space-y-0.5 text-sm">
                <p className="font-semibold text-gray-900">{booking.rider_name}</p>
                {booking.rider_phone && (
                  <a href={telHref(booking.rider_phone)} className="flex items-center gap-1.5 text-gray-600 hover:text-orange-600">
                    <Phone className="h-3.5 w-3.5" /> {booking.rider_phone}
                  </a>
                )}
                {booking.rider_email && (
                  <a href={`mailto:${booking.rider_email}`} className="flex items-center gap-1.5 text-gray-600 hover:text-orange-600">
                    <Mail className="h-3.5 w-3.5" /> {booking.rider_email}
                  </a>
                )}
              </div>
            </div>
          </Card>

          {/* Chauffeur */}
          <Card
            title="Chauffeur Information"
            action={
              isOpen && (
                <button
                  type="button"
                  onClick={() => setAssignTarget(booking)}
                  className="text-sm font-medium text-red-600 underline hover:text-red-700"
                >
                  {booking.driver ? "Change" : "Assign"}
                </button>
              )
            }
          >
            {booking.driver ? (
              <>
                <div className="flex items-center gap-4">
                  <Avatar name={booking.driver.full_name} src={booking.driver.avatar_url} />
                  <div className="min-w-0 flex-1 space-y-0.5 text-sm">
                    <p className="font-semibold text-gray-900">{booking.driver.full_name}</p>
                    {booking.driver.rating !== undefined && (
                      <p className="flex items-center gap-1 text-gray-600">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {booking.driver.rating.toFixed(1)}
                        {booking.driver.total_trips !== undefined && (
                          <span className="text-gray-400">({booking.driver.total_trips} trips)</span>
                        )}
                      </p>
                    )}
                    {booking.driver.phone_number && <p className="text-gray-600">{booking.driver.phone_number}</p>}
                  </div>
                  <span className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Assigned</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {booking.driver.phone_number ? (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <a href={telHref(booking.driver.phone_number)}>
                          <Phone className="mr-1.5 h-4 w-4" /> Call
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={whatsappHref(booking.driver.phone_number)} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="mr-1.5 h-4 w-4" /> Message
                        </a>
                      </Button>
                    </>
                  ) : (
                    <div className="col-span-2" />
                  )}
                  {isOpen && (
                    <Button variant="outline" size="sm" onClick={() => setAssignTarget(booking)}>
                      <Repeat className="mr-1.5 h-4 w-4" /> Change
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <UserRound className="h-5 w-5" /> No chauffeur assigned yet.
              </div>
            )}
          </Card>

          {/* Price */}
          <Card title="Price Summary">
            <div className="space-y-2 text-sm">
              {booking.base_fare !== undefined && <Row label="Vehicle" value={formatNaira(booking.base_fare)} />}
              {booking.add_ons
                .filter((addOn) => addOn.amount)
                .map((addOn, i) => (
                  <Row
                    key={addOn.id ?? i}
                    label={`${addOn.name}${addOn.days && addOn.days > 1 ? ` (× ${addOn.days} days)` : ""}`}
                    value={formatNaira(addOn.amount ?? 0)}
                  />
                ))}
              {!!booking.discount && <Row label="Discount" value={`−${formatNaira(booking.discount)}`} />}
              {!!booking.vat && <Row label="VAT" value={formatNaira(booking.vat)} />}
              {booking.base_fare === undefined && addOnsTotal === 0 && !booking.vat && (
                <p className="text-gray-500">No breakdown for this booking.</p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-red-600">{formatNaira(booking.amount)}</span>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Trip */}
          <Card title={isCharter ? "Charter Details" : "Trip Details"}>
            <div className="space-y-4 text-sm">
              {booking.pickup_location && (
                <LocationRow label={isCharter ? "Pick-up Location" : "Pick-up"} location={booking.pickup_location} />
              )}
              {booking.dropoff_location && (
                <LocationRow label={isCharter ? "Delivery Location" : "Drop-off"} location={booking.dropoff_location} />
              )}
              {booking.return_location && <LocationRow label="Return" location={booking.return_location} />}

              <div className="grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-1">
                {isCharter ? (
                  <>
                    <Detail icon={CalendarDays} label="Start Date & Time">
                      {formatDate(booking.start_date, "EEE, d MMM yyyy")}
                      {booking.start_time && ` • ${booking.start_time}`}
                    </Detail>
                    <Detail icon={CalendarDays} label="End Date & Time">
                      {formatDate(booking.end_date, "EEE, d MMM yyyy")}
                      {booking.end_time && ` • ${booking.end_time}`}
                    </Detail>
                  </>
                ) : (
                  <>
                    <Detail icon={CalendarDays} label="Pick-up Date">
                      {formatDate(booking.pickup_date, "EEE, d MMM yyyy")}
                    </Detail>
                    <Detail icon={Clock} label={booking.return_time ? "Pick-up / Return" : "Pick-up Time"}>
                      {[booking.pickup_time, booking.return_time].filter(Boolean).join(" – ") || "—"}
                    </Detail>
                  </>
                )}
              </div>
              {booking.duration_label && (
                <Detail icon={Clock} label="Duration">
                  {booking.duration_label}
                </Detail>
              )}
            </div>
          </Card>

          {/* Add-ons */}
          <Card title="Add-ons">
            {booking.add_ons.length === 0 ? (
              <p className="text-sm text-gray-500">No add-ons on this booking.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {booking.add_ons.map((addOn, i) => (
                  <li key={addOn.id ?? i} className="flex items-center justify-between gap-3">
                    <span className="text-gray-800">{addOn.name}</span>
                    <span
                      className={
                        addOn.amount
                          ? "rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600"
                          : "rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                      }
                    >
                      {addOn.amount
                        ? `+ ${formatNaira(addOn.amount)}${addOn.days && addOn.days > 1 ? ` × ${addOn.days} days` : ""}`
                        : "Included"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {(booking.notes || booking.cancellation_reason) && (
            <Card title="Notes">
              {booking.cancellation_reason && (
                <p className="text-sm text-red-600">Cancelled: {booking.cancellation_reason}</p>
              )}
              {booking.notes && <p className="whitespace-pre-line text-sm text-gray-700">{booking.notes}</p>}
            </Card>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
        <Button
          variant="outline"
          className="h-11 border-red-400 text-red-600 hover:bg-red-50 hover:text-red-700"
          disabled={!isOpen}
          onClick={() => setCancelTarget(booking)}
        >
          Cancel Booking
        </Button>
        <Button variant="outline" className="h-11" onClick={() => setNoteTarget(booking)}>
          <StickyNote className="mr-2 h-4 w-4" /> Add Note
        </Button>
        <Button
          className="h-11 bg-red-600 hover:bg-red-700"
          disabled={!next || update.isPending}
          onClick={() => next && update.mutate({ id: booking.id, payload: { status: next.status } })}
        >
          {update.isPending ? "Updating…" : next?.label ?? (booking.status === "COMPLETED" ? "Completed" : "Cancelled")}
        </Button>
      </div>

      <AssignDriverDialog booking={assignTarget} onOpenChange={(open) => !open && setAssignTarget(null)} />
      <BookingNoteDialog booking={noteTarget} mode="note" onOpenChange={(open) => !open && setNoteTarget(null)} />
      <BookingNoteDialog booking={cancelTarget} mode="cancel" onOpenChange={(open) => !open && setCancelTarget(null)} />
    </div>
  );
}

function Card({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600">{children}</span>;
}

function Avatar({ name, src }: { name: string; src?: string }) {
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{children}</p>
      </div>
    </div>
  );
}

function LocationRow({ label, location }: { label: string; location: MobilityLocation }) {
  return (
    <div className="flex gap-3">
      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{location.address}</p>
        <a
          href={mapsUrl(location)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-blue-700 underline"
        >
          View on Map
        </a>
      </div>
    </div>
  );
}
