import { cn } from "@/lib/utils";
import {
  BOOKING_STATUS_LABELS,
  TRIP_TYPE_LABELS,
  type MobilityBookingStatus,
  type MobilityTripType,
} from "@/types/mobility-types";
import { STATUS_STYLES, TRIP_TYPE_STYLES } from "./mobility-utils";

export function BookingStatusBadge({ status, className }: { status: MobilityBookingStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}

export function TripTypeBadge({ tripType }: { tripType?: MobilityTripType }) {
  if (!tripType) return <span className="text-gray-400">—</span>;
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium",
        TRIP_TYPE_STYLES[tripType]
      )}
    >
      {TRIP_TYPE_LABELS[tripType]}
    </span>
  );
}
