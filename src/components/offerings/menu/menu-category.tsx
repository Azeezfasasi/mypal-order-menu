"use client";

import React from "react";
import { useMemo } from "react";

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
import {
  ICreateServiceItemDto,
  ServiceType,
} from "@/types/service-offering-types";
import PromoteItemModal from "@/components/PromoteBusiness";
import { PromotionsApi, type TimeRemaining, type PromotionResponse } from "@/services/api/promotions-api";
import { AddCategoryDialog } from "./add-category-dialog";
import { AddItemDialog } from "./add-item-dialog";
import { CategoryHeader } from "./category-header";
import { EditItemDialog } from "./edit-item-dialog";
import { MenuItemCard } from "./menu-item-card";
import { SubCategoryList } from "./sub-category-list";
import { Category, MenuItem } from "./types";

interface MenuCategoryProps {
  category: Category;
  level?: number;
  onAddCategory: (values: FormData) => void;
  onAddItem: (categoryId: string, values: ICreateServiceItemDto) => void;
  onEditItem: (itemId: string, values: ICreateServiceItemDto) => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export function MenuCategory({
  category,
  level = 0,
  onAddCategory,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onDeleteCategory,
}: MenuCategoryProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<MenuItem | null>(null);
  const [itemToEdit, setItemToEdit] = React.useState<MenuItem | null>(null);
  const [promoteModalState, setPromoteModalState] = React.useState<{
    isOpen: boolean;
    itemId: string;
  }>({
    isOpen: false,
    itemId: "",
  });

  // Fetch promotions to check promoted status
  const { data: promotionsResponse } = PromotionsApi.useListPromotions();
  const promotedItemData = useMemo(() => {
    if (!promotionsResponse?.data) return new Map<string, TimeRemaining>();
    const map = new Map<string, TimeRemaining>();
    promotionsResponse.data
      .filter((p: PromotionResponse) => p.status?.toLowerCase() === "active")
      .forEach((p: PromotionResponse) => {
        // Handle service_item promotions (menu items)
        if (p.promotion_type === "service_item" && p.service_item?.id) {
          const id = p.service_item.id;
          if (p.time_remaining) {
            map.set(id, p.time_remaining);
          }
        }
      });
    return map;
  }, [promotionsResponse?.data]);

  // Helper function to format time remaining
  const formatTimeRemaining = (timeRemaining: TimeRemaining): string => {
    const { days = 0, hours = 0, minutes = 0 } = timeRemaining;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.join(" ");
  };

  const hasItems = category.items.length > 0;
  const currentCategoryHasSubCategories = category.subCategories.length > 0;
  const isBuffet = category.serviceType === ServiceType.BUFFET;
  const canAddSubcategoriesToCurrent = category.hasSubcategories;
  const isDefaultCategory = category.isDefault;

  const handleAddItemToCurrentCategory = (values: ICreateServiceItemDto) => {
    onAddItem(category.id, values);
  };

  const handleAddSubcategoryFromContentArea = (formData: FormData) => {
    // Update parentCategory in FormData
    formData.set("parentCategory", category.id);
    onAddCategory(formData);
  };

  const handleEditItemAction = (item: MenuItem) => {
    setItemToEdit(item);
  };

  const handleDeleteItemAction = (item: MenuItem) => {
    setItemToDelete(item);
  };

  const confirmDeleteItemAction = () => {
    if (itemToDelete) {
      onDeleteItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const handleEditItemSubmit = (values: ICreateServiceItemDto) => {
    if (itemToEdit) {
      onEditItem(itemToEdit.id, values); // Assuming itemToEdit.id is the correct item ID
      setItemToEdit(null);
    }
  };

  const handleDeleteCategoryCallback = () => {
    onDeleteCategory(category.id);
  };

  const handlePromoteItem = (item: MenuItem) => {
    setPromoteModalState({
      isOpen: true,
      itemId: item.id,
    });
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mb-6 animate-in fade-in duration-300">
      {/* Consistent margin */}
      <CategoryHeader
        category={category}
        isExpanded={isExpanded}
        toggleExpand={toggleExpand}
        level={level}
        onDeleteCategory={
          !isDefaultCategory ? handleDeleteCategoryCallback : undefined
        }
        isDefaultCategory={isDefaultCategory}
        hasItems={hasItems}
        hasSubCategories={currentCategoryHasSubCategories}
        onAddCategory={onAddCategory}
        canAddSubcategories={canAddSubcategoriesToCurrent && level < 2} // Only allow add if level < 2
      />
      {isExpanded && (
        <div className="space-y-4 pt-4">
          {/* Added pt-4 for spacing after header */}
          {hasItems && (
            <div className="space-y-4">
              {/* Increased gap for item list and its add button */}
              <div className="grid sm:grid-cols-1 lg:grid-cols-2 grid-cols-3 gap-4">
                {/* Responsive grid */}
                {category.items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onEdit={() => handleEditItemAction(item)}
                    onDelete={() => handleDeleteItemAction(item)}
                    onPromote={() => handlePromoteItem(item)}
                    isPromoted={promotedItemData.has(item.id)}
                    timeRemaining={
                      promotedItemData.has(item.id)
                        ? formatTimeRemaining(promotedItemData.get(item.id)!)
                        : undefined
                    }
                  />
                ))}
              </div>
              {!canAddSubcategoriesToCurrent && (
                <div className="flex justify-start">
                  <AddItemDialog
                    categoryId={category.id}
                    categoryName={category.name}
                    onAddItem={handleAddItemToCurrentCategory}
                    isBuffet={isBuffet}
                  />
                </div>
              )}
            </div>
          )}
          {currentCategoryHasSubCategories && level < 2 && (
            <SubCategoryList
              categories={category.subCategories}
              level={level + 1}
              onAddCategory={onAddCategory}
              onAddItem={onAddItem}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
              onDeleteCategory={onDeleteCategory}
            />
          )}
          {!hasItems && !currentCategoryHasSubCategories && (
            <div className="text-center py-10 bg-muted/10 rounded-md mt-4 border border-dashed">
              <p className="text-muted-foreground mb-3">
                This category (&quot;{category.name}&quot;) is currently empty.
              </p>
              <div className="flex justify-center gap-3">
                {canAddSubcategoriesToCurrent && level < 2 ? (
                  <AddCategoryDialog
                    parentId={category.id}
                    parentCategoryName={category.name}
                    onAddCategory={handleAddSubcategoryFromContentArea}
                    buttonText="Add Subcategory Here"
                    triggerButtonVariant="outline"
                    level={level + 1}
                  />
                ) : (
                  <AddItemDialog
                    categoryId={category.id}
                    categoryName={category.name}
                    onAddItem={handleAddItemToCurrentCategory}
                    isBuffet={isBuffet}
                    buttonText="Add Item Here"
                  />
                )}
              </div>
            </div>
          )}
          {(hasItems || currentCategoryHasSubCategories) && (
            <div className="flex gap-3 mt-4 pt-4 border-t border-border/50">
              {/* Add section for adding more */}
              {/* business are not allowed/able to create category/subcategory anymore */}
              {/* {canAddSubcategoriesToCurrent && level < 2 && (
                <AddCategoryDialog
                  parentId={category.id}
                  parentCategoryName={category.name}
                  onAddCategory={handleAddSubcategoryFromContentArea}
                  buttonText="Add Another Subcategory"
                  triggerButtonVariant="outline"
                  triggerButtonClassName="bg-transparent text-primary border-primary-500"
                  icon={<Plus className="h-4 w-4 mr-1" />}
                  level={level + 1}
                />
              )} */}
              {/* Show "Add Item" if it can't have subcategories OR even if it can, as a direct action */}
              {/* This provides a consistent "Add Item" button if applicable */}
              {!canAddSubcategoriesToCurrent && (
                <AddItemDialog
                  categoryId={category.id}
                  categoryName={category.name}
                  onAddItem={handleAddItemToCurrentCategory}
                  isBuffet={isBuffet}
                  buttonText="Add Another Item"
                />
              )}
            </div>
          )}
        </div>
      )}
      {itemToEdit && (
        <EditItemDialog
          item={itemToEdit}
          categoryId={category.id}
          onEditItem={handleEditItemSubmit}
          onClose={() => setItemToEdit(null)}
          isBuffet={isBuffet}
        />
      )}
      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={() => setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete item &quot;{itemToDelete?.name}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteItemAction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote Item Modal */}
      {promoteModalState.isOpen && (
        <PromoteItemModal
          isOpen={promoteModalState.isOpen}
          onClose={() => setPromoteModalState({ isOpen: false, itemId: "" })}
          itemId={promoteModalState.itemId}
          promotionType="service_item"
        />
      )}
    </div>
  );
}
