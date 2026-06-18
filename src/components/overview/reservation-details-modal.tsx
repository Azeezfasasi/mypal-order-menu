"use client";

import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Reservation as ReservationData } from "@/types/overview";
import { BusinessOverviewAndRevenueApi } from "@/services/api/business-overview-and-revenue-api";
import { ReservationStatus } from "@/types/enums";

interface ReservationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationData | null;
}

export function ReservationDetailsModal({
  isOpen,
  onClose,
  reservation,
}: ReservationDetailsModalProps) {
  const updateStatus =
    BusinessOverviewAndRevenueApi.useUpdateReservationStatus();

  if (!reservation) return null;

  const handleStatusChange = (status: ReservationStatus) => {
    // Map ReservationStatus to accept/decline
    let accept = false;
    let decline = false;
    if (status === ReservationStatus.BOOKED) accept = true;
    if (status === ReservationStatus.CANCELLED) decline = true;
    // Pending means both false
    updateStatus.mutate({
      id: reservation.details.id,
      status: { accept, decline },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
        <DialogHeader className="flex flex-row items-center justify-between mb-6">
          <DialogTitle className="text-lg font-semibold">
            Reservation details
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Customer&apos;s name</span>
            <span className="font-medium">{`${reservation.user.firstname} ${reservation.user.lastname}`}</span>
          </div>

          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Ticket ID</span>
            <span className="font-medium">
              {reservation.details.reservation_id}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Date of order</span>
            <span className="font-medium">{reservation.details.date}</span>
          </div>

          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Reservation status</span>
            <span className="font-medium">{reservation.status}</span>
          </div>
        </div>

        {reservation.status === ReservationStatus.PENDING && (
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleStatusChange(ReservationStatus.CANCELLED)}
              disabled={updateStatus.isPending}
            >
              Decline
            </Button>
            <Button
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              onClick={() => handleStatusChange(ReservationStatus.BOOKED)}
              disabled={updateStatus.isPending}
            >
              Accept
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
