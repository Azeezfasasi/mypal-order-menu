// --- Zod Schemas ---

import type {
  IServiceCategory,
  IServiceItem,
} from "@/types/service-offering-types";
import { z } from "zod";

// Schema for validating category form data
export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  image: z.string().optional(),
});

// Schema for validating service item form data
export const serviceItemSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"), // Coerce input to number
  image: z.string().optional(),
});

// Extend IServiceCategory to include items directly for easier mapping
export type CategoryWithItems = IServiceCategory & { items?: IServiceItem[] };
