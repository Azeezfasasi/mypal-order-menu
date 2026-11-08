"use client";

import { use } from "react";
import { BookingDetailView } from "@/components/beach-houses/BookingDetailView";

export default function BeachHouseBookingRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BookingDetailView id={id} />;
}
