"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/shared/loading-spinner";
import { ServiceOfferingApi } from "@/services/api/business-service-menu-offerings";
import { toast } from "sonner";
import Image from "next/image";
import { AlertCircle, Search, Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  image_urls?: string[];
  stock_quantity?: number;
  is_available?: boolean;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
  subCategories?: Category[];
}

type CategoryData = Category;

type FlattenedItem = MenuItem & { categoryId: string; categoryName: string };

export default function MenuManagementPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [itemAvailability, setItemAvailability] = useState<Record<string, boolean>>({});
  
  const {
    data: menuData,
    isLoading,
    error,
  } = ServiceOfferingApi.useBusinessMenus();
  
  const deleteItem = ServiceOfferingApi.useDeleteServiceItem();
  const updateItem = ServiceOfferingApi.useUpdateServiceItem();

  // Recursively flatten items from nested subcategories
  const flattenItems = useCallback((category: Category, parentCategoryId: string, parentCategoryName: string): FlattenedItem[] => {
    const items: FlattenedItem[] = [];

    // Add items from current level
    if (category.items && Array.isArray(category.items)) {
      category.items.forEach((item: MenuItem) => {
        items.push({
          ...item,
          categoryId: parentCategoryId,
          categoryName: parentCategoryName,
        });
      });
    }

    // Recursively add items from subcategories
    if (category.subCategories && Array.isArray(category.subCategories)) {
      category.subCategories.forEach((subCat: Category) => {
        const subItems = flattenItems(subCat, parentCategoryId, parentCategoryName);
        items.push(...subItems);
      });
    }

    return items;
  }, []);

  // Flatten categories and items
  const { categories, allItems } = useMemo(() => {
    const cats = (menuData?.data as CategoryData[]) || [];
    const items: FlattenedItem[] = [];
    
    console.log("Menu data:", menuData);
    console.log("Categories:", cats);
    
    cats.forEach((cat) => {
      console.log(`Category ${cat.name}:`, cat);
      
      // Recursively flatten items from this category and all its subcategories
      const categoryItems = flattenItems(cat, cat.id, cat.name);
      items.push(...categoryItems);
    });
    
    console.log("Flattened items:", items);
    return { categories: cats, allItems: items };
  }, [menuData, flattenItems]);

  // Build category tabs with counts
  const categoryTabs = useMemo(() => {
    const tabs = [
      { id: "all", name: "All Items", count: allItems.length }
    ];
    
    categories.forEach((cat) => {
      // Count items recursively including all subcategories
      const countItemsRecursive = (category: Category): number => {
        let count = category.items?.length || 0;
        if (category.subCategories && Array.isArray(category.subCategories)) {
          category.subCategories.forEach((subCat: Category) => {
            count += countItemsRecursive(subCat);
          });
        }
        return count;
      };

      const itemCount = countItemsRecursive(cat);
      tabs.push({
        id: cat.id,
        name: cat.name,
        count: itemCount,
      });
    });
    
    return tabs;
  }, [categories, allItems.length]);

  // Filter items based on category and search
  const filteredItems = useMemo(() => {
    let items = allItems;
    
    if (selectedCategory !== "all") {
      items = items.filter((item) => item.categoryId === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
      );
    }
    
    return items;
  }, [allItems, selectedCategory, searchQuery]);

  const handleToggleAvailability = (itemId: string, item: FlattenedItem) => {
    // Get current visual state from local state or original data
    const currentStatus = itemAvailability[itemId] !== undefined 
      ? itemAvailability[itemId] 
      : (item.is_available || true);
    
    const newStatus = !currentStatus;
    
    // Update local state immediately for optimistic UI
    setItemAvailability((prev) => ({ ...prev, [itemId]: newStatus }));
    
    // Call API to persist the change
    const updatePromise = updateItem.mutateAsync({
      itemId,
      itemData: {
        category_id: item.categoryId,
        is_available: newStatus,
      },
    }).catch((error) => {
      console.error("❌ [TOGGLE AVAILABILITY ERROR]", {
        itemId,
        itemName: item.name,
        newStatus,
        error: error.response?.data || error.message,
      });
      // Revert optimistic update on error
      setItemAvailability((prev) => ({ ...prev, [itemId]: currentStatus }));
      throw error;
    });

    toast.promise(updatePromise, {
      loading: `Updating availability...`,
      success: `Item ${newStatus ? "enabled" : "disabled"} successfully!`,
      error: (err) => {
        const errorMsg = err?.response?.data?.message || "Failed to update availability";
        return errorMsg;
      },
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    const promise = deleteItem.mutateAsync(itemId);

    toast.promise(promise, {
      loading: "Deleting item...",
      success: "Item deleted successfully!",
      error: (error) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unknown error occurred while deleting the item.";
        return `Failed to delete item: ${errorMessage}`;
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => router.back()} className="text-gray-600">
          <Image
            src="/images/arrowleft.svg"
            alt="Back"
            width={16}
            height={16}
            className="w-6 h-6"
          />
        </button>
        <div className="flex flex-col items-start justify-start gap-0">
          <h1 className="text-[24px] font-extrabold leading-6.5 text-[#031927]">Menu Management</h1>
          <p className="text-[16px] font-medium leading-6.5 text-[#68798A]">Manage availability and prices</p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Failed to load menu</p>
            <p className="text-xs text-red-700 mt-1">{error?.message || "An error occurred"}</p>
          </div>
        </div>
      ) : isLoading ? (
        <Loader message="Loading menu items..." />
      ) : (
        <>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search order id, customer name, item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 py-3 bg-white rounded-full border border-[#E1E3E7]"
            />
          </div>

          {/* Add Item Button */}
          <Button 
            onClick={() => {
              // TODO: Open add item modal
              toast.info("Add item modal - to be implemented");
            }}
            className="w-full bg-[#FEF2EE] hover:bg-orange-100 border border-[#DB3A0780] rounded-lg text-[14px] font-semibold text-[#DB3A07] py-3 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </Button>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categoryTabs.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-3 rounded-lg text-sm whitespace-nowrap transition-all flex flex-col items-center gap-1 ${
                  selectedCategory === category.id
                    ? "bg-[#DB3A07] text-white"
                    : "bg-white text-gray-700 border border-gray-200"
                }`}
              >
                <span className="font-semibold">{category.name}</span>
                <span className="text-xs">{category.count}</span>
              </button>
            ))}
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">
              All Items ({filteredItems.length})
            </h2>
            <button className="text-[#DB3A07] text-sm font-medium hover:underline">
              Sort by: Name A-Z ▾
            </button>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="flex items-center justify-center py-12 border border-gray-200 rounded-lg bg-white">
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">No items found</p>
                  <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or search</p>
                </div>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      {/* Item Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                        <Image
                          width={64}
                          height={64}
                          src={item.image_urls?.[0] || item.image || "/images/rice.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900">{item.name}</h3>
                        <p className="text-sm font-bold text-[#DB3A07] mt-1">₦{Number(item.price).toLocaleString()}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                            ● Available
                          </span>
                        </div>
                      </div>

                      {/* Availability Toggle */}
                      <button
                        onClick={() => handleToggleAvailability(item.id, item)}
                        className={`w-12 h-7 rounded-full transition-colors ${
                          itemAvailability[item.id] !== undefined
                            ? itemAvailability[item.id]
                              ? "bg-[#DB3A07]"
                              : "bg-gray-300"
                            : item.is_available
                            ? "bg-[#DB3A07]"
                            : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            itemAvailability[item.id] !== undefined
                              ? itemAvailability[item.id]
                                ? "translate-x-6"
                                : "translate-x-1"
                              : item.is_available
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 flex gap-2 pt-3 border-t border-gray-100 w-fit justify-end">
                    <Button 
                      onClick={() => {
                        // TODO: Open edit price modal
                        toast.info("Edit price modal - to be implemented");
                      }}
                      className="flex-1 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-xs font-medium py-2 w-fit"
                    >
                      ✏️ Edit Price
                    </Button>
                    <Button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="flex-1 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-xs font-medium py-2 w-fit"
                    >
                      <Trash className="w-4 h-4" /> Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Unavailable Warning */}
          {filteredItems.some(item => !item.is_available) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-800">
                <span className="font-semibold">Unavailable items won&apos;t be visible to customers.</span>
                <span> Toggle on to make them available.</span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
