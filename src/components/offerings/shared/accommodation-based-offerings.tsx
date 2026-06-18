"use client";

import { ReactNode } from "react";
import AccommodationList from "../shortlet-offerings/AccommodationList";
import AttractionsManagement from "./attraction-management";
import BusinessTransactionInformation from "./transaction-settings-section";

interface AccommodationBasedOfferingsProps {
  /**
   * Optional sections to render before the standard sections.
   * Useful for activities, tickets, or other category-specific features
   */
  topSections?: ReactNode;

  /**
   * Title for the accommodations section
   */
  accommodationTitle?: string;

  /**
   * Title for the attractions/amenities section
   */
  attractionTitle?: string;
}

/**
 * Generic component for offerings that support accommodations and attractions.
 * Used by: Beaches & Resorts, Shortlets, Parks & Recreation, Hotel Experience
 *
 * This component combines:
 * - Top sections (for category-specific features like activities, tickets)
 * - Attractions/Amenities management
 * - Accommodations management
 * - Transaction/business settings
 */
export default function AccommodationBasedOfferings({
  topSections,
  accommodationTitle,
  attractionTitle,
}: AccommodationBasedOfferingsProps) {
  return (
    <div className="space-y-8 min-h-screen rounded-lg">
      {/* Top sections (e.g., Activities, Visiting Tickets for Beaches & Resorts) */}
      {topSections}

      {/* Attractions/Amenities Section */}
      <AttractionsManagement sectionTitle={attractionTitle} />

      {/* Accommodations Section */}
      <AccommodationList sectionTitle={accommodationTitle} />

      {/* Transaction Information Section */}
      <BusinessTransactionInformation />
    </div>
  );
}
