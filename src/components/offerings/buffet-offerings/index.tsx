"use client";

import ErrorHandler from "@/components/shared/error-handler";
import Loader from "@/components/shared/loading-spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ServiceOfferingApi } from "@/services/api/business-service-menu-offerings";
import {
  CategoryType,
  IServiceCategory,
  IServiceItem,
  ServiceType,
} from "@/types/service-offering-types";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import AttractionsManagement from "../shared/attraction-management";
import CancellationPolicySection from "../shared/CancellationPolicySection";
import BusinessTransactionInformation from "../shared/transaction-settings-section";
import AddItemModal from "./add-item-modal";
import AddSubcategoryModal from "./add-subcategory-modal";
import CategorySection from "./category-section";
import CreateOfferModal from "./create-offer-modal";
import EditOfferModal from "./edit-offer-modal";
import {
  convertToServiceCategory,
  convertToServiceItem,
  transformBuffetData,
} from "./data-transformers";
import EditItemModal from "./edit-item-modal";
import EditSubcategoryModal from "./edit-subcategory-modal";

import Cuisine from "./cuisine";
import Attribute from "./attribute";
import Sports from "./sport";
// import { DebugSpecialOffers } from "./debug-special-offers";


interface DeleteConfirmation {
  isOpen: boolean;
  type: "category" | "item";
  id: string;
  name: string;
}

interface EditSubcategoryModal {
  isOpen: boolean;
  subcategory: IServiceCategory | null;
}

interface EditItemModalState {
  isOpen: boolean;
  item: IServiceItem | null;
  categoryType: CategoryType | null;
}

