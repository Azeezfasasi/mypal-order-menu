"use client";

import { Car, CarFront, Truck, type LucideIcon } from "lucide-react";
import type { MobilityCategory } from "@/types/mobility-types";
import { useMobilityCategories } from "./use-mobility-category";

const ICONS: Record<MobilityCategory, LucideIcon> = {
  IN_CITY: Car,
  LUXURY_RENTALS: CarFront,
  HOUSEHOLD_LOGISTICS: Truck,
};

/** Tab for the business's own mobility category */
export function MobilityCategoryTabs() {
  const categories = useMobilityCategories();

  return (
    <div className="flex gap-3 overflow-x-auto border-b border-gray-200 md:gap-2">
      {categories.map(({ id, label }) => {
        const Icon = ICONS[id];
        return (
          <div
            key={id}
            className="flex min-w-[140px] items-center justify-center gap-2 whitespace-nowrap rounded-t-lg border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-medium text-blue-900 md:min-w-0 md:px-3"
          >
            <Icon className="h-4 w-4 text-blue-600" />
            {label}
          </div>
        );
      })}
    </div>
  );
}
