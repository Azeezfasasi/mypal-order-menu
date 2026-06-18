import { EventClass, EventType } from "@/types/enums";
import { EventFormValues, Step, StepValidationResult } from "../types";

/**
 * Validates if a step can proceed based on its specific requirements
 */
export const validateStepCanProceed = (
  currentStep: Step,
  data: EventFormValues,
  existingEvent?: { flyer_url?: string | null }
): StepValidationResult => {
  console.log("🔍 validateStepCanProceed: Step:", currentStep);
  console.log("📊 validateStepCanProceed: Data:", data);
  console.log(
    "🏞️ validateStepCanProceed: Existing flyer:",
    existingEvent?.flyer_url
  );

  switch (currentStep) {
    case "basic":
      console.log("🔍 Basic step validation:");
      console.log(
        "  - event_title:",
        `"${data.event_title}"`,
        !!data.event_title
      );
      console.log("  - location:", `"${data.location}"`, !!data.location);
      console.log("  - about:", `"${data.about}"`, !!data.about);

      // Basic validation criteria - only validate fields on this step
      // Images are handled on the datetime step, not here
      const basicCriteria = !!(
        data.event_title?.trim() &&
        data.location?.trim() &&
        data.about?.trim()
      );

      const canProceedBasic = basicCriteria;

      console.log("✅ Basic step canProceed:", canProceedBasic);

      let validationMessage = "Please fill in all required basic information";
      if (!data.event_title?.trim()) {
        validationMessage = "Please enter an event title";
      } else if (!data.location?.trim()) {
        validationMessage = "Please enter a location";
      } else if (!data.about?.trim()) {
        validationMessage = "Please enter an event summary";
      }

      return {
        canProceed: canProceedBasic,
        validationMessage,
      };

    case "datetime":
      console.log("🔍 DateTime step validation:");
      console.log("  - start_date:", `"${data.start_date}"`, !!data.start_date);
      console.log("  - end_date:", `"${data.end_date}"`, !!data.end_date);
      console.log("  - start_time:", `"${data.start_time}"`, !!data.start_time);
      console.log("  - end_time:", `"${data.end_time}"`, !!data.end_time);
      console.log("  - duration:", `"${data.duration}"`, !!data.duration);

      // For step navigation, only validate date/time fields
      // Image validation is deferred to final submission
      const canProceedDateTime = !!(
        data.start_date?.trim() &&
        data.end_date?.trim() &&
        data.start_time?.trim() &&
        data.end_time?.trim() &&
        data.duration?.trim()
      );

      console.log("✅ DateTime step canProceed:", canProceedDateTime);

      return {
        canProceed: canProceedDateTime,
        validationMessage:
          "Please fill in all date and time fields including duration",
      };

    case "tickets":
      console.log("🔍 Tickets step validation:");
      console.log("  - event_type:", data.event_type);
      console.log("  - tickets:", data.tickets);

      if (data.event_type === EventType.TICKET) {
        const canProceedTickets =
          data.tickets.length > 0 &&
          data.tickets.every(
            (ticket) => ticket.ticket_name?.trim() && ticket.price >= 0
          );
        console.log("✅ Tickets step canProceed:", canProceedTickets);

        return {
          canProceed: canProceedTickets,
          validationMessage:
            "Please add at least one ticket with name and price",
        };
      }
      console.log("✅ Tickets step (not required) canProceed: true");
      return { canProceed: true, validationMessage: "" };

    case "additional":
      console.log("🔍 Additional step validation:");
      console.log("  - event_class:", data.event_class);
      console.log("  - benefits:", data.benefits);
      console.log("  - agendas:", data.agendas);

      if (data.event_class === EventClass.EXCLUSIVE) {
        // Only enforce this validation when actually on the additional step
        const benefitsValid = data.benefits.length > 0;
        const agendasValid = data.agendas.length > 0;

        const canProceedAdditional = benefitsValid && agendasValid;
        console.log("✅ Additional step validation details:");
        console.log("  - Benefits valid:", benefitsValid);
        console.log("  - Agendas valid:", agendasValid);
        console.log("✅ Additional step canProceed:", canProceedAdditional);

        return {
          canProceed: canProceedAdditional,
          validationMessage:
            "Please add at least one benefit and one agenda item",
        };
      }
      console.log("✅ Additional step (not required) canProceed: true");
      return { canProceed: true, validationMessage: "" };

    default:
      return { canProceed: true, validationMessage: "" };
  }
};

/**
 * Get display name for a step
 */
export const getStepDisplayName = (step: Step): string => {
  switch (step) {
    case "basic":
      return "Basic Info";
    case "datetime":
      return "Date & Time";
    case "tickets":
      return "Tickets";
    case "additional":
      return "Additional";
    default:
      return step;
  }
};

/**
 * Get the step configuration
 */
export const getStepConfig = (step: Step) => {
  const configs = {
    basic: {
      id: "basic" as Step,
      title: "Basic Information",
      fields: [
        "event_title",
        "location",
        "event_type",
        "event_class",
        "about",
        "refine_description",
        "is_eighten_plus",
        "image",
        "image_preference",
        "flyer_prompt", // Prompt for AI-generated flyer
        "flyer_cta", // Call to action for the flyer
        "flyer_url", // URL of the AI-generated flyer
      ] as (keyof EventFormValues)[],
    },
    datetime: {
      id: "datetime" as Step,
      title: "Date & Time",
      fields: [
        "start_date",
        "end_date",
        "start_time",
        "end_time",
        "duration",
      ] as (keyof EventFormValues)[],
    },
    tickets: {
      id: "tickets" as Step,
      title: "Tickets",
      fields: ["tickets"] as (keyof EventFormValues)[],
    },
    additional: {
      id: "additional" as Step,
      title: "Additional Details",
      fields: ["benefits", "agendas"] as (keyof EventFormValues)[],
    },
  };

  return configs[step];
};
