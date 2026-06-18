import { z } from "zod";

// Time format regex for 12-hour format (hh:mm AM/PM)
const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;

// Base schema shared between create and edit
const baseDealSchema = z.object({
  deal_title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters" }),
  location: z.string().min(3, { message: "Location is required" }),
  start_date: z.string(),
  end_date: z.string(),
  start_time: z
    .string()
    .regex(timeRegex, "Time must be in hh:mm AM/PM format (12-hour format)"),
  end_time: z
    .string()
    .regex(timeRegex, "Time must be in hh:mm AM/PM format (12-hour format)"),
  duration: z.string(),
  about_deal: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" }),
  price: z.string().min(1, { message: "Price is required" }),
  is_eighteen_plus: z.boolean().default(false),
  image: z.any().optional(),
  image_preference: z.enum(["upload", "generate"]).optional(),
  flyer_prompt: z.string().optional(),
  flyer_url: z.string().optional(),
  benefits: z
    .array(
      z.object({
        id: z.string().optional(),
        description: z.string(),
      })
    )
    .optional(),
  agendas: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string(),
      })
    )
    .optional(),
  refine_description: z.boolean().default(false),
});

// CREATE mode schema - requires image selection
export const dealFormSchema = baseDealSchema
  .extend({
    // Make image_preference required for create mode
    image_preference: z.enum(["upload", "generate"], {
      required_error: "Please select an image option (upload or generate)",
      invalid_type_error: "Please select either upload or generate option",
    }),
  })
  .superRefine((data, ctx) => {
    // Validate image_preference is selected first
    if (!data.image_preference) {
      ctx.addIssue({
        path: ["image_preference"],
        code: z.ZodIssueCode.custom,
        message: "Please select an image option (upload or generate).",
      });
      return; // Exit early if no preference is selected
    }

    // Require image if preference is upload
    if (data.image_preference === "upload") {
      if (!data.image) {
        ctx.addIssue({
          path: ["image"],
          code: z.ZodIssueCode.custom,
          message: "Please upload an image.",
        });
      }
    }

    // Require flyer_prompt and flyer_url if preference is generate
    if (data.image_preference === "generate") {
      if (!data.flyer_prompt || data.flyer_prompt.trim().length === 0) {
        ctx.addIssue({
          path: ["flyer_prompt"],
          code: z.ZodIssueCode.custom,
          message: "Please enter a prompt to generate an image.",
        });
      }

      if (!data.flyer_url || data.flyer_url.trim().length === 0) {
        ctx.addIssue({
          path: ["flyer_url"],
          code: z.ZodIssueCode.custom,
          message: "Please generate an image using the prompt above.",
        });
      }
    }
  });

// EDIT mode schema - image selection is optional
export const editDealFormSchema = baseDealSchema.superRefine((data, ctx) => {
  // Only validate if user chooses to update the image
  if (data.image_preference) {
    // Require image if preference is upload
    if (data.image_preference === "upload") {
      if (!data.image) {
        ctx.addIssue({
          path: ["image"],
          code: z.ZodIssueCode.custom,
          message: "Please upload an image.",
        });
      }
    }

    // Require flyer_prompt and flyer_url if preference is generate
    if (data.image_preference === "generate") {
      if (!data.flyer_prompt || data.flyer_prompt.trim().length === 0) {
        ctx.addIssue({
          path: ["flyer_prompt"],
          code: z.ZodIssueCode.custom,
          message: "Please enter a prompt to generate an image.",
        });
      }

      if (!data.flyer_url || data.flyer_url.trim().length === 0) {
        ctx.addIssue({
          path: ["flyer_url"],
          code: z.ZodIssueCode.custom,
          message: "Please generate an image using the prompt above.",
        });
      }
    }
  }
});

// ========================================
// GENERATED TYPESCRIPT TYPES FROM SCHEMAS
// ========================================

// Generate TypeScript types from the Zod schemas
export type IDealFormDataZod = z.infer<typeof dealFormSchema>;
export type IEditDealFormDataZod = z.infer<typeof editDealFormSchema>;

// If you need the base type without the refinement validation
export type IBaseDealFormDataZod = z.infer<typeof baseDealSchema>;

// Generate nested types for reusability
export type IDealBenefitFormDataZod = {
  id?: string;
  description: string;
};

export type IDealAgendaFormDataZod = {
  id?: string;
  title: string;
};
