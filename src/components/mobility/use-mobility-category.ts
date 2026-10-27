"use client";

import { useAuthStore } from "@/stores/auth-store";
import {
  MOBILITY_BUSINESS_CATEGORIES,
  MOBILITY_CATEGORIES,
  type MobilityCategory,
} from "@/types/mobility-types";

/** The mobility category of the logged-in business (In-City Rides, Luxury on Demand or Household Logistics) */
export function useMobilityCategory(): MobilityCategory {
  const businessType = useAuthStore((state) => state.business?.category?.business_type);
  // The route guard only lets mobility businesses in; In-City is a safe fallback
  return (businessType && MOBILITY_BUSINESS_CATEGORIES[businessType]) || "IN_CITY";
}

/** The business only manages its own category, so this is a single entry */
export function useMobilityCategories() {
  const category = useMobilityCategory();
  return MOBILITY_CATEGORIES.filter((c) => c.id === category);
}
