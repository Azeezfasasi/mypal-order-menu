"use client";

import Link from "next/link";
import { Ban, Eye, MoreVertical, StickyNote, UserRoundCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobilityApi } from "@/services/api/mobility-api";
import type { MobilityBooking } from "@/types/mobility-types";
import { canCancel, NEXT_STATUS } from "./mobility-utils";

interface BookingActionsMenuProps {
  booking: MobilityBooking;
  onAssignDriver: (booking: MobilityBooking) => void;
  onCancel: (booking: MobilityBooking) => void;
  onAddNote: (booking: MobilityBooking) => void;
}

export function BookingActionsMenu({ booking, onAssignDriver, onCancel, onAddNote }: BookingActionsMenuProps) {
  const update = MobilityApi.useUpdateBookingStatus();
  const next = NEXT_STATUS[booking.status];
  const isClosed = !canCancel(booking.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Actions for booking ${booking.reference}`}
          onClick={(e) => e.stopPropagation()}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem asChild>
          <Link href={`/mobility/bookings/${booking.id}`}>
            <Eye className="mr-2 h-4 w-4" /> View details
          </Link>
        </DropdownMenuItem>
        {next && (
          <DropdownMenuItem
            disabled={update.isPending}
            onClick={() => update.mutate({ id: booking.id, payload: { status: next.status } })}
          >
            {next.label}
          </DropdownMenuItem>
        )}
        {!isClosed && (
          <DropdownMenuItem onClick={() => onAssignDriver(booking)}>
            <UserRoundCog className="mr-2 h-4 w-4" />
            {booking.driver ? "Change chauffeur" : "Assign chauffeur"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onAddNote(booking)}>
          <StickyNote className="mr-2 h-4 w-4" /> Add note
        </DropdownMenuItem>
        {!isClosed && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onCancel(booking)}>
              <Ban className="mr-2 h-4 w-4" /> Cancel booking
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
