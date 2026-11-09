"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Ban, CalendarDays, CheckCircle2, Clock, FileText, Loader2, LogIn, Mail, MapPin, Phone, Ship, Users, UserX, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BoatCruisesApi } from "@/services/api/boat-cruises-api";
import { BOAT_BOOKING_SOURCE_LABELS, type BoatBookingDetail } from "@/types/boat-cruise-types";
import { useBoatNav } from "./boat-nav";
import { BoatBookingStatusBadge } from "./BoatBookingStatusBadge";
import { apiMessage, bookingActions, formatDay, formatDuration, formatNaira, formatTime, formatTimestamp } from "./boat-utils";

const DONE = {
  "check-in": "Guests checked in",
  complete: "Cruise completed",
  "no-show": "Marked as no-show",
} as const;

const PAYMENT_LABELS: Record<string, string> = {
  PAID_ONLINE: "Paid online",
  PAID_OFFLINE: "Paid offline",
  PENDING: "Awaiting payment",
  REFUNDED: "Refunded",
};

export function BoatBookingDetail({ id }: { id: string }) {
  const nav = useBoatNav();
  const { data: booking, isLoading, isError, refetch } = BoatCruisesApi.useBooking(id);
  const action = BoatCruisesApi.useBookingAction();
  const [dialog, setDialog] = useState<"cancel" | "no-show" | null>(null);

  // Re-evaluate the time-based actions every minute
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (isError || !booking) {
    return (
      <div className="py-24 text-center text-gray-500">
        Couldn&apos;t load this booking.{" "}
        <button type="button" onClick={() => refetch()} className="font-medium text-orange-600 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  const a = bookingActions(booking, now);
  const run = (kind: keyof typeof DONE) =>
    action.mutate({ id, action: kind }, { onSuccess: () => toast.success(DONE[kind]), onError: (e) => toast.error(apiMessage(e)) });
  const p = booking.price_breakdown;

  return (
    <main className="space-y-6">
      <button type="button" onClick={nav.bookings} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </button>

      <div className="flex items-start justify-between gap-4 md:flex-col">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-gray-900">{booking.reference}</h1>
            <BoatBookingStatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Booked {formatTimestamp(booking.created_at)}
            {booking.source ? ` · ${booking.ota_name || BOAT_BOOKING_SOURCE_LABELS[booking.source]}` : ""}
            {booking.payment_status ? ` · ${PAYMENT_LABELS[booking.payment_status] ?? booking.payment_status}` : ""}
          </p>
        </div>
        {(a.checkIn || a.complete || a.noShow || a.cancel) && (
          <div className="flex flex-wrap gap-2">
            {a.checkIn && (
              <Button onClick={() => run("check-in")} disabled={action.isPending} className="gap-2 bg-orange-600 text-white hover:bg-orange-700">
                <LogIn className="h-4 w-4" /> Check in
              </Button>
            )}
            {a.complete && (
              <Button onClick={() => run("complete")} disabled={action.isPending} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Complete cruise
              </Button>
            )}
            {a.noShow && (
              <Button variant="outline" onClick={() => setDialog("no-show")} disabled={action.isPending} className="gap-2">
                <UserX className="h-4 w-4" /> Mark no-show
              </Button>
            )}
            {a.cancel && (
              <Button variant="outline" onClick={() => setDialog("cancel")} disabled={action.isPending} className="gap-2 text-red-600 hover:text-red-700">
                <Ban className="h-4 w-4" /> Cancel booking
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-6 xl:grid-cols-1">
        <div className="space-y-6">
          <Card title="Cruise">
            <div className="flex gap-4">
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {booking.boat?.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={booking.boat.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Ship className="m-auto mt-6 h-6 w-6 text-gray-300" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{booking.boat?.name}</p>
                {booking.boat?.boat_type && <p className="text-sm text-gray-500">{booking.boat.boat_type}</p>}
                {booking.boat?.departure_location && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="h-3.5 w-3.5" /> {booking.boat.departure_location}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm md:grid-cols-1">
              <Info icon={CalendarDays} label="Date">
                {formatDay(booking.booking_date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </Info>
              <Info icon={Clock} label="Departure – return">
                {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                {booking.duration_minutes ? <span className="block text-xs text-gray-500">{formatDuration(booking.duration_minutes)}</span> : null}
              </Info>
              <Info icon={Users} label="Guests">
                {booking.guests?.total ?? "—"}
                {booking.guests?.children ? <span className="block text-xs text-gray-500">{booking.guests.adults} adults, {booking.guests.children} children</span> : null}
              </Info>
            </div>
            {(booking.checked_in_at || booking.completed_at) && (
              <p className="mt-3 text-xs text-gray-500">
                {booking.checked_in_at && `Checked in ${formatTimestamp(booking.checked_in_at)}`}
                {booking.checked_in_at && booking.completed_at && " · "}
                {booking.completed_at && `Completed ${formatTimestamp(booking.completed_at)}`}
              </p>
            )}
            {booking.notes && (
              <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                <span className="font-medium text-gray-900">Notes: </span>
                {booking.notes}
              </p>
            )}
          </Card>

          <Card title="Price breakdown">
            <div className="space-y-1.5">
              {(p?.lines ?? []).map((l) => (
                <Row key={l.code ?? l.label} label={l.detail ? `${l.label} (${l.detail})` : l.label} value={formatNaira(l.amount)} />
              ))}
              {(p?.charges ?? []).map((c) => (
                <Row key={c.type} label={`${c.type}${c.percentage ? ` (${c.percentage}%)` : ""}`} value={formatNaira(c.amount)} muted />
              ))}
            </div>
            <p className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-base font-bold text-gray-900">
              <span>Total</span>
              <span className="text-orange-600">{formatNaira(p?.total ?? booking.total_amount)}</span>
            </p>
            {booking.payment?.reference && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                <Wallet className="h-3.5 w-3.5" /> {booking.payment.method ?? "Payment"} · {booking.payment.reference}
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Guest">
            <p className="font-medium text-gray-900">{booking.reserver?.name ?? "—"}</p>
            {booking.reserver?.phone && (
              <a href={`tel:${booking.reserver.phone}`} className="mt-2 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <Phone className="h-4 w-4" /> {booking.reserver.phone}
              </a>
            )}
            {booking.reserver?.email && (
              <a href={`mailto:${booking.reserver.email}`} className="mt-1 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <Mail className="h-4 w-4" /> {booking.reserver.email}
              </a>
            )}
            <p className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              {booking.terms_accepted_at
                ? `Terms${booking.terms_version ? ` v${booking.terms_version}` : ""} accepted ${formatTimestamp(booking.terms_accepted_at)}`
                : "Terms not accepted in the app"}
            </p>
          </Card>

          {booking.cancellation_policy && (
            <Card title="Cancellation policy">
              <p className="text-sm font-medium text-gray-900">{booking.cancellation_policy.title}</p>
              {booking.cancellation_policy.description && <p className="mt-1 text-sm text-gray-600">{booking.cancellation_policy.description}</p>}
              {booking.cancellation_policy.rules?.length ? (
                <ul className="mt-2 space-y-1 text-xs text-gray-600">
                  {booking.cancellation_policy.rules.map((r) => (
                    <li key={r.timeframe}>
                      • {r.timeframe}: {r.refundPercentage ?? 0}% refund
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          )}

          {booking.cancellation && (
            <Card title="Cancellation">
              <div className="space-y-1 text-sm text-gray-700">
                <p>
                  Cancelled {formatTimestamp(booking.cancellation.cancelled_at)}
                  {booking.cancellation.cancelled_by ? ` by ${booking.cancellation.cancelled_by}` : ""}
                </p>
                {booking.cancellation.reason && <p>Reason: {booking.cancellation.reason}</p>}
                {booking.payment_status === "PAID_OFFLINE" && !booking.cancellation.refund_amount ? (
                  <p>Paid offline, so no wallet refund was made. Settle any refund with the guest directly.</p>
                ) : booking.cancellation.refund_amount !== undefined ? (
                  <p>Refunded to the guest&apos;s wallet: {formatNaira(booking.cancellation.refund_amount)}</p>
                ) : null}
              </div>
            </Card>
          )}
        </div>
      </div>

      <CancelDialog open={dialog === "cancel"} booking={booking} onOpenChange={(o) => !o && setDialog(null)} />
      <Dialog open={dialog === "no-show"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as no-show?</DialogTitle>
            <DialogDescription>The guests didn&apos;t turn up for departure. The cancellation policy&apos;s no-show fee applies.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={action.isPending}>
              Back
            </Button>
            <Button
              disabled={action.isPending}
              onClick={() =>
                action.mutate(
                  { id, action: "no-show" },
                  {
                    onSuccess: () => {
                      toast.success(DONE["no-show"]);
                      setDialog(null);
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
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function Info({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-gray-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <div className="mt-0.5 text-gray-900">{children}</div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <p className={`flex justify-between gap-3 text-sm ${muted ? "text-gray-500" : "text-gray-700"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </p>
  );
}

function CancelDialog({ open, booking, onOpenChange }: { open: boolean; booking: BoatBookingDetail; onOpenChange: (open: boolean) => void }) {
  const cancel = BoatCruisesApi.useCancelBooking();
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (open) setReason("");
  }, [open]);
  const refund = booking.business_cancellation_refund ?? booking.total_amount;
  const offline = booking.payment_status === "PAID_OFFLINE";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel {booking.reference}?</DialogTitle>
          <DialogDescription>
            {offline ? (
              <>This booking was paid offline, so no wallet refund is made. Settle any refund with the guest directly. This can&apos;t be undone.</>
            ) : (
              <>
                The guest is refunded <span className="font-semibold">100%</span> ({formatNaira(refund)}) to their MyPal wallet. This can&apos;t be undone.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label className="mb-1.5 block">Reason *</Label>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Bad weather — the marina is closed" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cancel.isPending}>
            Keep booking
          </Button>
          <Button
            disabled={cancel.isPending || reason.trim().length < 3}
            onClick={() =>
              cancel.mutate(
                { id: booking.id, reason: reason.trim() },
                {
                  onSuccess: () => {
                    toast.success("Booking cancelled — the guest has been refunded");
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
