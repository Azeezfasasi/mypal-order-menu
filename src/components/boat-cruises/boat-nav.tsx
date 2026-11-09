"use client";

import { createContext, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";

/**
 * Where the boat screens go. business-admin uses routes; internal-admin's
 * managed-business page has no sub-routes, so it provides its own (in-place views).
 */
export interface BoatNav {
  /** Boats list (Services and Offerings) */
  boats: () => void;
  /** Add (null) or edit a boat; step is the wizard step to open */
  openBoat: (id: string | null, step?: number) => void;
  /** Bookings list */
  bookings: () => void;
  openBooking: (id: string) => void;
}

export const BoatNavContext = createContext<BoatNav | null>(null);

export const useBoatNav = (): BoatNav => {
  const provided = useContext(BoatNavContext);
  const router = useRouter();
  return useMemo(
    () =>
      provided ?? {
        boats: () => router.push("/dashboard"),
        openBoat: (id, step) =>
          router.push(`/offerings/boat-cruises/${id ?? "new"}${step !== undefined ? `?step=${step}` : ""}`),
        bookings: () => router.push("/boat-cruises?tab=bookings"),
        openBooking: (id) => router.push(`/boat-cruises/bookings/${id}`),
      },
    [provided, router]
  );
};
