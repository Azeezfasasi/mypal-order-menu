import { cn } from "@/lib/utils";
import { BOAT_BOOKING_STATUS_LABELS, type BoatBookingStatus } from "@/types/boat-cruise-types";
import { BOOKING_STATUS_STYLES } from "./boat-utils";

export function BoatBookingStatusBadge({ status }: { status: BoatBookingStatus }) {
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium", BOOKING_STATUS_STYLES[status])}>
      {BOAT_BOOKING_STATUS_LABELS[status] ?? status}
    </span>
  );
}
