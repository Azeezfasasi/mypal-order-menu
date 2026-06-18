"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServiceOfferingApi } from "@/services/api/business-service-menu-offerings";
import { BranchesApi, type ILinkMenuItemsPayload } from "@/services/api/branches-api";
import Loader from "@/components/shared/loading-spinner";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

interface SelectedItem {
  item_id: string;
  price?: number;
  stock_quantity?: number;
  is_available: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
}

interface MenuCategory {
  id: string;
  name: string;
  items?: MenuItem[];
  subCategories?: MenuCategory[];
}

interface FineDiningMenuItem {
  id: string;
  name: string;
  type: string;
  menu_url: string;
  minimum_price: number;
  maximum_price: number;
  category?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface LinkMenuItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
  businessCategory?: string;
}

export function LinkMenuItemsModal({
  isOpen,
  onClose,
  branchId,
  branchName,
  businessCategory,
}: LinkMenuItemsModalProps) {
  console.log("🔗 [LinkMenuItemsModal] Opened with:", {
    isOpen,
    branchId,
    branchName,
    businessCategory,
  });
  
  const { data: menuData, isLoading, error: menuError } = ServiceOfferingApi.useBusinessMenus(businessCategory);
  const { mutate: linkItems, isPending } = BranchesApi.useLinkMenuItems(branchId);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [itemOverrides, setItemOverrides] = useState<
    Record<string, Partial<SelectedItem>>
  >({});

  const categories = useMemo(() => {
    const cats = menuData?.data || [];
    console.log("📦 Link Modal - Full API Response:", menuData);
    console.log("📦 Link Modal - Raw Categories:", cats);
    
    // Check if this is a flat list of menu items (Fine Dining API) vs structured categories
    const isFlatMenuItemsList = cats.length > 0 && 'menu_url' in cats[0];
    
    if (isFlatMenuItemsList) {
      console.log("📦 Detected Fine Dining API response (flat menu items), transforming...");
      
      // Cast to flat menu items for type safety
      const menuItems = cats as unknown as FineDiningMenuItem[];
      
      // Group items by their cuisine category or create a single category if no grouping
      const groupedByCategory = new Map<string, MenuItem[]>();
      
      menuItems.forEach((item) => {
        const menuItem: MenuItem = {
          id: item.id,
          name: item.name,
          description: item.type ? `${item.type} • ₦${item.minimum_price?.toLocaleString() || 0} - ₦${item.maximum_price?.toLocaleString() || 0}` : undefined,
        };
        
        // Group by cuisine category if available, otherwise use "All Items"
        const groupKey = item.category?.name || "All Items";
        
        if (!groupedByCategory.has(groupKey)) {
          groupedByCategory.set(groupKey, []);
        }
        groupedByCategory.get(groupKey)!.push(menuItem);
      });
      
      // Convert map to category structure
      const transformedCategories: MenuCategory[] = Array.from(groupedByCategory).map(([categoryName, items], idx) => ({
        id: `category-${idx}`,
        name: categoryName,
        items,
      }));
      
      console.log("📦 Transformed to categories:", transformedCategories.map(c => ({
        name: c.name,
        itemsCount: c.items?.length || 0,
      })));
      
      return transformedCategories;
    }
    
    // Original logic for structured categories
    cats.forEach((cat, idx) => {
      console.log(`Category ${idx} (${cat.name}):`, {
        hasItems: !!cat.items,
        itemsArray: cat.items,
        hasSubCategories: !!cat.subCategories,
        subCategoriesArray: cat.subCategories,
        allKeys: Object.keys(cat),
      });
    });

    console.log("📦 Link Modal - Categories fetched:", {
      totalCategories: cats.length,
      categories: cats.map(c => {
        const directItems = c.items?.length || 0;
        const subCategoryItems = (c.subCategories || []).flatMap(s => s.items || []).length;
        const totalItems = directItems + subCategoryItems;
        return {
          id: c.id,
          name: c.name,
          directItemsCount: directItems,
          subCategoryItems: subCategoryItems,
          totalItems: totalItems,
          hasSubcategories: !!c.subCategories?.length,
          subCategories: c.subCategories?.map(s => ({
            id: s.id,
            name: s.name,
            itemsCount: s.items?.length || 0,
          })) || [],
        };
      })
    });
    return cats;
  }, [menuData]);

  const filteredCategories = useMemo(() => {
    // Recursively collect all items from nested subCategories
    const collectAllItems = (category: MenuCategory): MenuItem[] => {
      let allItems: MenuItem[] = [...(category.items || [])];
      
      if (category.subCategories && Array.isArray(category.subCategories)) {
        category.subCategories.forEach((sub: MenuCategory) => {
          allItems = [...allItems, ...collectAllItems(sub)];
        });
      }
      
      return allItems;
    };

    // Flatten all items from main category and all nested subCategories
    const flattenedCategories = categories.map((category) => {
      const allItems = collectAllItems(category);
      console.log(`📦 ${category.name}: ${allItems.length} total items`);
      
      return {
        ...category,
        items: allItems,
      };
    });

    if (!searchTerm) {
      console.log("📦 No search term - returning all flattened categories");
      return flattenedCategories;
    }

    const filtered = flattenedCategories
      .map((category) => ({
        ...category,
        items: (category.items || []).filter(
          (item) =>
            item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      }))
      .filter((cat) => cat.items!.length > 0 || cat.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    console.log("🔍 Filtered categories:", filtered.length, "items match search:", searchTerm);
    return filtered;
  }, [categories, searchTerm]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.item_id === itemId);
      if (exists) {
        return prev.filter((i) => i.item_id !== itemId);
      } else {
        return [
          ...prev,
          {
            item_id: itemId,
            is_available: true,
            price: undefined,
            stock_quantity: undefined,
          },
        ];
      }
    });
  };

  const handleOverrideChange = (
    itemId: string,
    field: keyof SelectedItem,
    value: unknown
  ) => {
    setItemOverrides((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        [field]: value,
      },
    }));
  };

  const handleLink = () => {
    const payload: ILinkMenuItemsPayload = {
      items: selectedItems.map((item) => ({
        ...item,
        ...(itemOverrides[item.item_id] || {}),
      })),
    };

    linkItems(payload, {
      onSuccess: () => {
        setSelectedItems([]);
        setItemOverrides({});
        setSearchTerm("");
        onClose();
      },
    });
  };

  const isItemSelected = (itemId: string) =>
    selectedItems.some((i) => i.item_id === itemId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Menu Items to {branchName}</DialogTitle>
          <DialogDescription>
            Select menu items from {businessCategory} to link them to this branch.
            You can set branch-specific prices and stock quantities.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Loader message="Loading menu items..." />
        ) : menuError ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-red-600">
              <p className="font-semibold mb-2">Failed to load menu items</p>
              <p className="text-sm">{menuError instanceof Error ? menuError.message : "Unknown error"}</p>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="font-semibold mb-2">No menu categories found</p>
              <p className="text-sm">Create categories in your business menu first</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selected Count */}
            <div className="text-sm font-medium text-gray-600">
              {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
            </div>

            {/* Items List */}
            <ScrollArea className="flex-1 border rounded-lg overflow-y-auto">
              <div className="p-4 space-y-2">
                {filteredCategories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? "No items match your search" : "No items available"}
                  </div>
                ) : (
                  filteredCategories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 font-medium text-gray-900"
                      >
                        <span>{category.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {(category.items?.length || 0) + ((category.subCategories || []).flatMap(s => s.items || []).length || 0)}
                          </span>
                          {expandedCategories.has(category.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      {/* Items */}
                      {expandedCategories.has(category.id) && (
                        <div className="pl-4 space-y-3 py-2">
                          {!category.items || category.items.length === 0 ? (
                            <div className="text-sm text-gray-400 py-3">
                              No items in this category
                            </div>
                          ) : (
                            category.items.map((item) => {
                              const isSelected = isItemSelected(item.id);
                              const overrides = itemOverrides[item.id] || {};

                              return (
                                <div
                                  key={item.id}
                                  className={`p-3 rounded-lg border-2 transition-colors ${
                                    isSelected
                                      ? "border-orange-500 bg-orange-50"
                                      : "border-gray-200 bg-white hover:border-gray-300"
                                  }`}
                                >
                                  {/* Item Header with Checkbox */}
                                  <div className="flex items-start gap-3 mb-2">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => handleItemSelect(item.id)}
                                      className="mt-1"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-gray-900 break-words">
                                        {item.name}
                                      </h4>
                                      {item.description && (
                                        <p className="text-sm text-gray-500 break-words">
                                          {item.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Overrides (only show when selected) */}
                                  {isSelected && (
                                    <div className="mt-3 space-y-2 pl-7 border-t pt-3">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <Label className="text-xs text-gray-600">
                                            Branch Price (₦)
                                          </Label>
                                          <Input
                                            type="number"
                                            placeholder="Leave empty for global price"
                                            value={overrides.price ?? ""}
                                            onChange={(e) =>
                                              handleOverrideChange(
                                                item.id,
                                                "price",
                                                e.target.value
                                                  ? parseFloat(e.target.value)
                                                  : undefined
                                              )
                                            }
                                            className="text-sm"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-600">
                                            Stock Quantity
                                          </Label>
                                          <Input
                                            type="number"
                                            placeholder="Leave empty for unlimited"
                                            value={overrides.stock_quantity ?? ""}
                                            onChange={(e) =>
                                              handleOverrideChange(
                                                item.id,
                                                "stock_quantity",
                                                e.target.value
                                                  ? parseInt(e.target.value)
                                                  : undefined
                                              )
                                            }
                                            className="text-sm"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={selectedItems.length === 0 || isPending}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isPending ? "Linking..." : `Link ${selectedItems.length} Item${selectedItems.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
