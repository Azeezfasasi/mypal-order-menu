"use client";

import AccommodationBasedOfferings from "../shared/accommodation-based-offerings";

/**
 * Shortlet offerings component using the shared accommodation-based offering structure.
 * Shortlets support: Accommodations, Attractions/Amenities, and Transaction settings.
 */
export default function ShortletOfferingsContent() {
  return (
    <AccommodationBasedOfferings
      accommodationTitle="Accommodations"
      attractionTitle="Attractions"
    />
  );
}
