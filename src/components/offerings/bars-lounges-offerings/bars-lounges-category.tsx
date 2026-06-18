
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Eye,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/services/api/api-client";
import { ENDPOINTS } from "@/services/api/endpoints";
import { PromotionsApi, type PromotionResponse } from "@/services/api/promotions-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Loader from "@/components/shared/loading-spinner";
import Image from "next/image";
import PromoteItemModal from "@/components/PromoteBusiness";

interface SubCategory {
  id: string;
  name: string;
  items: CategoryItem[];
}

interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  price?: number;
  stock_quantity?: number;
  image_url?: string;
  is_available?: boolean;
}

interface BarsLoungesData {
  categories: SubCategory[];
}

// Error types for proper typing
interface AxiosErrorResponse {
  response?: {
    status: number;
    statusText: string;
    data?: { message?: string; error?: string };
    config?: { url?: string; method?: string };
  };
  request?: unknown;
  message?: string;
}

/**
 * Helper function to format remaining time for promotions
 */
function formatTimeRemaining(promotion: PromotionResponse): string {
  if (!promotion.time_remaining) return "";
  const { days, hours, minutes } = promotion.time_remaining;
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Helper function to extract and format error messages from API errors
 * Provides detailed error information for debugging
 */
function extractErrorMessage(error: unknown): {
  userMessage: string;
  debugMessage: string;
} {
  let userMessage = "An error occurred. Please try again.";
  let debugMessage = "";

  const axiosError = error as AxiosErrorResponse;

  if (axiosError && typeof axiosError === "object" && axiosError.response) {
    const status = axiosError.response.status;
    const data = axiosError.response.data;

    // Log detailed response for debugging
    console.error("❌ API Error Details:", {
      status,
      statusText: axiosError.response?.statusText,
      url: axiosError.response?.config?.url,
      method: axiosError.response?.config?.method,
      data: data,
    });

    debugMessage = `[${status}] ${axiosError.response?.statusText} - ${axiosError.response?.config?.method?.toUpperCase()} ${axiosError.response?.config?.url}`;

    if (status === 404) {
      userMessage = "Endpoint not found. The backend API endpoint may not be implemented yet.";
    } else if (status === 400) {
      userMessage = data?.message || data?.error || "Invalid request. Please check your input.";
    } else if (status === 401) {
      userMessage = "Unauthorized. Please log in again.";
    } else if (status === 403) {
      userMessage = "Access denied. You don't have permission for this action.";
    } else if (status === 500) {
      userMessage = "Server error. Please try again later.";
    } else if (data?.message) {
      userMessage = data.message;
    } else if (data?.error) {
      userMessage = data.error;
    }
  } else if (axiosError && typeof axiosError === "object" && axiosError.request) {
    console.error("❌ No Response:", axiosError.request);
    userMessage = "Network error. No response from server.";
    debugMessage = "Network request failed - no response received";
  } else if (axiosError && typeof axiosError === "object" && axiosError.message) {
    console.error("❌ Error Message:", axiosError.message);
    userMessage = axiosError.message;
    debugMessage = axiosError.message;
  }

  return { userMessage, debugMessage };
}

export default function BarsLoungesCategory() {
  const [data, setData] = useState<BarsLoungesData>({ categories: [] });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SubCategory | null>(
    null
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemPrice, setNewItemPrice] = useState<number | "">(0);
  const [newItemStockQuantity, setNewItemStockQuantity] = useState<number | "">(0);
  const [newItemImageUrl, setNewItemImageUrl] = useState("");
  const [newItemImage, setNewItemImage] = useState<File | null>(null);
  const [newItemImagePreview, setNewItemImagePreview] = useState<string>("");
  const [newItemIsAvailable, setNewItemIsAvailable] = useState(true);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [showItemDetailsModal, setShowItemDetailsModal] = useState(false);
  const [editingItemName, setEditingItemName] = useState("");
  const [editingItemDescription, setEditingItemDescription] = useState("");
  const [editingItemPrice, setEditingItemPrice] = useState<number | "">(0);
  const [editingItemStockQuantity, setEditingItemStockQuantity] = useState<number | "">(0);
  const [editingItemImageUrl, setEditingItemImageUrl] = useState("");
  const [editingItemImage, setEditingItemImage] = useState<File | null>(null);
  const [editingItemImagePreview, setEditingItemImagePreview] = useState<string>("");
  const [editingItemIsAvailable, setEditingItemIsAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promotingItem, setPromotingItem] = useState<{ id: string; name: string } | null>(null);
  const [itemPromotions, setItemPromotions] = useState<Record<string, PromotionResponse>>({});

  // Fetch promotions to display promotion badges
  const { data: promotionsData } = PromotionsApi.useListPromotions();

  // Update item promotions mapping when promotions data changes
  useEffect(() => {
    if (promotionsData?.data) {
      const promotionMap: Record<string, PromotionResponse> = {};
      promotionsData.data.forEach((promo) => {
        // Map promotions to their respective menu items
        if (promo.status === "ACTIVE" && promo.fine_dining_menu?.id) {
          promotionMap[promo.fine_dining_menu.id] = promo;
        }
      });
      setItemPromotions(promotionMap);
    }
  }, [promotionsData]);

  // Handle file upload for add item modal
  const handleNewItemImageUpload = (file: File) => {
    setNewItemImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewItemImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle file upload for edit item modal
  const handleEditingItemImageUpload = (file: File) => {
    setEditingItemImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingItemImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Fetch categories on mount
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Using the Menu Categories endpoint to get bar/lounge categories
      const response = await apiClient.get(ENDPOINTS.FINE_DINING_MENU_ORDERS.GET_MENU_CATEGORIES);

      // Transform response to match our structure
      const transformedData: BarsLoungesData = {
        categories: response.data?.data || response.data || [],
      };
      setData(transformedData);
    } catch (error) {
      const { userMessage, debugMessage } = extractErrorMessage(error);
      setError(debugMessage);
      console.error("📋 Failed to fetch categories:", debugMessage);
      
      // Show error toast
      toast.error(userMessage, {
        description: debugMode ? debugMessage : undefined,
      });
      
      // Set default categories if fetch fails
      setData({
        categories: [
          {
            id: "sport-lounges",
            name: "Sport Lounges",
            items: [{ id: "apex-lounge", name: "Apex Lounge" }],
          },
          {
            id: "shisha-lounges",
            name: "Shisha Lounges",
            items: [],
          },
          {
            id: "cocktail-lounges",
            name: "Cocktail Lounges",
            items: [],
          },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  }, [debugMode]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleCategoryExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      setError(null);
      // Call Menu Categories endpoint to create category
      const response = await apiClient.post(
        ENDPOINTS.FINE_DINING_MENU_ORDERS.CREATE_MENU_CATEGORIES,
        {
          name: newCategoryName,
          type: "bars_lounges",
        }
      );

      // Add to local state
      const newCategory: SubCategory = {
        id: response.data?.data?.id || Date.now().toString(),
        name: newCategoryName,
        items: [],
      };

      setData((prev) => ({
        categories: [...prev.categories, newCategory],
      }));

      setNewCategoryName("");
      setShowAddCategoryModal(false);
      
      // Show success toast
      toast.success(`Category "${newCategoryName}" created successfully`);
      
      // Refresh data
      fetchCategories();
    } catch (error) {
      const { userMessage, debugMessage } = extractErrorMessage(error);
      setError(debugMessage);
      console.error("❌ Failed to add category:", debugMessage);
      
      toast.error(userMessage, {
        description: debugMode ? debugMessage : undefined,
      });
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !newItemDescription.trim() || !selectedCategory) return;
    if (typeof newItemPrice !== 'number' || newItemPrice < 0) return;
    if (typeof newItemStockQuantity !== 'number' || newItemStockQuantity < 0) return;

    try {
      setError(null);
      
      // Use FormData for multipart request when there's an image file
      const requestConfig: { headers?: { 'Content-Type': string } } = {};
      let requestPayload: FormData | Record<string, unknown>;

      if (newItemImage) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('name', newItemName);
        formData.append('category_id', selectedCategory.id);
        formData.append('description', newItemDescription);
        formData.append('price', newItemPrice.toString());
        formData.append('stock_quantity', newItemStockQuantity.toString());
        formData.append('is_available', newItemIsAvailable.toString());
        formData.append('image', newItemImage);

        requestPayload = formData;
        requestConfig.headers = {
          'Content-Type': 'multipart/form-data',
        };

        console.log("📤 Sending item with file upload:", {
          name: newItemName,
          fileName: newItemImage.name,
          fileSize: newItemImage.size,
        });
      } else {
        // Use JSON for regular request without image
        requestPayload = {
          name: newItemName,
          category_id: selectedCategory.id,
          description: newItemDescription,
          price: newItemPrice,
          stock_quantity: newItemStockQuantity,
          is_available: newItemIsAvailable,
        };

        if (newItemImageUrl) {
          requestPayload.image_url = newItemImageUrl;
        }

        console.log("📤 Sending item:", {
          name: newItemName,
          hasImageUrl: !!newItemImageUrl,
        });
      }

      const response = await apiClient.post(
        ENDPOINTS.FINE_DINING_MENU_ORDERS.CREATE_MENU_ITEM,
        requestPayload,
        requestConfig
      );

      // Add to local state
      const newItem: CategoryItem = {
        id: response.data?.data?.id || Date.now().toString(),
        name: newItemName,
        description: newItemDescription,
        price: newItemPrice,
        stock_quantity: newItemStockQuantity,
        image_url: newItemImageUrl || (newItemImagePreview ? "data:image/jpeg;base64,..." : undefined),
        is_available: newItemIsAvailable,
      };

      setData((prev) => ({
        categories: prev.categories.map((cat) =>
          cat.id === selectedCategory.id
            ? { ...cat, items: [...cat.items, newItem] }
            : cat
        ),
      }));

      setNewItemName("");
      setNewItemDescription("");
      setNewItemPrice(0);
      setNewItemStockQuantity(0);
      setNewItemImageUrl("");
      setNewItemImage(null);
      setNewItemImagePreview("");
      setNewItemIsAvailable(true);
      setShowAddItemModal(false);
      setSelectedCategory(null);
      
      // Show success toast
      toast.success(`Item "${newItemName}" added successfully`);
    } catch (error) {
      const { userMessage, debugMessage } = extractErrorMessage(error);
      setError(debugMessage);
      console.error("❌ Failed to add item:", debugMessage);
      
      toast.error(userMessage, {
        description: debugMode ? debugMessage : undefined,
      });
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategoryName.trim() || !editingCategoryId) return;

    try {
      setError(null);
      const updateUrl = ENDPOINTS.FINE_DINING_MENU_ORDERS.UPDATE_MENU_CATEGORY(editingCategoryId);
      
      console.log("🔄 Updating category with URL:", updateUrl);
      console.log("📦 Request payload:", { name: editingCategoryName });
      
      // Call update category endpoint using PATCH
      const response = await apiClient.patch(updateUrl, {
        name: editingCategoryName,
      });
      
      console.log("✅ Update successful:", response.data);

      // Update local state
      setData((prev) => ({
        categories: prev.categories.map((cat) =>
          cat.id === editingCategoryId
            ? { ...cat, name: editingCategoryName }
            : cat
        ),
      }));

      setEditingCategoryId(null);
      setEditingCategoryName("");
      setShowEditCategoryModal(false);
      
      // Show success toast
      toast.success(`Category updated successfully`);
    } catch (error) {
      const { userMessage, debugMessage } = extractErrorMessage(error);
      setError(debugMessage);
      console.error("❌ Failed to update category:", debugMessage);
      
      toast.error(userMessage, {
        description: debugMode ? debugMessage : "Check console for details",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      setError(null);
      // Call delete category endpoint
      await apiClient.delete(
        ENDPOINTS.FINE_DINING_MENU_ORDERS.DELETE_MENU_CATEGORY(categoryId)
      );

      // Remove from local state
      setData((prev) => ({
        categories: prev.categories.filter((cat) => cat.id !== categoryId),
      }));
      
      // Show success toast
      toast.success("Category deleted successfully");
    } catch (error) {
      const { userMessage, debugMessage } = extractErrorMessage(error);
      setError(debugMessage);
      console.error("❌ Failed to delete category:", debugMessage);
      
      toast.error(userMessage, {
        description: debugMode ? debugMessage : undefined,
      });
    }
  };

  const handleDeleteItem = async (categoryId: string, itemId: string) => {
    if (!confirm("Are you sure you want to remove this item?")) return;

    try {
      setError(null);
      // Call delete menu item endpoint
      await apiClient.delete(
        ENDPOINTS.FINE_DINING_MENU_ORDERS.DELETE_MENU_ITEM(itemId)
      );

      // Remove from local state
      setData((prev) => ({
        categories: prev.categories.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                items: cat.items.filter((item) => item.id !== itemId),
              }
            : cat
        ),
      }));
      
      // Show success toast
      toast.success("Item removed successfully");
    } catch (error) {
      const { userMessage, debugMessage } = extractErrorMessage(error);
      setError(debugMessage);
      console.error("❌ Failed to delete item:", debugMessage);
      
      toast.error(userMessage, {
        description: debugMode ? debugMessage : undefined,
      });
    }
  };

  const handleViewItemDetails = (categoryId: string, item: CategoryItem) => {
    setEditingItemId(item.id);
    setEditingItemName(item.name);
    setEditingItemDescription(item.description || "");
    setEditingItemPrice(item.price || 0);
    setEditingItemStockQuantity(item.stock_quantity || 0);
    setEditingItemImageUrl(item.image_url || "");
    setEditingItemImagePreview(item.image_url || "");
    setEditingItemIsAvailable(item.is_available ?? true);
    setShowItemDetailsModal(true);
  };

  const handleEditItem = async () => {
    if (!editingItemName.trim() || !editingItemId) return;

    try {
      setError(null);
      const updateUrl = ENDPOINTS.FINE_DINING_MENU_ORDERS.UPDATE_MENU_ITEM(editingItemId);
      
      console.log("🔄 Updating item with URL:", updateUrl);
      
      // Use FormData for multipart request when there's an image file
      const requestConfig: { headers?: { 'Content-Type': string } } = {};
      let requestPayload: FormData | Record<string, unknown>;

      if (editingItemImage) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('name', editingItemName);
        formData.append('description', editingItemDescription);
        formData.append('price', editingItemPrice.toString());
        formData.append('stock_quantity', editingItemStockQuantity.toString());
        formData.append('is_available', editingItemIsAvailable.toString());
        formData.append('image', editingItemImage);

        requestPayload = formData;
        requestConfig.headers = {
          'Content-Type': 'multipart/form-data',
        };

        console.log("📤 Updating item with file upload:", {
          name: editingItemName,
          fileName: editingItemImage.name,
          fileSize: editingItemImage.size,
        });
      } else {
        // Use JSON for regular request without image
        requestPayload = {
          name: editingItemName,
          description: editingItemDescription,
          price: editingItemPrice,
          stock_quantity: editingItemStockQuantity,
          is_available: editingItemIsAvailable,
        };

        if (editingItemImageUrl) {
          requestPayload.image_url = editingItemImageUrl;
        }

        console.log("📤 Updating item:", {
          name: editingItemName,
          hasImageUrl: !!editingItemImageUrl,
        });
      }
      
      const response = await apiClient.patch(updateUrl, requestPayload, requestConfig);
      
      console.log("✅ Item update successful:", response.data);

      // Update local state - refresh categories to get latest data
      await fetchCategories();

      setEditingItemId(null);
      setEditingItemName("");
      setEditingItemDescription("");
      setEditingItemPrice(0);
      setEditingItemStockQuantity(0);
      setEditingItemImageUrl("");
      setEditingItemImage(null);
      setEditingItemImagePreview("");
      setEditingItemIsAvailable(true);
      setShowItemDetailsModal(false);
      
      // Show success toast
      toast.success(`Item "${editingItemName}" updated successfully`);
    } catch (error) {
      const { userMessage, debugMessage } = extractErrorMessage(error);
      setError(debugMessage);
      console.error("❌ Failed to update item:", debugMessage);
      
      toast.error(userMessage, {
        description: debugMode ? debugMessage : "Check console for details",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="flex justify-center items-center p-8">
        <Loader message="Loading categories..." />
      </Card>
    );
  }

  return (
    <Card className="p-6 md:p-0">
      {/* Debug Panel */}
      <div 
        data-debug-panel
        className="mb-4 p-4 bg-gray-100 rounded-lg hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-semibold text-gray-700">Debug Mode</span>
          </label>
        </div>
        
        {error && (
          <div className="mt-2 p-3 bg-red-100 border border-red-400 rounded-md">
            <div className="flex gap-2">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">Last Error:</p>
                <p className="text-xs text-red-700 font-mono mt-1 break-words">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-0">
        {/* Header Section with Background Image */}
        <div 
          className="flex md:flex-col items-center justify-between md:gap-2 p-4 rounded-t-lg py-6 bg-cover bg-center relative"
          style={{
            backgroundImage: 'url("/images/theatre.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/40 rounded-t-lg"></div>
          
          {/* Content */}
          <div className="relative z-10 flex items-center gap-3 cursor-pointer"
            onClick={() => toggleCategoryExpand("main-header")}
          >
            <h2 className="text-2xl font-bold text-white">Where To Go</h2>
          </div>
          <div className="flex gap-2 relative z-10">
            <Button
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus size={20} />
              Add new category
            </Button>
            {/* <Button
              onClick={() => {
                const debugPanel = document.querySelector('[data-debug-panel]');
                if (debugPanel) {
                  debugPanel.classList.toggle('hidden');
                }
              }}
              title="Toggle debug panel (Ctrl+D)"
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white text-xs"
              size="sm"
            >
              🐛 Debug
            </Button> */}
          </div>
        </div>

        {/* Main Category Section */}
        <div className="space-y-4">
          {/* Bars & Lounges Main Category */}
          <div className="bg-orange-600 text-white p-4 rounded-b-lg">
            <div className="flex md:flex-col items-center justify-between md:gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleCategoryExpand("main-category")}
                  className="hover:bg-orange-700 p-1 rounded transition"
                >
                  {expandedCategories.has("main-category") ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronUp size={20} />
                  )}
                </button>
                <span onClick={() => toggleCategoryExpand("main-category")} className="font-bold text-lg cursor-pointer">Bars & Lounges</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAddCategoryModal(true)}
                  className="bg-white text-black hover:bg-gray-200"
                  size="sm"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Sub-Categories */}
          {expandedCategories.has("main-category") && (
            <div className="ml-4 md:ml-2 space-y-3">
              {data.categories.map((category) => (
                <div key={category.id} className="space-y-2">
                  {/* Sub-Category Header */}
                  <div className="bg-orange-100 p-4 rounded-lg">
                    <div className="flex md:flex-col items-center justify-between md:gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => toggleCategoryExpand(category.id)}
                          className="hover:bg-orange-200 p-1 rounded transition"
                        >
                          {expandedCategories.has(category.id) ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronUp size={18} />
                          )}
                        </button>
                        <span onClick={() => toggleCategoryExpand(category.id)} className="font-bold text-gray-800 cursor-pointer">
                          {category.name}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setSelectedCategory(category);
                            setShowAddItemModal(true);
                          }}
                          size="sm"
                          className="bg-amber-700 hover:bg-amber-800"
                        >
                          Add
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingCategoryId(category.id);
                            setEditingCategoryName(category.name);
                            setShowEditCategoryModal(true);
                          }}
                          size="sm"
                          className="bg-amber-700 hover:bg-amber-800"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteCategory(category.id)}
                          size="sm"
                          className="bg-amber-700 hover:bg-amber-800"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Sub-Category Items */}
                  {expandedCategories.has(category.id) && (
                    <div className="ml-8 md:ml-4 space-y-2">
                      {category.items.length === 0 ? (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                          <p className="text-gray-500 text-sm">No items added yet</p>
                        </div>
                      ) : (
                        category.items.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white p-3 rounded-lg border border-gray-200 flex md:flex-col items-center justify-between md:gap-2"
                          >
                            <div className="flex items-center gap-4">
                                {item.image_url && (
                                <Image
                                    width={64}
                                    height={64}
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-16 h-16 object-cover rounded-lg"
                                />
                                )}
                                <div>
                                  <span className="text-gray-700 block font-medium">{item.name}</span>
                                  {/* Promotion Status Badge */}
                                  {itemPromotions[item.id] && (
                                    <div className="flex gap-2 mt-2">
                                      <div className="px-3 py-1 border border-green-500 text-green-600 text-xs font-medium rounded-full">
                                        Promoted
                                      </div>
                                      <div className="px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                                        active {formatTimeRemaining(itemPromotions[item.id])}
                                      </div>
                                    </div>
                                  )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() =>
                                  handleViewItemDetails(category.id, item)
                                }
                                size="sm"
                                className="flex items-center bg-[#ECE7DC] text-[#865503] font-semibold hover:bg-[#ECE7DC] hover:text-[#865503} hover:border hover:border-[#865503] gap-1 rounded-[9.67px]"
                              >
                                <Eye size={14} />
                                Details
                              </Button>
                              <Button
                                onClick={() =>
                                  handleViewItemDetails(category.id, item)
                                }
                                size="sm"
                                className="flex items-center bg-[#ECE7DC] text-[#865503] font-semibold hover:bg-[#ECE7DC] hover:text-[#865503} hover:border hover:border-[#865503] gap-1 rounded-[9.67px"
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => {
                                  setPromotingItem({ id: item.id, name: item.name });
                                  setShowPromoteModal(true);
                                }}
                                size="sm"
                                className="flex items-center bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-1 rounded-[9.67px]"
                              >
                                Promote
                              </Button>
                              <Button
                                onClick={() =>
                                  handleDeleteItem(category.id, item.id)
                                }
                                size="sm"
                                className="flex items-center bg-[#ECE7DC] text-[#865503] font-semibold hover:bg-[#ECE7DC] hover:text-[#865503} hover:border hover:border-[#865503] gap-1 rounded-[9.67px"
                              >
                                <X size={14} />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      <Dialog open={showAddCategoryModal} onOpenChange={setShowAddCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                placeholder="Enter category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategoryModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Modal */}
      <Dialog open={showAddItemModal} onOpenChange={setShowAddItemModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add {selectedCategory?.name || "Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                placeholder="Enter item name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="item-description">Lounge Description</Label>
              <Textarea
                id="item-description"
                placeholder="Enter item description"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="item-price">Price</Label>
              <Input
                id="item-price"
                type="number"
                placeholder="Enter price"
                min="0"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value ? parseFloat(e.target.value) : "")}
              />
            </div>
            <div>
              <Label htmlFor="item-stock">Stock Quantity</Label>
              <Input
                id="item-stock"
                type="number"
                placeholder="Enter stock quantity"
                min="0"
                value={newItemStockQuantity}
                onChange={(e) => setNewItemStockQuantity(e.target.value ? parseInt(e.target.value) : "")}
              />
            </div>
            {/* <div>
              <Label htmlFor="item-image-url">Image URL</Label>
              <Input
                id="item-image-url"
                type="url"
                placeholder="Enter image URL"
                value={newItemImageUrl}
                onChange={(e) => setNewItemImageUrl(e.target.value)}
              />
            </div> */}
            <div className="flex items-center gap-3">
              <input
                id="item-available"
                type="checkbox"
                checked={newItemIsAvailable}
                onChange={(e) => setNewItemIsAvailable(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="item-available" className="mb-0 cursor-pointer">Is Available</Label>
            </div>
            <div>
              <Label htmlFor="item-image-upload">Upload Image</Label>
              <div className="mt-2 flex flex-col gap-3">
                <input
                  id="item-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleNewItemImageUpload(file);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium"
                />
                {newItemImagePreview && (
                  <div className="relative w-full">
                    <Image
                      src={newItemImagePreview}
                      width={400}
                      height={400}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      onClick={() => {
                        setNewItemImage(null);
                        setNewItemImagePreview("");
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddItemModal(false);
                setSelectedCategory(null);
                setNewItemName("");
                setNewItemDescription("");
                setNewItemPrice(0);
                setNewItemStockQuantity(0);
                setNewItemImageUrl("");
                setNewItemImage(null);
                setNewItemImagePreview("");
                setNewItemIsAvailable(true);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddItem}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={showEditCategoryModal} onOpenChange={setShowEditCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category-name">Category Name</Label>
              <Input
                id="edit-category-name"
                placeholder="Enter category name"
                value={editingCategoryName}
                onChange={(e) => setEditingCategoryName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditCategoryModal(false);
                setEditingCategoryId(null);
                setEditingCategoryName("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditCategory}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Details Modal */}
      <Dialog open={showItemDetailsModal} onOpenChange={setShowItemDetailsModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="details-name">Name</Label>
              <Input
                id="details-name"
                type="text"
                value={editingItemName}
                onChange={(e) => setEditingItemName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="details-price">Price</Label>
                <Input
                  id="details-price"
                  type="number"
                  min="0"
                  value={editingItemPrice}
                  onChange={(e) =>
                    setEditingItemPrice(
                      e.target.value ? parseFloat(e.target.value) : ""
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="details-stock">Stock Quantity</Label>
                <Input
                  id="details-stock"
                  type="number"
                  min="0"
                  value={editingItemStockQuantity}
                  onChange={(e) =>
                    setEditingItemStockQuantity(
                      e.target.value ? parseInt(e.target.value) : ""
                    )
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="details-description">Lounge Description</Label>
              <Textarea
                id="details-description"
                value={editingItemDescription}
                onChange={(e) => setEditingItemDescription(e.target.value)}
                rows={3}
              />
            </div>
            {/* <div>
              <Label htmlFor="details-image-url">Image URL</Label>
              <Input
                id="details-image-url"
                type="url"
                placeholder="Enter image URL"
                value={editingItemImageUrl}
                onChange={(e) => setEditingItemImageUrl(e.target.value)}
              />
            </div> */}
            <div className="flex items-center gap-3">
              <input
                id="details-available"
                type="checkbox"
                checked={editingItemIsAvailable}
                onChange={(e) => setEditingItemIsAvailable(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="details-available" className="mb-0 cursor-pointer">Is Available</Label>
            </div>
            <div>
              <Label htmlFor="details-image-upload">Upload Image</Label>
              <div className="mt-2 flex flex-col gap-3">
                <input
                  id="details-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleEditingItemImageUpload(file);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium"
                />
                {editingItemImagePreview && (
                  <div className="relative w-full">
                    <Image
                      width={400}
                      height={400}
                      src={editingItemImagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      onClick={() => {
                        setEditingItemImage(null);
                        setEditingItemImagePreview("");
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowItemDetailsModal(false);
                setEditingItemId(null);
                setEditingItemName("");
                setEditingItemDescription("");
                setEditingItemPrice(0);
                setEditingItemStockQuantity(0);
                setEditingItemImageUrl("");
                setEditingItemImage(null);
                setEditingItemImagePreview("");
                setEditingItemIsAvailable(true);
              }}
            >
              Close
            </Button>
            <Button onClick={handleEditItem}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote Item Modal */}
      {promotingItem && (
        <PromoteItemModal
          isOpen={showPromoteModal}
          onClose={() => {
            setShowPromoteModal(false);
            setPromotingItem(null);
          }}
          itemId={promotingItem.id}
          promotionType="fine_dining_menu"
        />
      )}
    </Card>
  );
}
