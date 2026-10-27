"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MobilityApi, toKobo } from "@/services/api/mobility-api";
import type { MobilityVehicle } from "@/types/mobility-types";
import { vehicleName } from "./mobility-utils";

const REASONS = [
  "Scheduled maintenance",
  "Repairs",
  "Accident damage",
  "Licence or insurance renewal",
  "Driver unavailable",
  "Other",
];

interface EditAvailabilityDialogProps {
  vehicle: MobilityVehicle | null;
  onOpenChange: (open: boolean) => void;
}

export function EditAvailabilityDialog({ vehicle, onOpenChange }: EditAvailabilityDialogProps) {
  const [total, setTotal] = useState(0);
  const [available, setAvailable] = useState(0);
  const [outOfService, setOutOfService] = useState(0);
  const [price, setPrice] = useState("");
  const [reason, setReason] = useState("");
  const update = MobilityApi.useUpdateAvailability();

  useEffect(() => {
    if (!vehicle) return;
    setTotal(vehicle.total_units);
    setAvailable(vehicle.available_units);
    setOutOfService(vehicle.out_of_service_units);
    setPrice(vehicle.base_price ? String(vehicle.base_price) : "");
    setReason(vehicle.out_of_service_reason ?? "");
  }, [vehicle]);

  // Units neither available nor out of service are booked
  const booked = Math.max(0, total - available - outOfService);

  const save = (overrides?: { available: number; outOfService: number }) => {
    if (!vehicle) return;
    const nextAvailable = overrides?.available ?? available;
    const nextOutOfService = overrides?.outOfService ?? outOfService;
    if (nextAvailable + nextOutOfService > total) {
      toast.error("Available and out-of-service units can't add up to more than the total");
      return;
    }
    if (nextOutOfService > 0 && !reason) {
      toast.error("Choose why units are out of service");
      return;
    }
    update.mutate(
      {
        id: vehicle.id,
        payload: {
          total_units: total,
          available_units: nextAvailable,
          out_of_service_units: nextOutOfService,
          out_of_service_reason: nextOutOfService > 0 ? reason : undefined,
          ...(Number(price) > 0 ? { base_price_kobo: toKobo(Number(price)) } : {}),
          ...(overrides ? { is_active: true } : {}),
        },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  // Puts every unit that isn't booked back into service
  const markAvailable = () => save({ available: total - booked, outOfService: 0 });

  return (
    <Dialog open={!!vehicle} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 [&>button]:hidden">
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <DialogTitle className="text-base font-semibold">Edit Vehicle Availability</DialogTitle>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-orange-300 p-1 text-orange-600 hover:bg-orange-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <DialogDescription className="sr-only">Update unit counts, price and out-of-service reason</DialogDescription>

        <div className="mx-5 space-y-4 rounded-lg bg-gray-50 p-4">
          <div className="space-y-2">
            <Label className="text-sm">Vehicle</Label>
            <Input value={vehicle ? `${vehicleName(vehicle)} · ${vehicle.plate_number}` : ""} disabled className="bg-white" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stepper label="Total Units" value={total} min={1} onChange={setTotal} />
            <Stepper label="Available" value={available} max={total} onChange={setAvailable} />
            <Stepper label="Out of Service" value={outOfService} max={total} onChange={setOutOfService} />
            <div className="space-y-2">
              <Label className="text-sm">Price (₦)</Label>
              <Input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-10 bg-white"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            {booked} unit{booked === 1 ? "" : "s"} booked or in use.
          </p>

          <div className="space-y-2">
            <Label className="text-sm">Reason</Label>
            <Select value={reason} onValueChange={setReason} disabled={outOfService === 0}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder={outOfService === 0 ? "Only needed for out-of-service units" : "Choose a reason"} />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5">
          <Button variant="outline" className="h-11" disabled={update.isPending} onClick={markAvailable}>
            Mark Available
          </Button>
          <Button className="h-11 bg-orange-600 hover:bg-orange-700" disabled={update.isPending} onClick={() => save()}>
            {update.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stepper({
  label,
  value,
  min = 0,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  const clamp = (n: number) => Math.max(min, max === undefined ? n : Math.min(max, n));
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex h-10 items-center rounded-md border bg-white">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
          className="h-full w-full min-w-0 bg-transparent px-3 text-sm focus:outline-none"
          aria-label={label}
        />
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(clamp(value - 1))}
          className="flex h-full w-8 items-center justify-center border-l text-gray-600 hover:bg-gray-50"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(clamp(value + 1))}
          className="flex h-full w-8 items-center justify-center border-l text-gray-600 hover:bg-gray-50"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
