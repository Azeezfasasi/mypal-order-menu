"use client";

import { ArrowRight, BedDouble, Eye, Home, Lock, MoreVertical, Unlock, Users, type LucideIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { DayViewItem } from "@/types/beach-house-types";
import { badgeFor, formatNaira, highlightIcon } from "./beach-house-utils";

type Availability = { label: string; dot: string; pill: string };

export const dayAvailability = (item: DayViewItem): Availability => {
  if (item.status !== "PUBLISHED") return { label: "Not published", dot: "bg-gray-400", pill: "bg-gray-100 text-gray-600" };
  if (!item.is_available) return { label: "Blocked", dot: "bg-gray-400", pill: "bg-gray-100 text-gray-600" };
  if (item.bookings_on_date > 0)
    return { label: `${item.bookings_on_date} booked`, dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700" };
  return { label: "Available", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" };
};

interface BeachHouseDayCardProps {
  item: DayViewItem;
  /** Past days can't be blocked or opened */
  canToggle: boolean;
  isToggling: boolean;
  onToggle: (available: boolean) => void;
  onView: () => void;
}

export function BeachHouseDayCard({ item, canToggle, isToggling, onToggle, onView }: BeachHouseDayCardProps) {
  const badge = badgeFor(item.badge);
  const availability = dayAvailability(item);
  const specs: { icon: LucideIcon; label: string }[] = [
    ...(item.highlights ?? []).slice(0, 1).map((h) => ({ icon: highlightIcon(h), label: h })),
    ...(item.bedrooms ? [{ icon: BedDouble, label: `${item.bedrooms} Bedroom${item.bedrooms === 1 ? "" : "s"}` }] : []),
    ...(item.highlights ?? []).slice(1).map((h) => ({ icon: highlightIcon(h), label: h })),
  ].slice(0, 4);

  return (
    <div className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-3 pb-4 shadow-sm sm:gap-3">
      <div className="relative h-36 w-32 shrink-0 sm:h-32 sm:w-28">
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-gray-200 text-gray-400">
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <Home className="h-8 w-8" />
          )}
        </div>
        {badge && (
          <span className={cn("absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white", badge.className)}>
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-lg font-bold text-gray-900 sm:text-base">{item.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Actions for ${item.name}`}
                className="rounded p-0.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="mr-2 h-4 w-4" /> View bookings
              </DropdownMenuItem>
              {canToggle && (
                <DropdownMenuItem onClick={() => onToggle(!item.is_available)} disabled={isToggling}>
                  {item.is_available ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" /> Block this day
                    </>
                  ) : (
                    <>
                      <Unlock className="mr-2 h-4 w-4" /> Open this day
                    </>
                  )}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          {item.guest_capacity ? (
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <Users className="h-3.5 w-3.5" /> Up to {item.guest_capacity} guests
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Switch
              checked={item.is_available}
              disabled={!canToggle || isToggling}
              onCheckedChange={onToggle}
              aria-label={item.is_available ? "Block this day" : "Open this day"}
              className="data-[state=checked]:bg-emerald-600"
            />
            <span className={cn("flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", availability.pill)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", availability.dot)} />
              {availability.label}
            </span>
          </div>
        </div>

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

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <p className="whitespace-nowrap">
            <span className="text-lg font-bold text-orange-600 sm:text-base">{formatNaira(item.price?.amount)}</span>
            {item.price?.unit && <span className="text-xs text-gray-500"> / {item.price.unit}</span>}
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
