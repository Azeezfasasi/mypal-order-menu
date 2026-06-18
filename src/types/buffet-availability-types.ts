// Matches actual API response structure
export interface IAvailabilitySlot {
  id: number;
  day: string; // e.g., "Monday"
  meal_type: string; // e.g., "Breakfast Specials"
  opening_time: string | null; // e.g., "09:00" or null if closed
  closing_time: string | null; // e.g., "17:00" or null if closed
  is_active: boolean;
}

export interface IBuffetCategory {
  id: string;
  name: string;
  category_type: string; // e.g., "buffet_meal"
  serviceType: string; // "BUFFET"
  availability?: IAvailabilitySlot[];
}

export interface IBusiness {
  id: string;
  name: string;
}

// Response for GET /v1/category/availability (all categories)
export interface IGetAllAvailabilityResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    business: IBusiness;
    categories: Array<IBuffetCategory & { availability: IAvailabilitySlot[] }>;
  };
}

// Response for GET /v1/category/availability/{categoryId}
export interface IGetCategoryAvailabilityResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    category: IBuffetCategory;
    availability: IAvailabilitySlot[];
  };
}

// Request body for POST/PATCH
export interface ICreateUpdateAvailabilityDto {
  day: string;
  meal_type?: string;
  opening_time: string | null;
  closing_time: string | null;
  is_active?: boolean;
}

// For pagination if needed
export interface IGetAvailabilityParams {
  business_id?: string | number;
  page?: number;
  limit?: number;
}

// Legacy - kept for backward compatibility
export interface IBuffetAvailabilityItem {
  id: string;
  category_id: string;
  subcategory_id?: string;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  available_slots?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUpdateAvailabilityDto {
  start_time?: string;
  end_time?: string;
  available_slots?: number;
}
