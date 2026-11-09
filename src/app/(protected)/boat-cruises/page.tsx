"use client";

import { useSearchParams } from "next/navigation";
import { BOAT_TABS, BoatCruisesPage, type BoatTab } from "@/components/boat-cruises/BoatCruisesPage";

export default function BoatCruisesRoute() {
  const tab = useSearchParams().get("tab");
  const initialTab = BOAT_TABS.some((t) => t.id === tab) ? (tab as BoatTab) : "bookings";
  return <BoatCruisesPage key={initialTab} initialTab={initialTab} />;
}
