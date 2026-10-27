"use client";

import { useEffect, useState } from "react";
import { Car, Pencil, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { MOBILITY_CATEGORIES, VEHICLE_FEATURE_LABELS, type MobilityVehicle } from "@/types/mobility-types";
import { bookedUnits, formatNaira, vehicleName } from "./mobility-utils";
import { discountedPrice, FEATURE_ICONS, vehicleAvailability } from "./VehicleCard";

interface VehicleDetailsDialogProps {
  vehicle: MobilityVehicle | null;
  onOpenChange: (open: boolean) => void;
  onEditAvailability: (vehicle: MobilityVehicle) => void;
  onEditDetails: (vehicle: MobilityVehicle) => void;
}

export function VehicleDetailsDialog({ vehicle, onOpenChange, onEditAvailability, onEditDetails }: VehicleDetailsDialogProps) {
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [vehicle?.id]);

  if (!vehicle) return null;

  const availability = vehicleAvailability(vehicle);
  const image = vehicle.gallery_images[imageIndex];
  const units = [
    { label: "Total", value: vehicle.total_units, tone: "bg-gray-50" },
    { label: "Available", value: vehicle.available_units, tone: "bg-emerald-50" },
    { label: "Booked", value: bookedUnits(vehicle), tone: "bg-amber-50" },
    { label: "Out of service", value: vehicle.out_of_service_units, tone: "bg-red-50" },
  ];
  const category = MOBILITY_CATEGORIES.find((c) => c.id === vehicle.category)?.title;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {vehicleName(vehicle)}
            <span className={cn("flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", availability.pill)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", availability.dot)} />
              {availability.label}
            </span>
          </DialogTitle>
          <DialogDescription>
            {[vehicle.vehicle_class, vehicle.plate_number, category].filter(Boolean).join(" · ")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-gray-100 text-gray-400">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={vehicleName(vehicle)} className="h-full w-full object-cover" />
              ) : (
                <Car className="h-10 w-10" />
              )}
            </div>
            {vehicle.gallery_images.length > 1 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {vehicle.gallery_images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setImageIndex(i)}
                    className={cn(
                      "h-12 w-16 shrink-0 overflow-hidden rounded-md border-2",
                      i === imageIndex ? "border-orange-500" : "border-transparent"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-orange-600">{formatNaira(discountedPrice(vehicle))}</span>
            <span className="text-sm text-gray-600">/ 24h</span>
            {vehicle.discount_percentage ? (
              <span className="text-sm text-gray-400 line-through">{formatNaira(vehicle.base_price)}</span>
            ) : null}
          </div>

          <div className="grid grid-cols-4 gap-2 sm:grid-cols-2">
            {units.map(({ label, value, tone }) => (
              <div key={label} className={cn("rounded-lg px-3 py-2", tone)}>
                <p className="text-lg font-semibold text-gray-900">{value}</p>
                <p className="text-xs text-gray-600">{label}</p>
              </div>
            ))}
          </div>
          {vehicle.out_of_service_units > 0 && vehicle.out_of_service_reason && (
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-800">Out of service:</span> {vehicle.out_of_service_reason}
            </p>
          )}

          {(vehicle.features.length > 0 || vehicle.seat_count) && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-900">Features</p>
              <div className="flex flex-wrap gap-2">
                {vehicle.seat_count ? (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">{vehicle.seat_count} Seats</span>
                ) : null}
                {vehicle.features.map((feature) => {
                  const Icon = FEATURE_ICONS[feature];
                  return (
                    <span key={feature} className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                      <Icon className="h-3.5 w-3.5" />
                      {VEHICLE_FEATURE_LABELS[feature]}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {vehicle.add_ons.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-900">Add-ons</p>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {vehicle.add_ons.map((addOn) => (
                  <li key={addOn.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-gray-800">{addOn.name}</span>
                    <span className="text-gray-600">
                      {addOn.is_included ? "Included" : `${formatNaira(addOn.price_per_day)} / day`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {vehicle.description && (
            <div>
              <p className="mb-1 text-sm font-medium text-gray-900">Description</p>
              <p className="whitespace-pre-line text-sm text-gray-600">{vehicle.description}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => onEditDetails(vehicle)}>
              <Pencil className="h-4 w-4" /> Edit details
            </Button>
            <Button className="flex-1 gap-2 bg-orange-600 hover:bg-orange-700" onClick={() => onEditAvailability(vehicle)}>
              <SlidersHorizontal className="h-4 w-4" /> Edit availability
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
