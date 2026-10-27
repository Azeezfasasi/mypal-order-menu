"use client";

import {
  ArrowRight,
  Armchair,
  Car,
  MapPin,
  MoreVertical,
  Music,
  Pencil,
  ShieldCheck,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { VEHICLE_FEATURE_LABELS, type MobilityVehicle, type VehicleFeature } from "@/types/mobility-types";
import { formatNaira, vehicleName } from "./mobility-utils";

export const FEATURE_ICONS: Record<VehicleFeature, LucideIcon> = {
  AC: Snowflake,
  CHAUFFEUR: ShieldCheck,
  PREMIUM_INTERIOR: Sparkles,
  GPS: MapPin,
  MUSIC_SYSTEM: Music,
};

type Availability = { label: string; dot: string; pill: string };

export const vehicleAvailability = (vehicle: MobilityVehicle): Availability => {
  if (!vehicle.is_active) return { label: "Unavailable", dot: "bg-gray-400", pill: "bg-gray-100 text-gray-600" };
  if (vehicle.available_units <= 0) return { label: "Fully Booked", dot: "bg-red-500", pill: "bg-red-50 text-red-600" };
  return { label: "Available", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" };
};

/** Price after the vehicle's discount, in naira */
export const discountedPrice = (vehicle: MobilityVehicle) =>
  vehicle.discount_percentage ? vehicle.base_price * (1 - vehicle.discount_percentage / 100) : vehicle.base_price;

interface VehicleCardProps {
  vehicle: MobilityVehicle;
  isMostBooked: boolean;
  isToggling: boolean;
  onToggleActive: (isActive: boolean) => void;
  onView: () => void;
  onEditAvailability: () => void;
  onEditDetails: () => void;
}

export function VehicleCard({
  vehicle,
  isMostBooked,
  isToggling,
  onToggleActive,
  onView,
  onEditAvailability,
  onEditDetails,
}: VehicleCardProps) {
  const image = vehicle.gallery_images[0];
  const availability = vehicleAvailability(vehicle);
  const specs: { icon: LucideIcon; label: string }[] = [
    ...vehicle.features.slice(0, 2).map((f) => ({ icon: FEATURE_ICONS[f], label: VEHICLE_FEATURE_LABELS[f] })),
    ...(vehicle.seat_count ? [{ icon: Armchair, label: `${vehicle.seat_count} Seats` }] : []),
    ...vehicle.features.slice(2).map((f) => ({ icon: FEATURE_ICONS[f], label: VEHICLE_FEATURE_LABELS[f] })),
  ].slice(0, 4);

  return (
    <div className="flex gap-4 rounded-2xl bg-gray-50 p-3 pb-4 sm:gap-3">
      <div className="relative h-32 w-32 shrink-0 sm:h-28 sm:w-28">
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-gray-200 text-gray-400">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={vehicleName(vehicle)} className="h-full w-full object-cover" />
          ) : (
            <Car className="h-8 w-8" />
          )}
        </div>
        {vehicle.discount_percentage ? (
          <span className="absolute -left-1 -top-1 rounded-md bg-blue-700 px-2 py-1 text-xs font-bold text-white">
            {vehicle.discount_percentage}% Off
          </span>
        ) : (
          isMostBooked && (
            <span className="absolute -left-1 -top-1 rounded-md bg-orange-600 px-2 py-1 text-xs font-medium italic text-white">
              Most Booked
            </span>
          )
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-end gap-2">
          <Switch
            checked={vehicle.is_active}
            disabled={isToggling}
            onCheckedChange={onToggleActive}
            aria-label={vehicle.is_active ? "Block bookings" : "Allow bookings"}
            className="data-[state=checked]:bg-emerald-600"
          />
          <span className={cn("flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", availability.pill)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", availability.dot)} />
            {availability.label}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Actions for ${vehicleName(vehicle)}`}
                className="rounded p-0.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEditAvailability}>
                <SlidersHorizontal className="mr-2 h-4 w-4" /> Edit availability
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEditDetails}>
                <Pencil className="mr-2 h-4 w-4" /> Edit vehicle details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="mt-1 truncate text-lg font-bold text-gray-900">{vehicleName(vehicle)}</h3>
        <p className="text-xs text-gray-500">
          {vehicle.available_units} of {vehicle.total_units} available · {vehicle.plate_number}
        </p>

        {specs.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {specs.map(({ icon: Icon, label }) => (
              <span key={label} className="flex min-w-0 items-center gap-1.5 text-xs text-gray-600">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <p className="whitespace-nowrap">
            <span className="text-lg font-bold text-orange-600">{formatNaira(discountedPrice(vehicle))}</span>
            <span className="text-sm text-gray-700"> / 24h</span>
          </p>
          <button
            type="button"
            onClick={onView}
            className="flex items-center gap-1.5 rounded-md bg-orange-50 px-2.5 py-1 text-sm text-orange-600 hover:bg-orange-100"
          >
            View Details <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
