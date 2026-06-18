"use client";

// Import necessary hooks and components from React and libraries
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Import Shadcn UI components
import ErrorHandler from "@/components/shared/error-handler";
import Loader from "@/components/shared/loading-spinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ServiceOfferingApi } from "@/services/api/business-service-menu-offerings";
import { SERVICE_OFFERING_QUERY_KEYS } from "@/services/query-keys";
import {
  type ICreateServiceItemDto,
  type IServiceCategory,
  type IServiceItem,
  type IUpdateServiceCategoryDto,
  type IUpdateServiceItemDto,
} from "@/types/service-offering-types";
import { toast } from "sonner";
import AttractionsManagement from "../shared/attraction-management";
import { SectionHeader } from "../shared/SectionHeader";
import BusinessTransactionInformation from "../shared/transaction-settings-section";
import { CategoryDialog } from "./category-dialog";
import { CategoryWithItems, categorySchema, serviceItemSchema } from "./schema";
import { ServiceDialog } from "./service-dialog";
import { getImageForCategory } from "./utils";

// --- Component ---
export default function SalonSpaOfferingsContent() {
  // --- State ---
  const queryClient = useQueryClient();

  // State for dialogs
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false);
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false);
  const [showEditServiceDialog, setShowEditServiceDialog] = useState(false);

  // State for selected items
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(
    null,
  );
  const [currentServiceItem, setCurrentServiceItem] =
    useState<IServiceItem | null>(null);
  const [currentCategory, setCurrentCategory] =
    useState<IServiceCategory | null>(null);

  // State for data and UI
  const [categoriesData, setCategoriesData] = useState<CategoryWithItems[]>([]);
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);

  // --- API Hooks ---
  // Fetch business menus (categories and items)
  const {
    data: menuData,
    isLoading,
    error,
    refetch,
  } = ServiceOfferingApi.useBusinessMenus();

  // Mutations for CRUD operations
  // const createCategory = ServiceOfferingApi.useCreateCategory();
  const updateCategory = ServiceOfferingApi.useUpdateCategory();
  const deleteCategory = ServiceOfferingApi.useDeleteCategory();
  const createServiceItem = ServiceOfferingApi.useCreateServiceItem();
  const updateServiceItem = ServiceOfferingApi.useUpdateServiceItem();
  const deleteServiceItem = ServiceOfferingApi.useDeleteServiceItem();

  // --- Forms ---
  // Form hook for adding categories
  // const categoryForm = useForm<z.infer<typeof categorySchema>>({
  //   resolver: zodResolver(categorySchema),
  //   defaultValues: { name: "" },
  // });

  // Form hook for editing categories
  const editCategoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  });

  // Form hook for adding service items
  const serviceForm = useForm<z.infer<typeof serviceItemSchema>>({
    resolver: zodResolver(serviceItemSchema),
    defaultValues: { name: "", price: 0 },
  });

  // Form hook for editing service items
  const editServiceForm = useForm<z.infer<typeof serviceItemSchema>>({
    resolver: zodResolver(serviceItemSchema),
    defaultValues: { name: "", price: 0 },
  });

  // --- Effects ---
  // Update local categories state when API data is fetched or changes
  useEffect(() => {
    if (menuData?.data) {
      // Ensure items is always an array
      const formattedData = menuData.data.map((category) => ({
        ...category,
        items: category.items || [],
      }));
      setCategoriesData(formattedData);
    }
  }, [menuData]); // Dependency array ensures this runs when menuData changes

  // --- Handlers ---
  // Add a new category
  // const onAddCategory = async (formData: z.infer<typeof categorySchema>) => {
  //   try {
  //     const categoryDto: ICreateServiceCategoryDto = {
  //       name: formData.name,
  //       serviceType: ServiceType.SALONSANDSPA,
  //       hasSubcategories: false,
  //     };

  //     await createCategory.mutateAsync(categoryDto, {
  //       onSuccess: () => {
  //         toast.success("Category added successfully");
  //         categoryForm.reset();
  //         setShowAddCategoryDialog(false);
  //         queryClient.invalidateQueries({
  //           queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
  //         });
  //       },
  //       onError: (err) => {
  //         console.error("Error adding category:", err);
  //         toast.error("Failed to add category.", {
  //           description: err.message,
  //         });
  //       },
  //     });
  //   } catch (err) {
  //     console.error("Error setting up category addition:", err);
  //     toast.error("An unexpected error occurred.");
  //   }
  // };

  // Edit existing category
  const onEditCategory = async (formData: z.infer<typeof categorySchema>) => {
    if (!currentCategory) {
      toast.error("No category selected for editing.");
      return;
    }

    try {
      const updateDto: IUpdateServiceCategoryDto = {
        name: formData.name,
      };

      await updateCategory.mutateAsync(
        {
          categoryId: currentCategory.id,
          data: updateDto,
        },
        {
          onSuccess: () => {
            toast.success("Category updated successfully");
            editCategoryForm.reset();
            setCurrentCategory(null);
            setShowEditCategoryDialog(false);
            queryClient.invalidateQueries({
              queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
            });
          },
          onError: (err) => {
            console.error("Error updating category:", err);
            toast.error("Failed to update category", {
              description: err.message,
            });
          },
        },
      );
    } catch (err) {
      console.error("Error setting up category update:", err);
      toast.error("An unexpected error occurred.");
    }
  };

  // Open edit category dialog
  const openEditCategoryDialog = (category: IServiceCategory) => {
    setCurrentCategory(category);
    editCategoryForm.reset({
      name: category.name,
      image:
        category.image_urls && category.image_urls.length > 0
          ? category.image_urls[0]
          : undefined,
    });

    setShowEditCategoryDialog(true);
  };

  // Delete a category
  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id, {
        onSuccess: () => {
          toast.success("Category deleted successfully");
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
          });
        },
        onError: (err) => {
          console.error("Error deleting category:", err);
          toast.error(
            "Failed to delete category. It might have services attached.",
            {
              description: err.message,
            },
          );
        },
      });
    } catch (err) {
      console.error("Error setting up category deletion:", err);
      toast.error("An unexpected error occurred.");
    }
  };

  // Add a new service item to a category
  const onAddServiceItem = async (
    formData: z.infer<typeof serviceItemSchema>,
    image: File | null,
  ) => {
    if (!currentCategoryId) {
      toast.error("No category selected.");
      return;
    }

    try {
      const serviceItemDto: ICreateServiceItemDto = {
        name: formData.name,
        price: formData.price,
        category_id: currentCategoryId,
      };

      await createServiceItem.mutateAsync(
        {
          itemData: serviceItemDto,
          images: image ? [image] : undefined,
        },
        {
          onSuccess: () => {
            toast.success("Service added successfully");
            serviceForm.reset();
            setShowAddServiceDialog(false);
            setCurrentCategoryId(null);
            queryClient.invalidateQueries({
              queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
            });
          },
          onError: (err) => {
            console.error("Error adding service:", err);
            toast.error("Failed to add service. Please try again.");
          },
        },
      );
    } catch (err) {
      console.error("Error setting up service addition:", err);
      toast.error("An unexpected error occurred.");
    }
  };

  // Open edit service dialog
  const openEditServiceDialog = (
    serviceItem: IServiceItem,
    categoryId: string,
  ) => {
    setCurrentServiceItem(serviceItem);
    setCurrentCategoryId(categoryId);
    editServiceForm.reset({
      name: serviceItem.name,
      price: serviceItem.price || 0,
      image:
        serviceItem.image_urls && serviceItem.image_urls.length > 0
          ? serviceItem.image_urls[0]
          : undefined,
    });
    setShowEditServiceDialog(true);
  };

  // Edit existing service item
  const onEditServiceItem = async (
    formData: z.infer<typeof serviceItemSchema>,
    image: File | null,
  ) => {
    if (!currentServiceItem || !currentCategoryId) {
      toast.error("No service selected for editing.");
      return;
    }

    try {
      const updateDto: IUpdateServiceItemDto = {
        name: formData.name,
        price: formData.price,
        category_id: currentCategoryId,
      };

      await updateServiceItem.mutateAsync(
        {
          itemId: currentServiceItem.id,
          itemData: updateDto,
          images: image ? [image] : undefined,
        },
        {
          onSuccess: () => {
            toast.success("Service updated successfully");
            editServiceForm.reset();
            setCurrentServiceItem(null);
            setCurrentCategoryId(null);
            setShowEditServiceDialog(false);
            queryClient.invalidateQueries({
              queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
            });
          },
          onError: (err) => {
            console.error("Error updating service:", err);
            toast.error("Failed to update service. Please try again.");
          },
        },
      );
    } catch (err) {
      console.error("Error setting up service update:", err);
      toast.error("An unexpected error occurred.");
    }
  };

  // Delete a service item
  const handleDeleteServiceItem = async (serviceId: string) => {
    try {
      await deleteServiceItem.mutateAsync(serviceId, {
        onSuccess: () => {
          toast.success("Service deleted successfully");
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
          });
        },
        onError: (err) => {
          console.error("Error deleting service:", err);
          toast.error("Failed to delete service. Please try again.");
        },
      });
    } catch (err) {
      console.error("Error setting up service deletion:", err);
      toast.error("An unexpected error occurred.");
    }
  };

  // Open the "Add Service" dialog and set the current category ID
  const openAddServiceDialog = (categoryId: string) => {
    setCurrentCategoryId(categoryId);
    setShowAddServiceDialog(true);
    serviceForm.reset({ name: "", price: 0 });
  };

  // --- Render Logic ---
  // Loading state display
  if (isLoading) {
    return <Loader message="Loading menu info..." />;
  }

  // Error state display
  if (error) {
    return (
      <div className="p-8">
        {/* Optional padding around the error message */}
        <ErrorHandler
          message={
            error instanceof Error
              ? error.message
              : "An unknown error occurred while fetching menu items."
          }
          title="Failed to load salon and spa services. Please try again."
          className="mt-4" // Add some margin if needed
          dismissible={true}
          onDismiss={() => refetch()}
        />
      </div>
    );
  }

  // Main component render
  return (
    <div className="space-y-6 font-sora">
      <Card>
        <CardContent className="py-3 space-y-6">
          {/* NOTE (developers): Businesses are no longer allowed to add or edit categories from this UI. */}
          {/* Category management is now handled exclusively in the internal admin portal. */}
          {/* If you need to re-enable in-product category editing, coordinate with the platform team and ensure proper permissions and audit logging are in place. */}
          <SectionHeader
            title={"Categories"}
            // buttonLabel="Add Category (Admin Only)"
            onClick={() => {
              // Disabled: category management is handled in the internal admin portal.
              // Leave this handler as a no-op to avoid referencing missing state.
            }}
            buttonDisabled={true}
            icon={Plus}
          />

          {/* Categories Accordion */}
          <Accordion
            type="multiple"
            className="w-full space-y-4"
            value={openAccordionItems}
            onValueChange={setOpenAccordionItems}
          >
            {categoriesData.length === 0 && !isLoading && (
              <p className="text-center text-gray-500 py-6">
                No categories found. Add one to get started!
              </p>
            )}
            {categoriesData.map((category) => {
              // Determine the background image URL
              const backgroundImageUrl =
                category.image_urls && category.image_urls.length > 0
                  ? category.image_urls[0]
                  : getImageForCategory(category.id) ||
                    `https://placehold.co/800x120/cccccc/ffffff?text=${encodeURIComponent(
                      category.name || "Category",
                    )}`;

              return (
                <Card
                  key={category.id}
                  className="overflow-hidden shadow-none border-none"
                >
                  <AccordionItem value={category.id} className="border-none">
                    <AccordionTrigger
                      className="p-0 hover:no-underline focus:outline-none"
                      style={{
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${backgroundImageUrl})`,
                        height: "120px",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div className="flex items-center justify-between p-4 text-white w-full">
                        <h3 className="text-3xl font-bold">{category.name}</h3>
                        <div className="flex items-center gap-2">
                          {/* Edit Category Button */}
                          <Button
                            variant="outline"
                            className="bg-white text-black hover:bg-gray-100"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent accordion toggle
                              openEditCategoryDialog(category);
                            }}
                            aria-label={`Edit category ${category.name}`}
                          >
                            Edit
                          </Button>
                          {/* Delete Category Button */}
                          <Button
                            variant="outline"
                            className="bg-white text-black hover:bg-gray-100"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent accordion toggle
                              handleDeleteCategory(category.id);
                            }}
                            disabled={
                              category.isDefault || deleteCategory.isPending
                            }
                            aria-label={`Delete category ${category.name}`}
                          >
                            {deleteCategory.isPending &&
                            deleteCategory.variables === category.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Delete"
                            )}
                          </Button>
                          {/* Chevron Icon */}
                          <ChevronDown
                            className={`h-6 w-6 transition-transform ${
                              openAccordionItems.includes(category.id)
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </div>
                    </AccordionTrigger>
                    {/* Accordion Content - Service Items */}
                    <AccordionContent className="py-2">
                      <div className="space-y-2">
                        {/* List of Service Items */}
                        {category.items && category.items.length > 0 ? (
                          category.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 bg-primary-550 rounded-md mb-2"
                            >
                              <span className="text-white">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                  {formatCurrency(item.price || 0)}
                                </span>
                                {/* Edit Service Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-orange-100 border-orange-200 hover:bg-orange-200 text-primary"
                                  onClick={() =>
                                    openEditServiceDialog(item, category.id)
                                  }
                                  aria-label={`Edit service ${item.name}`}
                                >
                                  Edit
                                </Button>
                                {/* Delete Service Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-gray-200 border-gray-300 hover:bg-gray-300 text-gray-700"
                                  onClick={() =>
                                    handleDeleteServiceItem(item.id)
                                  }
                                  disabled={
                                    deleteServiceItem.isPending &&
                                    deleteServiceItem.variables === item.id
                                  }
                                  aria-label={`Delete service ${item.name}`}
                                >
                                  {deleteServiceItem.isPending &&
                                  deleteServiceItem.variables === item.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Delete"
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-gray-500 text-sm py-3">
                            No services added to this category yet.
                          </p>
                        )}
                        {/* Add Service Button */}
                        <Button
                          onClick={() => openAddServiceDialog(category.id)}
                          className="w-full bg-orange-100 text-primary hover:bg-orange-200 border border-orange-200 mt-2"
                          aria-label={`Add service to category ${category.name}`}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Service
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Card>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      <AttractionsManagement />

      {/* Transaction Information Section (Original Structure and Styling) */}
      <BusinessTransactionInformation />

      {/* --- Dialogs --- */}
      {/* Category Dialog - For both Add and Edit */}
      {/* <CategoryDialog
        open={showAddCategoryDialog}
        onOpenChange={setShowAddCategoryDialog}
        onSubmit={onAddCategory}
        isPending={createCategory.isPending}
        mode="add"
      /> */}

      <CategoryDialog
        open={showEditCategoryDialog}
        onOpenChange={setShowEditCategoryDialog}
        onSubmit={onEditCategory}
        category={currentCategory}
        isPending={updateCategory.isPending}
        mode="edit"
      />

      {/* Service Dialog - For both Add and Edit */}
      <ServiceDialog
        open={showAddServiceDialog}
        onOpenChange={(isOpen) => {
          setShowAddServiceDialog(isOpen);
          if (!isOpen) {
            setCurrentCategoryId(null);
          }
        }}
        onSubmit={onAddServiceItem}
        categoryId={currentCategoryId}
        categoryName={
          categoriesData.find((c) => c.id === currentCategoryId)?.name
        }
        isPending={createServiceItem.isPending}
        mode="add"
      />

      <ServiceDialog
        open={showEditServiceDialog}
        onOpenChange={(isOpen) => {
          setShowEditServiceDialog(isOpen);
          if (!isOpen) {
            setCurrentServiceItem(null);
            setCurrentCategoryId(null);
          }
        }}
        onSubmit={onEditServiceItem}
        serviceItem={currentServiceItem}
        categoryId={currentCategoryId}
        categoryName={
          categoriesData.find((c) => c.id === currentCategoryId)?.name
        }
        isPending={updateServiceItem.isPending}
        mode="edit"
      />
    </div>
  );
}
