"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { createBuffetOfferingsApi } from "@/services/api/buffet-offerings-api";
import { createServiceOfferingApi } from "@/services/api/business-service-menu-offerings";
import type { IServiceItem } from "@/types/service-offering-types";

// Extend IServiceItem to include special offer fields
interface ISpecialOfferItem extends IServiceItem {
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
}

// Validation schema for the offer form
const editOfferSchema = z.object({
  caption: z.string().min(3, "Caption must be at least 3 characters"),
  about: z.string().min(10, "Description must be at least 10 characters"),
  mainCatch: z.string().min(1, "Main catch/category is required"),
  aboutMainCatch: z.string().min(1, "Main catch description is required"),
  gatePass: z.string().optional(),
  gatePassPricingAdult: z.number().optional(),
  gatePassPricingChild: z.number().optional(),
  includeEntryFee: z.boolean().default(false),
  is18Plus: z.boolean().default(false),
  catchyPhrase: z.string().min(1, "Catchy phrase is required"),
  likeable: z.boolean().default(false),
  shareable: z.boolean().default(false),
  image: z.instanceof(File).optional(),
  tags: z.array(z.string()).default([]),
  newTag: z.string().optional(),
});

type EditOfferFormValues = z.infer<typeof editOfferSchema>;

interface EditOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ISpecialOfferItem;
}

