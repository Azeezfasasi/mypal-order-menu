"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronRight } from "lucide-react";

type Step = "basic" | "datetime" | "tickets" | "additional";

interface StepErrors {
  [stepName: string]: {
    [fieldName: string]: string;
  };
}

interface ErrorSummaryProps {
  stepErrors: StepErrors;
  onStepClick: (step: Step) => void;
  availableSteps: Step[];
}

export const ErrorSummary = ({
  stepErrors,
  onStepClick,
  availableSteps,
}: ErrorSummaryProps) => {
  console.log("📝 ErrorSummary received stepErrors:", stepErrors);
  console.log("🔢 ErrorSummary received availableSteps:", availableSteps);

  const hasErrors = Object.keys(stepErrors).length > 0;
  console.log("❓ ErrorSummary hasErrors:", hasErrors);

  if (!hasErrors) {
    console.log("✅ ErrorSummary: No errors, returning null");
    return null;
  }

  const getStepDisplayName = (step: Step): string => {
    switch (step) {
      case "basic":
        return "Basic Information";
      case "datetime":
        return "Date & Time";
      case "tickets":
        return "Tickets";
      case "additional":
        return "Additional Details";
      default:
        return step;
    }
  };

  const getFieldDisplayName = (fieldName: string): string => {
    const fieldMap: { [key: string]: string } = {
      event_title: "Event Title",
      location: "Location",
      event_type: "Event Type",
      event_class: "Event Class",
      about: "Description",
      is_eighten_plus: "Adult Content (18+)",
      image: "Event Image",
      start_date: "Start Date",
      end_date: "End Date",
      start_time: "Start Time",
      end_time: "End Time",
      duration: "Duration",
      tickets: "Tickets",
      benefits: "Event Benefits",
      agendas: "Event Agenda",
      flyer_url: "Flyer Image",
      flyer_cta: "Flyer Call to Action",
    };

    // Handle nested field paths like "tickets.0.ticket_name"
    if (fieldName.includes(".")) {
      const parts = fieldName.split(".");
      if (parts[0] === "tickets" && parts[2] === "ticket_name") {
        return `Ticket ${parseInt(parts[1]) + 1} Name`;
      }
      if (parts[0] === "tickets" && parts[2] === "price") {
        return `Ticket ${parseInt(parts[1]) + 1} Price`;
      }
      if (parts[0] === "benefits" && parts[2] === "description") {
        return `Benefit ${parseInt(parts[1]) + 1}`;
      }
      if (parts[0] === "agendas" && parts[2] === "title") {
        return `Agenda Item ${parseInt(parts[1]) + 1} Title`;
      }
    }

    return fieldMap[fieldName] || fieldName;
  };

  return (
    <div className="mb-6 p-4 border border-red-200 rounded-lg bg-red-50">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <h3 className="font-medium text-red-800">
          Please fix the following errors:
        </h3>
      </div>

      <div className="space-y-3">
        {availableSteps.map((step) => {
          const stepErrorsForStep = stepErrors[step];
          if (
            !stepErrorsForStep ||
            Object.keys(stepErrorsForStep).length === 0
          ) {
            return null;
          }

          return (
            <div key={step} className="space-y-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onStepClick(step)}
                className="flex items-center gap-2 text-red-700 hover:text-red-800 font-medium p-0 h-auto hover:bg-transparent"
              >
                <span>❌ {getStepDisplayName(step)}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <div className="ml-4 space-y-1">
                {Object.entries(stepErrorsForStep).map(
                  ([fieldName, errorMessage]) => (
                    <div key={fieldName} className="text-sm text-red-600">
                      •{" "}
                      <span className="font-medium">
                        {getFieldDisplayName(fieldName)}:
                      </span>{" "}
                      {errorMessage}
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
