"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Footprints, Globe, Loader2, Phone, Plane, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BoatCruisesApi } from "@/services/api/boat-cruises-api";
import type { ManualSource } from "@/types/boat-cruise-types";
import { useBoatNav } from "./boat-nav";
import { apiMessage, apiStatus, formatDuration, formatNaira, formatTime, minutesBetween, TIME_OPTIONS, toIsoDay } from "./boat-utils";

// "MyPal app" bookings are made by guests in the app, so it isn't offered here (the API returns 400)
const SOURCES: { id: ManualSource; label: string; icon: typeof Phone }[] = [
  { id: "WALK_IN", label: "Walk-in", icon: Footprints },
  { id: "PHONE_CALL", label: "Phone call", icon: Phone },
  { id: "WEBSITE", label: "Website", icon: Globe },
  { id: "OTA", label: "Online travel agency", icon: Plane },
];

export function BoatManualBookingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const nav = useBoatNav();
  const today = toIsoDay(new Date());
  const { data: items = [], isLoading: itemsLoading } = BoatCruisesApi.useInventoryItems(open);
  const { data: agencies = [] } = BoatCruisesApi.useTravelAgencies(open);
  const createAgency = BoatCruisesApi.useCreateTravelAgency();
  const create = BoatCruisesApi.useCreateManualBooking();

  const [source, setSource] = useState<ManualSource>("PHONE_CALL");
  const [agencyId, setAgencyId] = useState("");
  const [newAgency, setNewAgency] = useState("");
  const [addingAgency, setAddingAgency] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [boatId, setBoatId] = useState("");
  const [date, setDate] = useState(today);
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("12:00");
  const [guests, setGuests] = useState("");
  const [amount, setAmount] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [notes, setNotes] = useState("");
  const [conflict, setConflict] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSource("PHONE_CALL");
    setAgencyId("");
    setGuestName("");
    setBoatId("");
    setDate(toIsoDay(new Date()));
    setStart("10:00");
    setEnd("12:00");
    setGuests("");
    setAmount("");
    setAmountTouched(false);
    setNotes("");
    setConflict(false);
  }, [open]);

  const boat = items.find((i) => i.id === boatId);
  const minutes = minutesBetween(start, end);

  // Prefill the amount at the hourly rate until the business types its own
  useEffect(() => {
    if (!amountTouched && boat?.price && minutes > 0) setAmount(String(Math.round((boat.price * minutes) / 60)));
  }, [boat, minutes, amountTouched]);

  // Keep the times inside the boat's operating hours
  useEffect(() => {
    const hours = boat?.operating_hours;
    if (!hours) return;
    if (start < hours.start) setStart(hours.start);
    if (end > hours.end) setEnd(hours.end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boatId]);

  const agency = agencies.find((a) => a.id === agencyId);

  const submit = () => {
    if (!guestName.trim()) return toast.error("Enter the guest's name");
    if (!boat) return toast.error("Choose the boat");
    if (!date) return toast.error("Choose the date");
    if (minutes <= 0) return toast.error("Return time must be after departure");
    if (source === "OTA" && !agencyId) return toast.error("Choose the travel agency");
    if (!(Number(amount) >= 0) || amount === "") return toast.error("Enter the amount the guest paid");
    if (boat.capacity && Number(guests) > boat.capacity) return toast.error(`This boat takes up to ${boat.capacity} guests`);

    setConflict(false);
    create.mutate(
      {
        entity_type: "Boat",
        entity_id: boat.id,
        source,
        travel_agency_id: source === "OTA" ? agencyId : undefined,
        guest_name: guestName.trim(),
        start_date: date,
        start_time: start,
        end_time: end,
        no_of_guests: guests ? Number(guests) : undefined,
        amount: Number(amount),
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          toast.success("Booking created and confirmed");
          onOpenChange(false);
          // The response is the created reservation; it's a boat booking when it carries a BYC reference
          if (res?.id && res.reference) nav.openBooking(res.id);
          else nav.bookings();
        },
        onError: (error) => {
          if (apiStatus(error) === 409) {
            setConflict(true);
            toast.error("That boat is already booked or blocked at that time");
          } else toast.error(apiMessage(error));
        },
      }
    );
  };

  const addAgency = () => {
    const name = newAgency.trim();
    if (!name) return;
    createAgency.mutate(
      { name },
      {
        onSuccess: (a) => {
          setAgencyId(a.id);
          setSource("OTA");
          setNewAgency("");
          setAddingAgency(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95dvh] max-w-2xl gap-3 overflow-y-auto rounded-[15px] p-6">
        <DialogHeader className="mb-2 space-y-1 text-left">
          <DialogTitle className="text-xl font-bold">Add Manual Booking</DialogTitle>
          <DialogDescription>Record a walk-in, website, phone or travel-agency booking. It&apos;s confirmed as paid offline.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-3 sm:grid-cols-2">
          {SOURCES.map((s) => {
            const Icon = s.icon;
            const selected = source === s.id;
            const tile = (
              <button
                key={s.id}
                type="button"
                onClick={() => setSource(s.id)}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-2 rounded-xl border bg-[#FFECE5] p-4 transition-all",
                  selected ? "border-[#DA3807] ring-2 ring-[#DA3807]" : "border-orange-100 hover:bg-orange-50"
                )}
              >
                <Icon className="h-5 w-5 text-[#DA3807]" />
                <span className={cn("text-center text-[11px] font-semibold leading-tight", selected ? "text-orange-700" : "text-gray-600")}>
                  {s.id === "OTA" && agency ? agency.name : s.label}
                </span>
              </button>
            );
            if (s.id !== "OTA") return tile;
            return (
              <Popover key={s.id}>
                <PopoverTrigger asChild>{tile}</PopoverTrigger>
                <PopoverContent className="w-64 rounded-xl p-2" align="end">
                  <div className="max-h-60 space-y-1 overflow-y-auto">
                    {agencies.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setAgencyId(a.id);
                          setSource("OTA");
                        }}
                        className="flex w-full items-center justify-between rounded-lg p-3 text-left text-sm font-semibold text-slate-700 hover:bg-gray-50"
                      >
                        {a.name}
                        {agencyId === a.id && <CheckCircle2 className="h-4 w-4 text-orange-600" />}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 border-t pt-2">
                    {addingAgency ? (
                      <div className="space-y-2 p-2">
                        <Input autoFocus value={newAgency} onChange={(e) => setNewAgency(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addAgency()} placeholder="Agency name" className="h-9" />
                        <Button size="sm" onClick={addAgency} disabled={createAgency.isPending || !newAgency.trim()} className="h-8 w-full bg-slate-800">
                          {createAgency.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />} Save
                        </Button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setAddingAgency(true)} className="flex w-full items-center gap-2 p-3 text-sm font-medium text-gray-500 hover:text-slate-700">
                        <Plus className="h-4 w-4" /> Add Travel Agency
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>

        <div className="grid gap-4">
          <Field label="Guest name">
            <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Enter full guest name" className="h-12" />
          </Field>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
            <Field label="Inventory Item">
              <Select value={boatId} onValueChange={setBoatId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={itemsLoading ? "Loading…" : "Select boat or yacht"} />
                </SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                      {i.subtitle ? ` (${i.subtitle})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" value={date} min={today} onChange={(e) => { setDate(e.target.value); setConflict(false); }} className={cn("h-12", conflict && "border-red-500")} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:grid-cols-1">
            <Field label="Departure time">
              <TimeSelect value={start} onChange={(v) => { setStart(v); setConflict(false); }} invalid={conflict} />
            </Field>
            <Field label="Return time">
              <TimeSelect value={end} onChange={(v) => { setEnd(v); setConflict(false); }} invalid={conflict || minutes <= 0} />
            </Field>
            <Field label="Guests">
              <Input inputMode="numeric" value={guests} onChange={(e) => setGuests(e.target.value.replace(/[^\d]/g, ""))} placeholder={boat?.capacity ? `Up to ${boat.capacity}` : "e.g. 4"} className="h-12" />
            </Field>
          </div>
          {boat && (
            <p className="-mt-2 text-xs text-gray-500">
              {minutes > 0 ? formatDuration(minutes) : "—"} · operates {formatTime(boat.operating_hours?.start)} – {formatTime(boat.operating_hours?.end)} · {formatNaira(boat.price)}/hour
            </p>
          )}
          {conflict && <p className="-mt-2 text-sm text-red-600">This boat is already booked or blocked at that time. Pick another time or boat.</p>}

          <Field label="Amount paid (₦)">
            <Input
              inputMode="numeric"
              value={amount ? Number(amount).toLocaleString("en-NG") : ""}
              onChange={(e) => {
                setAmountTouched(true);
                setAmount(e.target.value.replace(/[^\d]/g, ""));
              }}
              placeholder="What the guest paid you"
              className="h-12"
            />
            <p className="mt-1 text-xs text-gray-400">Prefilled at the hourly rate; change it to what was actually paid.</p>
          </Field>

          <Field label="Note (Optional)">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="E.g. birthday party, special requests" className="min-h-[90px] resize-none" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-12 border-orange-500 font-bold text-orange-600 hover:bg-orange-50 hover:text-orange-600">
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending} className="h-12 bg-[#f0511f] font-bold text-white hover:bg-orange-700">
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm Booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-semibold text-slate-800">{label}</Label>
      {children}
    </div>
  );
}

function TimeSelect({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid?: boolean }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("h-12", invalid && "border-red-500")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {TIME_OPTIONS.map((t) => (
          <SelectItem key={t} value={t}>
            {formatTime(t)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
