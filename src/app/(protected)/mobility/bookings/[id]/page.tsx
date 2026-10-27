"use client";

import { useParams } from "next/navigation";
import MobilityBookingDetails from "@/components/mobility/MobilityBookingDetails";

export default function MobilityBookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  return <MobilityBookingDetails id={id} />;
}
