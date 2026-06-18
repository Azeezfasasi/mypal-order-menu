// Updated types to match backend DTOs

export interface IAccommodation {
  id: string;
  apartment_name: string;
  category_id?: string;
  custom_category_name?: string;
  apartment_description?: string;
  apartment_type?: string;
  total_units?: number;
  location?: ILocation;
  specifications?: Record<string, unknown>;
  pricing?: IPricing;
  rules?: IRules;
  images?: string[]; // sent to API when creating/updating
  image_urls?: string[]; // returned from API (S3 URLs)
  default_attraction_ids?: string[];
  category?: {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    isDefault?: boolean;
    sort_order?: number;
    business_type?: string; // From accommodation endpoint
    business_accommodation_type?: string; // From categories endpoint
    is_active?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  business_id?: string;
  attractions?: IAttraction[];
  average_rating?: number;
  business_accomodation_type?: string;
  charges?: unknown[];
  discountPrice?: number | null;
  isFullyBooked?: boolean;
  total_reviews?: number;
  unitsBooked?: number;
  unitsLeft?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IAttraction {
  id: string;
  attraction_name: string;
  is_active: boolean;
  image?: string; // Base64 encoded image or URL
  image_url?: string; // direct URL returned by backend (S3 etc)
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IDefaultAttraction {
  id: string;
  label: string;
  description: string | null;
  image_url: string | null;
  slug: string;
  group_label: string;
  sort_order: 14,
  business_accomodation_type: string;
  is_active: boolean
  createdAt: string;
  updatedAt: string;
}

export interface ILocation {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface IPricing {
  basePricePerNight?: number;
  cautionFee?: number;
  discounts?: Array<{
    minNights: number;
    percentage: number;
  }>;
  [key: string]: unknown;
}

export interface IRules {
  checkInTime?: string;
  checkOutTime?: string;
  allowParties?: boolean;
  allowPets?: boolean;
  [key: string]: unknown;
}

export type BusinessAccommodationType = "shortlet" | "hotel" | "resort";

export interface ICreateAccommodationDto {
  apartment_name: string;
  category_id?: string;
  custom_category_name?: string;
  apartment_description?: string;
  total_units?: number;
  location?: ILocation;
  specifications?: Record<string, unknown>;
  pricing?: IPricing;
  rules?: IRules;
  images?: string[]; // URLs (after upload)
  default_attraction_ids?: string[];
  business_type?: BusinessAccommodationType;
}

export interface IUpdateAccommodationDto {
  id?: string;
  apartment_name?: string;
  category_id?: string;
  custom_category_name?: string;
  apartment_description?: string;
  total_units?: number;
  location?: ILocation;
  specifications?: Record<string, unknown>;
  pricing?: IPricing;
  rules?: IRules;
  images?: string[]; // URLs
  default_attraction_ids?: string[];
  business_type?: BusinessAccommodationType;

}

export interface ICreateAttractionDto {
  attraction_name: string;
  is_active?: boolean;
  image?: File | string; // File for upload or base64 string
}

export interface IUpdateAttractionDto {
  id?: string; // Optional for new attractions
  attraction_name: string;
  is_active?: boolean;
  image?: File | string; // File for upload or base64 string
}
export interface IAccommodationAttractionResponse {
  accommodations: IAccommodation[];
  attractions: IAttraction[];
}
