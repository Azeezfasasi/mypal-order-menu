"use client";

import CancellationPolicySection from "../shared/CancellationPolicySection";
import OccasionsSection from "./OccasionsSection";

export default function OccasionsAndCancellationSection() {
  return (
    <div className="space-y-6">
      <OccasionsSection />
      <CancellationPolicySection />
    </div>
  );
}
