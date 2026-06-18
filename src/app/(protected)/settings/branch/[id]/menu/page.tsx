"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BranchesApi } from "@/services/api/branches-api";
import { LinkMenuItemsModal } from "@/components/branch/link-menu-items-modal";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";

interface MenuItem {
  item_id: string;
  price?: number;
  stock_quantity?: number;
  is_available: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function BranchMenuPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = params.id as string;
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Get business category from auth store
  const { business: businessProfile } = useAuthStore();
  const businessCategory = businessProfile?.category?.business_type || businessProfile?.business_type;

  console.log("📄 [BranchMenuPage] Auth Store Data:", {
    hasBusinessProfile: !!businessProfile,
    businessType: businessProfile?.business_type,
    categoryObject: businessProfile?.category,
    businessCategory,
    mounted,
  });

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: branchData, isLoading: isBranchLoading } = BranchesApi.useGetBranch(branchId);
  const { data: menuItemsData, isLoading: isMenuLoading, error: menuError } = BranchesApi.useGetBranchMenuItems(branchId);
  const { mutate: unlinkMenuItem } = BranchesApi.useUnlinkMenuItem(branchId);

  const branch = branchData?.data;
  
  // Menu items come as a direct array from the hook
  const menuItems: MenuItem[] = useMemo(() => {
    console.log("useMemo: Processing menuItemsData:", menuItemsData);
    
    if (!menuItemsData) {
      console.log("useMemo: menuItemsData is falsy, returning []");
      return [];
    }
    
    // Hook should return array directly now
    if (Array.isArray(menuItemsData)) {
      console.log("useMemo: menuItemsData is an array, items count:", menuItemsData.length);
      return menuItemsData;
    }
    
    console.log("useMemo: menuItemsData is not an array, returning []");
    return [];
  }, [menuItemsData]);

  // Debug logging
  useEffect(() => {
    console.log("Menu Items Response:", menuItemsData);
    console.log("Parsed Menu Items:", menuItems);
    if (menuError) {
      console.error("Menu Items Error:", menuError);
    }
  }, [menuItemsData, menuItems, menuError]);

  if (isBranchLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to branches
        </Button>
        <div className="text-center py-12">
          <p className="text-gray-600">Branch not found</p>
        </div>
      </div>
    );
  }

  const handleRemoveItem = (itemId: string) => {
    if (confirm("Are you sure you want to remove this menu item from the branch?")) {
      unlinkMenuItem(itemId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to branches
        </Button>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {branch.name} - Menu Items
          </h1>
          <p className="text-gray-600 mt-2">
            {branch.address}, {branch.city}, {branch.state}
          </p>
        </div>
      </div>

      {/* Fine Dining Notice */}
      {/* {businessCategory === "Fine Dining" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="text-blue-600 mt-1">ℹ️</div>
            <div>
              <p className="font-semibold text-blue-900 mb-1">Fine Dining Menu Management</p>
              <p className="text-sm text-blue-800">
                Fine Dining branches manage menus through the main menu section. Individual branch menu linking is not available for this category.
              </p>
            </div>
          </div>
        </div>
      )} */}

      {/* Menu Items Section */}
      <div className="bg-white rounded-lg border p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Menu Items
              </h2>
              <p className="text-gray-600">
                {menuItems.length || 0} items • {menuItems.filter(i => i.is_available).length || 0} available
              </p>
            </div>
            {/* {businessCategory !== "Fine Dining" && ( */}
              <Button
                onClick={() => setIsLinkModalOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Link Menu Items
              </Button>
            {/* )} */}
          </div>

          <div className="border-t pt-6">
            {isMenuLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin text-gray-400">Loading menu items...</div>
              </div>
            ) : menuError ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Error loading menu items</p>
                <p className="text-gray-600 text-sm mb-4">{menuError instanceof Error ? menuError.message : "Unknown error"}</p>
                <Button onClick={() => router.refresh()}>Retry</Button>
              </div>
            ) : menuItems.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No menu items linked
                </h3>
                <p className="text-gray-600">
                  No menu items have been linked to this branch yet
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Item ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Price</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Stock</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Availability</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map((item) => (
                      <tr key={item.item_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{item.item_id}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {item.price ? `₦${item.price.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {item.stock_quantity !== undefined ? item.stock_quantity : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              item.is_available
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.is_available ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.item_id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Link Menu Items Modal */}
      {mounted && businessCategory && (
        <LinkMenuItemsModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          branchId={branchId}
          branchName={branch?.name || ""}
          businessCategory={businessCategory}
        />
      )}
    </div>
  );
}
