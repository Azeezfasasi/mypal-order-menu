import { ContextType, EventClass, EventType } from "@/types/enums";
import * as z from "zod";
import { Step } from "../create-event-modal/types";

const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;

/**
 * Lenient schema for step navigation in edit mode
 */
export const editStepNavigationSchema = z.object({
  // Step 1: Basic Information (always required)
  event_title: z.string().min(3, "Title must be at least 3 characters"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  event_type: z.nativeEnum(EventType),
  event_class: z.nativeEnum(EventClass),
  about: z.string().min(10, "Description must be at least 10 characters"),
  refine_description: z.boolean().default(false),
  image: z.instanceof(File).nullable().optional(), // Optional for edit mode navigation
  // Update the enum to include "keep"
  image_preference: z.enum(["upload", "generate", "keep"]).nullish(), // Optional when there's an existing image
  flyer_prompt: z.string().optional(),
  flyer_cta: z
    .enum([
      "place_order",
      "make_reservation",
      "buy_tickets",
      "plain_informative",
    ])
    .optional(),
  flyer_url: z.string().optional(),
  is_eighten_plus: z.boolean(),

  // Step 2: Date and Time (optional for navigation)
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  duration: z.string().optional(),

  // Step 3: Tickets (optional for navigation)
  tickets: z
    .array(
      z.object({
        ticket_name: z.string().min(1, "Ticket name is required"),
        price: z.number().min(0, "Price must be 0 or greater"),
      })
    )
    .default([]),

  // Step 4: Additional Details (optional for navigation)
  benefits: z
    .array(
      z.object({
        title: z.string().min(1, "Benefit title is required"),
        description: z.string().min(1, "Benefit description is required"),
      })
    )
    .default([]),
  agendas: z
    .array(
      z.object({
        title: z.string().min(1, "Agenda title is required"),
        description: z.string().min(1, "Agenda description is required"),
        event_id: z.string().optional(),
        agendaType: z.nativeEnum(ContextType),
      })
    )
    .default([]),
});

/**
 * Base schema with all fields and their basic validation rules for edit mode
 */
export const editEventFormSchema = z.object({
  // Step 1: Basic Information
  event_title: z.string().min(3, "Title must be at least 3 characters"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  event_type: z.nativeEnum(EventType),
  event_class: z.nativeEnum(EventClass),
  about: z.string().min(10, "Description must be at least 10 characters"),
  refine_description: z.boolean().default(false),
  image: z.instanceof(File).nullable().optional(), // Nullable and optional for edit mode
  image_preference: z.enum(["upload", "generate", "keep"]).nullish(), // Optional when there's an existing image
  flyer_prompt: z.string().optional(),
  flyer_cta: z
    .enum([
      "place_order",
      "make_reservation",
      "buy_tickets",
      "plain_informative",
    ])
    .optional(),
  flyer_url: z.string().optional(),
  is_eighten_plus: z.boolean(),

  // Step 2: Date and Time
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  start_time: z.string().regex(timeRegex, "Time must be in hh:mm AM/PM format"),
  end_time: z.string().regex(timeRegex, "Time must be in hh:mm AM/PM format"),
  duration: z.string().min(1, "Duration is required"),

  // Step 3: Tickets
  tickets: z
    .array(
      z.object({
        ticket_name: z.string().min(1, "Ticket name is required"),
        price: z.number().min(0, "Price must be 0 or greater"),
        benefits: z
          .array(
            z.object({
              description: z.string().min(1, "Benefit description is required"),
            })
          )
          .default([]),
      })
    )
    .default([]),

  // Step 4: Additional Details
  benefits: z
    .array(
      z.object({
        description: z.string().min(1, "Benefit description is required"),
      })
    )
    .default([]),
  agendas: z
    .array(
      z.object({
        title: z.string().min(1, "Agenda title is required"),
        event_id: z.string().optional(),
        agendaType: z.nativeEnum(ContextType),
      })
    )
    .default([]),
});

/**
 * Creates a validation schema for editing based on the current step and submission state
 */
export const createEditEventFormSchema = (
  eventType: EventType,
  eventClass: EventClass,
  currentStep: Step,
  isSubmitting: boolean = false,
  hasExistingImage: boolean = false
) => {
  const schema = editEventFormSchema;

  // Apply conditional validation for tickets step
  if (isSubmitting || currentStep === "tickets") {
    if (eventType === EventType.TICKET) {
      return schema.refine((data) => data.tickets.length > 0, {
        message: "At least one ticket is required for ticket events",
        path: ["tickets"],
      });
    }
  }

  // Apply conditional validation for additional details step
  if (isSubmitting || currentStep === "additional") {
    if (eventClass === EventClass.EXCLUSIVE) {
      return schema
        .refine((data) => data.benefits.length > 0, {
          message: "At least one benefit is required for exclusive events",
          path: ["benefits"],
        })
        .refine((data) => data.agendas.length > 0, {
          message: "At least one agenda item is required for exclusive events",
          path: ["agendas"],
        });
    }
  }

  // For submission, validate image based on preference and existing image
  if (isSubmitting) {
    return schema.refine(
      (data) => {
        console.log("🔍 Edit Image validation check:", {
          image_preference: data.image_preference,
          image: data.image,
          flyer_url: data.flyer_url,
          hasExistingImage,
        });

        // If preference is "keep" and there's an existing image, it's valid
        if (data.image_preference === "keep" && hasExistingImage) {
          return true;
        }

        // If there's an existing image and no preference change, it's valid
        if (hasExistingImage && !data.image_preference) {
          return true;
        }

        // Validate image upload
        if (data.image_preference === "upload") {
          // If uploading new image, need File object
          if (data.image instanceof File) return true;
          // If no new image but has existing image, it's valid
          if (!data.image && hasExistingImage) return true;
          return false;
        }
        // Validate image generation
        else if (data.image_preference === "generate") {
          const hasPrompt =
            !!data.flyer_prompt && data.flyer_prompt.trim().length > 0;
          const hasGeneratedFlyer =
            !!data.flyer_url && data.flyer_url.trim().length > 0;

          console.log("🎨 Edit Generate validation:", {
            hasPrompt,
            hasGeneratedFlyer,
            hasExistingImage,
            prompt: data.flyer_prompt,
            url: data.flyer_url,
          });

          // If there's an existing image/flyer and no new changes, it's valid
          if (hasExistingImage && !hasPrompt && !hasGeneratedFlyer) {
            return true;
          }

          // Otherwise, need both prompt and generated flyer for new generation
          return hasPrompt && hasGeneratedFlyer;
        }

        // If no preference set but has existing image, it's valid
        return hasExistingImage;
      },
      {
        message: hasExistingImage
          ? "Please keep existing image, upload a new one, or generate a flyer"
          : "Please upload an image or generate a flyer using AI",
        path: ["image"],
      }
    );
  }

  return schema;
};

/**
 * Schema for final submission with all conditional validations for edit mode
 */
export const createEditSubmissionSchema = (
  eventType: EventType,
  eventClass: EventClass,
  hasExistingImage: boolean = false
) => {
  return createEditEventFormSchema(
    eventType,
    eventClass,
    "additional",
    true,
    hasExistingImage
  );
};
