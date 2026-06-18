import React from "react";
import ClubManagement from "./club-management";
// import { ExperiencesSection } from "../shared/experiences-section";
import AttractionsManagement from "@/components/offerings/shared/attraction-management";
import ClubOccasionsAndCancellationSection from "./occasions-cancellation-section";
import ClubReservationsSection from "./reservations-section";
import BusinessTransactionInformation from "../shared/transaction-settings-section";
import ClubCategory from "./club-category";

export default function ClubOfferingsContent() {
  return (
    <div className="space-y-6">
      {/* Category section */}
      <ClubCategory />
      
      {/* Club Management Section */}
      <ClubManagement />

      {/* Reservations Section */}
      <ClubReservationsSection />

      {/* Attractions Management */}
      <AttractionsManagement />

      {/* Occasions and Cancellation Policy Section */}
      <ClubOccasionsAndCancellationSection />

      {/* Transaction Information Section */}
      <BusinessTransactionInformation />
    </div>
  );
}

