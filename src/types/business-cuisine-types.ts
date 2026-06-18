export interface BusinessCategory {
    id: string;
    business_type: string;
    name: string;
    image_url: string;
    is_active: boolean;
}

export interface Cuisine {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    created_at: string;
    updated_at: string;
    businessCategory: BusinessCategory;
}

export interface AddCuisineDTO {
    cuisine_category_ids: string[]
}

export interface RemoveCuisineDTO {
    cuisine_category_id: string
}