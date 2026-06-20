// src/api/service-offering-types.ts

// ==================================
// Types for Service Offerings
// ==================================

import type { IBusiness } from "./auth-types";
import { BusinessCategoryType } from "./enums";

export enum CategoryType {
  BUFFET_MEAL = "buffet_meal",
  SPECIAL_OFFER = "special_offer",
  BUFFET_ADDON = "buffet_addon",
}

export enum ServiceType {
  SALONSANDSPA = BusinessCategoryType.SALONSANDSPA,
  MAINSTREAM = BusinessCategoryType.MAINSTREAM,
  ICONICDELICACIES = BusinessCategoryType.ICONICDELICACIES,
  BUFFET = BusinessCategoryType.BUFFET,
}

export interface IServiceCategory {
  id: string;
  name: string;
  serviceType: ServiceType;
  category_type?: CategoryType;
  price?: number;
  image_url?: string; // Single image URL for categories
  image_urls?: string[]; // Array for backward compatibility
  requiresPrice: boolean;
  price_per_child?: number;
  price_per_adults?: number;
  parentCategory?: IServiceCategory | string;
  hasSubcategories?: boolean;
  isDefault?: boolean;
  items?: IServiceItem[];
  subCategories?: IServiceCategory[];
  business?: IBusiness;
}

export interface IServiceItem {
  id: string;
  name: string;
  price?: number; // Price of the service item (Required for non-buffet services)
  discount_price?: string | number; // Price after MyPal discount
  image_urls?: string[];
  background_image_url?: string; // Background image URL for items
  description?: string;
  preparation_time?: number; // Preparation time in minutes for mainstream items
  category: IServiceCategory | string;
  business?: IBusiness;
  quantityOptions?: Array<{ label: string; price: number }>;
  mealDetail?: {
    mealType?: string;
    cuisine?: string;
    dish?: string;
    quantity?: string;
    servingFormat?: string;
    preparationTime?: string;
  };
}

export interface ICreateServiceCategoryDto {
  name: string;
  image?: File | string; // Single image for categories (optional for buffet services)
  serviceType?: ServiceType;
  category_type?: CategoryType;
  price_per_child?: number;
  price_per_adults?: number;
  parentCategory?: string; // "parent-category-uuid"
  hasSubcategories?: boolean;
}

export interface IUpdateServiceCategoryDto {
  name?: string;
  category_type?: CategoryType;
  price_per_child?: number;
  price_per_adults?: number;
}

export interface ICreateServiceItemDto {
  name: string;
  price?: number; // Price of the service item (Required for non-buffet services)
  images?: File[]; // Item images array (Required for buffet services)
  description?: string; // Description of the item (Required for buffet services)
  preparation_time?: number; // Preparation time in minutes for mainstream items
  background_image?: File; // Background image of the service item for buffet meals
  category_id: string;
  mealDetail?: {
    mealType?: string;
    cuisine?: string;
    dish?: string;
    quantity?: string; // Quantity or size of the item (e.g., 2.5L, 5L, 1kg)
    servingFormat?: string;
    preparationTime?: string;
  };
  quantityOptions?: Array<{ label: string; price: number }>;
}

export interface IUpdateServiceItemDto {
  name?: string;
  price?: number;
  description?: string;
  preparation_time?: number; // Preparation time in minutes for mainstream items
  category_id: string;
  is_available?: boolean; // Availability status of the item
  mealDetail?: {
    mealType?: string;
    cuisine?: string;
    dish?: string;
    quantity?: string;
    servingFormat?: string;
    preparationTime?: string;
  };
  quantityOptions?: Array<{ label: string; price: number }>;
}
