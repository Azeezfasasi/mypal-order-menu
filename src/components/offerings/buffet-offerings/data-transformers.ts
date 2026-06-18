import {
  CategoryType,
  IServiceCategory,
  IServiceItem,
  ServiceType,
} from "@/types/service-offering-types";

// Essential data structure for UI
export interface BuffetCategoryUI {
  id: string;
  name: string;
  categoryType: CategoryType;
  imageUrl?: string;
  subCategories: BuffetSubCategoryUI[];
  items?: BuffetItemUI[]; // Direct items on category (e.g., special offers)
}

export interface BuffetSubCategoryUI {
  id: string;
  name: string;
  pricePerAdult?: number;
  pricePerChild?: number;
  imageUrl?: string;
  items: BuffetItemUI[];
  subCategories?: BuffetSubCategoryUI[]; // For nested structure like alcoholic drinks
  isDefault?: boolean; // Cannot be deleted if true
}

export interface BuffetItemUI {
  id: string;
  name: string;
  price?: number;
  description?: string;
  imageUrls?: string[];
  backgroundImageUrl?: string;
  isDefault?: boolean; // Cannot be deleted if true
  // Special offer fields
  main_catch?: string;
  main_catch_description?: string;
  catchy_phrase?: string;
  gate_pass?: boolean;
  is_18_plus?: boolean;
  tags?: string[];
}

// Convert BuffetSubCategoryUI to IServiceCategory for modals
export const convertToServiceCategory = (
  subCategory: BuffetSubCategoryUI,
  categoryType: CategoryType,
): IServiceCategory => {
  return {
    id: subCategory.id,
    name: subCategory.name,
    serviceType: ServiceType.BUFFET,
    category_type: categoryType,
    price_per_adults: subCategory.pricePerAdult,
    price_per_child: subCategory.pricePerChild,
    image_url: subCategory.imageUrl,
    requiresPrice: categoryType === CategoryType.BUFFET_MEAL,
    items: subCategory.items.map((item) => convertToServiceItem(item)),
    subCategories: subCategory.subCategories?.map((sub) =>
      convertToServiceCategory(sub, categoryType),
    ),
  };
};

// Convert BuffetItemUI to IServiceItem for modals
export const convertToServiceItem = (item: BuffetItemUI): IServiceItem => {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    description: item.description,
    image_urls: item.imageUrls,
    background_image_url: item.backgroundImageUrl,
    category: item.id, // We'll need to set this properly in the calling code
  };
};

// Transform API data to clean UI data
export const transformBuffetData = (
  categories: IServiceCategory[],
): BuffetCategoryUI[] => {
  return categories.map((category) => {
    const transformedCategory: BuffetCategoryUI = {
      id: category.id,
      name: category.name,
      categoryType: category.category_type!,
      imageUrl: category.image_url || category.image_urls?.[0], // Handle both singular and plural
      subCategories: (category.subCategories || []).map((sub) => ({
        id: sub.id,
        name: sub.name,
        pricePerAdult: sub.price_per_adults,
        pricePerChild: sub.price_per_child,
        imageUrl: sub.image_url || sub.image_urls?.[0], // Handle both singular and plural
        items: (sub.items || []).map((item) => {
          return {
            id: item.id,
            name: item.name,
            price: item.price,
            description: item.description,
            imageUrls: item.image_urls,
            backgroundImageUrl: item.background_image_url,
            isDefault: (item as IServiceItem & { isDefault?: boolean }).isDefault,
            // Special offer fields - these properties exist at runtime but are not in the IServiceItem type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            main_catch: (item as any).main_catch,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            main_catch_description: (item as any).main_catch_description,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            catchy_phrase: (item as any).catchy_phrase,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            gate_pass: (item as any).gate_pass,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            is_18_plus: (item as any).is_18_plus,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tags: (item as any).tags,
          };
        }),
        // Handle nested subcategories (for alcoholic drinks, etc.)
        subCategories: (sub.subCategories || []).map((deepSub) =>
          transformSubCategoryRecursive(deepSub),
        ),
        isDefault: sub.isDefault,
      })),
      // Include direct items on the category (e.g., special offers)
      items: (category.items || []).map((item) => {
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description,
          imageUrls: item.image_urls,
          backgroundImageUrl: item.background_image_url,
          isDefault: (item as IServiceItem & { isDefault?: boolean }).isDefault,
          // Special offer fields -these properties exist at runtime but are not in the IServiceItem type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          main_catch: (item as any).main_catch,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          main_catch_description: (item as any).main_catch_description,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          catchy_phrase: (item as any).catchy_phrase,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          gate_pass: (item as any).gate_pass,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          is_18_plus: (item as any).is_18_plus,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tags: (item as any).tags,
        };
      }),
    };
    
    // Debug log for special offers
    if (category.category_type === "special_offer") {
      console.log(
        `🎯 [TRANSFORM] Special Offers category: ${category.name}`,
        `Items count: ${category.items?.length || 0}`,
        "Transformed items:", transformedCategory.items
      );
    }
    
    return transformedCategory;
  });
};

// Recursive helper to handle deeply nested subcategories
const transformSubCategoryRecursive = (
  sub: IServiceCategory,
): BuffetSubCategoryUI => ({
  id: sub.id,
  name: sub.name,
  pricePerAdult: sub.price_per_adults,
  pricePerChild: sub.price_per_child,
  imageUrl: sub.image_url || sub.image_urls?.[0],
  items: (sub.items || []).map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serviceItem = item as any;
    return {
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description,
      imageUrls: item.image_urls,
      backgroundImageUrl: item.background_image_url,
      isDefault: (item as IServiceItem & { isDefault?: boolean }).isDefault,
      // Special offer fields
      main_catch: serviceItem.main_catch,
      main_catch_description: serviceItem.main_catch_description,
      catchy_phrase: serviceItem.catchy_phrase,
      gate_pass: serviceItem.gate_pass,
      is_18_plus: serviceItem.is_18_plus,
      tags: serviceItem.tags,
    };
  }),
  // Recursively handle even deeper nesting if it exists
  subCategories: (sub.subCategories || []).map((deeperSub) =>
    transformSubCategoryRecursive(deeperSub),
  ),
  isDefault: sub.isDefault,
});
