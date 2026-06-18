// Type definitions for menu data

import { CategoryType, ServiceType } from "@/types/service-offering-types";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  discount_price?: string | number;
  image_urls?: string[];
  description: string | null;
  mealDetail?: {
    mealType: string;
    cuisine: string;
    dish: string;
    quantity?: string;
    servingFormat: string;
    preparationTime: string;
  };
  quantityOptions?: Array<{ label: string; price: number }>;
  // preparation_tme?: number; // Preparation time in minutes for mainstream items
}

export interface Category {
  id: string;
  name: string;
  category_type: string | null;
  price_per_child: number | null;
  price_per_adults: number | null;
  hasSubcategories: boolean | null;
  image_url?: string; // Single image URL for categories
  requiresPrice: boolean | null;
  serviceType: string;
  isDefault: boolean;
  parentCategory: Omit<
    Category,
    "items" | "subCategories" | "parentCategory"
  > | null;
  items: MenuItem[];
  subCategories: Category[];
}

export interface MenuData {
  status: string;
  statusCode: number;
  message: string;
  data: Category[];
}

export interface IServiceCategory {
  id: string;
  name: string;
  serviceType: ServiceType;
  category_type?: CategoryType;
  price?: number;
  image_urls?: string[];
  requiresPrice: boolean;
  price_per_child?: number;
  price_per_adults?: number;
  parentCategory?: IServiceCategory | string;
  hasSubcategories?: boolean;
  isDefault?: boolean;
  items?: IServiceItem[];
  subCategories?: IServiceCategory[];
}

export interface IServiceItem {
  id: string;
  name: string;
  price?: number;
  image_urls?: string[];
  description?: string;
  category: IServiceCategory | string;
}

export interface IUpdateServiceCategoryDto {
  name?: string;
  category_type?: CategoryType;
  price_per_child?: number;
  price_per_adults?: number;
}

export interface ICreateServiceItemDto {
  name: string;
  price?: number;
  image?: string | File;
  description?: string;
  category_id: string;
  mealDetail?: {
    mealType: string;
    cuisine: string;
    dish: string;
    quantity?: string;
    servingFormat: string;
    preparationTime: string;
  };
  quantityOptions?: Array<{ label: string; price: number }>;
}

export interface IUpdateServiceItemDto {
  name?: string;
  price?: number;
  description?: string;
  category_id: string;
  mealDetail?: {
    mealType: string;
    cuisine?: string;
    dish?: string;
    servingFormat?: string;
    preparationTime?: string;
  };
  quantityOptions?: Array<{ label: string; price: number }>;
}
