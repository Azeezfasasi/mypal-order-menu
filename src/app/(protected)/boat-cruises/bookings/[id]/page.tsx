"use client";

import { use } from "react";
import { BoatBookingDetail } from "@/components/boat-cruises/BoatBookingDetail";

export default function BoatBookingRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BoatBookingDetail id={id} />;
}
