"use client";

import AccommodationBasedOfferings from "../shared/accommodation-based-offerings";
import ActivitiesSection from "./activities-section";
import VisitingTicketsSection from "./visiting-tickets";

/**
 * Beaches & Resorts offerings component using the shared accommodation-based offering structure.
 * Beaches & Resorts have additional sections:
 * - Visiting Tickets (unique ticketing system for entry)
 * - Activities (unique activity pricing structure)
 * Plus the standard: Accommodations, Attractions/Amenities, and Transaction settings.
 */
export default function BeachesResortOfferingsContent() {
  return (
    <AccommodationBasedOfferings
      topSections={
        <>
          {/* Visiting Tickets Section */}
          <VisitingTicketsSection />

          {/* Activities Section */}
          <ActivitiesSection />
        </>
      }
      accommodationTitle="Accommodations"
      attractionTitle="Atractions & Amenities"
    />
  );
}
