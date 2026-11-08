import { cn } from "@/lib/utils";
import { BOOKING_STATUS_LABELS, type BookingStatus } from "@/types/beach-house-types";
import { STATUS_STYLES } from "./booking-utils";

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[status])}>
      {BOOKING_STATUS_LABELS[status] ?? status}
    </span>
  );
}
