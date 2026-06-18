import { CategoryType } from "@/types/service-offering-types";

export interface CategoryConfig {
  gradient: string;
  headerColor: string;
  borderColor: string;
  showPricing?: boolean;
  showAddButton?: boolean;
  buttonText?: string;
  // palette name, one of 'warm' | 'cool' | 'neutral'
  palette?: "warm" | "cool" | "neutral";
  // Permissions for subcategories
  canAddSubcategory?: boolean;
  canEditSubcategory?: boolean;
  canDeleteSubcategory?: boolean;
  // Permissions for items
  canAddItem?: boolean;
  canEditItem?: boolean;
  canDeleteItem?: boolean;
  // Maximum nesting depth for subcategories (0 = no nesting, 1 = one level, 2 = two levels, etc.)
  // undefined or null = unlimited nesting
  maxNestingDepth?: number;
}

// Three predefined palettes for cohesive category styling
export const palettes = {
  warm: {
    headerClass: "bg-orange-600",
    subBgClass: "bg-orange-500",
    subTextClass: "text-white",
    subBgLightClass: "bg-orange-100",
    borderClass: "border-orange-500",
  },
  cool: {
    headerClass: "bg-blue-800",
    subBgClass: "bg-blue-600",
    subTextClass: "text-white",
    subBgLightClass: "bg-blue-100",
    borderClass: "border-blue-600",
  },
  neutral: {
    headerClass: "bg-gray-700",
    subBgClass: "bg-gray-500",
    subTextClass: "text-white",
    subBgLightClass: "bg-gray-200",
    borderClass: "border-gray-400",
  },
} as const;

export const categoryConfigs: Record<CategoryType, CategoryConfig> = {
  [CategoryType.SPECIAL_OFFER]: {
    gradient: "bg-orange-600",
    headerColor: "bg-orange-500",
    borderColor: "border-orange-500",
    showAddButton: true,
    buttonText: "New offer",
    palette: "warm",
    canAddSubcategory: true,
    canEditSubcategory: true,
    canDeleteSubcategory: true,
    canAddItem: true,
    canEditItem: true,
    canDeleteItem: true,
    maxNestingDepth: 0, // No nesting - only top-level subcategories with items
  },
  [CategoryType.BUFFET_MEAL]: {
    gradient: "bg-gradient-to-r from-green-700/80 to-emerald-600/80",
    headerColor: "bg-orange-500",
    borderColor: "border-orange-500",
    showPricing: true,
    showAddButton: false,
    buttonText: "New category",
    palette: "warm",
    canAddSubcategory: false,
    canEditSubcategory: true,
    canDeleteSubcategory: false,
    canAddItem: false,
    canEditItem: true,
    canDeleteItem: false,
    maxNestingDepth: 0, // No nesting - flat structure
  },
  [CategoryType.BUFFET_ADDON]: {
    gradient: "bg-gradient-to-r from-amber-900/80 to-yellow-800/80",
    headerColor: "bg-orange-500",
    borderColor: "border-orange-500",
    showAddButton: false,
    buttonText: "New category",
    palette: "neutral",
    canAddSubcategory: false, // Disabled for now - not using nested subcategories
    canEditSubcategory: true,
    canDeleteSubcategory: true,
    canAddItem: true,
    canEditItem: true,
    canDeleteItem: true,
    maxNestingDepth: 3, // Allow 2 levels of nesting (e.g., Soft Drinks → Bottled → items)
  },
};
