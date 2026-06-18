import { Category, MenuItem } from "./types";

/**
 * Format price with currency symbol
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(price);
};

/**
 * Check if a category has items or subcategories
 */
export const hasContent = (category: Category): boolean => {
  return category.items.length > 0 || category.subCategories.length > 0;
};

/**
 * Get background image URL for a category
 */
export const getCategoryBackgroundImage = (categoryName: string): string => {
  const backgroundImageMap: Record<string, string> = {
    Meals: "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg",
    Drinks: "https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg",
    Snacks:
      "https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg",
    Wines: "https://images.pexels.com/photos/2702805/pexels-photo-2702805.jpeg",
    "Soups and Grills":
      "https://images.pexels.com/photos/26582556/pexels-photo-26582556/free-photo-of-photo-of-variety-of-dishes-standing-on-the-table.jpeg?auto=compress&cs=tinysrgb&w=800",
    Protein:
      "https://images.pexels.com/photos/8477757/pexels-photo-8477757.jpeg?auto=compress&cs=tinysrgb&w=800",
    Beer: "https://images.pexels.com/photos/1269025/pexels-photo-1269025.jpeg",
    default: "https://images.pexels.com/photos/326279/pexels-photo-326279.jpeg",
  };

  return backgroundImageMap[categoryName] || backgroundImageMap.default;
};

// Helper to find and update categories recursively (simplified)
export const findAndModifyCategory = (
  categories: Category[],
  categoryId: string,
  modification: (cat: Category) => Category
): Category[] => {
  return categories.map((cat) => {
    if (cat.id === categoryId) {
      return modification(cat);
    }
    if (cat.subCategories.length > 0) {
      return {
        ...cat,
        C: findAndModifyCategory(cat.subCategories, categoryId, modification),
      };
    }
    return cat;
  });
};

export const findCategoryAndAddItem = (
  categories: Category[],
  categoryId: string,
  item: MenuItem
): Category[] => {
  return categories.map((cat) => {
    if (cat.id === categoryId) {
      return { ...cat, items: [...cat.items, item] };
    }
    if (cat.subCategories.length > 0) {
      return {
        ...cat,
        subCategories: findCategoryAndAddItem(
          cat.subCategories,
          categoryId,
          item
        ),
      };
    }
    return cat;
  });
};

export const findCategoryAndEditItem = (
  categories: Category[],
  categoryId: string,
  itemId: string,
  updatedItemData: Partial<MenuItem>
): Category[] => {
  return categories.map((cat) => {
    if (cat.id === categoryId) {
      return {
        ...cat,
        items: cat.items.map((item) =>
          item.id === itemId ? { ...item, ...updatedItemData } : item
        ),
      };
    }
    if (cat.subCategories.length > 0) {
      return {
        ...cat,
        subCategories: findCategoryAndEditItem(
          cat.subCategories,
          categoryId,
          itemId,
          updatedItemData
        ),
      };
    }
    return cat;
  });
};

export const findCategoryAndDeleteItem = (
  categories: Category[],
  categoryId: string,
  itemId: string
): Category[] => {
  return categories.map((cat) => {
    if (cat.id === categoryId) {
      return { ...cat, items: cat.items.filter((item) => item.id !== itemId) };
    }
    if (cat.subCategories.length > 0) {
      return {
        ...cat,
        subCategories: findCategoryAndDeleteItem(
          cat.subCategories,
          categoryId,
          itemId
        ),
      };
    }
    return cat;
  });
};

export const addCategoryRecursive = (
  categories: Category[],
  newCategory: Category,
  parentId?: string | null
): Category[] => {
  if (!parentId) {
    // Adding a top-level category
    return [...categories, newCategory];
  }
  return categories.map((cat) => {
    if (cat.id === parentId) {
      return { ...cat, subCategories: [...cat.subCategories, newCategory] };
    }
    if (cat.subCategories.length > 0) {
      return {
        ...cat,
        subCategories: addCategoryRecursive(
          cat.subCategories,
          newCategory,
          parentId
        ),
      };
    }
    return cat;
  });
};

export const deleteCategoryRecursive = (
  categories: Category[],
  categoryId: string
): Category[] => {
  return categories
    .filter((cat) => cat.id !== categoryId)
    .map((cat) => {
      if (cat.subCategories.length > 0) {
        return {
          ...cat,
          subCategories: deleteCategoryRecursive(cat.subCategories, categoryId),
        };
      }
      return cat;
    });
};
