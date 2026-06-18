"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EventApi } from "@/services/api/business-events-api";
import { BaseError } from "@/types/api";
import { IEventListItem } from "@/types/event-types";
import { toast } from "sonner";

interface DeleteEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: IEventListItem;
  onSuccess: () => void;
}

export default function DeleteEventDialog({
  isOpen,
  onClose,
  event,
  onSuccess,
}: DeleteEventDialogProps) {
  const deleteEventMutation = EventApi.useDeleteEvent();

  const handleDelete = async () => {
    toast.promise(deleteEventMutation.mutateAsync(event.id), {
      loading: "Deleting event...",
      success: () => {
        onSuccess();
        onClose();
        return "Event deleted successfully";
      },
      error: (error: BaseError) => {
        // Prioritize API error message
        const apiMessage =
          error?.response?.data?.message || error?.message || "Unknown error";
        return `Failed to delete event: ${apiMessage}`;
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Event</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the event &quot;{event.event_title}
            &quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteEventMutation.isPending}
          >
            {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