export const EditOfferModal = ({
  isOpen,
  onClose,
  item,
}: EditOfferModalProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(
    item.background_image_url || null
  );

  // API hooks
  const buffetOfferingsApi = createBuffetOfferingsApi();
  const serviceOfferingApi = createServiceOfferingApi();
  const { mutateAsync: updateOffer, isPending: isSubmitting } =
    buffetOfferingsApi.useUpdateBuffetOffer();
  const { createOfferFormData } =
    buffetOfferingsApi.useCreateBuffetOfferFormData();
  
  // Fetch business menus with proper authentication
  const { data: menusData } = serviceOfferingApi.useBusinessMenus();

  const form = useForm<EditOfferFormValues>({
    resolver: zodResolver(editOfferSchema),
    defaultValues: {
      caption: item.name || "",
      about: item.description || "",
      mainCatch: item.main_catch || "",
      aboutMainCatch: item.main_catch_description || "",
      gatePass: "",
      gatePassPricingAdult: item.price_per_adults || undefined,
      gatePassPricingChild: item.price_per_child || undefined,
      includeEntryFee: item.gate_pass || false,
      is18Plus: item.is_18_plus || false,
      catchyPhrase: item.catchy_phrase || "",
      likeable: item.likeable || false,
      shareable: item.shareable || false,
      tags: item.tags || [],
      newTag: "",
    },
  });

  // Helper function to populate form with complete item data from backend
  const populateFormWithItem = useCallback(
    (itemData: ISpecialOfferItem) => {
      console.log("📝 [EDIT OFFER] Populating form with complete item data:", {
        name: itemData.name,
        main_catch: itemData.main_catch,
        catchy_phrase: itemData.catchy_phrase,
        gate_pass: itemData.gate_pass,
        is_18_plus: itemData.is_18_plus,
        tags: itemData.tags,
      });

      form.setValue("caption", itemData.name || "");
      form.setValue("about", itemData.description || "");
      form.setValue("mainCatch", itemData.main_catch || "");
      form.setValue("aboutMainCatch", itemData.main_catch_description || "");
      form.setValue("catchyPhrase", itemData.catchy_phrase || "");
      form.setValue("gatePass", "");
      form.setValue("gatePassPricingAdult", itemData.price_per_adults || undefined);
      form.setValue("gatePassPricingChild", itemData.price_per_child || undefined);
      form.setValue("includeEntryFee", itemData.gate_pass || false);
      form.setValue("is18Plus", itemData.is_18_plus || false);
      form.setValue("likeable", itemData.likeable || false);
      form.setValue("shareable", itemData.shareable || false);
      form.setValue("tags", itemData.tags || []);
      form.setValue("newTag", "");
    },
    [form]
  );

  // Fetch complete item data from backend when modal opens
  useEffect(() => {
    if (!isOpen || !item?.id || !menusData?.data) {
      return;
    }

    console.log("📡 [EDIT OFFER] Searching for item in backend menus data");

    try {
      const categories = menusData.data;
      console.log("[EDIT OFFER] Searching through", categories?.length || 0, "categories");

      // Search for the item across all categories and subcategories
      let foundItem: ISpecialOfferItem | null = null;

      for (const category of categories || []) {
        // Check direct items on category
        if (category.items && Array.isArray(category.items)) {
          console.log(`[EDIT OFFER] Checking category "${category.name}" direct items:`, category.items.length);
          const directItem = category.items.find((cat_item: ISpecialOfferItem) => cat_item.id === item.id);
          if (directItem) {
            console.log("[EDIT OFFER] ✅ Found in direct items");
            foundItem = directItem;
            break;
          }
        }

        // Check subcategories
        for (const subCat of category.subCategories || []) {
          if (subCat.items && Array.isArray(subCat.items)) {
            console.log(`[EDIT OFFER] Checking subcategory "${subCat.name}" items:`, subCat.items.length);
            const subItem = subCat.items.find((cat_item: ISpecialOfferItem) => cat_item.id === item.id);
            if (subItem) {
              console.log("[EDIT OFFER] ✅ Found in subcategory items");
              foundItem = subItem;
              break;
            }
          }

          // Check nested subcategories
          for (const nestedSub of subCat.subCategories || []) {
            if (nestedSub.items && Array.isArray(nestedSub.items)) {
              console.log(`[EDIT OFFER] Checking nested subcategory "${nestedSub.name}" items:`, nestedSub.items.length);
              const nestedItem = nestedSub.items.find((cat_item: ISpecialOfferItem) => cat_item.id === item.id);
              if (nestedItem) {
                console.log("[EDIT OFFER] ✅ Found in nested subcategory items");
                foundItem = nestedItem;
                break;
              }
            }
          }

          if (foundItem) break;
        }

        if (foundItem) break;
      }

      if (foundItem) {
        console.log("✅ [EDIT OFFER] Found complete item with all fields:", foundItem);
        populateFormWithItem(foundItem);
      } else {
        console.warn("[EDIT OFFER] ⚠️ Item not found in backend, using local data from props");
        console.warn("[EDIT OFFER] Local item has:", {
          id: item.id,
          name: item.name,
          main_catch: item.main_catch,
          catchy_phrase: item.catchy_phrase,
          gate_pass: item.gate_pass,
        });
        populateFormWithItem(item);
      }
    } catch (error) {
      console.error("[EDIT OFFER] ❌ Error searching for item:", error);
      console.warn("[EDIT OFFER] Falling back to local item data");
      // Fallback to local item data
      populateFormWithItem(item);
    }
  }, [isOpen, item, menusData, populateFormWithItem]);

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should not exceed 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      form.setValue("image", file);
    }
  };

  // Add tag
  const handleAddTag = useCallback(() => {
    const newTag = form.getValues("newTag");
    if (newTag?.trim()) {
      const currentTags = form.getValues("tags") || [];
      if (!currentTags.includes(newTag)) {
        form.setValue("tags", [...currentTags, newTag]);
        form.setValue("newTag", "");
      } else {
        toast.error("Tag already exists");
      }
    }
  }, [form]);

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  // Handle form submission
  const onSubmit = async (data: EditOfferFormValues) => {
    try {
      // Validate that all required special offer fields are present
      if (!data.mainCatch || !data.aboutMainCatch || !data.catchyPhrase) {
        toast.error("Please fill in all required special offer details");
        return;
      }

      // Extract category ID (handle both string and object formats)
      const categoryId =
        typeof item.category === "string"
          ? item.category
          : (item.category as { id?: string })?.id || "";

      if (!categoryId) {
        toast.error("Category information is missing");
        return;
      }

      console.log("🔍 [EDIT OFFER] Submitting with:", {
        offerId: item.id,
        categoryId,
        mainCatch: data.mainCatch,
        catchyPhrase: data.catchyPhrase,
        gatePass: data.includeEntryFee,
        is18Plus: data.is18Plus,
        tags: data.tags,
      });

      // For Special Offers: send all required fields
      const formData = createOfferFormData(
        {
          name: data.caption,
          category_id: categoryId,
          main_catch: data.mainCatch,
          main_catch_description: data.aboutMainCatch,
          catchy_phrase: data.catchyPhrase,
          gate_pass: data.includeEntryFee,
          is_18_plus: data.is18Plus,
          tags: data.tags || [],
          description: data.about,
          // Include pricing if entry fee is enabled
          ...(data.includeEntryFee && {
            price_per_adults: data.gatePassPricingAdult,
            price_per_child: data.gatePassPricingChild,
          }),
          likeable: data.likeable,
          shareable: data.shareable,
        },
        data.image
      );

      // Call API to update offer
      await updateOffer({ offerId: item.id, data: formData });

      // Reset form and close modal
      form.reset();
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error("Error updating offer:", error);
      // Error toast is handled by the mutation hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white z-10">
          <DialogTitle>Edit special offer</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* IDENTITY SECTION */}
            <section className="space-y-4 border-b pb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">
                Identity
              </h3>

              <FormField
                control={form.control}
                name="caption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caption</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Buffet brunch, cocktail wednesdays"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* ABOUT SECTION */}
            <section className="space-y-4 border-b pb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">
                About
              </h3>

              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the offer..."
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* MAIN CATCH SECTION */}
            <section className="space-y-4 border-b pb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">
                Main Catch
              </h3>

              <FormField
                control={form.control}
                name="mainCatch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Catch Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select main catch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="drinks">Drinks</SelectItem>
                        <SelectItem value="experience">Experience</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aboutMainCatch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Catch Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the main catch..."
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* ENTRY & ACCESS SECTION */}
            <section className="space-y-4 border-b pb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">
                Entry & Access
              </h3>

              <FormField
                control={form.control}
                name="includeEntryFee"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <FormLabel>Include Entry Fee</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("includeEntryFee") && (
                <>
                  <FormField
                    control={form.control}
                    name="gatePassPricingAdult"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adult Entry Fee (₦)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseFloat(e.target.value) : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gatePassPricingChild"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Child Entry Fee (₦)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseFloat(e.target.value) : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="is18Plus"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <FormLabel>18+ Only</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </section>

            {/* UPLOAD IMAGE SECTION */}
            <section className="space-y-4 border-b pb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">
                Upload Image
              </h3>

              {imagePreview && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      form.setValue("image", undefined);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="relative rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="pointer-events-none">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                </div>
              </div>
            </section>

            {/* ENGAGEMENT SECTION */}
            <section className="space-y-4 border-b pb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">
                Engagement
              </h3>

              <FormField
                control={form.control}
                name="catchyPhrase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catchy Phrase</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. The best brunch in town!"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="likeable"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <FormLabel>Likeable</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shareable"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <FormLabel>Shareable</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* TAGS SECTION */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">
                Tags
              </h3>

              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="newTag"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Add a tag..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  className="mt-0"
                >
                  Add
                </Button>
              </div>

              {form.watch("tags")?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.watch("tags").map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer">
                      {tag}
                      <X
                        className="h-3 w-3 ml-1"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </section>

            {/* ACTION BUTTONS */}
            <div className="sticky bottom-0 space-y-3 border-t bg-white pt-4">
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Offer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditOfferModal;
