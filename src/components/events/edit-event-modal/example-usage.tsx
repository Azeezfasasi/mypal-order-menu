// Example usage of EditEventModal
import { Button } from "@/components/ui/button";
import { IEvent } from "@/types/event-types";
import React, { useState } from "react";
import EditEventModal from "./EditEventModal";

interface ExampleUsageProps {
  event: IEvent;
  onEventUpdated: () => void; // Callback to refresh data after update
}

export const ExampleUsage: React.FC<ExampleUsageProps> = ({
  event,
  onEventUpdated,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleEventUpdated = () => {
    onEventUpdated(); // Trigger refresh/refetch in parent component
    setIsEditModalOpen(false);
  };

  return (
    <>
      <Button onClick={handleOpenEditModal}>Edit Event</Button>

      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        event={event}
        onSuccess={handleEventUpdated}
      />
    </>
  );
};
