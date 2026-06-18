// src/types/buffet-reservation-types.ts

import { IBusiness } from "./auth-types";
import { ReservationStatus } from "./enums";
import { IUser } from "./index";

// ==================================
// Base Interfaces
// ==================================

export interface IItemWithQuantity {
  item: IServiceItem;
  quantity: number;
}

export interface ICategoryWithQuantity {
  category: IServiceCategory;
  quantity_adults: number;
  quantity_children: number;
}

export interface IServiceCategory {
  id: string;
  name: string;
  price_per_adults?: number;
  price_per_child?: number;
  category_type: string;
  business: IBusiness;
  createdAt: Date;
  updatedAt: Date;
}

export interface IServiceItem {
  id: string;
  name: string;
  price: number;
  category: IServiceCategory;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment {
  id: string;
  amount: number;
  reference: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBuffetReservation {
  id: string;
  no_of_adults: number;
  no_of_children: number;
  total_individuals: number;
  user: IUser;
  business: IBusiness;
  meal_type: string;
  buffetMeal: IServiceCategory;
  buffetMealWithQuantity: {
    category_id: string;
    quantity_adults: number;
    quantity_children: number;
  };
  specialOfferItems: IServiceItem[];
  specialOfferItemsWithQuantities: IItemWithQuantity[];
  otherItems: IServiceItem[];
  otherItemsWithQuantities: IItemWithQuantity[];
  date: string;
  time: string;
  payment: IPayment;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Simplified version for list views
export interface IBuffetReservationListItem {
  id: string;
  no_of_adults: number;
  no_of_children: number;
  total_individuals: number;
  meal_type: string;
  date: string;
  time: string;
  user: IUser;
  business: IBusiness;
  payment: IPayment;
  createdAt: Date;
  updatedAt: Date;
}

// ==================================
// DTO Interfaces (for API requests)
// ==================================

export interface IItemWithQuantityDto {
  id: string;
  quantity: number;
}

export interface ICategoryWithQuantityDto {
  id: string;
  quantity_adults: number;
  quantity_children: number;
}

export interface ICreateBuffetReservationDto {
  business_id: string;
  date: string; // Format: dd-MM-YYYY
  time: string; // Format: hh:mm a
  no_of_adults: number;
  no_of_children: number;
  buffet_meal?: ICategoryWithQuantityDto;
  special_offer_items?: IItemWithQuantityDto[];
  other_items?: IItemWithQuantityDto[];
}

export interface IUpdateBuffetReservationDto {
  business_id?: string;
  date?: string;
  time?: string;
  no_of_adults?: number;
  no_of_children?: number;
  buffet_meal?: ICategoryWithQuantityDto;
  special_offer_items?: IItemWithQuantityDto[];
  other_items?: IItemWithQuantityDto[];
}

export interface IManageBuffetReservationDto {
  accept: boolean;
  decline: boolean;
}

// ==================================
// API Response Interfaces
// ==================================

export interface IBuffetReservationPaginationOptions {
  page?: number;
  limit?: number;
}

export interface IBuffetReservationQueryOptions
  extends IBuffetReservationPaginationOptions {
  status?: ReservationStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  [key: string]: unknown; // Index signature to allow additional properties
}

// ==================================
// Form Interfaces (for UI components)
// ==================================

export interface IBuffetReservationFormData {
  business_id: string;
  date: string;
  time: string;
  no_of_adults: number;
  no_of_children: number;
  buffet_meal?: {
    id: string;
    quantity_adults: number;
    quantity_children: number;
  };
  special_offer_items?: Array<{
    id: string;
    quantity: number;
  }>;
  other_items?: Array<{
    id: string;
    quantity: number;
  }>;
}

// ==================================
// Payment Interfaces
// ==================================

export interface IBuffetPaymentInitResponse {
  reference: string;
  authorization_url: string;
  amount: number;
}

export interface IBuffetPaymentVerificationResponse {
  status: string;
  payment: IPayment;
  message: string;
}
