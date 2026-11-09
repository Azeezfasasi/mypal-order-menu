"use client";

import { ArrowRight, Clock, Eye, Lock, MapPin, MoreVertical, Ship, Unlock, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { BoatDayItem } from "@/types/boat-cruise-types";
import { formatDuration, formatNaira } from "./boat-utils";

const BADGES: Record<string, { label: string; className: string }> = {
  POPULAR: { label: "Popular", className: "bg-orange-600" },
  MOST_BOOKED: { label: "Most Booked", className: "bg-orange-600" },
  NEW: { label: "New", className: "bg-blue-600" },
  PREMIUM: { label: "Premium", className: "bg-violet-600" },
};

const badgeFor = (badge?: string | null) =>
  !badge
    ? null
    : (BADGES[badge] ?? {
        label: badge.toLowerCase().split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        className: "bg-gray-800",
      });

type Availability = { label: string; dot: string; pill: string };

export const boatAvailability = (item: BoatDayItem): Availability => {
  if (!item.is_active) return { label: "Paused", dot: "bg-gray-400", pill: "bg-gray-100 text-gray-600" };
  if (!item.available_on_date) return { label: item.unavailable_reason || "Unavailable", dot: "bg-gray-400", pill: "bg-gray-100 text-gray-600" };
  if (item.bookings_count > 0) return { label: `${item.bookings_count} booked`, dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700" };
  return { label: "Available", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" };
};

/** "2h" / "30 mins" for the price unit */
const shortDuration = (minutes?: number | null) =>
  !minutes ? "" : minutes < 60 ? `${minutes} mins` : `${Number.isInteger(minutes / 60) ? minutes / 60 : (minutes / 60).toFixed(1)}h`;

interface BoatDayCardProps {
  item: BoatDayItem;
  /** Past days can't be blocked or opened */
  canBlock: boolean;
  isToggling: boolean;
  onToggleActive: (active: boolean) => void;
  onToggleDay: () => void;
  onView: () => void;
}

export function BoatDayCard({ item, canBlock, isToggling, onToggleActive, onToggleDay, onView }: BoatDayCardProps) {
  const badge = badgeFor(item.badge);
  const availability = boatAvailability(item);
  const dayBlocked = item.is_active && !item.available_on_date;

  return (
    <div className="flex gap-4 rounded-2xl bg-gray-50 p-3 pb-4 sm:gap-3">
      <div className="relative h-32 w-32 shrink-0 sm:h-28 sm:w-28">
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-gray-200 text-gray-400">
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <Ship className="h-8 w-8" />
          )}
        </div>
        {badge && <span className={cn("absolute -left-1 -top-1 rounded-md px-2 py-1 text-xs font-medium italic text-white", badge.className)}>{badge.label}</span>}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-end gap-2">
          <Switch
            checked={item.is_active}
            disabled={isToggling}
            onCheckedChange={onToggleActive}
            aria-label={item.is_active ? "Pause bookings" : "Take bookings"}
            className="data-[state=checked]:bg-emerald-600"
          />
          <span className={cn("flex max-w-[140px] items-center gap-1.5 truncate rounded-full px-2 py-0.5 text-xs font-medium", availability.pill)}>
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", availability.dot)} />
            <span className="truncate">{availability.label}</span>
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label={`Actions for ${item.name}`} className="rounded p-0.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="mr-2 h-4 w-4" /> View bookings
              </DropdownMenuItem>
              {canBlock && item.is_active && (
                <DropdownMenuItem onClick={onToggleDay}>
                  {dayBlocked ? (
                    <>
                      <Unlock className="mr-2 h-4 w-4" /> Open this day
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" /> Block this day
                    </>
                  )}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="mt-1 flex min-w-0 items-baseline gap-1.5">
          <span className="truncate text-lg font-bold text-gray-900">{item.name}</span>
          {item.boat_type && <span className="shrink-0 text-xs text-gray-500">{item.boat_type}</span>}
        </h3>

        <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-600">
          <span className="truncate">{item.boat_type ?? (item.vessel_class === "YACHT" ? "Yacht" : "Boat")}</span>
          {item.departure_location ? (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{item.departure_location}</span>
            </span>
          ) : (
            <span />
          )}
          {item.capacity ? (
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>
                <span className="font-semibold text-gray-900">{item.capacity} seats</span>
                <span className="block text-[10px] text-gray-400">Max {item.capacity} people</span>
              </span>
            </span>
          ) : null}
          {item.min_duration_minutes ? (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                <span className="font-semibold text-gray-900">{formatDuration(item.min_duration_minutes).replace(" Hours", " hrs").replace(" Hour", " hr").replace(" Minutes", " mins")}</span>
                <span className="block text-[10px] text-gray-400">Min. duration</span>
              </span>
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <p className="whitespace-nowrap">
            <span className="text-lg font-bold text-orange-600">{formatNaira(item.price?.amount)}</span>
            {item.price?.duration_minutes ? <span className="text-sm text-gray-700"> / {shortDuration(item.price.duration_minutes)}</span> : null}
          </p>
          <button type="button" onClick={onView} className="flex items-center gap-1.5 rounded-md bg-orange-50 px-2.5 py-1 text-sm text-orange-600 hover:bg-orange-100">
            View Details <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
