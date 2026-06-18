// Fixed components/sections/MenuSection.tsx
import { MenuItemDialog } from "@/components/dialogs/MenuItemDialog";
import ErrorHandler from "@/components/shared/error-handler";
import Loader from "@/components/shared/loading-spinner";
import { Card } from "@/components/ui/card";
import PromoteItemModal from "@/components/PromoteBusiness";
import { PromotionsApi, type PromotionType, type TimeRemaining } from "@/services/api/promotions-api";
import {
  FineDiningMenuApi,
  type ICreateFineDiningMenuPayload,
  type IUpdateFineDiningMenuPayload,
} from "@/services/api/fine-dining-menu-api";
import { FINE_DINING_MENU_QUERY_KEYS } from "@/services/query-keys";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MenuItemFormValues } from "../forms/MenuItemForm";
import { FineDiningMenuItemCard } from "../shared/FineDiningMenuItemCard";
import { SectionHeader } from "../shared/SectionHeader";

// Updated interface to include menu_url and support for PDF
export interface FineDiningMenuItem {
  id: string | number;
  name: string;
  minimum_price: number;
  maximum_price: number;
  type?: string; // 'Image', 'PDF', or 'url'
  menu_url?: string;
  category_id?: string;
  // Add other fields as needed
}

export function MenuSection() {
  // React Query Client for invalidation
  const queryClient = useQueryClient();

  // API data fetching
  const {
    data: menuItemsData,
    isLoading,
    error,
  } = FineDiningMenuApi.useGetBusinessFineDiningMenus();
  const menuItems = menuItemsData?.data || []; // Use fetched data or empty array

  // API mutations
  const createMenuMutation = FineDiningMenuApi.useCreateFineDiningMenu();
  const updateMenuMutation = FineDiningMenuApi.useUpdateFineDiningMenu();
  const deleteMenuMutation = FineDiningMenuApi.useDeleteFineDiningMenu();

  // Dialog states
  const [showAddMenuItemDialog, setShowAddMenuItemDialog] = useState(false);
  const [showEditMenuItemDialog, setShowEditMenuItemDialog] = useState(false);
  const [currentMenuItem, setCurrentMenuItem] =
    useState<FineDiningMenuItem | null>(null);

  // File preview state only (actual file is managed inside the dialog)
  const [filePreview, setFilePreview] = useState<string[] | null>(null);

  // Promote modal state
  const [promoteModalState, setPromoteModalState] = useState<{
    isOpen: boolean;
    menuItemId: string | number;
    promotionType?: PromotionType;
  }>({
    isOpen: false,
    menuItemId: "",
  });

  // Fetch promotions to check promoted status
  const { data: promotionsResponse } = PromotionsApi.useListPromotions();
  const promotedMenuData = useMemo(() => {
    if (!promotionsResponse?.data) return new Map<string | number, TimeRemaining>();
    const map = new Map<string | number, TimeRemaining>();
    promotionsResponse.data
      .filter((p) => p.status?.toLowerCase() === "active")
      .forEach((p) => {
        // Handle fine_dining_menu promotions
        if (p.promotion_type === "fine_dining_menu" && p.fine_dining_menu?.id) {
          // Use the menu item ID as the key for fine dining menu items
          if (p.time_remaining) {
            map.set(p.fine_dining_menu.id, p.time_remaining);
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

  // Handle edit menu item
  const handleEditMenuItem = (menuItem: FineDiningMenuItem) => {
    setCurrentMenuItem(menuItem);

    // Set initial state for the dialog based on the item type
    if (menuItem.type === "Image" && menuItem.menu_url) {
      setFilePreview([menuItem.menu_url]);
    } else if (menuItem.type === "PDF" && menuItem.menu_url) {
      setFilePreview(["pdf"]);
    } else {
      setFilePreview(null);
    }

    setShowEditMenuItemDialog(true);
  };

  // Handle adding menu item - Integrated with API
  const handleAddMenuItem = (
    data: MenuItemFormValues,
    files: File[] | null,
  ) => {
    const file = files && files.length > 0 ? files[0] : null;
    // Validation
    if (!file && (!data.menu_url || data.menu_url.trim() === "")) {
      toast.error("Either a file or a menu URL must be provided.");
      return;
    }

    // Build API payload
    const payload: ICreateFineDiningMenuPayload = {
      name: data.name,
      minimum_price: data.minimum_price,
      maximum_price: data.maximum_price,
      // Include description if your API supports it
      // description: data.description,
      image: file || undefined,
      menu_url: data.menu_url?.trim() || undefined,
      category_id: data.category_id,
    };

    // Call API
    createMenuMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Menu item added successfully!");
        queryClient.invalidateQueries({
          queryKey: FINE_DINING_MENU_QUERY_KEYS.businessMenus(),
        });
        // Reset form and close dialog
        setShowAddMenuItemDialog(false);
        setFilePreview(null);
      },
      onError: (error) => {
        toast.error("Failed to add menu item", {
          description:
            error.response?.data?.message || "An unexpected error occurred.",
        });
      },
    });
  };

  // Handle updating menu item - Integrated with API
  const handleUpdateMenuItem = (
    data: MenuItemFormValues,
    files: File[] | null,
  ) => {
    if (!currentMenuItem) return;
    const file = files && files.length > 0 ? files[0] : null;

    // Validation - allow submission with just a name if it's an edit
    // and we have an existing image or URL (that wasn't changed)
    const hasExistingAsset =
      (currentMenuItem.type === "Image" || currentMenuItem.type === "PDF") &&
      !file &&
      !data.menu_url;

    if (
      !file &&
      !hasExistingAsset &&
      (!data.menu_url || data.menu_url.trim() === "")
    ) {
      toast.error("Either a file or a menu URL must be provided.");
      return;
    }

    // Build API payload
    const payload: IUpdateFineDiningMenuPayload = {
      name: data.name,
      minimum_price: data.minimum_price,
      maximum_price: data.maximum_price,
      // description: data.description, // Include if needed
    };

    // Only include image in payload if a new file was selected
    if (file) {
      payload.image = file;
    }

    // Only include menu_url in payload if it was provided or edited
    if (data.menu_url?.trim()) {
      payload.menu_url = data.menu_url.trim();
    }

    // Call API
    updateMenuMutation.mutate(
      { id: currentMenuItem.id, data: payload },
      {
        onSuccess: () => {
          toast.success("Menu item updated successfully!");
          queryClient.invalidateQueries({
            queryKey: FINE_DINING_MENU_QUERY_KEYS.businessMenus(),
          });
          queryClient.invalidateQueries({
            queryKey: FINE_DINING_MENU_QUERY_KEYS.detail(currentMenuItem.id),
          });
          // Reset form and close dialog
          setShowEditMenuItemDialog(false);
          setCurrentMenuItem(null);
          setFilePreview(null);
        },
        onError: (error) => {
          toast.error("Failed to update menu item", {
            description: error.message || "An unexpected error occurred.",
          });
        },
      },
    );
  };

  // Handle delete menu item - Integrated with API
  const handleDeleteMenuItem = (id: string | number) => {
    deleteMenuMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Menu item deleted successfully!");
        queryClient.invalidateQueries({
          queryKey: FINE_DINING_MENU_QUERY_KEYS.businessMenus(),
        });
      },
      onError: (error) => {
        toast.error("Failed to delete menu item", {
          description: error.message || "An unexpected error occurred.",
        });
      },
    });
  };

  // Handle promote menu item
  const handlePromoteMenuItem = (id: string | number) => {
    setPromoteModalState({
      isOpen: true,
      menuItemId: id,
      promotionType: "fine_dining_menu",
    });
  };

  // Reset forms when dialogs close
  const handleAddDialogChange = (open: boolean) => {
    setShowAddMenuItemDialog(open);
    if (!open) {
      setFilePreview(null);
    }
  };

  const handleEditDialogChange = (open: boolean) => {
    setShowEditMenuItemDialog(open);
    if (!open) {
      setCurrentMenuItem(null);
      setFilePreview(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="flex justify-center items-center p-8">
        <Loader message="Loading menu info..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        {/* Optional padding around the error message */}
        <ErrorHandler
          message={
            error instanceof Error
              ? error.message
              : "An unknown error occurred while fetching menu items."
          }
          title="Failed to Load Menu"
          // Add some margin if needed
          // You could make this dismissible if you want the user to be able to hide it
          // dismissible={true}
          // onDismiss={() => { /* handle dismissal state if needed */ }}
        />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <SectionHeader
        title="Menu"
        buttonLabel={
          createMenuMutation.isPending ? "Adding..." : "Add menu item"
        }
        icon={Plus}
        onClick={() => setShowAddMenuItemDialog(true)}
        buttonDisabled={createMenuMutation.isPending}
      />

      <div className="space-y-4">
        {menuItems.length > 0 ? (
          menuItems.map((menuItem) => (
            <FineDiningMenuItemCard
              key={menuItem.id}
              id={menuItem.id}
              name={menuItem.name}
              minimum_price={menuItem.minimum_price}
              maximum_price={menuItem.maximum_price}
              type={menuItem.type}
              onEdit={() => handleEditMenuItem(menuItem)}
              onDelete={handleDeleteMenuItem}
              onPromote={handlePromoteMenuItem}
              isDeleting={
                deleteMenuMutation.isPending &&
                deleteMenuMutation.variables === menuItem.id
              }
              isUpdating={
                updateMenuMutation.isPending &&
                updateMenuMutation.variables?.id === menuItem.id
              }
              isPromoted={promotedMenuData.has(menuItem.id)}
              timeRemaining={promotedMenuData.get(menuItem.id)}
              formatTimeRemaining={formatTimeRemaining}
            />
          ))
        ) : (
          <div className="text-center text-gray-500">No menu items found.</div>
        )}
      </div>

      {/* Add Menu Item Dialog */}
      <MenuItemDialog
        open={showAddMenuItemDialog}
        onOpenChange={handleAddDialogChange}
        title="Add item"
        onSubmit={handleAddMenuItem}
        filePreview={filePreview}
        onFilePreviewChange={setFilePreview}
        isSubmitting={createMenuMutation.isPending}
        submitLabel="Save"
        fileInputId="add-menu-file"
      />

      {/* Edit Menu Item Dialog */}
      <MenuItemDialog
        open={showEditMenuItemDialog}
        onOpenChange={handleEditDialogChange}
        title="Edit menu item"
        onSubmit={handleUpdateMenuItem}
        defaultValues={
          currentMenuItem
            ? {
                category_id: currentMenuItem.category_id || "",
                name: currentMenuItem.name,
                minimum_price: currentMenuItem.minimum_price || 0,
                maximum_price: currentMenuItem.maximum_price || 0,
                description: "", // Replace with actual description when available
                menu_url: currentMenuItem.menu_url || "",
              }
            : undefined
        }
        filePreview={filePreview}
        onFilePreviewChange={setFilePreview}
        isSubmitting={updateMenuMutation.isPending}
        submitLabel="Save changes"
        fileInputId="edit-menu-file"
        currentItem={currentMenuItem}
      />

      {/* Promote Menu Item Modal */}
      {promoteModalState.isOpen && (
        <PromoteItemModal
          isOpen={promoteModalState.isOpen}
          onClose={() =>
            setPromoteModalState({ isOpen: false, menuItemId: "" })
          }
          itemId={String(promoteModalState.menuItemId)}
          promotionType={promoteModalState.promotionType || "service_item"}
        />
      )}
    </Card>
  );
}
