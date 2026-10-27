"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobilityApi } from "@/services/api/mobility-api";
import type { MobilityBooking } from "@/types/mobility-types";

interface BookingNoteDialogProps {
  booking: MobilityBooking | null;
  /** "cancel" asks for the required cancellation reason; "note" saves an internal note */
  mode: "cancel" | "note";
  onOpenChange: (open: boolean) => void;
}

export function BookingNoteDialog({ booking, mode, onOpenChange }: BookingNoteDialogProps) {
  const [text, setText] = useState("");
  const update = MobilityApi.useUpdateBookingStatus();
  const isCancel = mode === "cancel";

  useEffect(() => {
    if (booking) setText(isCancel ? "" : booking.notes ?? "");
  }, [booking, isCancel]);

  const submit = () => {
    if (!booking || !text.trim()) return;
    update.mutate(
      {
        id: booking.id,
        payload: isCancel
          ? { status: "CANCELLED", cancellation_reason: text.trim() }
          : { notes: text.trim() },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={!!booking} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isCancel ? "Cancel booking" : "Add note"}</DialogTitle>
          <DialogDescription>
            {isCancel
              ? `Booking ${booking?.reference} will be cancelled. This can't be undone.`
              : `Internal note for booking ${booking?.reference}. Riders don't see it.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>{isCancel ? "Reason for cancelling" : "Note"}</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isCancel ? "e.g. Customer cancelled via phone" : "e.g. Guest needs a child seat"}
            className="min-h-24"
          />
        </div>
        <DialogFooter className="gap-2 sm:flex-col-reverse">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isCancel ? "Keep booking" : "Close"}
          </Button>
          <Button
            className={isCancel ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}
            disabled={!text.trim() || update.isPending}
            onClick={submit}
          >
            {update.isPending ? "Saving…" : isCancel ? "Cancel booking" : "Save note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