export default function BuffetOfferingsContent() {
  // Modal states
  const [addSubcategoryModal, setAddSubcategoryModal] = useState<{
    isOpen: boolean;
    parentCategoryId: string;
    categoryType: CategoryType | null;
  }>({
    isOpen: false,
    parentCategoryId: "",
    categoryType: null,
  });

  const [addItemModal, setAddItemModal] = useState<{
    isOpen: boolean;
    categoryId: string;
    categoryType: CategoryType | null;
  }>({
    isOpen: false,
    categoryId: "",
    categoryType: null,
  });

  const [editSubcategoryModal, setEditSubcategoryModal] =
    useState<EditSubcategoryModal>({
      isOpen: false,
      subcategory: null,
    });

  const [editItemModal, setEditItemModal] = useState<EditItemModalState>({
    isOpen: false,
    item: null,
    categoryType: null,
  });

  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmation>({
      isOpen: false,
      type: "category",
      id: "",
      name: "",
    });

  const [createOfferModal, setCreateOfferModal] = useState<{
    isOpen: boolean;
    categoryId: string;
  }>({
    isOpen: false,
    categoryId: "",
  });

  const [editOfferModal, setEditOfferModal] = useState<{
    isOpen: boolean;
    item: IServiceItem & {
      main_catch?: string;
      main_catch_description?: string;
      catchy_phrase?: string;
      gate_pass?: boolean;
      is_18_plus?: boolean;
      price_per_adults?: number;
      price_per_child?: number;
      likeable?: boolean;
      shareable?: boolean;
      tags?: string[];
    } | null;
  }>({
    isOpen: false,
    item: null,
  });

  // API hooks
  const {
    data: businessMenusResponse,
    isLoading,
    error,
  } = ServiceOfferingApi.useBusinessMenus();

  const deleteCategory = ServiceOfferingApi.useDeleteCategory();
  const deleteServiceItem = ServiceOfferingApi.useDeleteServiceItem();

  // Transform API data to clean UI data
  const categories = useMemo(() => {
    const apiCategories = businessMenusResponse?.data || [];
    const buffetCategories = apiCategories.filter(
      (category) => category.serviceType === ServiceType.BUFFET,
    );
    const transformed = transformBuffetData(buffetCategories);
    
    // Debug log
    console.log("📊 [CATEGORY TRANSFORM] Input categories:", {
      total: apiCategories.length,
      buffet: buffetCategories.length,
      specialOffers: buffetCategories.filter(c => c.category_type === "special_offer").length,
    });
    
    buffetCategories.forEach(cat => {
      if (cat.category_type === "special_offer") {
        console.log(`🎯 [BUFFET_OFFERINGS] Special Offers - ID: ${cat.id}, Items: ${cat.items?.length || 0}`);
      }
    });
    
    return transformed;
  }, [businessMenusResponse?.data]);

  // Event handlers for category actions
  const handleAddCategory = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      setAddSubcategoryModal({
        isOpen: true,
        parentCategoryId: categoryId,
        categoryType: category.categoryType,
      });
    }
  };

  // Handler for adding subcategory within a subcategory (nested)
  const handleAddSubCategory = (parentSubCategoryId: string) => {
    // Find the category type by searching through all categories
    let categoryType: CategoryType | null = null;

    for (const category of categories) {
      // Check first level subcategories
      if (
        category.subCategories.some((sub) => sub.id === parentSubCategoryId)
      ) {
        categoryType = category.categoryType;
        break;
      }

      // Check nested subcategories recursively
      const findInNested = (
        subCats: typeof category.subCategories,
      ): boolean => {
        for (const sub of subCats) {
          if (sub.id === parentSubCategoryId) {
            categoryType = category.categoryType;
            return true;
          }
          if (sub.subCategories && findInNested(sub.subCategories)) {
            return true;
          }
        }
        return false;
      };

      if (findInNested(category.subCategories)) {
        break;
      }
    }

    if (categoryType) {
      setAddSubcategoryModal({
        isOpen: true,
        parentCategoryId: parentSubCategoryId,
        categoryType,
      });
    }
  };

  const handleEditSubCategory = (categoryId: string, subCategoryId: string) => {
    // Find the subcategory to edit
    const category = categories.find((cat) => cat.id === categoryId);
    let subCategoryToEdit = null;

    if (category) {
      // Check first level subcategories
      subCategoryToEdit = category.subCategories.find(
        (sub) => sub.id === subCategoryId,
      );

      // If not found, check nested subcategories
      if (!subCategoryToEdit) {
        for (const sub of category.subCategories) {
          if (sub.subCategories) {
            const nestedSub = sub.subCategories.find(
              (nested) => nested.id === subCategoryId,
            );
            if (nestedSub) {
              subCategoryToEdit = nestedSub;
              break;
            }
          }
        }
      }
    }

    if (subCategoryToEdit && category) {
      // Convert UI type to API type
      const serviceCategory = convertToServiceCategory(
        subCategoryToEdit,
        category.categoryType,
      );
      setEditSubcategoryModal({
        isOpen: true,
        subcategory: serviceCategory,
      });
    }
  };

  const handleDeleteSubCategory = (
    categoryId: string,
    subCategoryId: string,
  ) => {
    // Find the subcategory name for confirmation dialog
    const category = categories.find((cat) => cat.id === categoryId);
    let subCategoryName = "";

    if (category) {
      // Check first level subcategories
      const subCategory = category.subCategories.find(
        (sub) => sub.id === subCategoryId,
      );
      if (subCategory) {
        subCategoryName = subCategory.name;
      } else {
        // Check nested subcategories
        for (const sub of category.subCategories) {
          if (sub.subCategories) {
            const nestedSub = sub.subCategories.find(
              (nested) => nested.id === subCategoryId,
            );
            if (nestedSub) {
              subCategoryName = nestedSub.name;
              break;
            }
          }
        }
      }
    }

    setDeleteConfirmation({
      isOpen: true,
      type: "category",
      id: subCategoryId,
      name: subCategoryName || "Subcategory",
    });
  };

  const handleEditItem = (itemId: string) => {
    // Find the item to edit and its category type
    let itemToEdit = null;
    let categoryId = "";
    let categoryType: CategoryType | null = null;

    for (const category of categories) {
      // Check direct items on category (e.g., Special Offers)
      if (category.items) {
        const directItem = category.items.find((item) => item.id === itemId);
        if (directItem) {
          itemToEdit = directItem;
          categoryId = category.id;
          categoryType = category.categoryType;
          break;
        }
      }

      // Check subcategories
      for (const subCategory of category.subCategories) {
        const item = subCategory.items.find((item) => item.id === itemId);
        if (item) {
          itemToEdit = item;
          categoryId = subCategory.id;
          categoryType = category.categoryType;
          break;
        }

        // Check nested subcategories
        if (subCategory.subCategories) {
          for (const nestedSub of subCategory.subCategories) {
            const nestedItem = nestedSub.items.find(
              (item) => item.id === itemId,
            );
            if (nestedItem) {
              itemToEdit = nestedItem;
              categoryId = nestedSub.id;
              categoryType = category.categoryType;
              break;
            }
          }
        }

        if (itemToEdit) break;
      }
      if (itemToEdit) break;
    }

    if (itemToEdit) {
      // Convert UI type to API type with proper category reference
      const serviceItem = convertToServiceItem(itemToEdit);
      serviceItem.category = categoryId; // Set the proper category ID

      // Check if this is a special offer
      if (categoryType === "special_offer") {
        setEditOfferModal({
          isOpen: true,
          item: serviceItem,
        });
      } else {
        setEditItemModal({
          isOpen: true,
          item: serviceItem,
          categoryType,
        });
      }
    }
  };

  const handleDeleteItem = (itemId: string) => {
    // Find the item name for confirmation dialog
    let itemName = "";

    for (const category of categories) {
      // Check direct items on category (e.g., Special Offers)
      if (category.items) {
        const directItem = category.items.find((item) => item.id === itemId);
        if (directItem) {
          itemName = directItem.name;
          break;
        }
      }

      // Check subcategories
      for (const subCategory of category.subCategories) {
        const item = subCategory.items.find((item) => item.id === itemId);
        if (item) {
          itemName = item.name;
          break;
        }

        // Check nested subcategories
        if (subCategory.subCategories) {
          for (const nestedSub of subCategory.subCategories) {
            const nestedItem = nestedSub.items.find(
              (item) => item.id === itemId,
            );
            if (nestedItem) {
              itemName = nestedItem.name;
              break;
            }
          }
        }

        if (itemName) break;
      }
      if (itemName) break;
    }

    setDeleteConfirmation({
      isOpen: true,
      type: "item",
      id: itemId,
      name: itemName || "Item",
    });
  };

  const handleAddItem = (subCategoryId: string) => {
    // Find the category type for this subcategory
    let categoryType: CategoryType | null = null;

    for (const category of categories) {
      // Check first level subcategories
      if (category.subCategories.some((sub) => sub.id === subCategoryId)) {
        categoryType = category.categoryType;
        break;
      }

      // Check nested subcategories
      for (const sub of category.subCategories) {
        if (sub.subCategories?.some((nested) => nested.id === subCategoryId)) {
          categoryType = category.categoryType;
          break;
        }
      }

      if (categoryType) break;
    }

    setAddItemModal({
      isOpen: true,
      categoryId: subCategoryId,
      categoryType,
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.type === "category") {
      await deleteCategory.mutateAsync(deleteConfirmation.id);
    } else if (deleteConfirmation.type === "item") {
      await deleteServiceItem.mutateAsync(deleteConfirmation.id);
    }

    setDeleteConfirmation({
      isOpen: false,
      type: "category",
      id: "",
      name: "",
    });
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      type: "category",
      id: "",
      name: "",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Loader />
          <p className="text-lg text-gray-500">Loading buffet offerings...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorHandler message="Failed to load buffet offerings" title="Error" />
    );
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-500 mb-2">
            No buffet categories found
          </p>
          <p className="text-sm text-gray-400">
            Create your first buffet category to get started
          </p>
          <Button
            className="mt-4 bg-orange-500 hover:bg-orange-600"
            onClick={() =>
              setAddSubcategoryModal({
                isOpen: true,
                parentCategoryId: "", // No parent for top-level
                categoryType: CategoryType.BUFFET_ADDON,
              })
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <Cuisine />

      {/* Debug Panel */}
      {/* <DebugSpecialOffers /> */}

      <Card>
        <CardContent className="p-3 space-y-4">
          {/* Menu Title */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl md:textlg font-semibold text-gray-900">
              Menu
            </h2>
          </div>


          {/* Dynamic Menu Sections using optimized component */}
          {categories?.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              onAddCategory={handleAddCategory}
              onAddSubCategory={handleAddSubCategory}
              onEditSubCategory={handleEditSubCategory}
              onDeleteSubCategory={handleDeleteSubCategory}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onAddItem={handleAddItem}
              onCreateOffer={(categoryId) =>
                setCreateOfferModal({ isOpen: true, categoryId })
              }
            />
          ))}
        </CardContent>
      </Card>
      
      <Attribute />

      <Sports />

      {/* Attractions Management Section */}
      <AttractionsManagement />

      <CancellationPolicySection />

      {/* Transaction Information Section */}
      <BusinessTransactionInformation />

      {/* Modals */}

      {/* AddSubcategoryModal with proper type */}
      {addSubcategoryModal.categoryType && (
        <AddSubcategoryModal
          isOpen={addSubcategoryModal.isOpen}
          onClose={() =>
            setAddSubcategoryModal((prev) => ({ ...prev, isOpen: false }))
          }
          parentCategoryId={addSubcategoryModal.parentCategoryId}
          categoryType={addSubcategoryModal.categoryType}
        />
      )}

      {/* AddItemModal with proper categoryType */}
      {addItemModal.categoryType && (
        <AddItemModal
          isOpen={addItemModal.isOpen}
          onClose={() =>
            setAddItemModal((prev) => ({ ...prev, isOpen: false }))
          }
          categoryId={addItemModal.categoryId}
          categoryType={addItemModal.categoryType}
        />
      )}

      {/* EditSubcategoryModal with proper type conversion */}
      {editSubcategoryModal.subcategory && (
        <EditSubcategoryModal
          isOpen={editSubcategoryModal.isOpen}
          onClose={() =>
            setEditSubcategoryModal({ isOpen: false, subcategory: null })
          }
          subcategory={editSubcategoryModal.subcategory}
        />
      )}

      {/* EditItemModal with proper type conversion */}
      {editItemModal.item && (
        <EditItemModal
          isOpen={editItemModal.isOpen}
          onClose={() =>
            setEditItemModal({ isOpen: false, item: null, categoryType: null })
          }
          item={editItemModal.item}
          categoryType={editItemModal.categoryType}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmation.isOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete{" "}
              {deleteConfirmation.type === "category" ? "Subcategory" : "Item"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteConfirmation.name}
              &quot;?
              {deleteConfirmation.type === "category"
                ? " This will also delete all items within this subcategory."
                : " This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteCategory.isPending || deleteServiceItem.isPending}
            >
              {deleteCategory.isPending || deleteServiceItem.isPending ? (
                <>
                  <Loader className="h-4 w-4 mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Offer Modal */}
      <CreateOfferModal
        isOpen={createOfferModal.isOpen}
        onClose={() =>
          setCreateOfferModal({ ...createOfferModal, isOpen: false })
        }
        categoryId={createOfferModal.categoryId}
        onOfferCreated={() => {
          // TODO: Refresh offers list when offer is created
          console.log("Offer created successfully");
        }}
      />

      {/* Edit Offer Modal */}
      {editOfferModal.item && (
        <EditOfferModal
          isOpen={editOfferModal.isOpen}
          onClose={() =>
            setEditOfferModal({ isOpen: false, item: null })
          }
          item={editOfferModal.item}
        />
      )}
    </div>
  );
}
