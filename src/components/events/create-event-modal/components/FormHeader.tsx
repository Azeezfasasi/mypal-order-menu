"use client";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { getRandomDummyEvent } from "@/data/event-dummy-data";
import { __DEV__ } from "@/lib/utils";
import { EventClass } from "@/types/enums";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { EventFormAgenda, EventFormBenefit, EventFormValues } from "../types";

interface FormHeaderProps {
  eventClass: EventClass;
  onClose: () => void;
  form: UseFormReturn<EventFormValues>;
}

export const FormHeader = ({ eventClass, form }: FormHeaderProps) => {
  const handleFillDemoData = () => {
    const dummyData = getRandomDummyEvent();

    // Fill all form fields except image
    Object.entries(dummyData).forEach(([key, value]) => {
      if (key !== "image") {
        // Handle benefits and agendas arrays specially to ensure proper structure
        if (key === "benefits" && Array.isArray(value)) {
          const benefitsWithTitles = value.map((benefit) => ({
            title: (benefit as EventFormBenefit).title || "",
            description: (benefit as EventFormBenefit).description || "",
          }));
          form.setValue("benefits", benefitsWithTitles);
        } else if (key === "agendas" && Array.isArray(value)) {
          const agendasWithDescriptions = value.map((agenda) => ({
            title: (agenda as EventFormAgenda).title || "",
            description: (agenda as EventFormAgenda).description || "",
            event_id: (agenda as EventFormAgenda).event_id || "",
            agendaType: (agenda as EventFormAgenda).agendaType,
          }));
          form.setValue("agendas", agendasWithDescriptions);
        } else {
          form.setValue(key as keyof EventFormValues, value);
        }
      }
    });

    toast.success("Form filled with demo data!");
  };

  return (
    <div className="flex flex-row sm:flex-col sm:items-center justify-between mb-6 gap-0 sm:gap-3">
      <div className="space-y-1 flex flex-row sm:flex-col gap-2 sm:items-center">
        <h2 className="text-2xl sm:text-xl font-semibold">Create Event</h2>
        <StatusBadge variant={"soft-default"} className="capitalize w-fit">
          {eventClass}
        </StatusBadge>
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
