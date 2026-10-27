"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { Check, Footprints, Globe, Loader2, Phone, Plane, Plus, Smartphone, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { LocationField, type MobilityAddress } from "./LocationField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TimePickerAmPm } from "@/components/ui/time-picker-ampm";
import { cn } from "@/lib/utils";
import { MobilityApi } from "@/services/api/mobility-api";
import { useAuthStore } from "@/stores/auth-store";
import {
  CHARTER_PRESET_LABELS,
  MOBILITY_CATEGORIES,
  type CreateMobilityBookingPayload,
  type MobilityBookingSource,
  type MobilityCategory,
  type MobilityCharterPreset,
  type MobilityTripType,
} from "@/types/mobility-types";
import { formatNaira, toLocationPayload, vehicleName } from "./mobility-utils";

const SOURCES: { id: MobilityBookingSource; label: string; icon: LucideIcon }[] = [
  { id: "WALK_IN", label: "Walk-in", icon: Footprints },
  { id: "PHONE_CALL", label: "Phone call", icon: Phone },
  { id: "WEBSITE", label: "Website", icon: Globe },
  { id: "MYPAL_APP", label: "MyPal app", icon: Smartphone },
  { id: "OTA", label: "Online travel agency", icon: Plane },
];

const DEFAULT_AGENCIES = ["Booking.com", "Expedia"];

const TRIP_OPTIONS: { id: MobilityTripType; label: string }[] = [
  { id: "ONE_WAY", label: "One-time" },
  { id: "ROUND_TRIP", label: "Round-trip" },
  { id: "CHARTER", label: "Charter" },
];

const PRESET_DAYS: Record<Exclude<MobilityCharterPreset, "CUSTOM">, number> = {
  HOURS_24: 1,
  ONE_WEEK: 7,
  TWO_WEEKS: 14,
};

/** <input type="date"> value (yyyy-MM-dd) → the API's DD-MM-YYYY */
const fromInputDate = (value: string) => {
  const [y, m, d] = value.split("-");
  return y && m && d ? `${d}-${m}-${y}` : undefined;
};

interface AddBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory: MobilityCategory;
}

