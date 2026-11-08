"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Home,
  Loader2,
  LogIn,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserX,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BeachHouseBookingsApi } from "@/services/api/beach-house-bookings-api";
import { uploadAccommodationFiles } from "@/services/api/upload-utils";
import {
  BOOKING_SOURCE_LABELS,
  DEPOSIT_STATUS_LABELS,
  PRICE_UNIT_LABELS,
  STAY_OPTION_LABELS,
  type BookingDetail,
  type PriceSection,
} from "@/types/beach-house-types";
import { formatNaira } from "./beach-house-utils";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { apiMessage, DEPOSIT_STYLES, formatDay, formatTimestamp, guestsSummary, stayDates } from "./booking-utils";

const CLAIM_WINDOW_MS = 48 * 60 * 60 * 1000;

const ACTION_COPY = {
  "check-in": { done: "Guest checked in", label: "Check in" },
  complete: { done: "Stay completed — the 48-hour deposit window has started", label: "Complete stay" },
  "no-show": { done: "Marked as no-show — the no-show fee applies and the deposit is refunded", label: "Mark no-show" },
} as const;

export function BookingDetailView({ id }: { id: string }) {
  const { data: booking, isLoading, isError, refetch } = BeachHouseBookingsApi.useBooking(id);
  const action = BeachHouseBookingsApi.useBookingAction();
  const release = BeachHouseBookingsApi.useReleaseDeposit();
  const [dialog, setDialog] = useState<"cancel" | "claim" | "release" | "no-show" | null>(null);

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

  const run = (kind: keyof typeof ACTION_COPY) =>
    action.mutate(
      { id, action: kind },
      { onSuccess: () => toast.success(ACTION_COPY[kind].done), onError: (error) => toast.error(apiMessage(error)) }
    );

  const a = booking.actions ?? ({} as BookingDetail["actions"]);
  const busy = action.isPending || release.isPending;
  const anyAction = a.check_in || a.complete || a.no_show || a.cancel || a.claim_deposit || a.release_deposit;

  return (
    <main className="space-y-6">
      <Link href="/beach-houses/bookings" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </Link>

      <div className="flex items-start justify-between gap-4 md:flex-col">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-gray-900">{booking.reservation_id}</h1>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Booked {formatTimestamp(booking.created_at)}
            {booking.source ? ` · ${BOOKING_SOURCE_LABELS[booking.source]}` : ""}
            {booking.payment?.reference ? ` · Payment ${booking.payment.reference}` : ""}
          </p>
        </div>
        {anyAction && (
          <div className="flex flex-wrap gap-2">
            {a.check_in && (
              <Button onClick={() => run("check-in")} disabled={busy} className="gap-2 bg-orange-600 text-white hover:bg-orange-700">
                <LogIn className="h-4 w-4" /> Check in
              </Button>
            )}
            {a.complete && (
              <Button onClick={() => run("complete")} disabled={busy} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Complete stay
              </Button>
            )}
            {a.no_show && (
              <Button variant="outline" onClick={() => setDialog("no-show")} disabled={busy} className="gap-2">
                <UserX className="h-4 w-4" /> Mark no-show
              </Button>
            )}
            {a.cancel && (
              <Button variant="outline" onClick={() => setDialog("cancel")} disabled={busy} className="gap-2 text-red-600 hover:text-red-700">
                <Ban className="h-4 w-4" /> Cancel booking
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-6 xl:grid-cols-1">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stay</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {booking.listing?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={booking.listing.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Home className="m-auto mt-6 h-6 w-6 text-gray-300" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{booking.listing?.name}</p>
                  {booking.listing?.area && <p className="text-sm text-gray-500">{booking.listing.area}</p>}
                  <p className="mt-1 text-sm text-gray-700">{booking.package_title || STAY_OPTION_LABELS[booking.package_type]}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm md:grid-cols-1">
                <Info icon={CalendarDays} label="Dates">
                  {stayDates(booking)}
                  {booking.start_time && booking.package_type === "DAY_ACCESS" ? ` · ${booking.start_time} – ${booking.end_time}` : ""}
                </Info>
                <Info icon={Users} label="Guests">{guestsSummary(booking.guests)}</Info>
                <Info icon={Clock} label="Checked in / completed">
                  {booking.checked_in_at ? formatTimestamp(booking.checked_in_at) : "—"}
                  {booking.completed_at ? <span className="block">{formatTimestamp(booking.completed_at)}</span> : null}
                </Info>
              </div>
              {booking.notes && (
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  <span className="font-medium text-gray-900">Notes: </span>
                  {booking.notes}
                </p>
              )}
            </CardContent>
          </Card>

          {(booking.experiences?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-orange-600" /> Experiences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-gray-100">
                  {booking.experiences!.map((e, i) => (
                    <li key={`${e.optional_experience_id ?? e.name}-${i}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{e.name}</p>
                        <p className="text-xs text-gray-500">
                          {e.quantity ? `${e.quantity} × ` : ""}
                          {e.price_unit ? PRICE_UNIT_LABELS[e.price_unit] : ""}
                          {e.scheduled_date ? ` · ${formatDay(e.scheduled_date)}` : " · date flexible (check-in day)"}
                        </p>
                      </div>
                      {e.total !== undefined && <span className="font-medium text-gray-900">{formatNaira(e.total)}</span>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <PriceCard booking={booking} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guest</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{booking.guest?.name ?? "—"}</p>
              {booking.guest?.email && (
                <a href={`mailto:${booking.guest.email}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <Mail className="h-4 w-4" /> {booking.guest.email}
                </a>
              )}
              {booking.guest?.phone && (
                <a href={`tel:${booking.guest.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <Phone className="h-4 w-4" /> {booking.guest.phone}
                </a>
              )}
              <p className="flex items-center gap-2 pt-2 text-gray-600">
                <FileText className="h-4 w-4" />
                {booking.terms_accepted_at
                  ? `House rules${booking.house_rules_version ? ` v${booking.house_rules_version}` : ""} accepted ${formatTimestamp(booking.terms_accepted_at)}`
                  : "House rules not accepted yet"}
              </p>
            </CardContent>
          </Card>

          <DepositCard booking={booking} onClaim={() => setDialog("claim")} onRelease={() => setDialog("release")} busy={busy} />

          {booking.cancellation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cancellation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-gray-700">
                <p>Cancelled {formatTimestamp(booking.cancellation.cancelled_at)}{booking.cancellation.cancelled_by ? ` by ${booking.cancellation.cancelled_by}` : ""}</p>
                {booking.cancellation.reason && <p>Reason: {booking.cancellation.reason}</p>}
                {booking.cancellation.refund_amount !== undefined && <p>Refunded to the guest&apos;s wallet: {formatNaira(booking.cancellation.refund_amount)}</p>}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CancelDialog open={dialog === "cancel"} booking={booking} onOpenChange={(o) => !o && setDialog(null)} />
      <ClaimDialog open={dialog === "claim"} booking={booking} onOpenChange={(o) => !o && setDialog(null)} />
      <ConfirmDialog
        open={dialog === "no-show"}
        title="Mark as no-show?"
        description="The cancellation policy's no-show fee is applied and the security deposit is refunded to the guest."
        confirm="Mark no-show"
        busy={action.isPending}
        onOpenChange={(o) => !o && setDialog(null)}
        onConfirm={() =>
          action.mutate(
            { id, action: "no-show" },
            {
              onSuccess: () => {
                toast.success(ACTION_COPY["no-show"].done);
                setDialog(null);
              },
              onError: (error) => toast.error(apiMessage(error)),
            }
          )
        }
      />
      <ConfirmDialog
        open={dialog === "release"}
        title="Release the security deposit?"
        description={`The full deposit (${formatNaira(booking.security_deposit?.amount)}) is refunded to the guest's MyPal wallet now. You can't claim from it afterwards.`}
        confirm="Release deposit"
        busy={release.isPending}
        onOpenChange={(o) => !o && setDialog(null)}
        onConfirm={() =>
          release.mutate(id, {
            onSuccess: () => {
              toast.success("Deposit released to the guest");
              setDialog(null);
            },
            onError: (error) => toast.error(apiMessage(error)),
          })
        }
      />
    </main>
  );
}

function Info({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-gray-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-0.5 text-gray-900">{children}</p>
    </div>
  );
}

function SectionLines({ title, section }: { title: string; section?: PriceSection }) {
  if (!section || (section.lines.length === 0 && !section.total)) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      {section.lines.map((l, i) => (
        <Row key={`${l.code ?? l.label}-${i}`} label={l.label} value={formatNaira(l.amount)} />
      ))}
      {(section.discounts ?? []).map((d, i) => (
        <Row key={`d-${i}`} label={d.label ?? `Discount${d.percentage ? ` (${d.percentage}%)` : ""}`} value={`−${formatNaira(d.amount)}`} className="text-emerald-700" />
      ))}
      {(section.charges ?? []).map((c) => (
        <Row key={c.type} label={`${c.type.charAt(0)}${c.type.slice(1).toLowerCase()}${c.percentage ? ` (${c.percentage}%)` : ""}`} value={formatNaira(c.amount)} className="text-gray-500" />
      ))}
      <Row label={`${title} total`} value={formatNaira(section.total)} className="font-medium text-gray-900" />
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <p className={cn("flex justify-between gap-3 text-sm text-gray-700", className)}>
      <span>{label}</span>
      <span>{value}</span>
    </p>
  );
}

function PriceCard({ booking }: { booking: BookingDetail }) {
  const p = booking.price_breakdown;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Price breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {p ? (
          <>
            <SectionLines title="Stay" section={p.stay} />
            <SectionLines title="Experiences" section={p.experiences} />
            {p.security_deposit?.amount ? (
              <Row label={`Security deposit${p.security_deposit.refundable ? " (refundable)" : ""}`} value={formatNaira(p.security_deposit.amount)} />
            ) : null}
          </>
        ) : null}
        <p className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold text-gray-900">
          <span>Total paid</span>
          <span className="text-orange-600">{formatNaira(p?.total ?? booking.total)}</span>
        </p>
      </CardContent>
    </Card>
  );
}

function useCountdown(deadline: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, [deadline]);
  if (!deadline) return null;
  const left = deadline - now;
  if (left <= 0) return "Window closed";
  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  return `${h}h ${m}m left to claim`;
}

function DepositCard({ booking, onClaim, onRelease, busy }: { booking: BookingDetail; onClaim: () => void; onRelease: () => void; busy: boolean }) {
  const d = booking.security_deposit;
  const deadline = booking.completed_at && booking.actions?.claim_deposit ? new Date(booking.completed_at).getTime() + CLAIM_WINDOW_MS : null;
  const countdown = useCountdown(deadline);
  if (!d?.amount) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-orange-600" /> Security deposit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Row label="Amount" value={formatNaira(d.amount)} className="font-medium text-gray-900" />
        <p className="flex justify-between">
          <span className="text-gray-700">Status</span>
          <span className={cn("font-medium", d.status ? DEPOSIT_STYLES[d.status] : "text-gray-500")}>{d.status ? DEPOSIT_STATUS_LABELS[d.status] : booking.source && booking.source !== "MOBILE" ? "Handled offline" : "—"}</span>
        </p>
        {d.claim_amount ? (
          <div className="rounded-lg bg-gray-50 p-3 text-gray-700">
            <p>
              Claimed <span className="font-medium">{formatNaira(d.claim_amount)}</span>
              {d.claim_reason ? ` — ${d.claim_reason}` : ""}
            </p>
            {d.settled_at && <p className="text-xs text-gray-500">Settled {formatTimestamp(d.settled_at)}</p>}
          </div>
        ) : null}
        {countdown && (
          <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            <Clock className="h-3.5 w-3.5" /> {countdown}. Unclaimed deposits are refunded automatically after 48 hours.
          </p>
        )}
        {(booking.actions?.claim_deposit || booking.actions?.release_deposit) && (
          <div className="grid grid-cols-2 gap-2">
            {booking.actions.claim_deposit && (
              <Button variant="outline" onClick={onClaim} disabled={busy} className="gap-1.5">
                <Wallet className="h-4 w-4" /> Claim
              </Button>
            )}
            {booking.actions.release_deposit && (
              <Button onClick={onRelease} disabled={busy} className="bg-emerald-600 text-white hover:bg-emerald-700">
                Release
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirm,
  busy,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirm: string;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Back
          </Button>
          <Button onClick={onConfirm} disabled={busy} className="bg-orange-600 text-white hover:bg-orange-700">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelDialog({ open, booking, onOpenChange }: { open: boolean; booking: BookingDetail; onOpenChange: (open: boolean) => void }) {
  const cancel = BeachHouseBookingsApi.useCancelBooking();
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel {booking.reservation_id}?</DialogTitle>
          <DialogDescription>
            The guest is refunded <span className="font-semibold">100%</span> ({formatNaira(booking.total)}) to their MyPal wallet. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label className="mb-1.5 block">Reason *</Label>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Property unavailable due to maintenance" />
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

function ClaimDialog({ open, booking, onOpenChange }: { open: boolean; booking: BookingDetail; onOpenChange: (open: boolean) => void }) {
  const claim = BeachHouseBookingsApi.useClaimDeposit();
  const max = booking.security_deposit?.amount ?? 0;
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setReason("");
    setFiles([]);
  }, [open]);

  const submit = async () => {
    const value = Number(amount);
    if (!(value > 0 && value <= max)) return toast.error(`Enter an amount up to ${formatNaira(max)}`);
    if (reason.trim().length < 3) return toast.error("Explain what the claim is for");
    try {
      setUploading(true);
      const evidence_urls = files.length ? await uploadAccommodationFiles(files) : undefined;
      claim.mutate(
        { id: booking.id, amount: value, reason: reason.trim(), evidence_urls },
        {
          onSuccess: () => {
            toast.success("Deposit claim submitted");
            onOpenChange(false);
          },
          onError: (error) => toast.error(apiMessage(error)),
        }
      );
    } catch {
      toast.error("Couldn't upload the photos — try again");
    } finally {
      setUploading(false);
    }
  };

  const busy = uploading || claim.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Claim from the security deposit</DialogTitle>
          <DialogDescription>One claim only, within 48 hours of completion. The rest of the deposit is refunded to the guest.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Amount (₦) * — up to {formatNaira(max)}</Label>
            <Input type="number" min={1} max={max} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Reason *</Label>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Broken glass on the deck" />
          </div>
          <div>
            <Label className="mb-1.5 block">Evidence photos (optional)</Label>
            <Input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Back
          </Button>
          <Button onClick={submit} disabled={busy} className="bg-orange-600 text-white hover:bg-orange-700">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit claim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
