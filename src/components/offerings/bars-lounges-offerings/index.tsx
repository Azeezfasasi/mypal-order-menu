"use client";

import React from "react";
import AttractionsManagement from "@/components/offerings/shared/attraction-management";
import CancellationPolicySection from "@/components/offerings/shared/CancellationPolicySection";
import ReservationsManagement from "@/components/offerings/bars-lounges-offerings/reservations-management";
import BarsLoungesCategory from "@/components/offerings/bars-lounges-offerings/bars-lounges-category";
import BusinessTransactionInformation from "../shared/transaction-settings-section";

export default function BarsLoungesOfferingsContent() {
  return (
    <div className="space-y-6">
      {/* Category Section */}
      <BarsLoungesCategory />

      {/* Bar and Lounge Reservations Management */}
      <ReservationsManagement />

      {/* Attractions Management */}
      <AttractionsManagement />

      {/* Cancellation Policy Section */}
      <CancellationPolicySection />

      {/* Transaction Information Section */}
      <BusinessTransactionInformation />
    </div>
  );
}