export function AddBookingDialog({ open, onOpenChange, defaultCategory }: AddBookingDialogProps) {
  const businessId = useAuthStore((state) => state.business?.id);
  const today = format(new Date(), "yyyy-MM-dd");

  const [source, setSource] = useState<MobilityBookingSource>("WALK_IN");
  const [agencies, setAgencies] = useState(DEFAULT_AGENCIES);
  const [otaName, setOtaName] = useState("");
  const [otaOpen, setOtaOpen] = useState(false);
  const [newAgency, setNewAgency] = useState("");
  const [category, setCategory] = useState<MobilityCategory>(defaultCategory);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [tripType, setTripType] = useState<MobilityTripType>("ONE_WAY");
  const [pickup, setPickup] = useState<MobilityAddress | null>(null);
  const [dropoff, setDropoff] = useState<MobilityAddress | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [preset, setPreset] = useState<MobilityCharterPreset>("HOURS_24");
  const [endDate, setEndDate] = useState(today);
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  // Remounts the address fields so they clear between bookings
  const [formKey, setFormKey] = useState(0);

  const { data: vehiclesData, isLoading: vehiclesLoading } = MobilityApi.useVehicles(
    { category },
    { enabled: open }
  );
  const vehicles = (vehiclesData?.items ?? []).filter((v) => v.is_active);
  const create = MobilityApi.useCreateBooking();
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const includedAddOns = selectedVehicle?.add_ons.filter((a) => a.is_included) ?? [];
  const optionalAddOns = selectedVehicle?.add_ons.filter((a) => !a.is_included) ?? [];
  const [addOnIds, setAddOnIds] = useState<string[]>([]);

  const charterEndDate =
    preset === "CUSTOM" ? endDate : format(addDays(new Date(date || today), PRESET_DAYS[preset]), "yyyy-MM-dd");
  // Add-ons are charged per day, so charters pay for each day of the hire
  const addOnDays =
    tripType !== "CHARTER"
      ? 1
      : preset === "CUSTOM"
        ? Math.max(1, differenceInCalendarDays(new Date(endDate || today), new Date(date || today)))
        : PRESET_DAYS[preset];
  const selectedAddOns = useMemo(
    () => addOnIds.map((id) => ({ vehicle_add_on_id: id, days: addOnDays })),
    [addOnIds, addOnDays]
  );

  // Add-ons belong to a vehicle, so they reset when it changes
  useEffect(() => {
    setAddOnIds([]);
  }, [vehicleId]);

  const farePayload = useMemo(
    () =>
      vehicleId
        ? {
            vehicle_id: vehicleId,
            trip_type: tripType,
            ...(tripType === "CHARTER" ? { charter_duration_preset: preset } : {}),
            ...(selectedAddOns.length ? { selected_add_ons: selectedAddOns } : {}),
          }
        : null,
    [vehicleId, tripType, preset, selectedAddOns]
  );
  const { data: fare, isFetching: fareLoading, isError: fareError } = MobilityApi.useCalculateFare(
    open ? farePayload : null
  );

  useEffect(() => {
    if (!open) return;
    setSource("WALK_IN");
    setOtaName("");
    setCategory(defaultCategory);
    setGuestName("");
    setGuestPhone("");
    setTripType("ONE_WAY");
    setPickup(null);
    setDropoff(null);
    setVehicleId("");
    setDate(today);
    setTime("");
    setReturnTime("");
    setPreset("HOURS_24");
    setEndDate(today);
    setEndTime("");
    setNotes("");
    setFormKey((k) => k + 1);
  }, [open, defaultCategory, today]);

  // A vehicle from another category can't stay selected
  useEffect(() => {
    setVehicleId("");
  }, [category]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!businessId) {
      toast.error("Your business profile hasn't loaded. Refresh and try again.");
      return;
    }
    if (source === "OTA" && !otaName) {
      toast.error("Choose the travel agency");
      return;
    }
    if (!guestName.trim()) {
      toast.error("Enter the customer's name");
      return;
    }
    if (guestPhone && !/^\+?[\d\s()-]{7,20}$/.test(guestPhone.trim())) {
      toast.error("Enter a valid phone number");
      return;
    }
    if (!pickup) {
      toast.error("Choose a pick-up location from the suggestions");
      return;
    }
    if (tripType !== "CHARTER" && !dropoff) {
      toast.error("Choose a drop-off location from the suggestions");
      return;
    }
    if (!vehicleId) {
      toast.error("Choose a vehicle");
      return;
    }
    if (!date || !time) {
      toast.error(tripType === "CHARTER" ? "Choose the start date and time" : "Choose the pick-up date and time");
      return;
    }
    if (tripType === "ROUND_TRIP" && !returnTime) {
      toast.error("Choose the return time");
      return;
    }
    if (tripType === "CHARTER" && preset === "CUSTOM" && (!endDate || !endTime || endDate < date)) {
      toast.error("Choose an end date and time after the start");
      return;
    }

    const payload: CreateMobilityBookingPayload = {
      business_id: businessId,
      vehicle_id: vehicleId,
      trip_type: tripType,
      service_category: category,
      source,
      ota_name: source === "OTA" ? otaName : undefined,
      guest_name: guestName.trim(),
      guest_phone: guestPhone.trim() || undefined,
      pickup_location: toLocationPayload(pickup),
      dropoff_location: dropoff ? toLocationPayload(dropoff) : undefined,
      selected_add_ons: selectedAddOns.length ? selectedAddOns : undefined,
      notes: notes.trim() || undefined,
      ...(tripType === "CHARTER"
        ? {
            charter_duration_preset: preset,
            start_date: fromInputDate(date),
            start_time: time,
            end_date: fromInputDate(charterEndDate),
            end_time: preset === "CUSTOM" ? endTime : time,
          }
        : {
            pickup_date: fromInputDate(date),
            pickup_time: time,
            ...(tripType === "ROUND_TRIP" ? { return_time: returnTime } : {}),
          }),
    };

    create.mutate(payload, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] max-w-2xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Manual Booking</DialogTitle>
          <DialogDescription>Record a walk-in, WhatsApp, or phone booking</DialogDescription>
        </DialogHeader>

        <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
          {/* Booking source */}
          <div className="grid grid-cols-5 gap-2 rounded-xl border p-2 md:grid-cols-3">
            {SOURCES.map(({ id, label, icon: Icon }) => {
              const active = source === id;
              const button = (
                <button
                  type="button"
                  onClick={() => {
                    setSource(id);
                    if (id === "OTA") setOtaOpen(true);
                  }}
                  className={cn(
                    "flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-lg border bg-orange-50 px-2 py-3 text-center text-xs font-medium text-gray-800 transition-colors",
                    active ? "border-orange-500" : "border-transparent hover:border-orange-200"
                  )}
                >
                  <Icon className="h-5 w-5 text-orange-600" />
                  {id === "OTA" && otaName ? otaName : label}
                </button>
              );
              if (id !== "OTA") return <div key={id}>{button}</div>;
              return (
                <Popover key={id} open={otaOpen} onOpenChange={setOtaOpen}>
                  <PopoverTrigger asChild>{button}</PopoverTrigger>
                  <PopoverContent align="end" className="w-60 p-1">
                    {agencies.map((agency) => (
                      <button
                        key={agency}
                        type="button"
                        onClick={() => {
                          setOtaName(agency);
                          setOtaOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded px-3 py-2 text-sm font-medium hover:bg-gray-50"
                      >
                        {agency}
                        {otaName === agency && <Check className="h-4 w-4 text-orange-600" />}
                      </button>
                    ))}
                    <div className="mt-1 flex items-center gap-1 border-t px-1 pt-2">
                      <Input
                        value={newAgency}
                        onChange={(e) => setNewAgency(e.target.value)}
                        placeholder="Add travel agency"
                        className="h-8 text-sm"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Add travel agency"
                        disabled={!newAgency.trim()}
                        onClick={() => {
                          const name = newAgency.trim();
                          if (!agencies.includes(name)) setAgencies((prev) => [...prev, name]);
                          setOtaName(name);
                          setNewAgency("");
                          setOtaOpen(false);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>

          {/* Fixed to the business's own mobility category */}
          <Field label="Category">
            <Input
              value={MOBILITY_CATEGORIES.find((c) => c.id === category)?.title ?? ""}
              disabled
              className="h-11"
            />
          </Field>

          <Field label="Customer name">
            <Input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter full customer name"
              className="h-11"
            />
          </Field>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 md:grid-cols-1">
            <Field label="Phone Number">
              <Input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="Enter phone number"
                className="h-11"
              />
            </Field>
            <div className="flex h-11 items-center gap-5" role="radiogroup" aria-label="Trip type">
              {TRIP_OPTIONS.map(({ id, label }) => (
                <label key={id} className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                  <input
                    type="radio"
                    name="trip-type"
                    checked={tripType === id}
                    onChange={() => setTripType(id)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <Field label="Pick-up Location">
            <LocationField value={pickup} onChange={setPickup} placeholder="Search address or location" />
          </Field>

          <Field label={tripType === "CHARTER" ? "Drop-off / Delivery Location (optional)" : "Drop-off Location"}>
            <LocationField value={dropoff} onChange={setDropoff} placeholder="Search address or location" />
          </Field>

          {tripType === "CHARTER" && (
            <Field label="Charter duration">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CHARTER_PRESET_LABELS) as MobilityCharterPreset[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPreset(p)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm",
                      preset === p
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {CHARTER_PRESET_LABELS[p]}
                  </button>
                ))}
              </div>
            </Field>
          )}

          <div className="grid grid-cols-3 gap-4 md:grid-cols-1">
            <Field label="Inventory Item">
              <Select value={vehicleId} onValueChange={setVehicleId} disabled={vehiclesLoading}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={vehiclesLoading ? "Loading…" : vehicles.length ? "Select vehicle" : "No vehicles"} />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {vehicleName(v)} · {v.plate_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={tripType === "CHARTER" ? "Start date" : "Date"}>
              <Input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} className="h-11" />
            </Field>
            <Field label={tripType === "CHARTER" ? "Start time" : "Time"}>
              <TimePickerAmPm value={time} onChange={setTime} placeholder="Select time" />
            </Field>
          </div>

          {tripType === "ROUND_TRIP" && (
            <div className="grid grid-cols-3 gap-4 md:grid-cols-1">
              <Field label="Return time">
                <TimePickerAmPm value={returnTime} onChange={setReturnTime} placeholder="Select time" />
              </Field>
            </div>
          )}

          {tripType === "CHARTER" && preset === "CUSTOM" && (
            <div className="grid grid-cols-3 gap-4 md:grid-cols-1">
              <div />
              <Field label="End date">
                <Input
                  type="date"
                  value={endDate}
                  min={date || today}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-11"
                />
              </Field>
              <Field label="End time">
                <TimePickerAmPm value={endTime} onChange={setEndTime} placeholder="Select time" />
              </Field>
            </div>
          )}

          {selectedVehicle && selectedVehicle.add_ons.length > 0 && (
            <Field label="Add-ons">
              <div className="space-y-2 rounded-md border p-3">
                {includedAddOns.map((addOn) => (
                  <div key={addOn.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-800">{addOn.name}</span>
                    <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Included</span>
                  </div>
                ))}
                {optionalAddOns.map((addOn) => (
                  <label key={addOn.id} className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-gray-800">
                      <input
                        type="checkbox"
                        checked={addOnIds.includes(addOn.id)}
                        onChange={(e) =>
                          setAddOnIds((prev) =>
                            e.target.checked ? [...prev, addOn.id] : prev.filter((id) => id !== addOn.id)
                          )
                        }
                        className="h-4 w-4 accent-orange-600"
                      />
                      {addOn.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      + {formatNaira(addOn.price_per_day)}/day
                      {addOnDays > 1 && ` × ${addOnDays}`}
                    </span>
                  </label>
                ))}
              </div>
            </Field>
          )}

          <Field label="Amount">
            <div className="flex h-11 items-center rounded-md border bg-gray-50 px-3 text-sm">
              {!vehicleId ? (
                <span className="text-gray-400">Choose a vehicle to see the fare</span>
              ) : fareLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              ) : fareError || !fare ? (
                <span className="text-gray-500">Fare is calculated when the booking is saved</span>
              ) : (
                <span className="font-semibold text-gray-900">
                  {formatNaira(fare.total)}
                  {fare.vat > 0 && (
                    <span className="ml-2 text-xs font-normal text-gray-500">incl. VAT {formatNaira(fare.vat)}</span>
                  )}
                </span>
              )}
            </div>
          </Field>

          <Field label="Note (Optional)">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., party request, party size"
              className="min-h-24"
            />
          </Field>

          <div className="grid grid-cols-[1fr_1.6fr] gap-4 pt-2 md:grid-cols-1">
            <Button
              type="button"
              variant="outline"
              className="h-12 border-orange-500 text-orange-600 hover:bg-orange-50"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="h-12 bg-orange-600 hover:bg-orange-700" disabled={create.isPending}>
              {create.isPending ? "Adding…" : "Add Booking"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-900">{label}</Label>
      {children}
    </div>
  );
}
