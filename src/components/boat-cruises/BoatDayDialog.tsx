"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Ban, CalendarDays, CheckCircle2, Clock, Loader2, LogIn, Phone, Ship, Users, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { BoatCruisesApi } from "@/services/api/boat-cruises-api";
import { BOAT_BOOKING_SOURCE_LABELS, type BoatDayBooking, type BoatDayItem } from "@/types/boat-cruise-types";
import { useBoatNav } from "./boat-nav";
import { BoatBookingStatusBadge } from "./BoatBookingStatusBadge";
import { apiMessage, bookingActions, formatNaira, formatTime, parseDay } from "./boat-utils";

const DONE = {
  "check-in": "Guests checked in",
  complete: "Cruise completed",
  "no-show": "Marked as no-show",
} as const;

/** "View Details": a boat's bookings and free start times on the chosen day */
export function BoatDayDialog({ item, date, canBlock, onOpenChange }: { item: BoatDayItem | null; date: string; canBlock: boolean; onOpenChange: (open: boolean) => void }) {
  const { data, isLoading } = BoatCruisesApi.useListingDay(item?.id, item ? date : undefined);
  const setDay = BoatCruisesApi.useSetDayAvailability();
  const [cancelling, setCancelling] = useState<BoatDayBooking | null>(null);
  const [noShow, setNoShow] = useState<BoatDayBooking | null>(null);

  if (!item) return null;
  const blocked = data?.is_blocked ?? false;

  return (
    <>
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{item.name}</DialogTitle>
            <DialogDescription className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {format(parseDay(date), "EEEE, d MMMM yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="h-40 overflow-hidden rounded-xl bg-gray-100">
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Ship className="m-auto mt-14 h-8 w-8 text-gray-300" />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-1.5 text-gray-600">
              <Clock className="h-4 w-4" />
              {data?.operating_hours ? `Operates ${formatTime(data.operating_hours.start)} – ${formatTime(data.operating_hours.end)}` : "—"}
            </span>
            {canBlock && item.is_active && (
              <Button
                variant="outline"
                size="sm"
                disabled={setDay.isPending || isLoading}
                onClick={() =>
                  setDay.mutate(
                    { id: item.id, dates: [date], is_blocked: !blocked },
                    { onSuccess: () => toast.success(blocked ? "Day opened for bookings" : "Day blocked") }
                  )
                }
              >
                {setDay.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {blocked ? "Open this day" : "Block this day"}
              </Button>
            )}
          </div>

          {!item.is_active ? (
            <p className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">This boat is paused. Turn its switch on to take bookings.</p>
          ) : blocked ? (
            <p className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">Blocked for bookings on this day.</p>
          ) : data?.free_start_times?.length ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-900">Free start times</p>
              <div className="flex flex-wrap gap-1.5">
                {data.free_start_times.map((t) => (
                  <span key={t} className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {formatTime(t)}
                  </span>
                ))}
              </div>
            </div>
          ) : data ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Fully booked on this day.</p>
          ) : null}

          <div>
            <h4 className="mb-2 text-sm font-semibold text-gray-900">Bookings on this day</h4>
            {isLoading ? (
              <div className="flex justify-center py-8 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : !data?.bookings.length ? (
              <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">No bookings on this day.</p>
            ) : (
              <ul className="space-y-3">
                {data.bookings.map((b) => (
                  <BookingRow key={b.id} booking={b} date={date} onNoShow={() => setNoShow(b)} onCancel={() => setCancelling(b)} />
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <NoShowDialog booking={noShow} onOpenChange={(o) => !o && setNoShow(null)} />
      <CancelDialog booking={cancelling} onOpenChange={(o) => !o && setCancelling(null)} />
    </>
  );
}

function BookingRow({ booking: b, date, onNoShow, onCancel }: { booking: BoatDayBooking; date: string; onNoShow: () => void; onCancel: () => void }) {
  const nav = useBoatNav();
  const action = BoatCruisesApi.useBookingAction();
  const a = bookingActions({ status: b.status, booking_date: date, start_time: b.start_time, end_time: b.end_time });
  const run = (kind: keyof typeof DONE) =>
    action.mutate({ id: b.id, action: kind }, { onSuccess: () => toast.success(DONE[kind]), onError: (e) => toast.error(apiMessage(e)) });

  return (
    <li className="rounded-xl border border-gray-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={() => nav.openBooking(b.id)} className="min-w-0 text-left">
          <p className="font-medium text-gray-900 hover:underline">{b.reserver_name ?? "Guest"}</p>
          <p className="font-mono text-xs text-orange-700">{b.reference}</p>
        </button>
        <BoatBookingStatusBadge status={b.status} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> {formatTime(b.start_time)} – {formatTime(b.end_time)}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> {b.guests ?? "—"} guests
        </span>
        <span>{b.source ? BOAT_BOOKING_SOURCE_LABELS[b.source] : ""}</span>
        <span className="font-semibold text-gray-900">{formatNaira(b.total_amount)}</span>
        {b.reserver_phone && (
          <a href={`tel:${b.reserver_phone}`} className="col-span-2 flex items-center gap-1.5 text-orange-600">
            <Phone className="h-3.5 w-3.5" /> {b.reserver_phone}
          </a>
        )}
      </div>
      {(a.checkIn || a.complete || a.noShow || a.cancel) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {a.checkIn && (
            <Button size="sm" onClick={() => run("check-in")} disabled={action.isPending} className="gap-1.5 bg-orange-600 text-white hover:bg-orange-700">
              <LogIn className="h-4 w-4" /> Check in
            </Button>
          )}
          {a.complete && (
            <Button size="sm" onClick={() => run("complete")} disabled={action.isPending} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Complete cruise
            </Button>
          )}
          {a.noShow && (
            <Button size="sm" variant="outline" onClick={onNoShow} disabled={action.isPending} className="gap-1.5">
              <UserX className="h-4 w-4" /> No-show
            </Button>
          )}
          {a.cancel && (
            <Button size="sm" variant="outline" onClick={onCancel} disabled={action.isPending} className="gap-1.5 text-red-600 hover:text-red-700">
              <Ban className="h-4 w-4" /> Cancel
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

function NoShowDialog({ booking, onOpenChange }: { booking: BoatDayBooking | null; onOpenChange: (open: boolean) => void }) {
  const action = BoatCruisesApi.useBookingAction();
  return (
    <Dialog open={booking !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark as no-show?</DialogTitle>
          <DialogDescription>The guests didn&apos;t turn up for departure. The cancellation policy&apos;s no-show fee applies.</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={action.isPending}>
            Back
          </Button>
          <Button
            disabled={action.isPending}
            onClick={() =>
              booking &&
              action.mutate(
                { id: booking.id, action: "no-show" },
                {
                  onSuccess: () => {
                    toast.success(DONE["no-show"]);
                    onOpenChange(false);
                  },
                  onError: (e) => toast.error(apiMessage(e)),
                }
              )
            }
            className="bg-orange-600 text-white hover:bg-orange-700"
          >
            {action.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Mark no-show
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelDialog({ booking, onOpenChange }: { booking: BoatDayBooking | null; onOpenChange: (open: boolean) => void }) {
  const cancel = BoatCruisesApi.useCancelBooking();
  const [reason, setReason] = useState("");
  const offline = booking?.source && booking.source !== "MOBILE";

  return (
    <Dialog
      open={booking !== null}
      onOpenChange={(o) => {
        if (!o) setReason("");
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cancel {booking?.reference}?</DialogTitle>
          <DialogDescription>
            {offline
              ? "This booking was recorded offline, so no wallet refund is made. Settle any refund with the guest directly."
              : `The guest is refunded 100% (${formatNaira(booking?.total_amount)}) to their MyPal wallet.`}{" "}
            This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for cancelling" />
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cancel.isPending}>
            Keep booking
          </Button>
          <Button
            disabled={cancel.isPending || reason.trim().length < 3}
            onClick={() =>
              booking &&
              cancel.mutate(
                { id: booking.id, reason: reason.trim() },
                {
                  onSuccess: () => {
                    toast.success("Booking cancelled");
                    setReason("");
                    onOpenChange(false);
                  },
                  onError: (e) => toast.error(apiMessage(e)),
                }
              )
            }
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {cancel.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Cancel booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
