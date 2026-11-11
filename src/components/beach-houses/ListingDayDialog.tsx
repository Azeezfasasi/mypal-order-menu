"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Ban, CalendarDays, CheckCircle2, Home, Loader2, LogIn, Phone, Users, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BeachHousesApi, type BookingAction } from "@/services/api/beach-houses-api";
import { BOOKING_STATUS_LABELS, STAY_OPTION_LABELS, type BookingSummary, type DayViewItem } from "@/types/beach-house-types";
import { apiMessage, BOOKING_STATUS_STYLES, formatNaira, guestsSummary, stayDates } from "./beach-house-utils";

const ACTION_DONE: Record<BookingAction, string> = {
  "check-in": "Guest checked in",
  complete: "Stay completed — the 48-hour deposit window has started",
  "no-show": "Marked as no-show",
};

interface ListingDayDialogProps {
  item: DayViewItem | null;
  /** YYYY-MM-DD */
  date: string;
  canToggle: boolean;
  onOpenChange: (open: boolean) => void;
}

/** A listing's bookings for one day, with check-in / complete / no-show / cancel */
export function ListingDayDialog({ item, date, canToggle, onOpenChange }: ListingDayDialogProps) {
  const { data, isLoading } = BeachHousesApi.useListingDay(item?.id, item ? date : undefined);
  const setAvailability = BeachHousesApi.useSetAvailability();
  const [cancelling, setCancelling] = useState<BookingSummary | null>(null);
  const [confirmNoShow, setConfirmNoShow] = useState<BookingSummary | null>(null);

  if (!item) return null;
  const [y, m, d] = date.split("-").map(Number);
  const blocked = data?.is_blocked ?? !item.is_available;

  return (
    <>
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{item.name}</DialogTitle>
            <DialogDescription className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {format(new Date(y, m - 1, d), "EEEE, d MMMM yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="h-40 overflow-hidden rounded-xl bg-gray-100">
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Home className="m-auto mt-14 h-8 w-8 text-gray-300" />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2 text-xs">
              {blocked ? (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">Blocked for bookings</span>
              ) : (
                <>
                  {data?.day_access_available !== null && data?.day_access_available !== undefined && (
                    <Availability on={data.day_access_available} label="Day access" />
                  )}
                  {data?.overnight_available !== null && data?.overnight_available !== undefined && (
                    <Availability on={data.overnight_available} label="Overnight" />
                  )}
                </>
              )}
            </div>
            {canToggle && (
              <Button
                variant="outline"
                size="sm"
                disabled={setAvailability.isPending}
                onClick={() =>
                  setAvailability.mutate(
                    { listingId: item.id, dates: [date], is_blocked: !blocked },
                    { onSuccess: () => toast.success(blocked ? "Day opened for bookings" : "Day blocked") }
                  )
                }
              >
                {setAvailability.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {blocked ? "Open this day" : "Block this day"}
              </Button>
            )}
          </div>

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
                  <BookingRow key={b.id} booking={b} onNoShow={() => setConfirmNoShow(b)} onCancel={() => setCancelling(b)} />
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <NoShowDialog booking={confirmNoShow} onOpenChange={(o) => !o && setConfirmNoShow(null)} />
      <CancelDialog booking={cancelling} onOpenChange={(o) => !o && setCancelling(null)} />
    </>
  );
}

function Availability({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 font-medium", on ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
      {label}: {on ? "available" : "booked"}
    </span>
  );
}

function BookingRow({ booking: b, onNoShow, onCancel }: { booking: BookingSummary; onNoShow: () => void; onCancel: () => void }) {
  const action = BeachHousesApi.useBookingAction();
  const a = b.actions;
  const run = (kind: BookingAction) =>
    action.mutate(
      { id: b.id, action: kind },
      { onSuccess: () => toast.success(ACTION_DONE[kind]), onError: (error) => toast.error(apiMessage(error)) }
    );

  return (
    <li className="rounded-xl border border-gray-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{b.guest?.name ?? "Guest"}</p>
          <p className="font-mono text-xs text-orange-700">{b.reservation_id}</p>
        </div>
        <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", BOOKING_STATUS_STYLES[b.status])}>
          {BOOKING_STATUS_LABELS[b.status] ?? b.status}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" /> {stayDates(b)}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> {guestsSummary(b.guests)}
        </span>
        <span>
          {b.package_title || STAY_OPTION_LABELS[b.package_type]}
          {b.start_time ? ` · ${b.start_time}–${b.end_time}` : ""}
        </span>
        <span className="font-semibold text-gray-900">{formatNaira(b.total)}</span>
        {b.guest?.phone && (
          <a href={`tel:${b.guest.phone}`} className="col-span-2 flex items-center gap-1.5 text-orange-600">
            <Phone className="h-3.5 w-3.5" /> {b.guest.phone}
          </a>
        )}
      </div>
      {a && (a.check_in || a.complete || a.no_show || a.cancel) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {a.check_in && (
            <Button size="sm" onClick={() => run("check-in")} disabled={action.isPending} className="gap-1.5 bg-orange-600 text-white hover:bg-orange-700">
              <LogIn className="h-4 w-4" /> Check in
            </Button>
          )}
          {a.complete && (
            <Button size="sm" onClick={() => run("complete")} disabled={action.isPending} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Complete stay
            </Button>
          )}
          {a.no_show && (
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

function NoShowDialog({ booking, onOpenChange }: { booking: BookingSummary | null; onOpenChange: (open: boolean) => void }) {
  const action = BeachHousesApi.useBookingAction();
  return (
    <Dialog open={booking !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark as no-show?</DialogTitle>
          <DialogDescription>
            The cancellation policy&apos;s no-show fee is applied and the security deposit is refunded to the guest.
          </DialogDescription>
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
                    toast.success(ACTION_DONE["no-show"]);
                    onOpenChange(false);
                  },
                  onError: (error) => toast.error(apiMessage(error)),
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

function CancelDialog({ booking, onOpenChange }: { booking: BookingSummary | null; onOpenChange: (open: boolean) => void }) {
  const cancel = BeachHousesApi.useCancelBooking();
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (booking) setReason("");
  }, [booking]);

  return (
    <Dialog open={booking !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cancel {booking?.reservation_id}?</DialogTitle>
          <DialogDescription>
            {booking?.source && booking.source !== "MOBILE" ? (
              <>This booking was paid offline, so no wallet refund is made. Settle any refund with the guest directly.</>
            ) : booking?.source === "MOBILE" ? (
              <>
                The guest is refunded <span className="font-semibold">100%</span> ({formatNaira(booking.total)}) to their MyPal wallet.
              </>
            ) : (
              <>
                Bookings paid in the MyPal app are refunded <span className="font-semibold">100%</span> ({formatNaira(booking?.total)}) to the guest&apos;s wallet. Walk-in and phone bookings were paid offline, so settle those refunds directly.
              </>
            )}{" "}
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
                    toast.success(booking?.source === "MOBILE" ? "Booking cancelled — the guest has been refunded" : "Booking cancelled");
                    onOpenChange(false);
                  },
                  onError: (error) => toast.error(apiMessage(error)),
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
