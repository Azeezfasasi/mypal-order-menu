"use client";

import React, { useState, useMemo } from "react";
import { Plus, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { menuAndOrdersApi } from "@/services/api/fine-din-menu-orders-api";
import AddMenuItemModal, { MenuItemFormData } from "@/components/menu-management/add-menu-item-modal";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  stock_quantity: number;
  unit_type: string;
  is_available: boolean;
  image_url: string;
  category?: string;
}

interface MenuCategory {
  id: string;
  name: string;
  is_active: boolean;
  items: MenuItem[];
}

export default function MenuManagementPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All Items");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const router = useRouter();

  const api = menuAndOrdersApi();
  const { data: menuCategories, isLoading, error } = api.useGetMenuCategories();

  const categories = useMemo(() => {
    if (!menuCategories?.data) return [{ name: "All Items", count: 0, id: "all" }];

    const cats = menuCategories.data.map((cat: MenuCategory) => ({
      name: cat.name,
      count: cat.items?.length || 0,
      id: cat.id,
    }));

    return [{ name: "All Items", count: cats.reduce((sum: number, c) => sum + c.count, 0), id: "all" }, ...cats];
  }, [menuCategories]);

  const allItems = useMemo(() => {
    if (!menuCategories?.data) return [];
    return menuCategories.data.flatMap((cat: MenuCategory) =>
      (cat.items || []).map((item: MenuItem) => ({ ...item, category: cat.name }))
    );
  }, [menuCategories]);

  const filteredItems = useMemo(() => {
    let items = allItems;

    if (selectedCategory !== "All Items") {
      items = items.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  }, [allItems, selectedCategory, searchQuery]);

  const handleAddItem = (itemData: MenuItemFormData) => {
    // TODO: Call API to add item
    console.log("Add item:", itemData);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 cursor-pointer">
          <button onClick={() => router.back()} className="text-gray-600 cursor-pointer"><Image src="/images/arrowleft.svg" alt="Back" width={16} height={16} className="w-6 h-6" /></button>
          <h1 className="text-xl font-bold">Menu Management</h1>
        </div>
        <p className="text-sm text-gray-600">Manage availability and prices</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Image
            width={20}
            height={20}
            src="/images/search.svg"
            alt="Search Icon"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
        />
        <Input
            type="text"
            placeholder="Search menu item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-6 bg-white rounded-[100px] border border-[#E1E3E7]"
        />
      </div>

      {/* Add Item Button */}
      <Button 
        onClick={() => setIsAddModalOpen(true)}
        className="w-auto md:w-full bg-[#FEF2EE] hover:bg-orange-200 border border-[#DB3A0780] rounded-lg text-[14px] font-semibold leading-[145%] text-[#DB3A07] text-center flex items-center justify-center gap-2 mx-auto"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Item
      </Button>

      {/* Category Tabs */}
      <div className="space-y-3">
        <div className="grid grid-cols-4 md:grid-cols-3 gap-2">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => setSelectedCategory(category.name)}
              className={cn(
                "rounded-lg px-3 py-6 text-sm transition-all",
                selectedCategory === category.name
                  ? "bg-orange-100 text-orange-600 border-2 border-orange-500 font-bold"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="font-semibold">{category.name}</div>
              <div className="text-xs">{category.count}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold">
          {selectedCategory} ({filteredItems.length})
        </h2>
        <button className="text-orange-500 text-sm font-medium hover:underline">
          Sort by: Name A-Z ▾
        </button>
      </div>

      {/* Menu Items List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading menu items...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Error loading menu items</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No menu items found</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "rounded-lg p-4 border transition-opacity",
                item.is_available
                  ? "bg-white border-gray-200"
                  : "bg-gray-50 border-gray-200 opacity-60"
              )}
            >
              <div className="flex gap-3">
                {/* Item Image */}
                <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0 overflow-hidden">
                  <Image
                    width={64}
                    height={64}
                    src={item.image_url || "/images/rice.svg"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">{item.name}</h3>
                  <p className="text-sm font-bold text-orange-600 mt-1">₦{Number(item.price).toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full",
                      item.is_available
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    )}>
                      {item.is_available ? "● Available" : "● Unavailable"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => {
                      // TODO: Toggle availability
                      console.log("Toggle availability for", item.id);
                    }}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      item.is_available
                        ? "bg-orange-600 text-white hover:bg-orange-700"
                        : "bg-gray-300 text-white hover:bg-gray-400"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-900">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Edit and More Options */}
              <div className="mt-3 flex gap-2">
                <Button 
                  onClick={() => {
                    // TODO: Open edit price modal
                    console.log("Edit price for", item.id);
                  }}
                  className="flex-1 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm"
                >
                  ✏️ Edit Price
                </Button>
                <Button 
                  onClick={() => {
                    // TODO: Delete item
                    console.log("Delete item", item.id);
                  }}
                  className="flex-1 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm"
                >
                  🗑️ Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Unavailable Warning */}
      {filteredItems.some(item => !item.is_available) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-6">
          <p className="text-xs text-orange-800">
            <span className="font-semibold">Unavailable items won&apos;t be visible to customers.</span>
            <span> Mark them available when back in stock.</span>
          </p>
        </div>
      )}

      {/* Add Menu Item Modal */}
      <AddMenuItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddItem}
      />
    </div>
  );
}
