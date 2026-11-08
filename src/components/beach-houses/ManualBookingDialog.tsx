"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BeachHouseBookingsApi } from "@/services/api/beach-house-bookings-api";
import { BeachHousesApi } from "@/services/api/beach-houses-api";
import { BOOKING_SOURCE_LABELS, type ManualBookingPayload } from "@/types/beach-house-types";
import { formatNaira, priceUnitLabel } from "./beach-house-utils";
import { apiMessage, apiStatus, toIsoDay } from "./booking-utils";

type Source = ManualBookingPayload["source"];
const SOURCES: Source[] = ["WALK_IN", "PHONE_CALL", "THIRD_PARTY"];
type ExperiencePick = { quantity: number; scheduled_date: string };

/** Adds days to a YYYY-MM-DD string */
const addDays = (day: string, n: number) => {
  const [y, m, d] = day.split("-").map(Number);
  return toIsoDay(new Date(y, m - 1, d + n));
};

export function ManualBookingDialog({ open, onOpenChange, defaultListingId }: { open: boolean; onOpenChange: (open: boolean) => void; defaultListingId?: string }) {
  const router = useRouter();
  const today = toIsoDay(new Date());
  const { data: listings } = BeachHousesApi.useListings({ page: 1, limit: 100, status: "PUBLISHED" });
  const create = BeachHouseBookingsApi.useCreateManualBooking();

  const [listingId, setListingId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [picks, setPicks] = useState<Record<string, ExperiencePick>>({});
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [source, setSource] = useState<Source>("WALK_IN");
  const [paid, setPaid] = useState(true);
  const [notes, setNotes] = useState("");
  const [conflict, setConflict] = useState(false);

  useEffect(() => {
    if (!open) return;
    setListingId(defaultListingId ?? "");
    setPackageId("");
    setCheckIn(toIsoDay(new Date()));
    setCheckOut("");
    setAdults(1);
    setChildren(0);
    setInfants(0);
    setPicks({});
    setGuestName("");
    setGuestPhone("");
    setGuestEmail("");
    setSource("WALK_IN");
    setPaid(true);
    setNotes("");
    setConflict(false);
  }, [open, defaultListingId]);

  const { data: listing, isFetching: loadingListing } = BeachHousesApi.useListing(listingId || undefined);
  const packages = useMemo(() => (listing?.packages ?? []).filter((p) => p.is_active !== false), [listing]);
  const experiences = useMemo(() => (listing?.experiences ?? []).filter((e) => e.is_enabled && e.is_available !== false), [listing]);
  const pkg = packages.find((p) => p.id === packageId);
  const isDay = pkg?.type === "DAY_ACCESS";
  const capacity = listing?.specifications?.guestCapacity;

  // Default the check-out date for the chosen stay type
  useEffect(() => {
    if (!pkg || !checkIn) return;
    const nights = { DAY_ACCESS: 0, OVERNIGHT: 1, WEEKLY: 7, MONTHLY: 30 }[pkg.type];
    setCheckOut((current) => (pkg.type === "OVERNIGHT" && current > checkIn ? current : addDays(checkIn, nights)));
  }, [pkg, checkIn]);

  useEffect(() => {
    setPackageId("");
    setPicks({});
  }, [listingId]);

  const togglePick = (id: string, on: boolean) =>
    setPicks((prev) => {
      const next = { ...prev };
      if (on) next[id] = { quantity: 1, scheduled_date: "" };
      else delete next[id];
      return next;
    });

  const submit = () => {
    if (!listingId || !pkg) return toast.error("Choose an accommodation and stay type");
    if (!checkIn) return toast.error("Choose the check-in date");
    if (!isDay && (!checkOut || checkOut <= checkIn)) return toast.error("Check-out must be after check-in");
    if (adults < 1) return toast.error("At least one adult is required");
    if (guestName.trim().length < 2) return toast.error("Enter the guest's name");

    const payload: ManualBookingPayload = {
      stay_package_id: pkg.id,
      check_in_date: checkIn,
      check_out_date: isDay ? checkIn : checkOut,
      no_of_adults: adults,
      no_of_children: children,
      no_of_infants: infants,
      experiences: Object.entries(picks).map(([id, p]) => ({
        optional_experience_id: id,
        quantity: p.quantity,
        ...(p.scheduled_date ? { scheduled_date: p.scheduled_date } : {}),
      })),
      guest_name: guestName.trim(),
      guest_phone: guestPhone.trim() || undefined,
      guest_email: guestEmail.trim() || undefined,
      source,
      payment_received: paid,
      notes: notes.trim() || undefined,
    };
    if (!payload.experiences?.length) delete payload.experiences;

    setConflict(false);
    create.mutate(
      { listingId, payload },
      {
        onSuccess: (booking) => {
          toast.success(`Booking ${booking?.reservation_id ?? ""} created`);
          onOpenChange(false);
          if (booking?.id) router.push(`/beach-houses/bookings/${booking.id}`);
        },
        onError: (error) => {
          if (apiStatus(error) === 409) {
            setConflict(true);
            toast.error("Those dates are already booked or blocked");
          } else toast.error(apiMessage(error));
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New walk-in / phone booking</DialogTitle>
          <DialogDescription>The booking is created as Confirmed. Payment and the security deposit are handled offline.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
            <Field label="Accommodation *">
              <Select value={listingId} onValueChange={setListingId}>
                <SelectTrigger>
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
            </Field>
            <Field label="Stay type *">
              <Select value={packageId} onValueChange={setPackageId} disabled={!listingId || loadingListing}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingListing ? "Loading…" : "Choose stay type"} />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} · {formatNaira(p.from_price ?? p.weekday_price)}
                      {p.unit ? ` / ${p.unit}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
            <Field label={isDay ? "Date *" : "Check-in *"}>
              <Input type="date" value={checkIn} min={today} onChange={(e) => { setCheckIn(e.target.value); setConflict(false); }} className={cn(conflict && "border-red-500")} />
            </Field>
            {!isDay && (
              <Field label="Check-out *">
                <Input
                  type="date"
                  value={checkOut}
                  min={checkIn ? addDays(checkIn, 1) : today}
                  disabled={pkg?.type === "WEEKLY" || pkg?.type === "MONTHLY"}
                  onChange={(e) => { setCheckOut(e.target.value); setConflict(false); }}
                  className={cn(conflict && "border-red-500")}
                />
              </Field>
            )}
            {isDay && pkg?.start_time && (
              <p className="self-end pb-2 text-sm text-gray-500">
                Access {pkg.start_time} – {pkg.end_time}
              </p>
            )}
          </div>
          {conflict && <p className="-mt-3 text-sm text-red-600">These dates are already booked or blocked. Pick other dates.</p>}

          <div>
            <Label className="mb-2 block">Guests{capacity ? ` (up to ${capacity})` : ""}</Label>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
              <Counter label="Adults" value={adults} min={1} onChange={setAdults} />
              <Counter label="Children" value={children} onChange={setChildren} />
              <Counter label="Infants" value={infants} onChange={setInfants} />
            </div>
          </div>

          {experiences.length > 0 && (
            <div>
              <Label className="mb-2 block">Optional experiences</Label>
              <div className="space-y-2">
                {experiences.map((e) => {
                  const pick = picks[e.optional_experience_id];
                  return (
                    <div key={e.optional_experience_id} className={cn("rounded-lg border p-3", pick ? "border-orange-300 bg-orange-50/50" : "border-gray-200")}>
                      <label className="flex cursor-pointer items-center gap-3">
                        <Checkbox checked={Boolean(pick)} onCheckedChange={(v) => togglePick(e.optional_experience_id, v === true)} />
                        <span className="flex-1 text-sm font-medium text-gray-900">{e.name}</span>
                        <span className="text-sm text-gray-600">
                          {formatNaira(e.price)} / {priceUnitLabel(e.price_unit)}
                        </span>
                      </label>
                      {pick && (
                        <div className="mt-3 grid grid-cols-2 gap-3 pl-7 md:grid-cols-1">
                          <Field label="Quantity">
                            <Input
                              type="number"
                              min={1}
                              value={pick.quantity}
                              onChange={(ev) => setPicks((p) => ({ ...p, [e.optional_experience_id]: { ...pick, quantity: Math.max(1, Number(ev.target.value) || 1) } }))}
                            />
                          </Field>
                          <Field label="Day (blank = check-in day)">
                            <Input
                              type="date"
                              value={pick.scheduled_date}
                              min={checkIn}
                              max={isDay ? checkIn : checkOut || undefined}
                              onChange={(ev) => setPicks((p) => ({ ...p, [e.optional_experience_id]: { ...pick, scheduled_date: ev.target.value } }))}
                            />
                          </Field>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 md:grid-cols-1">
            <Field label="Guest name *">
              <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Ada Obi" />
            </Field>
            <Field label="Phone">
              <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+2348012345678" />
            </Field>
            <Field label="Email">
              <Input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="ada@example.com" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
            <Field label="Source">
              <Select value={source} onValueChange={(v) => setSource(v as Source)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {BOOKING_SOURCE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-sm text-gray-800">
              <Checkbox checked={paid} onCheckedChange={(v) => setPaid(v === true)} /> Payment received
            </label>
          </div>

          <Field label="Notes">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Paid by transfer" />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending} className="bg-orange-600 text-white hover:bg-orange-700">
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      {children}
    </div>
  );
}

function Counter({ label, value, min = 0, onChange }: { label: string; value: number; min?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className="rounded-full border p-1 text-gray-600 disabled:opacity-40" aria-label={`Fewer ${label.toLowerCase()}`}>
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center text-sm font-medium">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)} className="rounded-full border p-1 text-gray-600" aria-label={`More ${label.toLowerCase()}`}>
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
