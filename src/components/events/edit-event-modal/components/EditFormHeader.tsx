"use client";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { getRandomDummyEvent } from "@/data/event-dummy-data";
import { __DEV__ } from "@/lib/utils";
import { EventClass } from "@/types/enums";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { EventFormValues } from "../../create-event-modal/types";

interface EditFormHeaderProps {
  eventClass: EventClass;
  onClose: () => void;
  form: UseFormReturn<EventFormValues>;
  eventTitle: string;
}

export const EditFormHeader = ({
  eventClass,
  form,
  eventTitle,
}: EditFormHeaderProps) => {
  const handleFillDemoData = () => {
    const dummyData = getRandomDummyEvent();
    // Fill all form fields except image and preserve current values for key fields
    Object.entries(dummyData).forEach(([key, value]) => {
      if (key !== "image" && key !== "event_title") {
        form.setValue(key as keyof EventFormValues, value.toString());
      }
    });
    toast.success("Form updated with demo data!");
  };

  return (
    <div className="flex flex-row sm:flex-col sm:items-center justify-between mb-6 gap-0 sm:gap-3">
      <div className="space-y-1 flex flex-row sm:flex-col gap-2 sm:items-center">
        <h2 className="text-2xl sm:text-xl font-semibold">Edit Event</h2>
        <div className="flex flex-col sm:items-center gap-1">
          <StatusBadge variant={"soft-default"} className="capitalize w-fit">
            {eventClass}
          </StatusBadge>
          <p className="text-sm text-gray-600 truncate max-w-[200px] sm:max-w-none">
            {eventTitle}
          </p>
        </div>
      </div>
      {__DEV__ && (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFillDemoData}
            type="button"
            className="text-sm sm:text-xs"
          >
            Fill Demo Data
          </Button>
        </div>
      )}
    </div>
  );
};
