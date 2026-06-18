"use client";

import type { ICreateServiceItemDto } from "@/types/service-offering-types";
import { MenuHeader } from "../menu/header";
import { MenuList } from "../menu/menu-list";
import ErrorHandler from "@/components/shared/error-handler";
import Loader from "@/components/shared/loading-spinner";
import { Card } from "@/components/ui/card";
import { ServiceOfferingApi } from "@/services/api/business-service-menu-offerings";
import { toast } from "sonner";
import { Category } from "../menu/types";
import AttractionsManagement from "../shared/attraction-management";
import CancellationPolicySection from "../shared/CancellationPolicySection";
import BusinessTransactionInformation from "../shared/transaction-settings-section";
import DeliveryManagement from "../shared/delivery-management";
import DeliveryAnalytics from "../shared/delivery-analytics";
import Attribute from "./attribute";
import Sports from "./sport";
import Cuisine from "./cuisine";
import OrderOptions from "./OrderOptions";

export default function Home() {
  const {
    data: menuData,
    isLoading,
    error,
  } = ServiceOfferingApi.useBusinessMenus();
  const createCategory = ServiceOfferingApi.useCreateCategoryWithImage();
  const createItem = ServiceOfferingApi.useCreateServiceItem();
  const updateItem = ServiceOfferingApi.useUpdateServiceItem();
  const deleteItem = ServiceOfferingApi.useDeleteServiceItem();
  const deleteCategory = ServiceOfferingApi.useDeleteCategory();

  const handleEditItem = async (
    itemId: string,
    values: ICreateServiceItemDto,
  ) => {
    const promise = updateItem.mutateAsync({
      itemId,
      itemData: values,
      images: values.images as File[] | undefined,
    });

    toast.promise(promise, {
      loading: "Updating item...",
      success: "Item updated successfully!",
      error: (error) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unknown error occurred while updating the item.";
        return `Failed to update item: ${errorMessage}`;
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

  const handleDeleteCategory = async (categoryId: string) => {
    const promise = deleteCategory.mutateAsync(categoryId);

    toast.promise(promise, {
      loading: "Deleting category...",
      success: "category deleted successfully!",
      error: (error) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unknown error occurred while deleting the category.";
        return `Failed to delete category: ${errorMessage}`;
      },
    });
  };

  const handleAddCategory = async (formData: FormData) => {
    const promise = createCategory.mutateAsync(formData);

    toast.promise(promise, {
      loading: "Creating category...",
      success: "Category created successfully!",
      error: (error) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unknown error occurred while adding menu category.";
        return errorMessage;
      },
    });
  };

  const handleAddItem = async (
    categoryId: string,
    values: ICreateServiceItemDto,
  ) => {
    const promise = createItem.mutateAsync({
      itemData: {
        ...values,
        category_id: categoryId,
      },
      images: values.images as File[] | undefined,
    });

    toast.promise(promise, {
      loading: "Creating item...",
      success: "Item created successfully!",
      error: (error) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unknown error occurred while creating menu item.";
        return `Failed to create item: ${errorMessage}`;
      },
    });
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-5 md:max-w-full">
          
          <Cuisine />
          
          <Card className="p-5">
            {error ? (
              <ErrorHandler message="Error loading menu data" />
            ) : isLoading ? (
              <Loader message="Loading Iconic Delicacies business offerings" />
            ) : (
              <>
                <MenuHeader onAddCategory={handleAddCategory} />
                <MenuList
                  categories={(menuData?.data as Category[]) || []}
                  onAddCategory={handleAddCategory}
                  onAddItem={handleAddItem}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleDeleteItem}
                  onDeleteCategory={handleDeleteCategory}
                />
              </>
            )}
          </Card>

          <Attribute />

          <Sports />

          <OrderOptions />

          <AttractionsManagement />

          {/* Delivery Management Section */}
          <DeliveryManagement />

          {/* Delivery Analytics Section */}
          <DeliveryAnalytics />

          <CancellationPolicySection />

          {/* Transaction Information Section */}
          <BusinessTransactionInformation />
        </div>
      </div>
    </main>
  );
}


