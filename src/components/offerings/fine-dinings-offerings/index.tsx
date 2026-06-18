// FineDiningOfferingsContent.tsx
"use client";

import { MenuSection } from "./menu-section";

import AttractionsManagement from "@/components/offerings/shared/attraction-management";
import { ExperiencesSection } from "../shared/experiences-section";
import BusinessTransactionInformation from "../shared/transaction-settings-section";
import FineDiningCuisineManagement from "./cuisine";
import OccasionsAndCancellationSection from "./occasions-cancellation-section";

export default function FineDiningOfferingsContent() {
  return (
    <div className="space-y-6">
      {/* Fine Dining Cuisine Management Section */}
      <FineDiningCuisineManagement />

      {/* Menu Section - Now completely self-contained */}
      <MenuSection />

      {/* Experiences Section - Now completely self-contained */}
      <ExperiencesSection />

      <AttractionsManagement />

      {/* Occasions and Cancellation Policy Section */}
      <OccasionsAndCancellationSection />

      {/* Transaction Information Section */}
      <BusinessTransactionInformation />
    </div>
  );
}
